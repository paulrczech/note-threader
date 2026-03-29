import { Midi } from '@tonejs/midi'
import type { Cluster } from './noteUtils'

export interface MidiExportOptions {
  bpm: number
  arpeggiate: boolean      // true = stagger notes, false = simultaneous chord
  noteDuration: number     // duration of each note in seconds
  arpeggioInterval: number // seconds between arpeggio notes (ignored if !arpeggiate)
}

const DEFAULT_OPTIONS: MidiExportOptions = {
  bpm: 80,
  arpeggiate: true,
  noteDuration: 1.5,
  arpeggioInterval: 0.12,
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
  // Name the track
  track.name = 'Note Threader'

  let currentTime = 0
  const clusterGap = 0.2  // brief silence between clusters

  for (const cluster of sequence) {
    const sorted = [...cluster].sort((a, b) => a - b)

    if (opts.arpeggiate) {
      sorted.forEach((midi_note, i) => {
        track.addNote({
          midi: midi_note,
          time: currentTime + i * opts.arpeggioInterval,
          duration: opts.noteDuration,
          velocity: 0.75,
        })
      })
      currentTime += sorted.length * opts.arpeggioInterval + opts.noteDuration + clusterGap
    } else {
      // All notes simultaneously (block chord)
      sorted.forEach(midi_note => {
        track.addNote({
          midi: midi_note,
          time: currentTime,
          duration: opts.noteDuration,
          velocity: 0.75,
        })
      })
      currentTime += opts.noteDuration + clusterGap
    }
  }

  // Encode and download
  const bytes = midi.toArray()
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'audio/midi' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `note-threader-${Date.now().toString(36)}.mid`
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
