import { Strategy } from '../data/strategies'
import { getScaleNotes } from '../data/scales'
import { MIDI_MIN, MIDI_MAX } from '../data/notes'
import {
  Cluster,
  sortCluster,
  isValidCluster,
  mostDissonantVoiceIndex,
  reachableNotes,
  deduplicateClusters,
} from '../utils/noteUtils'

export interface VoiceLeadingOptions {
  keyLockActive: boolean
  keyRoot?: number        // MIDI root note (pitch class only used)
  scaleId?: string        // scale id from scales.ts
}

const MAX_CANDIDATES = 6  // max options returned to the user

// Resolve interval bounds from a movementType string
function intervalBounds(movementType: string): { min: number; max: number } {
  switch (movementType) {
    case 'half':              return { min: 1, max: 1 }
    case 'whole':             return { min: 2, max: 2 }
    case 'step':              return { min: 1, max: 2 }
    case 'third':             return { min: 1, max: 4 }
    case 'tritone':           return { min: 6, max: 6 }
    case 'chromatic-approach':return { min: 1, max: 1 }
    case 'free':              return { min: 1, max: 7 }
    default:                  return { min: 1, max: 2 }
  }
}

// Determine which voice indices are allowed to move given the strategy rule
function movableVoiceIndices(strategy: Strategy, cluster: Cluster): number[] {
  const n = cluster.length
  const all = Array.from({ length: n }, (_, i) => i)

  switch (strategy.voicesAllowedToMove) {
    case 'all':
      return all
    case 'all-but-one':
      // Will be handled per-candidate: hold each voice in turn
      return all
    case 'one':
      return all  // caller picks one at a time
    case 'two':
      return all  // caller picks two at a time
    case 'top':
      return [n - 1]
    case 'bottom':
      return [0]
    case 'upper':
      return all.slice(1)
    case 'lower':
      return all.slice(0, n - 1)
    case 'most-dissonant-held': {
      const heldIdx = mostDissonantVoiceIndex(cluster)
      return all.filter(i => i !== heldIdx)
    }
    case 'least-expected-held': {
      // Hold a non-outer voice (middle voice in 3-voice; random inner for 4+)
      const innerIndices = all.slice(1, n - 1)
      const heldIdx = innerIndices.length > 0
        ? innerIndices[Math.floor(Math.random() * innerIndices.length)]
        : 1
      return all.filter(i => i !== heldIdx)
    }
    default:
      return all
  }
}

// Build the set of allowed MIDI notes (full range or scale-filtered)
function buildAllowedNoteSet(options: VoiceLeadingOptions): Set<number> | undefined {
  if (!options.keyLockActive || !options.scaleId || options.keyRoot === undefined) {
    return undefined  // no restriction
  }
  const notes = getScaleNotes(options.keyRoot, options.scaleId, MIDI_MIN, MIDI_MAX)
  return new Set(notes)
}

// Generate candidate clusters for strategies where exactly one voice moves
function generateSingleVoiceCandidates(
  cluster: Cluster,
  strategy: Strategy,
  allowedNotes: Set<number> | undefined
): Cluster[] {
  const { min, max } = intervalBounds(strategy.movementType)
  const candidates: Cluster[] = []
  const movable = movableVoiceIndices(strategy, cluster)

  for (const voiceIdx of movable) {
    const targets = reachableNotes(cluster[voiceIdx], min, max, allowedNotes)
    for (const target of targets) {
      const newCluster = [...cluster]
      newCluster[voiceIdx] = target
      const sorted = sortCluster(newCluster)
      if (isValidCluster(sorted)) {
        candidates.push(sorted)
      }
    }
  }
  return candidates
}

// Generate candidates where all voices move in the same direction (up or down)
function generateAllVoiceSameDirection(
  cluster: Cluster,
  strategy: Strategy,
  allowedNotes: Set<number> | undefined
): Cluster[] {
  const { min } = intervalBounds(strategy.movementType)
  const step = min  // use min interval for uniform movement
  const candidates: Cluster[] = []

  for (const dir of [1, -1]) {
    const newCluster = cluster.map(note => note + dir * step)
    const sorted = sortCluster(newCluster)
    if (isValidCluster(sorted)) {
      if (!allowedNotes || newCluster.every(n => allowedNotes.has(n))) {
        candidates.push(sorted)
      }
    }
  }
  return candidates
}

// Generate candidates where one voice is held and all others move (all-but-one)
function generateAllButOneCandidates(
  cluster: Cluster,
  strategy: Strategy,
  allowedNotes: Set<number> | undefined
): Cluster[] {
  const { min, max } = intervalBounds(strategy.movementType)
  const n = cluster.length
  const candidates: Cluster[] = []

  // Try holding each voice in turn
  for (let heldIdx = 0; heldIdx < n; heldIdx++) {
    const movingIndices = Array.from({ length: n }, (_, i) => i).filter(i => i !== heldIdx)

    // Generate all combinations of target notes for moving voices
    const targetSets: number[][] = movingIndices.map(idx =>
      reachableNotes(cluster[idx], min, max, allowedNotes)
    )

    // Cartesian product of target sets (bounded — movingIndices.length is small)
    const combos = cartesianProduct(targetSets)
    for (const combo of combos) {
      const newCluster = [...cluster]
      movingIndices.forEach((voiceIdx, i) => {
        newCluster[voiceIdx] = combo[i]
      })
      const sorted = sortCluster(newCluster)
      if (isValidCluster(sorted)) {
        candidates.push(sorted)
      }
    }
  }
  return candidates
}

// Cartesian product of arrays — used for multi-voice movement
function cartesianProduct(arrays: number[][]): number[][] {
  if (arrays.length === 0) return [[]]
  return arrays.reduce<number[][]>(
    (acc, arr) => acc.flatMap(combo => arr.map(val => [...combo, val])),
    [[]]
  )
}

// Select a random subset of candidates when there are too many
function sampleCandidates(candidates: Cluster[], max: number): Cluster[] {
  if (candidates.length <= max) return candidates
  const shuffled = [...candidates].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, max)
}

// Main export: given current cluster + strategy + options, return candidate clusters
export function generateCandidates(
  cluster: Cluster,
  strategy: Strategy,
  options: VoiceLeadingOptions
): Cluster[] {
  // Skip key-lock-required strategies if key lock is not active
  if (strategy.requiresKeyLock && !options.keyLockActive) {
    return []
  }

  const allowedNotes = buildAllowedNoteSet(options)
  let candidates: Cluster[] = []

  switch (strategy.voicesAllowedToMove) {
    case 'all':
      if (strategy.movementType === 'half' || strategy.movementType === 'whole') {
        // all-voices-same-direction (e.g. "move every voice by half step")
        candidates = generateAllVoiceSameDirection(cluster, strategy, allowedNotes)
      } else {
        candidates = generateSingleVoiceCandidates(cluster, strategy, allowedNotes)
      }
      break

    case 'all-but-one':
      candidates = generateAllButOneCandidates(cluster, strategy, allowedNotes)
      break

    case 'one':
    case 'top':
    case 'bottom':
    case 'upper':
    case 'lower':
    case 'most-dissonant-held':
    case 'least-expected-held':
      candidates = generateSingleVoiceCandidates(cluster, strategy, allowedNotes)
      break

    default:
      candidates = generateSingleVoiceCandidates(cluster, strategy, allowedNotes)
  }

  // Remove duplicates, remove the current cluster itself, cap results
  const unique = deduplicateClusters(candidates)
  const filtered = unique.filter(c => !c.every((n, i) => n === sortCluster(cluster)[i]))
  return sampleCandidates(filtered, MAX_CANDIDATES)
}
