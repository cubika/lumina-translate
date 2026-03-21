import { useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'

interface TranslationOutputProps {
  translatedText: string
  sourceText: string
  isTranslating: boolean
}

/** Split text into paragraphs, normalizing different newline patterns */
function splitParagraphs(text: string): string[] {
  // Split on double newlines (standard markdown paragraph breaks)
  const paras = text.split(/\n{2,}/).filter(Boolean)
  if (paras.length > 1) return paras
  // Fallback: single newline split for line-by-line content
  return text.split(/\n/).filter(Boolean)
}

export default function TranslationOutput({ translatedText, sourceText, isTranslating }: TranslationOutputProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const targetParas = useMemo(() => splitParagraphs(translatedText), [translatedText])
  const sourceParas = useMemo(() => splitParagraphs(sourceText), [sourceText])

  // Direct 1:1 mapping — works when AI preserves paragraph structure
  const alignedSource = hoveredIdx !== null && hoveredIdx < sourceParas.length
    ? sourceParas[hoveredIdx]
    : null

  // During streaming or if only one paragraph, render as single markdown block
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

  // Paragraph-aligned view with hover + sticky bottom bar
  return (
    <div className="prose-output flex flex-col gap-3 pb-2">
      {targetParas.map((para, i) => (
        <div
          key={i}
          onMouseEnter={() => setHoveredIdx(i)}
          onMouseLeave={() => setHoveredIdx(null)}
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

      {/* Sticky original-text bar at bottom of output panel */}
      {alignedSource !== null && (
        <div className="sticky bottom-0 left-0 right-0 mt-2 z-10">
          <div className="glass-panel rounded-xl border border-outline-variant/20 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="material-symbols-outlined text-xs text-on-surface-variant/50">source</span>
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/50 font-label font-semibold">
                Original
              </span>
            </div>
            <p className="text-on-surface/70 text-sm font-body leading-relaxed whitespace-pre-wrap max-h-28 overflow-y-auto">
              {alignedSource}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
