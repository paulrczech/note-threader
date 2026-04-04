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

const NBROSOWSKY_BASE = 'https://nbrosowsky.github.io/tonejs-instruments/samples/'

// Harp samples from nbrosowsky/tonejs-instruments
const HARP_BASE = NBROSOWSKY_BASE + 'harp/'
const HARP_URLS: Record<string, string> = {
  'C3': 'C3.mp3', 'E3': 'E3.mp3', 'G3': 'G3.mp3', 'B3': 'B3.mp3',
  'C5': 'C5.mp3', 'E5': 'E5.mp3', 'G5': 'G5.mp3', 'B5': 'B5.mp3',
  'D2': 'D2.mp3', 'D4': 'D4.mp3', 'D6': 'D6.mp3',
  'F2': 'F2.mp3', 'F4': 'F4.mp3', 'F6': 'F6.mp3',
  'A2': 'A2.mp3', 'A4': 'A4.mp3', 'A6': 'A6.mp3',
  'E1': 'E1.mp3', 'G1': 'G1.mp3', 'B1': 'B1.mp3',
}

const GUITAR_ACOUSTIC_URLS: Record<string, string> = {
  'A2': 'A2.mp3',  'A3': 'A3.mp3',  'A4': 'A4.mp3',
  'A#2': 'As2.mp3', 'A#3': 'As3.mp3', 'A#4': 'As4.mp3',
  'B2': 'B2.mp3',  'B3': 'B3.mp3',  'B4': 'B4.mp3',
  'C3': 'C3.mp3',  'C4': 'C4.mp3',  'C5': 'C5.mp3',
  'C#3': 'Cs3.mp3', 'C#4': 'Cs4.mp3', 'C#5': 'Cs5.mp3',
  'D2': 'D2.mp3',  'D3': 'D3.mp3',  'D4': 'D4.mp3',  'D5': 'D5.mp3',
  'D#2': 'Ds2.mp3', 'D#3': 'Ds3.mp3', 'D#4': 'Ds4.mp3',
  'E2': 'E2.mp3',  'E3': 'E3.mp3',  'E4': 'E4.mp3',
  'F2': 'F2.mp3',  'F3': 'F3.mp3',  'F4': 'F4.mp3',
  'F#2': 'Fs2.mp3', 'F#3': 'Fs3.mp3', 'F#4': 'Fs4.mp3',
  'G2': 'G2.mp3',  'G3': 'G3.mp3',  'G4': 'G4.mp3',
  'G#2': 'Gs2.mp3', 'G#3': 'Gs3.mp3', 'G#4': 'Gs4.mp3',
}

const GUITAR_NYLON_URLS: Record<string, string> = {
  'A2': 'A2.mp3',  'A3': 'A3.mp3',  'A4': 'A4.mp3',  'A5': 'A5.mp3',
  'A#5': 'As5.mp3',
  'B1': 'B1.mp3',  'B2': 'B2.mp3',  'B3': 'B3.mp3',  'B4': 'B4.mp3',
  'C#3': 'Cs3.mp3', 'C#4': 'Cs4.mp3', 'C#5': 'Cs5.mp3',
  'D2': 'D2.mp3',  'D3': 'D3.mp3',  'D5': 'D5.mp3',
  'D#4': 'Ds4.mp3',
  'E2': 'E2.mp3',  'E3': 'E3.mp3',  'E4': 'E4.mp3',  'E5': 'E5.mp3',
  'F#2': 'Fs2.mp3', 'F#3': 'Fs3.mp3', 'F#4': 'Fs4.mp3', 'F#5': 'Fs5.mp3',
  'G3': 'G3.mp3',  'G5': 'G5.mp3',
  'G#2': 'Gs2.mp3', 'G#4': 'Gs4.mp3', 'G#5': 'Gs5.mp3',
}

const CELLO_URLS: Record<string, string> = {
  'A2': 'A2.mp3',  'A3': 'A3.mp3',  'A4': 'A4.mp3',
  'A#2': 'As2.mp3', 'A#3': 'As3.mp3',
  'B2': 'B2.mp3',  'B3': 'B3.mp3',  'B4': 'B4.mp3',
  'C2': 'C2.mp3',  'C3': 'C3.mp3',  'C4': 'C4.mp3',  'C5': 'C5.mp3',
  'C#3': 'Cs3.mp3', 'C#4': 'Cs4.mp3',
  'D2': 'D2.mp3',  'D3': 'D3.mp3',  'D4': 'D4.mp3',
  'D#2': 'Ds2.mp3', 'D#3': 'Ds3.mp3', 'D#4': 'Ds4.mp3',
  'E2': 'E2.mp3',  'E3': 'E3.mp3',  'E4': 'E4.mp3',
  'F2': 'F2.mp3',  'F3': 'F3.mp3',  'F4': 'F4.mp3',
  'F#3': 'Fs3.mp3', 'F#4': 'Fs4.mp3',
  'G2': 'G2.mp3',  'G3': 'G3.mp3',  'G4': 'G4.mp3',
  'G#2': 'Gs2.mp3', 'G#3': 'Gs3.mp3', 'G#4': 'Gs4.mp3',
}

