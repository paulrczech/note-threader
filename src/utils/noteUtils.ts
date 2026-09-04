import { MIDI_MIN, MIDI_MAX, MAX_CLUSTER_SPREAD, dissonanceRank } from '../data/notes'

export type Cluster = number[]  // array of MIDI notes, sorted ascending (V1 at index 0)

// Ensure a cluster is sorted ascending (voice ordering enforced)
export function sortCluster(cluster: Cluster): Cluster {
  return [...cluster].sort((a, b) => a - b)
}

// Check if a cluster satisfies all hard constraints. `bounds` defaults to the global
// MIDI_MIN/MAX (used throughout the voice-leading engine); manual-entry pickers pass an
// instrument-specific range instead, without affecting movement/candidate generation.
export function isValidCluster(
  cluster: Cluster,
  bounds: { min: number; max: number } = { min: MIDI_MIN, max: MIDI_MAX }
): boolean {
  if (cluster.length < 2) return false
  for (const note of cluster) {
    if (note < bounds.min || note > bounds.max) return false
  }
  const sorted = sortCluster(cluster)
  if (sorted[sorted.length - 1] - sorted[0] > MAX_CLUSTER_SPREAD) return false
  // No duplicate notes
  const unique = new Set(sorted)
  if (unique.size !== sorted.length) return false
  return true
}

// Check if two clusters are equal (same notes regardless of order)
export function clustersEqual(a: Cluster, b: Cluster): boolean {
  if (a.length !== b.length) return false
  const sa = sortCluster(a)
  const sb = sortCluster(b)
  return sa.every((note, i) => note === sb[i])
}

// Find the voice index (0-based) that participates in the most dissonant interval pair
export function mostDissonantVoiceIndex(cluster: Cluster): number {
  const sorted = sortCluster(cluster)
  const scores = sorted.map(() => 0)

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const rank = dissonanceRank(sorted[i], sorted[j])
      scores[i] += rank
      scores[j] += rank
    }
  }

  // Return the index with the highest dissonance score
  let maxScore = -1
  let maxIdx = 0
  for (let i = 0; i < scores.length; i++) {
    if (scores[i] > maxScore) {
      maxScore = scores[i]
      maxIdx = i
    }
  }
  return maxIdx
}

// Generate all notes reachable from a MIDI note within [minInterval, maxInterval] semitones.
// `bounds` defaults to the global MIDI_MIN/MAX; callers operating on a cluster that already
// sits outside that window (e.g. a piano/harp session started below E2) should widen it so
// movement isn't stranded — see generateCandidates in useVoiceLeading.ts.
export function reachableNotes(
  fromMidi: number,
  minInterval: number,
  maxInterval: number,
  allowedNotes?: Set<number>,
  bounds: { min: number; max: number } = { min: MIDI_MIN, max: MIDI_MAX }
): number[] {
  const results: number[] = []
  for (let delta = -maxInterval; delta <= maxInterval; delta++) {
    if (Math.abs(delta) < minInterval) continue
    const target = fromMidi + delta
    if (target < bounds.min || target > bounds.max) continue
    if (allowedNotes && !allowedNotes.has(target)) continue
    results.push(target)
  }
  return results
}

// Deduplicate an array of clusters
export function deduplicateClusters(clusters: Cluster[]): Cluster[] {
  const seen = new Set<string>()
  return clusters.filter(c => {
    const key = sortCluster(c).join(',')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
