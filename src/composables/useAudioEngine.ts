import { ref, readonly } from 'vue'
import * as Tone from 'tone'
import type { Cluster } from '../utils/noteUtils'
import { midiToName } from '../data/notes'
import type { InstrumentType } from '../stores/settingsStore'

// Salamander Grand Piano samples hosted on Tone.js CDN
const SALAMANDER_BASE = 'https://tonejs.github.io/audio/salamander/'
const SALAMANDER_URLS: Record<string, string> = {
  'A0':  'A0.mp3',  'C1':  'C1.mp3',  'D#1': 'Ds1.mp3', 'F#1': 'Fs1.mp3',
  'A1':  'A1.mp3',  'C2':  'C2.mp3',  'D#2': 'Ds2.mp3', 'F#2': 'Fs2.mp3',
  'A2':  'A2.mp3',  'C3':  'C3.mp3',  'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3',
  'A3':  'A3.mp3',  'C4':  'C4.mp3',  'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3',
  'A4':  'A4.mp3',  'C5':  'C5.mp3',  'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3',
  'A5':  'A5.mp3',  'C6':  'C6.mp3',
}

const LOOP_GAP_BEATS = 1

export type ArpeggioDirection = 'up' | 'down' | 'updown' | 'random' | 'chord'

export interface PlaybackSettings {
  bpm: number
  direction: ArpeggioDirection
}

// Per-instrument note duration (Tone.js time string or seconds)
const NOTE_DURATIONS: Record<InstrumentType, string> = {
  piano:   '2n',
  strings: '1n',
  synth:   '2n.',
}

type ToneInstrument = Tone.Sampler | Tone.PolySynth

let instrument: ToneInstrument | null = null
let currentInstrumentType: InstrumentType | null = null
let loopPart: Tone.Part | null = null
let rafId: number | null = null
let currentClusterDuration = 0
let currentSequenceLength = 0

const isLoaded = ref(false)
const isPlaying = ref(false)
const loadError = ref<string | null>(null)
const playingIndex = ref<number>(-1)

function midiToTone(midi: number): string {
  return midiToName(midi)
}

function intervalFromBpm(bpm: number): number {
  return 60 / bpm / 4
}

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

function createSynth(): Tone.PolySynth {
  return new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.4, decay: 0.3, sustain: 0.7, release: 1.8 },
  }).toDestination()
}

function createStrings(): Tone.PolySynth {
  return new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.8, decay: 0.4, sustain: 0.9, release: 2.5 },
    volume: -6,
  }).toDestination()
}

async function init(instrumentType: InstrumentType = 'piano'): Promise<void> {
  // No-op if same instrument already loaded
  if (instrument && isLoaded.value && currentInstrumentType === instrumentType) return

  // Dispose previous instrument
  if (instrument) {
    instrument.dispose()
    instrument = null
    isLoaded.value = false
  }

  await Tone.start()
  currentInstrumentType = instrumentType

  if (instrumentType === 'piano') {
    return new Promise((resolve, reject) => {
      instrument = new Tone.Sampler({
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
  } else {
    instrument = instrumentType === 'strings' ? createStrings() : createSynth()
    isLoaded.value = true
  }
}

function playCluster(
  cluster: number[],
  settings: PlaybackSettings = { bpm: 80, direction: 'up' },
  onComplete?: () => void
): void {
  if (!instrument || !isLoaded.value) return

  stopLoop()

  const noteDuration = NOTE_DURATIONS[currentInstrumentType ?? 'piano']
  const interval = settings.direction === 'chord' ? 0 : intervalFromBpm(settings.bpm)
  const notes = buildArpeggioNotes(cluster, settings.direction)
  const now = Tone.now()

  notes.forEach((midi, i) => {
    const vel = humanVelocity(0.72, i, notes.length)
    instrument!.triggerAttackRelease(midiToTone(midi), noteDuration, now + i * interval, vel)
  })

  if (onComplete) {
    const totalTime = (notes.length - 1) * interval + Tone.Time(noteDuration).toSeconds()
    setTimeout(onComplete, totalTime * 1000)
  }
}

// Humanized velocity — base with slight random variation and arpeggio position taper
function humanVelocity(baseVelocity: number, noteIdx: number, totalNotes: number): number {
  const jitter = (Math.random() - 0.5) * 0.24  // ±12% random humanization
  const taper = noteIdx === 0 ? 0 : -0.06 * (noteIdx / Math.max(totalNotes - 1, 1))
  return Math.min(1, Math.max(0.3, baseVelocity + jitter + taper))
}

function playSequence(
  sequence: Cluster[],
  settings: PlaybackSettings = { bpm: 80, direction: 'up' },
  loop = true
): void {
  if (!instrument || !isLoaded.value || sequence.length === 0) return

  stopLoop()

  const noteDuration = NOTE_DURATIONS[currentInstrumentType ?? 'piano']
  const isChord = settings.direction === 'chord'
  const interval = isChord ? 0 : intervalFromBpm(settings.bpm)
  const beat = 60 / settings.bpm

  const maxVoices = Math.max(...sequence.map(c => c.length))
  const clusterDuration = isChord
    ? (1 + LOOP_GAP_BEATS) * beat
    : maxVoices * interval + LOOP_GAP_BEATS * beat

  const events = sequence.map((cluster, i) => ({
    time: i * clusterDuration,
    notes: buildArpeggioNotes(cluster, settings.direction),
  }))

  const totalDuration = sequence.length * clusterDuration

  // Configure Transport loop params BEFORE starting
  const transport = Tone.getTransport()
  transport.bpm.value = settings.bpm
  transport.loop = loop
  transport.loopStart = 0
  transport.loopEnd = totalDuration

  loopPart = new Tone.Part((time, event) => {
    const total = event.notes.length
    event.notes.forEach((midi: number, noteIdx: number) => {
      const vel = humanVelocity(0.72, noteIdx, total)
      instrument!.triggerAttackRelease(midiToTone(midi), noteDuration, time + noteIdx * interval, vel)
    })
  }, events)

  loopPart.start(0)

  // Small offset gives the scheduler time to commit before playback starts
  transport.start('+0.05')
  isPlaying.value = true

  currentClusterDuration = clusterDuration
  currentSequenceLength = sequence.length
  playingIndex.value = 0

  function tick() {
    const pos = Tone.getTransport().seconds
    const idx = Math.floor(pos / currentClusterDuration) % currentSequenceLength
    playingIndex.value = idx
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)
}

function stopLoop(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
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
  playingIndex.value = -1
}

function dispose(): void {
  stopLoop()
  if (instrument) {
    instrument.dispose()
    instrument = null
    isLoaded.value = false
    currentInstrumentType = null
  }
}

export function useAudioEngine() {
  return {
    isLoaded: readonly(isLoaded),
    isPlaying: readonly(isPlaying),
    loadError: readonly(loadError),
    playingIndex: readonly(playingIndex),
    init,
    playCluster,
    playSequence,
    stopLoop,
    dispose,
  }
}
