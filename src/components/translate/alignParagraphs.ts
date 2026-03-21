/**
 * Gale-Church inspired length-based paragraph alignment.
 * Finds optimal alignment between source and target paragraphs
 * supporting 1:1, 1:2, 2:1, 1:0, 0:1 mappings.
 *
 * Returns a map: target paragraph index → source paragraph indices
 */

interface AlignmentGroup {
  sourceIndices: number[]
  targetIndices: number[]
}

function charLen(paras: string[], from: number, count: number): number {
  let len = 0
  for (let i = from; i < from + count && i < paras.length; i++) {
    len += paras[i].length
  }
  return len
}

// Cost of aligning `sn` source paragraphs with `tn` target paragraphs
function alignCost(source: string[], si: number, sn: number, target: string[], ti: number, tn: number): number {
  if (sn === 0 && tn === 0) return Infinity
  const sLen = charLen(source, si, sn)
  const tLen = charLen(target, ti, tn)
  if (sLen === 0 && tLen === 0) return 0
  if (sLen === 0 || tLen === 0) return 100 // penalty for deletion/insertion
  const ratio = tLen / sLen
  // Penalize deviation from expected ratio (0.5 to 2.0 is reasonable)
  return Math.abs(Math.log(ratio)) * 10
}

// Transitions: [source paragraphs consumed, target paragraphs consumed]
const TRANSITIONS: [number, number][] = [
  [1, 1], // 1:1
  [1, 2], // 1:2 (source merged)
  [2, 1], // 2:1 (target merged)
  [0, 1], // deletion (target has extra)
  [1, 0], // insertion (source has extra)
]

export function alignParagraphs(source: string[], target: string[]): AlignmentGroup[] {
  const S = source.length
  const T = target.length

  if (S === 0 || T === 0) return []

  // DP: dp[i][j] = min cost to align source[0..i) with target[0..j)
  const dp: number[][] = Array.from({ length: S + 1 }, () => Array(T + 1).fill(Infinity))
  const back: ([number, number] | null)[][] = Array.from({ length: S + 1 }, () => Array(T + 1).fill(null))
  dp[0][0] = 0

  for (let i = 0; i <= S; i++) {
    for (let j = 0; j <= T; j++) {
      if (dp[i][j] === Infinity) continue

      for (const [sn, tn] of TRANSITIONS) {
        const ni = i + sn
        const nj = j + tn
        if (ni > S || nj > T) continue

        const cost = dp[i][j] + alignCost(source, i, sn, target, j, tn)
        if (cost < dp[ni][nj]) {
          dp[ni][nj] = cost
          back[ni][nj] = [sn, tn]
        }
      }
    }
  }

  // Trace back
  const groups: AlignmentGroup[] = []
  let i = S, j = T
  while (i > 0 || j > 0) {
    const step = back[i][j]
    if (!step) break
    const [sn, tn] = step
    const sourceIndices: number[] = []
    const targetIndices: number[] = []
    for (let k = i - sn; k < i; k++) sourceIndices.push(k)
    for (let k = j - tn; k < j; k++) targetIndices.push(k)
    groups.unshift({ sourceIndices, targetIndices })
    i -= sn
    j -= tn
  }

  return groups
}

/**
 * Build a lookup: given a target paragraph index, return the source paragraph indices it aligns to.
 */
export function buildTargetToSourceMap(groups: AlignmentGroup[]): Map<number, number[]> {
  const map = new Map<number, number[]>()
  for (const group of groups) {
    for (const ti of group.targetIndices) {
      map.set(ti, group.sourceIndices)
    }
  }
  return map
}
