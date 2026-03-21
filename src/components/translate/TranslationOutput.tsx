import { useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'

interface TranslationOutputProps {
  translatedText: string
  sourceText: string
  isTranslating: boolean
}

/** Split text into paragraphs by double or single newlines, preserving structure */
function splitParagraphs(text: string): string[] {
  // Split on double newlines first (markdown paragraphs), fall back to single
  const paras = text.split(/\n{2,}/)
  if (paras.length > 1) return paras.filter(Boolean)
  // Single newline split for line-by-line content
  return text.split(/\n/).filter(Boolean)
}

export default function TranslationOutput({ translatedText, sourceText, isTranslating }: TranslationOutputProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const targetParas = useMemo(() => splitParagraphs(translatedText), [translatedText])
  const sourceParas = useMemo(() => splitParagraphs(sourceText), [sourceText])

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

  // Paragraph-aligned view with hover
  return (
    <div className="prose-output flex flex-col gap-3">
      {targetParas.map((para, i) => {
        const hasSource = i < sourceParas.length
        return (
          <div
            key={i}
            className="group relative"
            onMouseEnter={() => hasSource && setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div
              className={`rounded-lg px-2 py-1 -mx-2 transition-colors duration-150 ${
                hoveredIdx === i ? 'bg-primary-fixed-dim/8' : ''
              }`}
            >
              <ReactMarkdown>{para}</ReactMarkdown>
            </div>

            {/* Original text tooltip */}
            {hoveredIdx === i && hasSource && (
              <div className="absolute left-0 right-0 bottom-full mb-2 z-50 pointer-events-none">
                <div className="glass-panel rounded-xl border border-outline-variant/20 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] max-h-40 overflow-y-auto">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="material-symbols-outlined text-xs text-on-surface-variant/50">source</span>
                    <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/50 font-label font-semibold">
                      Original
                    </span>
                  </div>
                  <p className="text-on-surface/70 text-sm font-body leading-relaxed whitespace-pre-wrap">
                    {sourceParas[i]}
                  </p>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
