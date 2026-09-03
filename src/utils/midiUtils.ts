import { Midi } from '@tonejs/midi'
import type { Cluster } from './noteUtils'

export type ArpeggioDirection = 'up' | 'down' | 'updown' | 'random' | 'chord'

export interface MidiExportOptions {
  bpm: number
  direction: ArpeggioDirection
  beatsPerBar: number  // one cluster occupies exactly this many beats — keeps downbeats grid-aligned
  subdivision: number  // arpeggio notes per beat (2 = 8th notes, 4 = 16th notes) — matches useAudioEngine's playback grid
  gapFraction: number  // fraction of one subdivision left silent before the next downbeat
}

const DEFAULT_OPTIONS: MidiExportOptions = {
  bpm: 80,
  direction: 'up',
  beatsPerBar: 4,
  subdivision: 4,
  gapFraction: 0.15,
}

function orderNotes(cluster: Cluster, direction: ArpeggioDirection): number[] {
  const sorted = [...cluster].sort((a, b) => a - b)
  switch (direction) {
    case 'down':
      return sorted.reverse()
    case 'updown': {
      const inner = sorted.slice(1, sorted.length - 1).reverse()
      return [...sorted, ...inner]
    }
    case 'random':
      return [...sorted].sort(() => Math.random() - 0.5)
    case 'up':
    case 'chord':
    default:
      return sorted
  }
}

// Export a sequence of clusters as a MIDI file and trigger a browser download
export function exportSequenceAsMidi(
  sequence: Cluster[],
  options: Partial<MidiExportOptions> = {}
): void {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  const midi = new Midi()
  midi.header.setTempo(opts.bpm)

  const track = midi.addTrack()
  track.name = 'Eddy'

  const beatSec = 60 / opts.bpm
  const barSec = beatSec * opts.beatsPerBar
  const subdivisionsPerBar = opts.beatsPerBar * opts.subdivision
  const subdivisionSec = barSec / subdivisionsPerBar
  const gapSec = subdivisionSec * opts.gapFraction

  sequence.forEach((cluster, barIndex) => {
    const barStart = barIndex * barSec
    const notes = orderNotes(cluster, opts.direction)

    if (opts.direction === 'chord') {
      notes.forEach(midi_note => {
        track.addNote({
          midi: midi_note,
          time: barStart,
          duration: barSec - gapSec,
          velocity: 0.75,
        })
      })
      return
    }

    // Arpeggiate across the bar's subdivisions, then hold the last note
    // through to the next downbeat — one cluster is always exactly one bar.
    const steps = Math.min(notes.length, subdivisionsPerBar)
    notes.slice(0, steps).forEach((midi_note, i) => {
      const isLast = i === steps - 1
      track.addNote({
        midi: midi_note,
        time: barStart + i * subdivisionSec,
        duration: isLast ? barSec - i * subdivisionSec - gapSec : subdivisionSec,
        velocity: 0.75,
      })
    })
  })

  // Encode and download
  const bytes = midi.toArray()
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'audio/midi' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `eddy-${Date.now().toString(36)}.mid`
  a.click()
  URL.revokeObjectURL(url)
}

// Export sequence as plain text (note names, one cluster per line)
export function exportSequenceAsText(sequence: Cluster[]): string {
  return sequence
    .map((cluster, i) => {
      const notes = [...cluster]
        .sort((a, b) => a - b)
        .map(midiToNoteName)
        .join('  ')
      return `${String(i + 1).padStart(2, ' ')}.  ${notes}`
    })
    .join('\n')
}

function midiToNoteName(midi: number): string {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const octave = Math.floor(midi / 12) - 1
  return `${names[midi % 12]}${octave}`
}
