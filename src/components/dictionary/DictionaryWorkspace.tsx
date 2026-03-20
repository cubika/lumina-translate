import { useState, useCallback } from 'react'
import { lookupWord } from '../../services/ai'
import { loadSettings } from '../../services/settings'

interface DictionaryResult {
  word: string
  phonetics: string
  wordClass: string
  definition: string
  etymology: string
  synonyms: string[]
  antonyms: string[]
  examples: string[]
}

export default function DictionaryWorkspace() {
  const [input, setInput] = useState('')
  const [tokens, setTokens] = useState<string[]>([])
  const [selectedToken, setSelectedToken] = useState<string | null>(null)
  const [result, setResult] = useState<DictionaryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentWords, setRecentWords] = useState<string[]>([])

  const tokenize = useCallback((text: string): string[] => {
    const cjkRange = /[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/
    if (cjkRange.test(text)) {
      const cleaned = text.replace(/[.,;:!?，。；：！？、\s]/g, '')
      // Short CJK input (<=4 chars) is likely a single word/phrase
      if (cleaned.length <= 4) return [cleaned]
      // Longer input: split into individual characters for token selection
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
        setRecentWords((prev) => {
          const filtered = prev.filter((w) => w.toLowerCase() !== word.toLowerCase())
          return [word, ...filtered].slice(0, 12)
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to look up word')
        setResult(null)
      } finally {
        setLoading(false)
      }
    },
    [],
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
      setSelectedToken(word)
      const context = tokens.length > 1 ? tokens.join(' ') : undefined
      lookupSelectedWord(word, context)
    },
    [tokens, lookupSelectedWord],
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
    const text = [
      `Word: ${result.word}`,
      `Phonetics: ${result.phonetics}`,
      `Class: ${result.wordClass}`,
      `Definition: ${result.definition}`,
      `Etymology: ${result.etymology}`,
      `Synonyms: ${result.synonyms.join(', ')}`,
      `Antonyms: ${result.antonyms.join(', ')}`,
      `Examples:\n${result.examples.map((ex) => `  - ${ex}`).join('\n')}`,
    ].join('\n\n')

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${result.word}-analysis.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [result])

  const highlightWordInText = (text: string, word: string) => {
    const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="text-secondary-fixed-dim font-semibold">
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      ),
    )
  }

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
            placeholder="Enter a word or sentence to analyze..."
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
                Analyzing...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">search</span>
                Look Up
              </>
            )}
          </button>
        </div>
      </form>

      {/* Source Context - Tokenized Sentence */}
      {tokens.length > 0 && (
        <div className="flex-shrink-0">
          <h3 className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant/50 font-label font-semibold mb-3">
            Source Context
          </h3>
          <div className="flex flex-wrap gap-2">
            {tokens.map((token, i) => (
              <button
                key={`${token}-${i}`}
                onClick={() => handleTokenClick(token)}
                className={`px-4 py-2 rounded-full text-sm font-label font-medium transition-all duration-300 cursor-pointer ${
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
              Analyzing word...
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
              Dictionary Lookup
            </h2>
            <p className="text-sm text-on-surface-variant/40 font-body leading-relaxed">
              Enter a word or sentence above to get detailed definitions, etymology, synonyms, and contextual usage analysis.
            </p>
          </div>
        </div>
      )}

      {/* Bento Grid */}
      {result && (
        <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto">
          {/* Top Row: Definition + Synonyms/Antonyms */}
          <div className="grid grid-cols-12 gap-4">
            {/* Main Definition Card */}
            <div className="col-span-7 liquid-glass rounded-[2rem] ghost-border p-8 flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <h2 className="text-4xl font-headline font-black tracking-tight text-on-surface">
                  {result.word}
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-primary-fixed-dim/70 text-sm font-label">
                    {result.phonetics}
                  </span>
                  <button
                    onClick={() => {
                      if ('speechSynthesis' in window) {
                        const utterance = new SpeechSynthesisUtterance(result.word)
                        speechSynthesis.speak(utterance)
                      }
                    }}
                    className="w-8 h-8 rounded-full bg-primary-fixed-dim/10 hover:bg-primary-fixed-dim/20 flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer"
                    title="Pronounce"
                  >
                    <span className="material-symbols-outlined text-primary-fixed-dim text-lg">
                      volume_up
                    </span>
                  </button>
                </div>
              </div>

              <span className="inline-flex self-start px-3 py-1 rounded-full bg-secondary-fixed-dim/10 text-secondary-fixed-dim text-xs font-label font-semibold uppercase tracking-widest">
                {result.wordClass}
              </span>

              <p className="text-on-surface/80 font-body text-sm leading-relaxed">
                {result.definition}
              </p>

              <div className="border-t border-outline-variant/10 pt-4">
                <h4 className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant/40 font-label font-semibold mb-2">
                  Etymology
                </h4>
                <p className="text-on-surface-variant/70 text-xs font-body leading-relaxed italic">
                  {result.etymology}
                </p>
              </div>
            </div>

            {/* Synonyms & Antonyms - stacked */}
            <div className="col-span-5 flex flex-col gap-4">
              {/* Synonyms */}
              <div className="liquid-glass rounded-[2rem] ghost-border p-6 flex flex-col gap-4 flex-1">
                <h3 className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant/50 font-label font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-primary-fixed-dim/60">
                    link
                  </span>
                  Synonyms
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
                      No synonyms found
                    </p>
                  )}
                </div>
              </div>

              {/* Antonyms */}
              <div className="liquid-glass rounded-[2rem] ghost-border p-6 flex flex-col gap-4 flex-1">
                <h3 className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant/50 font-label font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-secondary-fixed-dim/60">
                    swap_horiz
                  </span>
                  Antonyms
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
                      No antonyms found
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Context Usage - full width */}
          {result.examples.length > 0 && (
            <div className="liquid-glass rounded-[2rem] ghost-border p-6 flex flex-col gap-4">
              <h3 className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant/50 font-label font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary-fixed-dim/60">
                  format_quote
                </span>
                Context Usage
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {result.examples.map((example, i) => (
                  <div
                    key={i}
                    className="bg-surface-container/60 rounded-2xl p-4 border-l-2 border-primary-fixed-dim/20"
                  >
                    <p className="text-on-surface/70 text-sm font-body leading-relaxed">
                      {highlightWordInText(example, result.word)}
                    </p>
                  </div>
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
            {/* Recently Viewed */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant/40 font-label font-semibold whitespace-nowrap">
                Recent
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

            {/* Export Button */}
            {result && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-surface-container-high/40 hover:bg-surface-container-highest/50 text-on-surface-variant/60 hover:text-on-surface text-xs font-label font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ml-4"
              >
                <span className="material-symbols-outlined text-base">download</span>
                Export Analysis
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
