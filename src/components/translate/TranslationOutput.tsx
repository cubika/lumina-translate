import { memo, useState, useMemo, useCallback } from 'react'

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

export default memo(function TranslationOutput({ translatedText, isTranslating, onHoverIndex, highlightIndex }: TranslationOutputProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const targetParas = useMemo(
    () => isTranslating ? [] : splitParagraphs(translatedText),
    [translatedText, isTranslating]
  )

  const handleEnter = useCallback((i: number) => {
    setHoveredIdx(i)
    onHoverIndex(i)
  }, [onHoverIndex])

  const handleLeave = useCallback(() => {
    setHoveredIdx(null)
  }, [])

  if (isTranslating || targetParas.length <= 1) {
    return (
      <p className="text-on-surface font-reading text-[16px] leading-[1.85] whitespace-pre-wrap">
        {translatedText}
        {isTranslating && (
          <span className="inline-block w-0.5 h-4 bg-secondary-fixed-dim animate-pulse ml-0.5 align-text-bottom" />
        )}
      </p>
    )
  }

  const activeIdx = hoveredIdx ?? highlightIndex

  return (
    <div className="flex flex-col gap-3">
      {targetParas.map((para, i) => (
        <Paragraph
          key={i}
          text={para}
          index={i}
          isActive={activeIdx === i}
          onEnter={handleEnter}
          onLeave={handleLeave}
          variant="target"
        />
      ))}
    </div>
  )
})
