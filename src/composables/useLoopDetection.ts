import { Cluster, clustersEqual } from '../utils/noteUtils'

export function useLoopDetection() {
  // Check if the latest cluster in the sequence matches the opening cluster
  function isResolved(sequence: Cluster[]): boolean {
    if (sequence.length < 2) return false
    return clustersEqual(sequence[0], sequence[sequence.length - 1])
  }

  // Find any earlier cluster in the sequence that matches the latest (not just index 0)
  // Returns the index of the matching cluster, or -1 if none
  function findLoopPoint(sequence: Cluster[]): number {
    if (sequence.length < 2) return -1
    const last = sequence[sequence.length - 1]
    for (let i = 0; i < sequence.length - 1; i++) {
      if (clustersEqual(sequence[i], last)) return i
    }
    return -1
  }

  return { isResolved, findLoopPoint }
}
