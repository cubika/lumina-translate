import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { translateStream, speakText } from '../../services/ai'
import { loadSettings, LANGUAGES, langToBcp47 } from '../../services/settings'
import { useTranslation } from '../../hooks/useTranslation'
import TranslationOutput, { splitParagraphs, Paragraph } from './TranslationOutput'

export default function TranslateWorkspace() {
  const t = useTranslation()
  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [sourceLang, setSourceLang] = useState(() => loadSettings().sourceLang)
  const [targetLang, setTargetLang] = useState(() => loadSettings().targetLang)
  const [isTranslating, setIsTranslating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [swapRotation, setSwapRotation] = useState(0)
  const [hoveredSourceIdx, setHoveredSourceIdx] = useState<number | null>(null)
  const [isEditingSource, setIsEditingSource] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const sourceParas = useMemo(() => splitParagraphs(sourceText), [sourceText])

  // Switch to view mode when translation completes, edit mode when text changes
  useEffect(() => {
    if (translatedText && !isTranslating) setIsEditingSource(false)
  }, [translatedText, isTranslating])

  const handleHoverPara = useCallback((idx: number) => {
    setHoveredSourceIdx(idx)
  }, [])

  const handleHoverParaLeave = useCallback(() => {
    setHoveredSourceIdx(null)
  }, [])

  useEffect(() => {
    const sync = () => {
      const s = loadSettings()
      setSourceLang(s.sourceLang)
      setTargetLang(s.targetLang)
    }
    window.addEventListener('settings-changed', sync)
    return () => window.removeEventListener('settings-changed', sync)
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
                aria-label={t('translate.swap')}
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
                aria-label={t('translate.clear')}
              >
                <span className="material-symbols-outlined text-on-surface-variant/60 text-base">
                  close
                </span>
              </button>
            )}
          </div>
          <div className="glass-panel rounded-2xl border border-outline-variant/10 flex-1 flex flex-col min-h-[260px]">
            {/* View mode: hoverable paragraphs. Click to edit. */}
            {!isEditingSource && translatedText && sourceParas.length > 1 ? (
              <div
                className="flex-1 p-5 overflow-y-auto min-h-0 scroll-smooth cursor-text"
                onClick={() => { setIsEditingSource(true); setTimeout(() => textareaRef.current?.focus(), 0) }}
                onMouseLeave={handleHoverParaLeave}
              >
                <div className="flex flex-col gap-3">
                  {sourceParas.map((para, i) => (
                    <Paragraph
                      key={i}
                      text={para}
                      index={i}
                      isActive={hoveredSourceIdx === i}
                      onEnter={handleHoverPara}
                      onLeave={handleHoverParaLeave}
                      variant="source"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={sourceText}
                onChange={handleSourceChange}
                placeholder={t('translate.placeholder')}
                className="flex-1 bg-transparent text-on-surface font-reading text-[16px] leading-[1.7] p-5 resize-none outline-none placeholder:text-on-surface-variant/40 w-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    handleTranslate()
                  }
                }}
                onBlur={() => { if (translatedText) setIsEditingSource(false) }}
              />
            )}
            <div className="flex justify-end px-5 pb-3">
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
                aria-label={t('translate.listen')}
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
                aria-label={copied ? t('translate.copied') : t('translate.copyTranslation')}
              >
                <span className="material-symbols-outlined text-on-surface-variant text-lg">
                  {copied ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>
          </div>
          <div className="bg-surface-container-high rounded-2xl border border-outline-variant/10 flex-1 flex flex-col min-h-[260px] border-l-2 border-l-secondary-fixed-dim">
            <div className="flex-1 p-5 overflow-y-auto min-h-0 scroll-smooth" onMouseLeave={handleHoverParaLeave}>
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
                  isTranslating={isTranslating}
                  onHoverIndex={handleHoverPara}
                  highlightIndex={hoveredSourceIdx}
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

      {/* Floating translate button */}
      <div className="fixed bottom-6 left-64 right-0 flex justify-center z-40 pointer-events-none">
        <button
          onClick={handleTranslate}
          disabled={!sourceText.trim() || isTranslating || sourceLang === targetLang}
          className="liquid-gradient px-10 py-3 rounded-2xl text-white font-label font-bold text-sm tracking-wide shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)] hover:brightness-110 transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)] flex items-center gap-2 pointer-events-auto"
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
  )
}
