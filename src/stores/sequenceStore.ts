import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Cluster, sortCluster, isValidCluster } from '../utils/noteUtils'
import { MIDI_SEED_MAX, MIDI_MIN, MIDI_MAX } from '../data/notes'

export const useSequenceStore = defineStore('sequence', () => {
  const sequence = ref<Cluster[]>([])
  const redoStack = ref<Cluster[]>([])
  const candidates = ref<Cluster[]>([])
  const auditioning = ref<Cluster | null>(null)
  const loopResolved = ref(false)
  const loopPoint = ref<number>(-1)

  const currentCluster = computed<Cluster | null>(() =>
    sequence.value.length > 0 ? sequence.value[sequence.value.length - 1] : null
  )

  const moveCount = computed(() => Math.max(0, sequence.value.length - 1))
  const canUndo = computed(() => sequence.value.length > 1)
  const canRedo = computed(() => redoStack.value.length > 0)

  function start(openingCluster: Cluster) {
    // Always clear old session first — never let stale data leak through
    sequence.value = []
    redoStack.value = []
    candidates.value = []
    auditioning.value = null
    loopResolved.value = false
    loopPoint.value = -1

    const sorted = sortCluster(openingCluster)
    if (!isValidCluster(sorted)) {
      console.warn('Invalid opening cluster', sorted)
      return
    }
    sequence.value = [sorted]
  }

  function randomStart(voiceCount: number) {
    let notes: number[] = []

    // Retry until we get exactly voiceCount valid notes.
    // Previous approach broke early when notes went too high, producing silent failures.
    for (let attempt = 0; attempt < 30; attempt++) {
      notes = []
      // Seed anywhere from MIDI_MIN up to MIDI_SEED_MAX, leaving headroom for voices above
      const seedRange = MIDI_SEED_MAX - MIDI_MIN
      notes.push(MIDI_MIN + Math.floor(Math.random() * seedRange))

      while (notes.length < voiceCount) {
        const prev = notes[notes.length - 1]
        const spread = prev - notes[0]
        const remaining = voiceCount - notes.length
        // Reserve at least 1 semitone per remaining voice
        const maxStep = Math.min(14 - spread - (remaining - 1), 5)
        if (maxStep < 1) break
        const step = 1 + Math.floor(Math.random() * maxStep)
        notes.push(prev + step)
      }

      if (notes.length === voiceCount && isValidCluster(notes)) break
    }

    // Guaranteed fallback — can never fail isValidCluster
    if (notes.length !== voiceCount || !isValidCluster(notes)) {
      const fallbacks: Record<number, Cluster> = {
        3: [60, 64, 67],  // C4 E4 G4
        4: [60, 64, 67, 71], // C4 E4 G4 B4
      }
      notes = fallbacks[voiceCount] ?? [60, 64, 67]
    }

    start(notes)
  }

  function setCandidates(newCandidates: Cluster[]) {
    candidates.value = newCandidates
    auditioning.value = null
  }

  function audition(cluster: Cluster) {
    auditioning.value = cluster
  }

  function confirm(cluster: Cluster) {
    redoStack.value = []  // new branch clears redo history
    sequence.value.push(sortCluster(cluster))
    candidates.value = []
    auditioning.value = null
  }

  function undo() {
    if (sequence.value.length <= 1) return
    const popped = sequence.value.pop()!
    redoStack.value.push(popped)
    candidates.value = []
    auditioning.value = null
    loopResolved.value = false
  }

  function redo() {
    if (redoStack.value.length === 0) return
    const cluster = redoStack.value.pop()!
    sequence.value.push(cluster)
    candidates.value = []
    auditioning.value = null
  }

  // Returns whether an octave shift is possible in the given direction
  function canTransposeOctave(direction: 1 | -1): boolean {
    if (!currentCluster.value) return false
    return currentCluster.value.every(n => {
      const shifted = n + direction * 12
      return shifted >= MIDI_MIN && shifted <= MIDI_MAX
    })
  }

  function transposeOctave(direction: 1 | -1) {
    if (!canTransposeOctave(direction)) return
    const shifted = currentCluster.value!.map(n => n + direction * 12) as Cluster
    const lastIdx = sequence.value.length - 1
    sequence.value[lastIdx] = shifted
    candidates.value = []
    auditioning.value = null
  }

  function editClusterAt(index: number, newCluster: Cluster) {
    if (index < 0 || index >= sequence.value.length) return
    const sorted = sortCluster(newCluster)
    if (!isValidCluster(sorted)) return
    sequence.value[index] = sorted
  }

  function reorderSequence(from: number, to: number) {
    if (from === to) return
    const arr = [...sequence.value]
    const [moved] = arr.splice(from, 1)
    arr.splice(to, 0, moved)
    sequence.value = arr
    candidates.value = []
    auditioning.value = null
  }

  function deleteAt(index: number) {
    if (index < 0 || index >= sequence.value.length) return
    if (index === 0 && sequence.value.length === 1) return
    sequence.value.splice(index, 1)
    candidates.value = []
    auditioning.value = null
  }

  function setLoopResolved(resolved: boolean, point: number = -1) {
    loopResolved.value = resolved
    loopPoint.value = point
  }

  function reset() {
    sequence.value = []
    redoStack.value = []
    candidates.value = []
    auditioning.value = null
    loopResolved.value = false
    loopPoint.value = -1
  }

  return {
    sequence,
    candidates,
    auditioning,
    loopResolved,
    loopPoint,
    currentCluster,
    moveCount,
    canUndo,
    canRedo,
    start,
    randomStart,
    setCandidates,
    audition,
    confirm,
    undo,
    redo,
    canTransposeOctave,
    transposeOctave,
    editClusterAt,
    deleteAt,
    reorderSequence,
    setLoopResolved,
    reset,
  }
})
