import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { translateStream, speakText } from '../../services/ai'
import { loadSettings, LANGUAGES, langToBcp47 } from '../../services/settings'
import { useTranslation } from '../../hooks/useTranslation'
import TranslationOutput, { splitParagraphs } from './TranslationOutput'

export default function TranslateWorkspace() {
  const t = useTranslation()
  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [sourceLang, setSourceLang] = useState(() => loadSettings().sourceLang)
  const [targetLang, setTargetLang] = useState(() => loadSettings().targetLang)
  const [isTranslating, setIsTranslating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [swapRotation, setSwapRotation] = useState(0)
  const [hoveredParaIdx, setHoveredParaIdx] = useState<number | null>(null)
  const sourceScrollRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  const sourceParas = useMemo(() => splitParagraphs(sourceText), [sourceText])

  useEffect(() => {
    const sync = () => {
      const s = loadSettings()
      setSourceLang(s.sourceLang)
      setTargetLang(s.targetLang)
    }
    window.addEventListener('settings-changed', sync)
    return () => window.removeEventListener('settings-changed', sync)
  }, [])

  // Sync textarea scroll with backdrop
  const handleSourceScroll = useCallback(() => {
    if (sourceScrollRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = sourceScrollRef.current.scrollTop
    }
  }, [])

  const handleSourceChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSourceText(e.target.value)
  }, [])

  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim() || isTranslating) return

    if (sourceLang === targetLang) {
      setTranslatedText(sourceText)
      return
    }

    setIsTranslating(true)
    setTranslatedText('')

    try {
      const settings = loadSettings()
      const result = await translateStream(
        {
          text: sourceText,
          sourceLang,
          targetLang,
          model: settings.selectedModel,
          providerType: settings.providerType,
        },
        (chunk) => {
          setTranslatedText(prev => prev + chunk)
        }
      )
      setTranslatedText(result)
    } catch (err) {
      setTranslatedText(
        err instanceof Error ? err.message : 'Translation failed. Please check your API settings.'
      )
    } finally {
      setIsTranslating(false)
    }
  }, [sourceText, sourceLang, targetLang, isTranslating])

  const handleCopy = useCallback(() => {
    if (!translatedText) return
    navigator.clipboard.writeText(translatedText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => { /* clipboard permission denied */ })
  }, [translatedText])

  const handleSwapLanguages = useCallback(() => {
    setSwapRotation(r => r + 180)
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
    if (translatedText) {
      setSourceText(translatedText)
      setTranslatedText(sourceText)
    }
  }, [sourceLang, targetLang, sourceText, translatedText])

  const handleClearSource = useCallback(() => {
    setSourceText('')
    setTranslatedText('')
  }, [])

  // Whether to show highlight backdrop (only when translated + hovering)
  const showHighlight = translatedText && !isTranslating && hoveredParaIdx !== null && sourceParas.length > 1

  return (
    <div className="flex flex-col h-full px-8 py-6 gap-6 overflow-y-auto pb-28">
      {/* Side-by-side editor */}
      <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Source panel */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="bg-surface-container-high text-on-surface text-xs font-label font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border border-outline-variant/10 outline-none cursor-pointer hover:bg-surface-container-highest/60 transition-colors"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSwapLanguages}
                disabled={isTranslating}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-highest/50 transition-all duration-200 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                title={t('translate.swap')}
              >
                <span
                  className="material-symbols-outlined text-on-surface-variant text-lg transition-transform duration-300"
                  style={{ transform: `rotate(${swapRotation}deg)` }}
                >
                  swap_horiz
                </span>
              </button>
            </div>
            {sourceText && (
              <button
                onClick={handleClearSource}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-container-highest/50 transition-all duration-200 active:scale-90"
                title={t('translate.clear')}
              >
                <span className="material-symbols-outlined text-on-surface-variant/60 text-base">
                  close
                </span>
              </button>
            )}
          </div>
          <div className="glass-panel rounded-2xl border border-outline-variant/10 flex-1 flex flex-col min-h-[260px] relative">
            {/* Highlight backdrop — sits behind the textarea */}
            {showHighlight && (
              <div
                ref={backdropRef}
                className="absolute inset-0 p-5 overflow-hidden pointer-events-none font-body text-[15px] leading-relaxed text-transparent whitespace-pre-wrap break-words"
              >
                {sourceParas.map((para, i) => (
                  <div
                    key={i}
                    className={`rounded-md transition-colors duration-150 ${
                      hoveredParaIdx === i
                        ? 'bg-primary-fixed-dim/12'
                        : ''
                    }`}
                  >
                    {para}
                    {i < sourceParas.length - 1 && '\n\n'}
                  </div>
                ))}
              </div>
            )}
            <textarea
              ref={sourceScrollRef as unknown as React.RefObject<HTMLTextAreaElement>}
              value={sourceText}
              onChange={handleSourceChange}
              onScroll={handleSourceScroll}
              placeholder={t('translate.placeholder')}
              className="flex-1 bg-transparent text-on-surface font-body text-[15px] leading-relaxed p-5 resize-none outline-none placeholder:text-on-surface-variant/30 w-full relative z-10"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleTranslate()
                }
              }}
            />
            <div className="flex justify-end px-5 pb-3 relative z-10">
              <span className="text-[11px] font-label text-on-surface-variant/60">
                {sourceText.length} {t('translate.chars')}
              </span>
            </div>
          </div>
        </div>

        {/* Target panel */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-surface-container-high text-secondary-fixed-dim text-xs font-label font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border border-outline-variant/10 outline-none cursor-pointer hover:bg-surface-container-highest/60 transition-colors"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (translatedText) {
                    speakText(translatedText, langToBcp47(targetLang))
                  }
                }}
                disabled={!translatedText}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-highest/50 transition-all duration-200 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                title={t('translate.listen')}
              >
                <span className="material-symbols-outlined text-on-surface-variant text-lg">
                  volume_up
                </span>
              </button>
              <button
                onClick={handleCopy}
                disabled={!translatedText}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-highest/50 transition-all duration-200 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                title={copied ? t('translate.copied') : t('translate.copyTranslation')}
              >
                <span className="material-symbols-outlined text-on-surface-variant text-lg">
                  {copied ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>
          </div>
          <div className="bg-surface-container-high rounded-2xl border border-outline-variant/10 flex-1 flex flex-col min-h-[260px] border-l-2 border-l-secondary-fixed-dim">
            <div className="flex-1 p-5 overflow-y-auto min-h-0">
              {isTranslating && !translatedText ? (
                <div className="flex flex-col gap-3 animate-pulse">
                  <div className="h-4 bg-surface-container-highest/30 rounded-lg w-full" />
                  <div className="h-4 bg-surface-container-highest/30 rounded-lg w-11/12" />
                  <div className="h-4 bg-surface-container-highest/30 rounded-lg w-4/5" />
                  <div className="h-4 bg-surface-container-highest/30 rounded-lg w-9/12" />
                  <div className="h-4 bg-surface-container-highest/30 rounded-lg w-full" />
                  <div className="h-4 bg-surface-container-highest/30 rounded-lg w-3/4" />
                </div>
              ) : translatedText ? (
                <TranslationOutput
                  translatedText={translatedText}
                  sourceText={sourceText}
                  isTranslating={isTranslating}
                  onHoverIndex={setHoveredParaIdx}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30">
                  <span className="material-symbols-outlined text-4xl">translate</span>
                  <p className="text-on-surface-variant font-body text-sm">
                    {t('translate.outputPlaceholder')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom floating glass bar */}
      <div className="fixed bottom-6 left-64 right-0 flex justify-center z-40 pointer-events-none px-8">
        <div className="glass-panel rounded-2xl border border-outline-variant/10 px-4 py-3 flex items-center gap-3 pointer-events-auto shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <button
            onClick={handleTranslate}
            disabled={!sourceText.trim() || isTranslating || sourceLang === targetLang}
            className="liquid-gradient px-8 py-2.5 rounded-xl text-white font-label font-bold text-sm tracking-wide shadow-lg hover:shadow-xl hover:brightness-110 transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 flex items-center gap-2"
          >
            {isTranslating ? (
              <>
                <span className="material-symbols-outlined animate-spin text-base">
                  progress_activity
                </span>
                {t('translate.translating')}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">translate</span>
                {t('translate.translate')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
