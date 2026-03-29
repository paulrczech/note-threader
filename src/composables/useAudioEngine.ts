import { ref, readonly } from 'vue'
import * as Tone from 'tone'
import type { Cluster } from '../utils/noteUtils'
import { midiToName } from '../data/notes'

// Salamander Grand Piano samples hosted on Tone.js CDN
// Subset spanning our playable range — Tone.Sampler interpolates between them
const SALAMANDER_BASE = 'https://tonejs.github.io/audio/salamander/'
const SALAMANDER_URLS: Record<string, string> = {
  'A0':  'A0.mp3',
  'C1':  'C1.mp3',
  'D#1': 'Ds1.mp3',
  'F#1': 'Fs1.mp3',
  'A1':  'A1.mp3',
  'C2':  'C2.mp3',
  'D#2': 'Ds2.mp3',
  'F#2': 'Fs2.mp3',
  'A2':  'A2.mp3',
  'C3':  'C3.mp3',
  'D#3': 'Ds3.mp3',
  'F#3': 'Fs3.mp3',
  'A3':  'A3.mp3',
  'C4':  'C4.mp3',
  'D#4': 'Ds4.mp3',
  'F#4': 'Fs4.mp3',
  'A4':  'A4.mp3',
  'C5':  'C5.mp3',
  'D#5': 'Ds5.mp3',
  'F#5': 'Fs5.mp3',
  'A5':  'A5.mp3',
  'C6':  'C6.mp3',
}

const NOTE_DURATION = '2n'
const LOOP_GAP_BEATS = 1  // beats of silence between clusters in loop

export type ArpeggioDirection = 'up' | 'down' | 'updown' | 'random' | 'chord'

export interface PlaybackSettings {
  bpm: number
  direction: ArpeggioDirection
}

let sampler: Tone.Sampler | null = null
let loopPart: Tone.Part | null = null

const isLoaded = ref(false)
const isPlaying = ref(false)
const loadError = ref<string | null>(null)

function midiToTone(midi: number): string {
  return midiToName(midi)
}

// Derive seconds-per-16th-note from BPM
function intervalFromBpm(bpm: number): number {
  return 60 / bpm / 4
}

// Build the ordered note array for an arpeggio based on direction.
// For 'chord', returns sorted notes — caller is responsible for firing them at offset 0.
function buildArpeggioNotes(cluster: number[], direction: ArpeggioDirection): number[] {
  const sorted = [...cluster].sort((a, b) => a - b)
  switch (direction) {
    case 'up':
    case 'chord':
      return sorted
    case 'down':
      return [...sorted].reverse()
    case 'updown': {
      const inner = sorted.slice(1, sorted.length - 1).reverse()
      return [...sorted, ...inner]
    }
    case 'random':
      return [...sorted].sort(() => Math.random() - 0.5)
    default:
      return sorted
  }
}

// Initialize the sampler — must be called inside a user gesture to unlock audio context
async function init(): Promise<void> {
  if (sampler && isLoaded.value) return

  await Tone.start()

  return new Promise((resolve, reject) => {
    sampler = new Tone.Sampler({
      urls: SALAMANDER_URLS,
      baseUrl: SALAMANDER_BASE,
      onload: () => {
        isLoaded.value = true
        loadError.value = null
        resolve()
      },
      onerror: (err) => {
        loadError.value = 'Failed to load piano samples'
        console.error('Sampler load error:', err)
        reject(err)
      },
    }).toDestination()
  })
}

// Play a single MIDI note immediately
function playNote(midi: number, duration = NOTE_DURATION): void {
  if (!sampler || !isLoaded.value) return
  sampler.triggerAttackRelease(midiToTone(midi), duration)
}

// Audition a single cluster as an arpeggio — stops any running loop first
function playCluster(
  cluster: number[],
  settings: PlaybackSettings = { bpm: 80, direction: 'up' },
  onComplete?: () => void
): void {
  if (!sampler || !isLoaded.value) return

  stopLoop()

  const interval = settings.direction === 'chord' ? 0 : intervalFromBpm(settings.bpm)
  const notes = buildArpeggioNotes(cluster, settings.direction)
  const now = Tone.now()

  notes.forEach((midi, i) => {
    sampler!.triggerAttackRelease(midiToTone(midi), NOTE_DURATION, now + i * interval)
  })

  if (onComplete) {
    const totalTime = (notes.length - 1) * interval + Tone.Time(NOTE_DURATION).toSeconds()
    setTimeout(onComplete, totalTime * 1000)
  }
}

// Play a full sequence as a continuous loop
function playSequence(
  sequence: Cluster[],
  settings: PlaybackSettings = { bpm: 80, direction: 'up' },
  loop = true
): void {
  if (!sampler || !isLoaded.value || sequence.length === 0) return

  stopLoop()

  const isChord = settings.direction === 'chord'
  const interval = isChord ? 0 : intervalFromBpm(settings.bpm)
  const beat = 60 / settings.bpm

  Tone.getTransport().bpm.value = settings.bpm

  // Chord mode: each cluster fires simultaneously and occupies one beat + gap
  // Arpeggio mode: each cluster occupies (voices * interval) + gap
  const maxVoices = Math.max(...sequence.map(c => c.length))
  const clusterDuration = isChord
    ? (1 + LOOP_GAP_BEATS) * beat
    : maxVoices * interval + LOOP_GAP_BEATS * beat

  const events = sequence.map((cluster, i) => ({
    time: i * clusterDuration,
    notes: buildArpeggioNotes(cluster, settings.direction),
  }))

  const totalDuration = sequence.length * clusterDuration

  loopPart = new Tone.Part((time, event) => {
    event.notes.forEach((midi: number, noteIdx: number) => {
      sampler!.triggerAttackRelease(
        midiToTone(midi),
        NOTE_DURATION,
        time + noteIdx * interval
      )
    })
  }, events)

  loopPart.start(0)

  // Loop the Transport (not the Part) — more reliable in Tone.js
  const transport = Tone.getTransport()
  transport.loop = loop
  transport.loopStart = 0
  transport.loopEnd = totalDuration
  transport.start()
  isPlaying.value = true
}

function stopLoop(): void {
  if (loopPart) {
    loopPart.stop()
    loopPart.dispose()
    loopPart = null
  }
  const transport = Tone.getTransport()
  transport.stop()
  transport.loop = false
  transport.position = 0
  isPlaying.value = false
}

function dispose(): void {
  stopLoop()
  if (sampler) {
    sampler.dispose()
    sampler = null
    isLoaded.value = false
  }
}

export function useAudioEngine() {
  return {
    isLoaded: readonly(isLoaded),
    isPlaying: readonly(isPlaying),
    loadError: readonly(loadError),
    init,
    playNote,
    playCluster,
    playSequence,
    stopLoop,
    dispose,
  }
}
