import { useState, useCallback } from 'react'
import { proofread } from '../../services/ai'
import { loadSettings } from '../../services/settings'

interface Issue {
  type: string
  severity: string
  original: string
  suggestion: string
  explanation: string
}

type IssueStatus = 'pending' | 'accepted' | 'dismissed'

function getIssueColor(type: string): {
  text: string
  bg: string
  border: string
  icon: string
  iconStyle?: React.CSSProperties
} {
  switch (type) {
    case 'Grammar Fix':
      return {
        text: 'text-error',
        bg: 'bg-error/10',
        border: 'hover:border-error/30',
        icon: 'error',
        iconStyle: { fontVariationSettings: "'FILL' 1" },
      }
    case 'Tone & Style':
      return {
        text: 'text-primary-fixed-dim',
        bg: 'bg-primary-fixed-dim/10',
        border: 'hover:border-primary-fixed-dim/30',
        icon: 'auto_fix_high',
        iconStyle: { fontVariationSettings: "'FILL' 1" },
      }
    case 'Spelling':
      return {
        text: 'text-error',
        bg: 'bg-error/10',
        border: 'hover:border-error/30',
        icon: 'spellcheck',
        iconStyle: { fontVariationSettings: "'FILL' 1" },
      }
    default:
      return {
        text: 'text-on-surface-variant',
        bg: 'bg-surface-container-high/50',
        border: 'hover:border-outline-variant/30',
        icon: 'info',
        iconStyle: { fontVariationSettings: "'FILL' 1" },
      }
  }
}

function highlightOriginalText(text: string, issues: Issue[], statuses: IssueStatus[]): React.ReactNode {
  if (!issues.length) return <p className="text-lg leading-[1.8] text-on-surface-variant/90">{text}</p>

  const activeIssues = issues.filter((_, i) => statuses[i] === 'pending')
  if (!activeIssues.length) return <p className="text-lg leading-[1.8] text-on-surface-variant/90">{text}</p>

  type Segment = { start: number; end: number; issue: Issue }
  const segments: Segment[] = []

  for (const issue of activeIssues) {
    const idx = text.indexOf(issue.original)
    if (idx !== -1) {
      segments.push({ start: idx, end: idx + issue.original.length, issue })
    }
  }

  segments.sort((a, b) => a.start - b.start)

  // Remove overlapping segments
  const filtered: Segment[] = []
  let lastEnd = 0
  for (const seg of segments) {
    if (seg.start >= lastEnd) {
      filtered.push(seg)
      lastEnd = seg.end
    }
  }

  if (!filtered.length) return <p className="text-lg leading-[1.8] text-on-surface-variant/90">{text}</p>

  const parts: React.ReactNode[] = []
  let cursor = 0

  for (const seg of filtered) {
    if (cursor < seg.start) {
      parts.push(
        <span key={`t-${cursor}`}>{text.slice(cursor, seg.start)}</span>
      )
    }

    const isGrammarOrSpelling = seg.issue.type === 'Grammar Fix' || seg.issue.type === 'Spelling'
    const highlightClass = isGrammarOrSpelling
      ? 'bg-error/20 border-b-2 border-error text-on-background px-1.5 py-0.5 rounded-sm cursor-help'
      : 'bg-primary-fixed-dim/20 border-b-2 border-primary-fixed-dim text-on-background px-1.5 py-0.5 rounded-sm cursor-help'

    parts.push(
      <span key={`h-${seg.start}`} className={highlightClass} title={seg.issue.explanation}>
        {text.slice(seg.start, seg.end)}
      </span>
    )
    cursor = seg.end
  }

  if (cursor < text.length) {
    parts.push(<span key={`t-${cursor}`}>{text.slice(cursor)}</span>)
  }

  return <p className="text-lg leading-[1.8] text-on-surface-variant/90">{parts}</p>
}

