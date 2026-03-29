import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Cluster, sortCluster, isValidCluster } from '../utils/noteUtils'
import { MIDI_SEED_MIN, MIDI_SEED_MAX } from '../data/notes'

export const useSequenceStore = defineStore('sequence', () => {
  const sequence = ref<Cluster[]>([])
  const candidates = ref<Cluster[]>([])
  const auditioning = ref<Cluster | null>(null)  // cluster currently being previewed
  const loopResolved = ref(false)
  const loopPoint = ref<number>(-1)  // index in sequence where loop closes

  const currentCluster = computed<Cluster | null>(() =>
    sequence.value.length > 0 ? sequence.value[sequence.value.length - 1] : null
  )

  const moveCount = computed(() => Math.max(0, sequence.value.length - 1))

  // Start a new session with a given opening cluster
  function start(openingCluster: Cluster) {
    const sorted = sortCluster(openingCluster)
    if (!isValidCluster(sorted)) {
      console.warn('Invalid opening cluster', sorted)
      return
    }
    sequence.value = [sorted]
    candidates.value = []
    auditioning.value = null
    loopResolved.value = false
    loopPoint.value = -1
  }

  // Generate a random starting cluster of N voices within seed range
  function randomStart(voiceCount: number) {
    const notes: number[] = []
    const range = MIDI_SEED_MAX - MIDI_SEED_MIN
    // First note anywhere in seed zone
    notes.push(MIDI_SEED_MIN + Math.floor(Math.random() * range))
    // Subsequent notes: within 14 semitones total spread, above previous
    while (notes.length < voiceCount) {
      const prev = notes[notes.length - 1]
      // Leave room for remaining voices
      const remaining = voiceCount - notes.length
      const maxStep = Math.min(14 - (prev - notes[0]), 12 - remaining)
      const step = 1 + Math.floor(Math.random() * Math.max(1, maxStep))
      const next = prev + step
      if (next > MIDI_SEED_MAX + 4) break  // safety: don't go too high
      notes.push(next)
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
    sequence.value.push(sortCluster(cluster))
    candidates.value = []
    auditioning.value = null
  }

  function back() {
    if (sequence.value.length > 1) {
      sequence.value.pop()
      candidates.value = []
      auditioning.value = null
      loopResolved.value = false
    }
  }

  function editClusterAt(index: number, newCluster: Cluster) {
    if (index < 0 || index >= sequence.value.length) return
    const sorted = sortCluster(newCluster)
    if (!isValidCluster(sorted)) return
    sequence.value[index] = sorted
  }

  function deleteAt(index: number) {
    if (index < 0 || index >= sequence.value.length) return
    // Never delete the opening cluster (index 0)
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
    start,
    randomStart,
    setCandidates,
    audition,
    confirm,
    back,
    editClusterAt,
    deleteAt,
    setLoopResolved,
    reset,
  }
})
