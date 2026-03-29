import { memo, useState, useRef, useMemo, useCallback, useEffect } from 'react'
import PretextRenderer from '../shared/PretextRenderer'

interface TranslationOutputProps {
  translatedText: string
  isTranslating: boolean
  onHoverIndex: (index: number) => void
  highlightIndex: number | null
}

function splitParagraphs(text: string): string[] {
  const paras = text.split(/\n{2,}/).filter(Boolean)
  if (paras.length > 1) return paras
  return text.split(/\n/).filter(Boolean)
}

export { splitParagraphs }

const Paragraph = memo(function Paragraph({
  text,
  index,
  isActive,
  onEnter,
  onLeave,
  variant,
}: {
  text: string
  index: number
  isActive: boolean
  onEnter: (i: number) => void
  onLeave: () => void
  variant: 'source' | 'target'
}) {
  const activeClass = variant === 'source'
    ? 'bg-primary-fixed-dim/15 border-l-2 border-primary-fixed-dim/50 pl-3'
    : 'bg-secondary-fixed-dim/15 border-l-2 border-secondary-fixed-dim/50 pl-3'

  const lineHeight = variant === 'source' ? 'leading-[1.7]' : 'leading-[1.85]'

  return (
    <p
      onMouseEnter={() => onEnter(index)}
      onMouseLeave={onLeave}
      className={`text-on-surface font-reading text-[16px] ${lineHeight} whitespace-pre-wrap rounded-lg px-2 py-1 -mx-2 transition-colors duration-150 cursor-default ${
        isActive ? activeClass : 'border-l-2 border-transparent pl-3'
      }`}
    >
      {text}
    </p>
  )
})

export { Paragraph }

/** Compute character ranges for each paragraph in the original text. */
function computeParagraphRanges(text: string): { start: number; end: number }[] {
  const paras = splitParagraphs(text)
  const ranges: { start: number; end: number }[] = []
  let searchFrom = 0
  for (const para of paras) {
    const idx = text.indexOf(para, searchFrom)
    if (idx !== -1) {
      ranges.push({ start: idx, end: idx + para.length })
      searchFrom = idx + para.length
    }
  }
  return ranges
}

const TARGET_LINE_HEIGHT = Math.round(16 * 1.85) // 29.6 → 30px

export default memo(function TranslationOutput({ translatedText, isTranslating, onHoverIndex, highlightIndex }: TranslationOutputProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const fontRef = useRef<HTMLDivElement>(null)
  const [resolvedFont, setResolvedFont] = useState('')

  // Resolve the actual CSS font from the wrapper element
  useEffect(() => {
    const el = fontRef.current
    if (!el) return
    const cs = getComputedStyle(el)
    setResolvedFont(`${cs.fontSize} ${cs.fontFamily}`)
  }, [translatedText])

  const paragraphRanges = useMemo(
    () => (!isTranslating && translatedText) ? computeParagraphRanges(translatedText) : [],
    [translatedText, isTranslating]
  )

  const handleParagraphHover = useCallback((i: number) => {
    setHoveredIdx(i)
    onHoverIndex(i)
  }, [onHoverIndex])

  const handleParagraphLeave = useCallback(() => {
    setHoveredIdx(null)
  }, [])

  const activeIdx = hoveredIdx ?? highlightIndex

  // During streaming: simple <p> with cursor animation
  if (isTranslating) {
    return (
      <p className="text-on-surface font-reading text-[16px] leading-[1.85] whitespace-pre-wrap">
        {translatedText}
        <span className="inline-block w-0.5 h-4 bg-secondary-fixed-dim animate-pulse ml-0.5 align-text-bottom" />
      </p>
    )
  }

  // After translation complete: PretextRenderer with virtual scrolling
  return (
    <div ref={fontRef} className="h-full font-reading text-[16px] text-on-surface">
      {resolvedFont ? (
        <PretextRenderer
          text={translatedText}
          font={resolvedFont}
          lineHeight={TARGET_LINE_HEIGHT}
          className="h-full"
          paragraphRanges={paragraphRanges}
          onParagraphHover={handleParagraphHover}
          onParagraphLeave={handleParagraphLeave}
          highlightParagraphIndex={activeIdx}
          paragraphHighlightClass="bg-secondary-fixed-dim/15"
        />
      ) : (
        <p className="leading-[1.85] whitespace-pre-wrap">{translatedText}</p>
      )}
    </div>
  )
})