function highlightCorrectedText(text: string, issues: Issue[], statuses: IssueStatus[]): React.ReactNode {
  if (!issues.length) return <p className="text-lg leading-[1.8] text-on-surface">{text}</p>

  const activeIssues = issues.filter((_, i) => statuses[i] === 'pending' || statuses[i] === 'accepted')
  if (!activeIssues.length) return <p className="text-lg leading-[1.8] text-on-surface">{text}</p>

  type Segment = { start: number; end: number; issue: Issue }
  const segments: Segment[] = []

  for (const issue of activeIssues) {
    const idx = text.indexOf(issue.suggestion)
    if (idx !== -1) {
      segments.push({ start: idx, end: idx + issue.suggestion.length, issue })
    }
  }

  segments.sort((a, b) => a.start - b.start)

  const filtered: Segment[] = []
  let lastEnd = 0
  for (const seg of segments) {
    if (seg.start >= lastEnd) {
      filtered.push(seg)
      lastEnd = seg.end
    }
  }

  if (!filtered.length) return <p className="text-lg leading-[1.8] text-on-surface">{text}</p>

  const parts: React.ReactNode[] = []
  let cursor = 0

  for (const seg of filtered) {
    if (cursor < seg.start) {
      parts.push(<span key={`t-${cursor}`}>{text.slice(cursor, seg.start)}</span>)
    }

    const isTone = seg.issue.type === 'Tone & Style'
    parts.push(
      <span
        key={`h-${seg.start}`}
        className={`text-secondary-fixed-dim font-bold underline underline-offset-4 decoration-secondary-fixed-dim/40${isTone ? ' italic' : ''}`}
      >
        {text.slice(seg.start, seg.end)}
      </span>
    )
    cursor = seg.end
  }

  if (cursor < text.length) {
    parts.push(<span key={`t-${cursor}`}>{text.slice(cursor)}</span>)
  }

  return <p className="text-lg leading-[1.8] text-on-surface">{parts}</p>
}