const VIOLIN_URLS: Record<string, string> = {
  'A3': 'A3.mp3', 'A4': 'A4.mp3', 'A5': 'A5.mp3', 'A6': 'A6.mp3',
  'C4': 'C4.mp3', 'C5': 'C5.mp3', 'C6': 'C6.mp3',
  'E4': 'E4.mp3', 'E5': 'E5.mp3', 'E6': 'E6.mp3',
  'G3': 'G3.mp3', 'G4': 'G4.mp3', 'G5': 'G5.mp3', 'G6': 'G6.mp3',
}

const LOOP_GAP_BEATS = 1

export type ArpeggioDirection = 'up' | 'down' | 'updown' | 'random' | 'chord'

export interface PlaybackSettings {
  bpm: number
  direction: ArpeggioDirection
}

// Fixed note durations for plucky/percussive instruments
const NOTE_DURATIONS: Partial<Record<InstrumentType, string>> = {
  piano:            '2n',
  harp:             '2n',
  'guitar-acoustic':'2n',
  'guitar-nylon':   '2n',
}

// Instruments that should sustain for the full cluster duration rather than a fixed value
const SUSTAINED_INSTRUMENTS = new Set<InstrumentType>(['cello', 'violin'])

function noteDuration(clusterDurationSeconds?: number): string {
  const type = currentInstrumentType ?? 'piano'
  if (SUSTAINED_INSTRUMENTS.has(type) && clusterDurationSeconds) {
    return clusterDurationSeconds.toFixed(3)
  }
  return NOTE_DURATIONS[type] ?? '2n'
}

type ToneInstrument = Tone.Sampler

let instrument: ToneInstrument | null = null
let currentInstrumentType: InstrumentType | null = null
let loopPart: Tone.Part | null = null
let rafId: number | null = null
let currentClusterDuration = 0
let currentSequenceLength = 0
let lastPlaySequenceTime = 0

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

  const SAMPLER_CONFIGS: Record<InstrumentType, { urls: Record<string, string>; baseUrl: string }> = {
    piano:            { urls: SALAMANDER_URLS,      baseUrl: SALAMANDER_BASE },
    harp:             { urls: HARP_URLS,            baseUrl: HARP_BASE },
    'guitar-acoustic':{ urls: GUITAR_ACOUSTIC_URLS, baseUrl: NBROSOWSKY_BASE + 'guitar-acoustic/' },
    'guitar-nylon':   { urls: GUITAR_NYLON_URLS,    baseUrl: NBROSOWSKY_BASE + 'guitar-nylon/' },
    cello:            { urls: CELLO_URLS,           baseUrl: NBROSOWSKY_BASE + 'cello/' },
    violin:           { urls: VIOLIN_URLS,          baseUrl: NBROSOWSKY_BASE + 'violin/' },
  }

  const { urls, baseUrl } = SAMPLER_CONFIGS[instrumentType]
  return new Promise((resolve, reject) => {
    instrument = new Tone.Sampler({
      urls,
      baseUrl,
      onload: () => {
        isLoaded.value = true
        loadError.value = null
        resolve()
      },
      onerror: (err) => {
        loadError.value = `Failed to load ${instrumentType} samples`
        console.error('Sampler load error:', err)
        reject(err)
      },
    }).toDestination()
  })
}

function playCluster(
  cluster: number[],
  settings: PlaybackSettings = { bpm: 80, direction: 'up' },
  onComplete?: () => void
): void {
  if (!instrument || !isLoaded.value) return

  stopLoop()

  const interval = settings.direction === 'chord' ? 0 : intervalFromBpm(settings.bpm)
  const notes = buildArpeggioNotes(cluster, settings.direction)
  const now = Tone.now()
  // For single-cluster audition, use a 2-beat duration as the cluster window
  const beat = 60 / settings.bpm
  const dur = noteDuration((notes.length * interval) + beat)

  notes.forEach((midi, i) => {
    const vel = humanVelocity(0.72, i, notes.length)
    instrument!.triggerAttackRelease(midiToTone(midi), dur, now + i * interval, vel)
  })

  if (onComplete) {
    const totalTime = (notes.length - 1) * interval + Tone.Time(dur).toSeconds()
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
  const now = Date.now()
  if (now - lastPlaySequenceTime < 100) return
  lastPlaySequenceTime = now

  stopLoop()

  const isChord = settings.direction === 'chord'
  const interval = isChord ? 0 : intervalFromBpm(settings.bpm)
  const beat = 60 / settings.bpm

  const maxVoices = Math.max(...sequence.map(c => c.length))
  const clusterDuration = isChord
    ? (1 + LOOP_GAP_BEATS) * beat
    : maxVoices * interval + LOOP_GAP_BEATS * beat

  const dur = noteDuration(clusterDuration)

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
      instrument!.triggerAttackRelease(midiToTone(midi), dur, time + noteIdx * interval, vel)
    })
  }, events)

  loopPart.loop = loop
  loopPart.loopEnd = totalDuration
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
