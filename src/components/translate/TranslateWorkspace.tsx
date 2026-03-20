import { useState, useCallback } from 'react'
import { translate } from '../../services/ai'
import { loadSettings } from '../../services/settings'
import { LANGUAGES } from '../../services/settings'

interface BreakdownData {
  phonetics: string
  wordClass: string
  definition: string
  synonyms: string[]
}

export default function TranslateWorkspace() {
  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [sourceLang, setSourceLang] = useState(() => loadSettings().sourceLang)
  const [targetLang, setTargetLang] = useState(() => loadSettings().targetLang)
  const [isTranslating, setIsTranslating] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const [copied, setCopied] = useState(false)
  const [breakdown, setBreakdown] = useState<BreakdownData | null>(null)

  const handleSourceChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setSourceText(text)
    setCharCount(text.length)
  }, [])

  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim() || isTranslating) return

    setIsTranslating(true)
    setTranslatedText('')
    setBreakdown(null)

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

      // Generate a simple breakdown for single words or short phrases
      const words = sourceText.trim().split(/\s+/)
      if (words.length <= 3) {
        setBreakdown({
          phonetics: '',
          wordClass: '',
          definition: result,
          synonyms: [],
        })
      }
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
    navigator.clipboard.writeText(translatedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [translatedText])

  const handleSwapLanguages = useCallback(() => {
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
    if (translatedText) {
      setSourceText(translatedText)
      setTranslatedText(sourceText)
      setCharCount(translatedText.length)
    }
  }, [sourceLang, targetLang, sourceText, translatedText])

  const handleClearSource = useCallback(() => {
    setSourceText('')
    setCharCount(0)
    setTranslatedText('')
    setBreakdown(null)
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
                title="Swap languages"
              >
                <span className="material-symbols-outlined text-on-surface-variant text-lg">
                  swap_horiz
                </span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-label text-on-surface-variant/60">
                {charCount} chars
              </span>
              {sourceText && (
                <button
                  onClick={handleClearSource}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-container-highest/50 transition-all duration-200 active:scale-90"
                  title="Clear"
                >
                  <span className="material-symbols-outlined text-on-surface-variant/60 text-base">
                    close
                  </span>
                </button>
              )}
            </div>
          </div>
          <div className="glass-panel rounded-2xl border border-outline-variant/10 flex-1 flex flex-col min-h-[260px]">
            <textarea
              value={sourceText}
              onChange={handleSourceChange}
              placeholder="Enter text to translate..."
              className="flex-1 bg-transparent text-on-surface font-body text-[15px] leading-relaxed p-5 resize-none outline-none placeholder:text-on-surface-variant/30 w-full"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleTranslate()
                }
              }}
            />
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
                    const utterance = new SpeechSynthesisUtterance(translatedText)
                    speechSynthesis.speak(utterance)
                  }
                }}
                disabled={!translatedText}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-highest/50 transition-all duration-200 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Listen"
              >
                <span className="material-symbols-outlined text-on-surface-variant text-lg">
                  volume_up
                </span>
              </button>
              <button
                onClick={handleCopy}
                disabled={!translatedText}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-highest/50 transition-all duration-200 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                title={copied ? 'Copied!' : 'Copy translation'}
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
                  <span className="text-sm font-label">Translating...</span>
                </div>
              ) : translatedText ? (
                <p className="text-on-surface font-body text-[15px] leading-relaxed whitespace-pre-wrap">
                  {translatedText}
                </p>
              ) : (
                <p className="text-on-surface-variant/30 font-body text-[15px]">
                  Translation will appear here...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown card */}
      {breakdown && translatedText && (
        <div className="glass-panel rounded-2xl border border-outline-variant/10 p-6">
          <h3 className="font-headline font-semibold text-primary-fixed-dim text-base mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">auto_stories</span>
            Detailed Breakdown
          </h3>
          <div className="grid grid-cols-2 gap-8">
            {/* Left column: phonetics + word class */}
            <div className="space-y-4">
              {breakdown.phonetics && (
                <div>
                  <span className="text-[11px] font-label uppercase tracking-widest text-on-surface-variant/50 block mb-1">
                    Phonetics
                  </span>
                  <span className="text-on-surface font-body text-sm">
                    {breakdown.phonetics}
                  </span>
                </div>
              )}
              {breakdown.wordClass && (
                <div>
                  <span className="text-[11px] font-label uppercase tracking-widest text-on-surface-variant/50 block mb-1">
                    Word Class
                  </span>
                  <span className="inline-block bg-secondary-fixed-dim/10 text-secondary-fixed-dim text-xs font-label font-bold px-2.5 py-1 rounded-lg">
                    {breakdown.wordClass}
                  </span>
                </div>
              )}
              <div>
                <span className="text-[11px] font-label uppercase tracking-widest text-on-surface-variant/50 block mb-1">
                  Source
                </span>
                <span className="text-on-surface font-body text-sm">
                  {sourceText}
                </span>
              </div>
            </div>

            {/* Right column: definition + synonyms */}
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-label uppercase tracking-widest text-on-surface-variant/50 block mb-1">
                  Translation
                </span>
                <span className="text-on-surface font-body text-sm leading-relaxed">
                  {breakdown.definition}
                </span>
              </div>
              {breakdown.synonyms.length > 0 && (
                <div>
                  <span className="text-[11px] font-label uppercase tracking-widest text-on-surface-variant/50 block mb-2">
                    Synonyms
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {breakdown.synonyms.map((syn) => (
                      <span
                        key={syn}
                        className="bg-surface-container-highest/40 text-on-surface-variant text-xs font-label px-2.5 py-1 rounded-lg"
                      >
                        {syn}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom floating glass bar */}
      <div className="fixed bottom-6 left-64 right-0 flex justify-center z-40 pointer-events-none px-8">
        <div className="glass-panel rounded-2xl border border-outline-variant/10 px-4 py-3 flex items-center gap-3 pointer-events-auto shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-highest/40 transition-all duration-200 active:scale-95">
            <span className="material-symbols-outlined text-lg">history</span>
            <span className="text-sm font-label font-medium">History</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-highest/40 transition-all duration-200 active:scale-95">
            <span className="material-symbols-outlined text-lg">bookmark</span>
            <span className="text-sm font-label font-medium">Saved</span>
          </button>
          <div className="w-px h-8 bg-outline-variant/20 mx-1" />
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
                Translating...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">translate</span>
                Translate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
