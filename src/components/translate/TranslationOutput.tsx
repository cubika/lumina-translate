import { useState, useMemo, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'

interface TranslationOutputProps {
  translatedText: string
  sourceText: string
  isTranslating: boolean
  onHoverIndex: (index: number | null) => void
}

function splitParagraphs(text: string): string[] {
  const paras = text.split(/\n{2,}/).filter(Boolean)
  if (paras.length > 1) return paras
  return text.split(/\n/).filter(Boolean)
}

export { splitParagraphs }

export default function TranslationOutput({ translatedText, sourceText, isTranslating, onHoverIndex }: TranslationOutputProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const targetParas = useMemo(() => splitParagraphs(translatedText), [translatedText])

  const handleEnter = useCallback((i: number) => {
    setHoveredIdx(i)
    onHoverIndex(i)
  }, [onHoverIndex])

  const handleLeave = useCallback(() => {
    setHoveredIdx(null)
    onHoverIndex(null)
  }, [onHoverIndex])

  if (isTranslating || targetParas.length <= 1) {
    return (
      <div className="prose-output">
        <ReactMarkdown>{translatedText}</ReactMarkdown>
        {isTranslating && (
          <span className="inline-block w-0.5 h-4 bg-secondary-fixed-dim animate-pulse ml-0.5 align-text-bottom" />
        )}
      </div>
    )
  }

  return (
    <div className="prose-output flex flex-col gap-3">
      {targetParas.map((para, i) => (
        <div
          key={i}
          onMouseEnter={() => handleEnter(i)}
          onMouseLeave={handleLeave}
        >
          <div
            className={`rounded-lg px-2 py-1 -mx-2 transition-colors duration-150 ${
              hoveredIdx === i ? 'bg-primary-fixed-dim/8' : ''
            }`}
          >
            <ReactMarkdown>{para}</ReactMarkdown>
          </div>
        </div>
      ))}
    </div>
  )
}
