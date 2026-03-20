import { useState, useCallback, useEffect } from 'react'
import { translate } from '../../services/ai'
import { loadSettings, LANGUAGES, langToBcp47 } from '../../services/settings'
import { useTranslation } from '../../hooks/useTranslation'

export default function TranslateWorkspace() {
  const t = useTranslation()
  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [sourceLang, setSourceLang] = useState(() => loadSettings().sourceLang)
  const [targetLang, setTargetLang] = useState(() => loadSettings().targetLang)
  const [isTranslating, setIsTranslating] = useState(false)
  const [copied, setCopied] = useState(false)

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

    setIsTranslating(true)
    setTranslatedText('')

    try {
      const settings = loadSettings()
      const result = await translate({
        text: sourceText,
        sourceLang,
        targetLang,
        model: settings.selectedModel,
        providerType: settings.providerType,
      })
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
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-highest/50 transition-all duration-200 active:scale-90"
                title={t('translate.swap')}
              >
                <span className="material-symbols-outlined text-on-surface-variant text-lg">
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
          <div className="glass-panel rounded-2xl border border-outline-variant/10 flex-1 flex flex-col min-h-[260px]">
            <textarea
              value={sourceText}
              onChange={handleSourceChange}
              placeholder={t('translate.placeholder')}
              className="flex-1 bg-transparent text-on-surface font-body text-[15px] leading-relaxed p-5 resize-none outline-none placeholder:text-on-surface-variant/30 w-full"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleTranslate()
                }
              }}
            />
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
                  if (translatedText && 'speechSynthesis' in window) {
                    speechSynthesis.cancel()
                    const utterance = new SpeechSynthesisUtterance(translatedText)
                    utterance.lang = langToBcp47(targetLang)
                    speechSynthesis.speak(utterance)
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
            <div className="flex-1 p-5 overflow-y-auto">
              {isTranslating ? (
                <div className="flex items-center gap-3 text-on-surface-variant/60">
                  <span className="material-symbols-outlined animate-spin text-secondary-fixed-dim">
                    progress_activity
                  </span>
                  <span className="text-sm font-label">{t('translate.translating')}</span>
                </div>
              ) : translatedText ? (
                <p className="text-on-surface font-body text-[15px] leading-relaxed whitespace-pre-wrap">
                  {translatedText}
                </p>
              ) : (
                <p className="text-on-surface-variant/30 font-body text-[15px]">
                  {t('translate.outputPlaceholder')}
                </p>
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
            disabled={!sourceText.trim() || isTranslating}
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