export default function ProofreadWorkspace() {
  const [inputText, setInputText] = useState('')
  const [originalText, setOriginalText] = useState('')
  const [correctedText, setCorrectedText] = useState('')
  const [issues, setIssues] = useState<Issue[]>([])
  const [issueStatuses, setIssueStatuses] = useState<IssueStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasResult, setHasResult] = useState(false)

  const wordCount = useCallback((text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0
  }, [])

  const handleProofread = useCallback(async () => {
    if (!inputText.trim()) return

    const settings = loadSettings()
    setLoading(true)
    setError('')

    try {
      const result = await proofread({
        text: inputText,
        model: settings.selectedModel,
        providerType: settings.providerType,
      })

      setOriginalText(inputText)
      setCorrectedText(result.corrected)
      setIssues(result.issues)
      setIssueStatuses(result.issues.map(() => 'pending'))
      setHasResult(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [inputText])

  const handleAccept = useCallback((index: number) => {
    setIssueStatuses((prev) => {
      const next = [...prev]
      next[index] = 'accepted'
      return next
    })
  }, [])

  const handleDismiss = useCallback((index: number) => {
    setIssueStatuses((prev) => {
      const next = [...prev]
      next[index] = 'dismissed'
      return next
    })
  }, [])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(correctedText)
  }, [correctedText])

  const handleApplyAll = useCallback(() => {
    setIssueStatuses((prev) => prev.map(() => 'accepted'))
  }, [])

  const handleExport = useCallback(() => {
    const blob = new Blob([correctedText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'proofread-export.txt'
    a.click()
    URL.revokeObjectURL(url)
  }, [correctedText])

  const pendingCount = issueStatuses.filter((s) => s === 'pending').length
  const readabilityScore = hasResult ? Math.min(99, Math.max(50, 100 - issues.length * 5)) : 0

  // Input view (before proofreading)
  if (!hasResult) {
    return (
      <div className="h-full flex flex-col p-8 gap-6">
        <div className="flex items-center gap-2 px-1">
          <span className="w-2 h-2 rounded-full bg-outline" />
          <span className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Enter Text to Proofread
          </span>
          <span className="ml-auto text-[10px] text-on-surface-variant/60 font-label">
            {wordCount(inputText)} Words
          </span>
        </div>

        <div className="flex-1 glass-panel rounded-[2rem] p-10 border border-outline-variant/10 shadow-inner flex flex-col">
          <textarea
            className="flex-1 w-full bg-transparent border-none outline-none resize-none text-lg leading-[1.8] text-on-surface-variant/90 placeholder:text-on-surface-variant/30"
            placeholder="Paste or type the text you'd like to proofread..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        </div>

        {error && (
          <div className="bg-error-container/20 border border-error/20 rounded-2xl px-6 py-3 text-error text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleProofread}
            disabled={loading || !inputText.trim()}
            className="flex items-center gap-3 px-8 h-12 bg-gradient-to-br from-[#aec6ff] to-[#0054ba] rounded-2xl text-on-primary-fixed font-bold shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'wght' 600" }}>
                  spellcheck
                </span>
                <span>Proofread</span>
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  // Result view (after proofreading)
  return (
    <div className="flex-1 flex min-h-0 relative h-full">
      {/* Text Comparison (Side-by-Side) */}
      <div className="flex-1 flex flex-col p-8 pr-4 gap-8 overflow-hidden">
        <div className="flex-1 grid grid-cols-2 gap-8 min-h-0">
          {/* Original Text Panel */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-outline" />
                <span className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Original Source
                </span>
              </div>
              <span className="text-[10px] text-on-surface-variant/60 font-label">
                {wordCount(originalText)} Words
              </span>
            </div>
            <div className="flex-1 glass-panel rounded-[2rem] p-10 overflow-y-auto border border-outline-variant/10 shadow-inner">
              <div className="max-w-2xl mx-auto prose prose-invert">
                {highlightOriginalText(originalText, issues, issueStatuses)}
              </div>
            </div>
          </div>

          {/* Corrected Text Panel */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary-fixed-dim shadow-[0_0_8px_rgba(0,218,243,0.5)]" />
                <span className="font-label text-xs font-bold uppercase tracking-widest text-secondary-fixed-dim">
                  AI Corrected View
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="text-xs bg-surface-container-high/80 px-4 py-1.5 rounded-lg hover:bg-surface-container-highest transition-colors font-label border border-outline-variant/10"
                >
                  Copy
                </button>
                <button
                  onClick={handleApplyAll}
                  className="text-xs bg-gradient-to-br from-primary-fixed-dim to-on-primary-container text-white px-4 py-1.5 rounded-lg font-bold font-label shadow-lg hover:brightness-110 transition-all"
                >
                  Apply All Changes
                </button>
              </div>
            </div>
            <div className="flex-1 bg-surface-container-low rounded-[2rem] p-10 overflow-y-auto border border-outline-variant/20 shadow-xl">
              <div className="max-w-2xl mx-auto">
                {highlightCorrectedText(correctedText, issues, issueStatuses)}
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Utility Toolbar */}
        <div className="h-24 glass-panel rounded-[2rem] flex items-center justify-between px-10 border border-outline-variant/10 shadow-xl flex-shrink-0">
          <div className="flex items-center gap-10">
            <div className="flex flex-col">
              <span className="text-[10px] font-label font-bold text-on-surface-variant/50 uppercase tracking-widest mb-1">
                Readability Index
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-secondary-fixed-dim">{readabilityScore}</span>
                <span className="text-xs text-on-surface-variant/40">/ 100</span>
              </div>
            </div>
            <div className="h-10 w-[1px] bg-outline-variant/20" />
            <div className="flex gap-3">
              {pendingCount > 0 && (
                <div className="w-2.5 h-2.5 rounded-full bg-error animate-pulse mt-2" />
              )}
              <div className="flex flex-col">
                <span className="text-[10px] font-label font-bold text-on-surface-variant/50 uppercase tracking-widest mb-1">
                  Issue Count
                </span>
                <span className="text-lg font-bold">
                  {pendingCount} Potential Error{pendingCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setHasResult(false)
                setInputText(originalText)
              }}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface-container-highest text-on-surface hover:bg-surface-bright transition-all border border-outline-variant/10"
              title="Start over"
            >
              <span className="material-symbols-outlined">history</span>
            </button>
            <button
              onClick={handleCopy}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface-container-highest text-on-surface hover:bg-surface-bright transition-all border border-outline-variant/10"
              title="Share"
            >
              <span className="material-symbols-outlined">share</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-3 px-8 h-12 bg-gradient-to-br from-[#aec6ff] to-[#0054ba] rounded-2xl text-on-primary-fixed font-bold shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'wght' 600" }}>
                download
              </span>
              <span>Export Final</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Insights Sidebar */}
      <aside className="w-[380px] h-full flex flex-col border-l border-[#3b494c]/15 bg-surface-container-low/30 p-8 gap-6 overflow-hidden flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-headline font-bold text-lg">Detailed Insights</h3>
          <span className="text-[10px] bg-surface-container-high px-2 py-1 rounded-md text-on-surface-variant border border-outline-variant/20 font-mono">
            v4.2 Pulse
          </span>
        </div>

        <div className="flex-1 flex flex-col gap-5 overflow-y-auto pr-2">
          {issues.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-on-surface-variant/40 gap-3">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
              <p className="text-sm font-label">No issues found</p>
            </div>
          )}

          {issues.map((issue, index) => {
            const status = issueStatuses[index]
            if (status === 'dismissed') return null

            const colors = getIssueColor(issue.type)
            const isToneStyle = issue.type === 'Tone & Style'
            const isAccepted = status === 'accepted'

            return (
              <div
                key={index}
                className={`bg-surface-container-high/40 border border-outline-variant/10 rounded-3xl p-6 flex flex-col gap-4 group ${colors.border} transition-all shadow-sm ${isAccepted ? 'opacity-50' : ''}`}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center`}>
                      <span
                        className={`material-symbols-outlined ${colors.text} text-lg`}
                        style={colors.iconStyle}
                      >
                        {colors.icon}
                      </span>
                    </div>
                    <span className={`font-label text-xs font-bold ${colors.text} uppercase tracking-wider`}>
                      {issue.type}
                    </span>
                  </div>
                  {issue.severity && (
                    <span className="text-[10px] text-on-surface-variant/40 bg-surface-container-highest px-2 py-0.5 rounded-full">
                      {issue.severity}
                    </span>
                  )}
                </div>

                {/* Content */}
                {isToneStyle ? (
                  <>
                    <p className="text-sm font-bold leading-tight">"{issue.suggestion}"</p>
                    <p className="text-[12px] text-on-surface-variant/60 leading-relaxed italic">
                      {issue.explanation}
                    </p>
                  </>
                ) : (
                  <div>
                    <p className="text-[13px] text-on-surface-variant mb-2">{issue.explanation}</p>
                    <div className="flex items-center gap-3 bg-surface-container-lowest/50 p-3 rounded-2xl border border-outline-variant/5">
                      <span className="text-on-surface-variant/50 line-through text-sm font-medium">
                        {issue.original}
                      </span>
                      <span className="material-symbols-outlined text-on-surface-variant/30 text-xs">
                        arrow_forward
                      </span>
                      <span className="text-secondary-fixed-dim text-sm font-bold">{issue.suggestion}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {!isAccepted && (
                  isToneStyle ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(index)}
                        className="flex-1 py-3 rounded-xl bg-surface-container-highest font-label text-xs font-bold hover:bg-primary-fixed-dim hover:text-on-primary-fixed transition-all"
                      >
                        Apply Rewrite
                      </button>
                      <button
                        onClick={() => handleDismiss(index)}
                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-surface-container-highest hover:bg-error/10 hover:text-error transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(index)}
                        className="flex-1 py-3 rounded-xl bg-surface-container-highest font-label text-xs font-bold hover:bg-on-surface hover:text-surface transition-all"
                      >
                        Accept Change
                      </button>
                      <button
                        onClick={() => handleDismiss(index)}
                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-surface-container-highest hover:bg-error/10 hover:text-error transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  )
                )}

                {isAccepted && (
                  <div className="flex items-center gap-2 text-secondary-fixed-dim font-label text-xs font-bold">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                    Accepted
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </aside>
    </div>
  )
}
