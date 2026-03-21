import { useState, useCallback } from 'react'
import { lookupWord, downloadTextFile, speakText } from '../../services/ai'
import type { DictionaryResult } from '../../services/ai'
import { loadSettings, langToBcp47 } from '../../services/settings'
import { useTranslation } from '../../hooks/useTranslation'

function highlightWordInText(text: string, word: string) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    part.toLowerCase() === word.toLowerCase() ? (
      <span key={i} className="text-secondary-fixed-dim font-semibold">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

export default function DictionaryWorkspace() {
  const t = useTranslation()
  const [input, setInput] = useState('')
  const [tokens, setTokens] = useState<string[]>([])
  const [selectedToken, setSelectedToken] = useState<string | null>(null)
  const [result, setResult] = useState<DictionaryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentWords, setRecentWords] = useState<string[]>([])
  const [pronounceLang, setPronounceLang] = useState('en')

  const tokenize = useCallback((text: string): string[] => {
    const cjkRange = /[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/
    if (cjkRange.test(text)) {
      const cleaned = text.replace(/[.,;:!?，。；：！？、\s]/g, '')
      if (cleaned.length <= 4) return [cleaned]
      return Array.from(cleaned).filter(Boolean)
    }
    return text
      .replace(/[^\w\s'-]/g, '')
      .split(/\s+/)
      .filter(Boolean)
  }, [])

  const lookupSelectedWord = useCallback(
    async (word: string, context?: string) => {
      setLoading(true)
      setError(null)
      try {
        const settings = loadSettings()
        const data = await lookupWord({
          word,
          context,
          nativeLang: settings.targetLang,
          model: settings.selectedModel,
          providerType: settings.providerType,
        })
        setResult(data)
        setPronounceLang(langToBcp47(settings.sourceLang))
        setRecentWords((prev) => {
          const filtered = prev.filter((w) => w.toLowerCase() !== word.toLowerCase())
          return [word, ...filtered].slice(0, 12)
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : t('dictionary.error'))
        setResult(null)
      } finally {
        setLoading(false)
      }
    },
    [t],
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = input.trim()
      if (!trimmed) return

      const words = tokenize(trimmed)
      setTokens(words)

      if (words.length === 1) {
        setSelectedToken(words[0])
        lookupSelectedWord(words[0])
      } else if (words.length > 1) {
        setSelectedToken(null)
        setResult(null)
      }
    },
    [input, tokenize, lookupSelectedWord],
  )

  const handleTokenClick = useCallback(
    (word: string) => {
      if (loading) return
      setSelectedToken(word)
      const context = tokens.length > 1 ? tokens.join(' ') : undefined
      lookupSelectedWord(word, context)
    },
    [tokens, lookupSelectedWord, loading],
  )

  const handleRecentClick = useCallback(
    (word: string) => {
      setInput(word)
      setTokens([word])
      setSelectedToken(word)
      lookupSelectedWord(word)
    },
    [lookupSelectedWord],
  )

  const handleExport = useCallback(() => {
    if (!result) return
    const meanings = result.meanings.map(m =>
      `${m.wordClass}:\n${m.definitions.map((d, i) => `  ${i + 1}. ${d.text}${d.register ? ` [${d.register}]` : ''}`).join('\n')}`
    ).join('\n\n')
    const text = [
      `Word: ${result.word}`,
      `Phonetics: ${result.phonetics}`,
      meanings,
      `Etymology: ${result.etymology}`,
      `Usage: ${result.usageNote}`,
      `Frequency: ${result.frequency}`,
      `Related Forms: ${result.relatedForms.join(', ')}`,
      `Synonyms: ${result.synonyms.join(', ')}`,
      `Antonyms: ${result.antonyms.join(', ')}`,
      `Examples:\n${result.examples.map((ex) => `  - ${ex}`).join('\n')}`,
    ].join('\n\n')

    downloadTextFile(text, `${result.word}-analysis.txt`)
  }, [result])

  return (
    <div className="h-full flex flex-col overflow-y-auto px-8 py-6 gap-6">
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="flex-shrink-0">
        <div className="liquid-glass rounded-[2rem] ghost-border p-2 flex items-center gap-3">
          <span className="material-symbols-outlined text-on-surface-variant ml-4">
            menu_book
          </span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('dictionary.placeholder')}
            className="flex-1 bg-transparent border-none outline-none text-on-surface placeholder:text-on-surface-variant/40 font-body text-base py-3"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-primary-fixed-dim/15 hover:bg-primary-fixed-dim/25 text-primary-fixed-dim px-6 py-3 rounded-3xl font-label font-semibold text-sm tracking-wide transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                {t('proofread.analyzing')}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">search</span>
                {t('dictionary.lookUp')}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Source Context - Tokenized Sentence */}
      {tokens.length > 0 && (
        <div className="flex-shrink-0">
          <h3 className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant/50 font-label font-semibold mb-3">
            {t('dictionary.sourceContext')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {tokens.map((token, i) => (
              <button
                key={`${token}-${i}`}
                onClick={() => handleTokenClick(token)}
                disabled={loading}
                className={`px-4 py-2 rounded-full text-sm font-label font-medium transition-all duration-300 ${loading ? 'cursor-wait' : 'cursor-pointer'} ${
                  selectedToken === token
                    ? 'bg-gradient-to-r from-primary-fixed-dim/30 to-secondary-fixed-dim/20 text-primary-fixed-dim shadow-lg shadow-primary-fixed-dim/10 scale-105'
                    : 'bg-surface-container-high/50 text-on-surface-variant hover:bg-surface-container-highest/60 hover:text-on-surface'
                }`}
              >
                {token}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="liquid-glass rounded-[2rem] ghost-border p-6 border-l-4 border-error/60">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-error">error</span>
            <p className="text-error text-sm font-body">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !result && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-primary-fixed-dim/20 border-t-primary-fixed-dim animate-spin" />
            <p className="text-on-surface-variant/60 text-sm font-label">
              {t('dictionary.searching')}
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && !loading && !error && tokens.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center max-w-sm">
            <div className="w-20 h-20 rounded-full bg-surface-container-high/40 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">
                dictionary
              </span>
            </div>
            <h2 className="text-lg font-headline font-semibold text-on-surface/60">
              {t('dictionary.emptyTitle')}
            </h2>
            <p className="text-sm text-on-surface-variant/40 font-body leading-relaxed">
              {t('dictionary.emptyDesc')}
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto">
          {/* Header: Word + Phonetics + Frequency */}
          <div className="liquid-glass rounded-[2rem] ghost-border p-8 flex flex-col gap-5">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <h2 className="text-4xl font-headline font-black tracking-tight text-on-surface">
                  {result.word}
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-primary-fixed-dim/70 text-sm font-label">
                    {result.phonetics}
                  </span>
                  <button
                    onClick={() => speakText(result.word, pronounceLang)}
                    className="w-8 h-8 rounded-full bg-primary-fixed-dim/10 hover:bg-primary-fixed-dim/20 flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer"
                    title={t('dictionary.pronounce')}
                  >
                    <span className="material-symbols-outlined text-primary-fixed-dim text-lg">
                      volume_up
                    </span>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Word class pills */}
                {result.meanings.map((m, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-secondary-fixed-dim/10 text-secondary-fixed-dim text-xs font-label font-semibold uppercase tracking-widest">
                    {m.wordClass}
                  </span>
                ))}
                {result.frequency && (
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-high/60 text-on-surface-variant/60 text-[10px] font-label font-semibold uppercase tracking-widest">
                    {result.frequency}
                  </span>
                )}
              </div>
            </div>

            {/* Definitions grouped by word class */}
            <div className="flex flex-col gap-4">
              {result.meanings.map((meaning, mi) => (
                <div key={mi}>
                  {result.meanings.length > 1 && (
                    <h3 className="text-xs font-label font-bold text-secondary-fixed-dim uppercase tracking-widest mb-2">
                      {meaning.wordClass}
                    </h3>
                  )}
                  <div className="flex flex-col gap-2">
                    {meaning.definitions.map((def, di) => (
                      <div key={di} className="flex gap-3">
                        {meaning.definitions.length > 1 && (
                          <span className="text-on-surface-variant/30 text-sm font-label font-semibold mt-0.5 shrink-0">
                            {di + 1}.
                          </span>
                        )}
                        <div className="flex-1">
                          <p className="text-on-surface/80 font-body text-sm leading-relaxed">
                            {def.text}
                          </p>
                          {def.register && (
                            <span className="inline-flex mt-1 px-2 py-0.5 rounded-md bg-surface-container-high/50 text-on-surface-variant/50 text-[10px] font-label font-semibold italic">
                              {def.register}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Usage Note */}
            {result.usageNote && (
              <div className="bg-primary-fixed-dim/5 rounded-xl px-4 py-3">
                <p className="text-on-surface-variant/70 text-xs font-body leading-relaxed">
                  <span className="text-primary-fixed-dim/70 font-semibold">Note: </span>
                  {result.usageNote}
                </p>
              </div>
            )}

            {/* Etymology */}
            <div className="border-t border-outline-variant/10 pt-4">
              <h4 className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant/40 font-label font-semibold mb-2">
                {t('dictionary.etymology')}
              </h4>
              <p className="text-on-surface-variant/70 text-xs font-body leading-relaxed italic">
                {result.etymology}
              </p>
            </div>
          </div>

          {/* Synonyms & Antonyms row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Synonyms */}
            <div className="liquid-glass rounded-[2rem] ghost-border p-6 flex flex-col gap-4">
              <h3 className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant/50 font-label font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary-fixed-dim/60">
                  link
                </span>
                {t('dictionary.synonyms')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.synonyms.length > 0 ? (
                  result.synonyms.map((syn, i) => (
                    <button
                      key={i}
                      onClick={() => handleRecentClick(syn)}
                      className="px-3 py-1.5 rounded-full bg-primary-fixed-dim/8 hover:bg-primary-fixed-dim/15 text-primary-fixed-dim text-xs font-label font-medium transition-all duration-200 cursor-pointer hover:scale-105"
                    >
                      {syn}
                    </button>
                  ))
                ) : (
                  <p className="text-on-surface-variant/30 text-xs font-body">
                    {t('dictionary.noSynonyms')}
                  </p>
                )}
              </div>
            </div>

            {/* Antonyms */}
            <div className="liquid-glass rounded-[2rem] ghost-border p-6 flex flex-col gap-4">
              <h3 className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant/50 font-label font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-secondary-fixed-dim/60">
                  swap_horiz
                </span>
                {t('dictionary.antonyms')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.antonyms.length > 0 ? (
                  result.antonyms.map((ant, i) => (
                    <button
                      key={i}
                      onClick={() => handleRecentClick(ant)}
                      className="px-3 py-1.5 rounded-full bg-secondary-fixed-dim/8 hover:bg-secondary-fixed-dim/15 text-secondary-fixed-dim text-xs font-label font-medium transition-all duration-200 cursor-pointer hover:scale-105"
                    >
                      {ant}
                    </button>
                  ))
                ) : (
                  <p className="text-on-surface-variant/30 text-xs font-body">
                    {t('dictionary.noAntonyms')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Related Forms */}
          {result.relatedForms && result.relatedForms.length > 0 && (
            <div className="liquid-glass rounded-[2rem] ghost-border p-6 flex flex-col gap-4">
              <h3 className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant/50 font-label font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary-fixed-dim/60">
                  account_tree
                </span>
                Related Forms
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.relatedForms.map((form, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full bg-surface-container-high/50 text-on-surface-variant/70 text-xs font-label font-medium"
                  >
                    {form}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Examples */}
          {result.examples.length > 0 && (
            <div className="liquid-glass rounded-[2rem] ghost-border p-6 flex flex-col gap-4">
              <h3 className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant/50 font-label font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary-fixed-dim/60">
                  format_quote
                </span>
                {t('dictionary.contextUsage')}
              </h3>
              <div className="flex flex-col gap-2">
                {result.examples.map((example, i) => (
                  <p key={i} className="text-on-surface/70 text-sm font-body leading-relaxed pl-4">
                    {highlightWordInText(example, result.word)}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {(recentWords.length > 0 || result) && (
        <div className="flex-shrink-0 border-t border-outline-variant/10 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant/40 font-label font-semibold whitespace-nowrap">
                {t('dictionary.recent')}
              </span>
              <div className="flex gap-2 overflow-x-auto min-w-0">
                {recentWords.map((word, i) => (
                  <button
                    key={`${word}-${i}`}
                    onClick={() => handleRecentClick(word)}
                    className="px-3 py-1 rounded-full bg-surface-container-high/40 hover:bg-surface-container-highest/50 text-on-surface-variant/60 hover:text-on-surface text-xs font-label transition-all duration-200 whitespace-nowrap cursor-pointer"
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>

            {result && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-surface-container-high/40 hover:bg-surface-container-highest/50 text-on-surface-variant/60 hover:text-on-surface text-xs font-label font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ml-4"
              >
                <span className="material-symbols-outlined text-base">download</span>
                {t('dictionary.export')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
