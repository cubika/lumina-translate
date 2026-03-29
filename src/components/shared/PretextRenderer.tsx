import {
  memo,
  useRef,
  useState,
  useMemo,
  useCallback,
  useEffect,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import {
  prepareWithSegments,
  layoutWithLines,
  type LayoutCursor,
  type PreparedTextWithSegments,
  type LayoutLine,
} from '@chenglou/pretext'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface Highlight {
  start: number // character offset in the original text
  end: number
  className: string
  title?: string
}

export interface PretextRendererProps {
  text: string
  font: string // CSS font string, e.g. "16px Inter"
  lineHeight: number // in px
  className?: string // container className
  highlights?: Highlight[]
  paragraphRanges?: { start: number; end: number }[]
  onParagraphHover?: (index: number) => void
  onParagraphLeave?: () => void
  highlightParagraphIndex?: number | null
  paragraphHighlightClass?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute the character offset (in UTF-16 code units) in the original text
 * for a LayoutCursor. The cursor's graphemeIndex counts graphemes within the
 * segment, which may differ from code-unit length for emoji / combining chars.
 *
 * Uses Array.from() to iterate by Unicode code points — correct for surrogate
 * pairs (emoji) and sufficient for translation text.
 */
function cursorToCharOffset(
  segments: string[],
  cursor: LayoutCursor,
): number {
  let offset = 0
  for (let i = 0; i < cursor.segmentIndex; i++) {
    offset += segments[i]!.length
  }
  if (cursor.graphemeIndex > 0 && cursor.segmentIndex < segments.length) {
    const seg = segments[cursor.segmentIndex]!
    // Iterate by code points; each "element" from Array.from is one code point,
    // which is a reasonable proxy for graphemes in non-combining text.
    const codePoints = Array.from(seg)
    const graphemeSlice = codePoints.slice(0, cursor.graphemeIndex)
    offset += graphemeSlice.join('').length
  }
  return offset
}

/** Binary search: find the index of the paragraph that contains `charOffset`. */
function findParagraphIndex(
  paragraphRanges: { start: number; end: number }[],
  charOffset: number,
): number {
  for (let i = 0; i < paragraphRanges.length; i++) {
    const range = paragraphRanges[i]!
    if (charOffset >= range.start && charOffset < range.end) {
      return i
    }
  }
  return -1
}

// ---------------------------------------------------------------------------
// Line rendering helpers
// ---------------------------------------------------------------------------

interface LineSpan {
  text: string
  className?: string
  title?: string
}

/**
 * Split a line's text into spans based on highlight boundaries.
 *
 * `lineStartChar` / `lineEndChar` are the character offsets of this line
 * in the original text. Highlights whose [start, end) range overlaps
 * [lineStartChar, lineEndChar) produce styled spans.
 *
 * Note: `lineText` may be shorter than `lineEndChar - lineStartChar` because
 * pretext strips invisible segments (hard breaks, soft hyphens). We clamp all
 * slice positions to `lineText.length` to stay safe.
 */
function splitLineIntoSpans(
  lineText: string,
  lineStartChar: number,
  lineEndChar: number,
  highlights: Highlight[],
): LineSpan[] {
  const textLen = lineText.length
  // Effective end for slicing — never exceed the actual rendered text
  const effectiveEnd = lineStartChar + textLen

  // Collect cut-points that fall inside this line
  const cuts: { offset: number; isStart: boolean; highlight: Highlight }[] = []

  for (const hl of highlights) {
    if (hl.end <= lineStartChar || hl.start >= effectiveEnd) continue
    const clampedStart = Math.max(hl.start, lineStartChar)
    const clampedEnd = Math.min(hl.end, effectiveEnd)
    cuts.push({ offset: clampedStart, isStart: true, highlight: hl })
    cuts.push({ offset: clampedEnd, isStart: false, highlight: hl })
  }

  if (cuts.length === 0) {
    return [{ text: lineText }]
  }

  // Sort by offset; starts before ends at the same position
  cuts.sort((a, b) => a.offset - b.offset || (a.isStart ? -1 : 1))

  // Walk through the line producing spans
  const spans: LineSpan[] = []
  let pos = lineStartChar
  const activeHighlights: Highlight[] = []

  for (const cut of cuts) {
    if (cut.offset > pos) {
      const text = lineText.slice(pos - lineStartChar, cut.offset - lineStartChar)
      if (text) {
        const topHL = activeHighlights.length > 0 ? activeHighlights[activeHighlights.length - 1] : undefined
        spans.push({
          text,
          className: topHL?.className,
          title: topHL?.title,
        })
      }
    }
    if (cut.isStart) {
      activeHighlights.push(cut.highlight)
    } else {
      const idx = activeHighlights.lastIndexOf(cut.highlight)
      if (idx !== -1) activeHighlights.splice(idx, 1)
    }
    pos = cut.offset
  }

  // Remaining text after last cut
  if (pos < effectiveEnd) {
    const text = lineText.slice(pos - lineStartChar)
    if (text) {
      const topHL = activeHighlights.length > 0 ? activeHighlights[activeHighlights.length - 1] : undefined
      spans.push({
        text,
        className: topHL?.className,
        title: topHL?.title,
      })
    }
  }

  return spans
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const LINE_BUFFER = 10

export default memo(function PretextRenderer({
  text,
  font,
  lineHeight,
  className,
  highlights,
  paragraphRanges,
  onParagraphHover,
  onParagraphLeave,
  highlightParagraphIndex,
  paragraphHighlightClass,
}: PretextRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)

  // ---- ResizeObserver: track container width and height ----
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const rect = entry.contentRect
        setContainerWidth(rect.width)
        setViewportHeight(rect.height)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // ---- Prepare text (one-time per text + font change) ----
  const prepared = useMemo<PreparedTextWithSegments | null>(() => {
    if (!text) return null
    return prepareWithSegments(text, font, { whiteSpace: 'pre-wrap' })
  }, [text, font])

  // ---- Layout: recompute when prepared data or container width changes ----
  const layoutResult = useMemo(() => {
    if (!prepared || containerWidth <= 0) return null
    return layoutWithLines(prepared, containerWidth, lineHeight)
  }, [prepared, containerWidth, lineHeight])

  // ---- Precompute character offsets per line ----
  const lineCharOffsets = useMemo(() => {
    if (!layoutResult || !prepared) return null
    const segments = prepared.segments
    return layoutResult.lines.map((line: LayoutLine) => ({
      start: cursorToCharOffset(segments, line.start),
      end: cursorToCharOffset(segments, line.end),
    }))
  }, [layoutResult, prepared])

  // ---- Virtual scrolling: determine visible line range ----
  const { firstLine, lastLine } = useMemo(() => {
    if (!layoutResult) return { firstLine: 0, lastLine: 0 }
    const totalLines = layoutResult.lineCount
    const first = Math.max(0, Math.floor(scrollTop / lineHeight) - LINE_BUFFER)
    const last = Math.min(
      totalLines - 1,
      Math.ceil((scrollTop + viewportHeight) / lineHeight) + LINE_BUFFER,
    )
    return { firstLine: first, lastLine: last }
  }, [layoutResult, scrollTop, viewportHeight, lineHeight])

  // ---- Scroll handler ----
  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (el) setScrollTop(el.scrollTop)
  }, [])

  // ---- Paragraph hover handler ----
  const handleMouseMove = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (!paragraphRanges || !onParagraphHover || !lineCharOffsets || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const y = e.clientY - containerRect.top + (containerRef.current.scrollTop || 0)
      const lineIdx = Math.floor(y / lineHeight)

      if (lineIdx < 0 || lineIdx >= lineCharOffsets.length) return

      const lineOffset = lineCharOffsets[lineIdx]!
      const paraIdx = findParagraphIndex(paragraphRanges, lineOffset.start)
      if (paraIdx >= 0) {
        onParagraphHover(paraIdx)
      }
    },
    [paragraphRanges, onParagraphHover, lineCharOffsets, lineHeight],
  )

  const handleMouseLeave = useCallback(() => {
    onParagraphLeave?.()
  }, [onParagraphLeave])

  // ---- Empty text: render nothing ----
  if (!text || !layoutResult || !lineCharOffsets) {
    return <div ref={containerRef} className={className} />
  }

  const totalHeight = layoutResult.lineCount * lineHeight
  const lines = layoutResult.lines

  // ---- Build a set of paragraph-highlighted line indices ----
  let highlightedLineSet: Set<number> | null = null
  if (
    highlightParagraphIndex != null &&
    paragraphRanges &&
    highlightParagraphIndex >= 0 &&
    highlightParagraphIndex < paragraphRanges.length
  ) {
    highlightedLineSet = new Set<number>()
    const pRange = paragraphRanges[highlightParagraphIndex]!
    for (let i = firstLine; i <= lastLine; i++) {
      const lo = lineCharOffsets[i]!
      // Line overlaps the paragraph range
      if (lo.start < pRange.end && lo.end > pRange.start) {
        highlightedLineSet.add(i)
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ overflow: 'auto', position: 'relative' }}
      onScroll={handleScroll}
      onMouseMove={paragraphRanges ? handleMouseMove : undefined}
      onMouseLeave={paragraphRanges ? handleMouseLeave : undefined}
    >
      {/* Spacer to establish total scroll height */}
      <div style={{ height: totalHeight, position: 'relative', userSelect: 'text' }}>
        {/* Render only visible lines */}
        {lines.slice(firstLine, lastLine + 1).map((line: LayoutLine, offset: number) => {
          const lineIdx = firstLine + offset
          const lineOffset = lineCharOffsets[lineIdx]!
          const isParaHighlighted = highlightedLineSet?.has(lineIdx) ?? false

          // Determine if we need highlight spans
          const hasHighlights = highlights && highlights.length > 0
          const spans = hasHighlights
            ? splitLineIntoSpans(line.text, lineOffset.start, lineOffset.end, highlights)
            : null

          return (
            <div
              key={lineIdx}
              style={{
                position: 'absolute',
                top: lineIdx * lineHeight,
                left: 0,
                right: 0,
                height: lineHeight,
                lineHeight: `${lineHeight}px`,
                font,
                whiteSpace: 'pre',
              }}
              className={isParaHighlighted ? paragraphHighlightClass : undefined}
            >
              {spans
                ? spans.map((span, si) =>
                    span.className ? (
                      <span key={si} className={span.className} title={span.title}>
                        {span.text}
                      </span>
                    ) : (
                      <span key={si}>{span.text}</span>
                    ),
                  )
                : line.text}
            </div>
          )
        })}
      </div>
    </div>
  )
})
