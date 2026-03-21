import { useState, useRef, useCallback, useEffect } from 'react'
import { translate, downloadTextFile } from '../../services/ai'
import { loadSettings, LANGUAGES } from '../../services/settings'
import { useTranslation } from '../../hooks/useTranslation'
import { extractPdfText, extractPdfPages } from '../../services/pdf'

interface TranslatedDoc {
  id: number
  name: string
  from: string
  to: string
  status: 'Ready' | 'Translating' | 'Failed'
  date: string
  size: string
  originalText: string
  translatedText: string
  error?: string
  progress?: string
}

const supportedFormats = ['TXT', 'MD', 'CSV', 'JSON', 'SRT', 'PDF']

function statusColor(status: TranslatedDoc['status']) {
  switch (status) {
    case 'Ready':
      return 'bg-green-500/15 text-green-400 border border-green-500/20'
    case 'Translating':
      return 'bg-secondary-fixed-dim/15 text-secondary-fixed-dim border border-secondary-fixed-dim/20'
    case 'Failed':
      return 'bg-error/15 text-error border border-error/20'
  }
}

export default function DocumentsWorkspace() {
  const [isDragOver, setIsDragOver] = useState(false)
  const [docs, setDocs] = useState<TranslatedDoc[]>([])
  const [sourceLang, setSourceLang] = useState(() => loadSettings().sourceLang)
  const [targetLang, setTargetLang] = useState(() => loadSettings().targetLang)
  const [downloadToast, setDownloadToast] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const t = useTranslation()

  useEffect(() => {
    const sync = () => {
      const s = loadSettings()
      setSourceLang(s.sourceLang)
      setTargetLang(s.targetLang)
    }
    window.addEventListener('settings-changed', sync)
    return () => window.removeEventListener('settings-changed', sync)
  }, [])

  const processFile = useCallback(
    async (file: File) => {
      const settings = loadSettings()
      const isPdf = file.name.toLowerCase().endsWith('.pdf')

      // For PDFs, extract pages separately for chunked translation
      let text: string
      let pages: string[] | null = null
      if (isPdf) {
        console.log(`[PDF] Extracting text from ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)...`)
        try {
          pages = await extractPdfPages(file)
          text = pages.join('\n\n')
          console.log(`[PDF] Extracted ${pages.length} pages, ${text.length} chars total`)
        } catch (e) {
          console.error('[PDF] Extraction failed:', e)
          throw e
        }
      } else {
        text = await file.text()
      }
      if (!text.trim()) {
        console.warn('[DOC] File is empty after extraction')
        return
      }

      const docId = Date.now()
      const sizeKB = (file.size / 1024).toFixed(1)
      const sizeLabel = file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${sizeKB} KB`

      const newDoc: TranslatedDoc = {
        id: docId,
        name: file.name,
        from: sourceLang,
        to: targetLang,
        status: 'Translating',
        date: new Date().toISOString().slice(0, 10),
        size: sizeLabel,
        originalText: text,
        translatedText: '',
      }

      setDocs((prev) => [newDoc, ...prev])

      try {
        // ~30K chars per chunk ≈ 10K tokens, safe for models with 128K+ context (Azure Model Router, GPT-4o, Claude)
        const MAX_CHUNK_CHARS = 30000
        const needsChunking = text.length > MAX_CHUNK_CHARS
        console.log(`[DOC] Text length: ${text.length} chars, needsChunking: ${needsChunking}`)

        let result: string

        if (needsChunking) {
          // Build chunks from pages (PDF) or paragraphs (text)
          const segments = pages ?? text.split(/\n{2,}/).filter(Boolean)
          const chunks: string[] = []
          let current = ''

          for (const segment of segments) {
            if (current.length + segment.length > MAX_CHUNK_CHARS && current) {
              chunks.push(current.trim())
              current = ''
            }
            current += (current ? '\n\n' : '') + segment
          }
          if (current.trim()) chunks.push(current.trim())

          console.log(`[DOC] Split into ${chunks.length} chunks: ${chunks.map((c, i) => `chunk ${i + 1}: ${c.length} chars`).join(', ')}`)

          // Translate chunks in parallel with concurrency limit
          const CONCURRENCY = 5
          const translated: string[] = new Array(chunks.length).fill('')
          let completed = 0

          const translateChunk = async (i: number) => {
            console.log(`[DOC] Translating chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)...`)
            const chunkResult = await translate({
              text: chunks[i],
              sourceLang,
              targetLang,
              model: settings.selectedModel,
              providerType: settings.providerType,
            })
            translated[i] = chunkResult
            completed++
            console.log(`[DOC] Chunk ${i + 1} done (${completed}/${chunks.length}), result: ${chunkResult.length} chars`)
            setDocs((prev) =>
              prev.map((d) =>
                d.id === docId
                  ? { ...d, progress: `${Math.round(completed / chunks.length * 100)}%` }
                  : d,
              ),
            )
          }

          // Process in batches of CONCURRENCY
          for (let i = 0; i < chunks.length; i += CONCURRENCY) {
            const batch = chunks.slice(i, i + CONCURRENCY).map((_, j) => translateChunk(i + j))
            await Promise.all(batch)
          }
          result = translated.join('\n\n')
        } else {
          console.log(`[DOC] Single-shot translation (${text.length} chars)...`)
          result = await translate({
            text,
            sourceLang,
            targetLang,
            model: settings.selectedModel,
            providerType: settings.providerType,
          })
        }

        console.log(`[DOC] Translation complete, total: ${result.length} chars`)
        setDocs((prev) =>
          prev.map((d) =>
            d.id === docId ? { ...d, status: 'Ready', translatedText: result } : d,
          ),
        )
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Translation failed'
        console.error(`[DOC] Translation failed:`, errMsg, err)
        setDocs((prev) =>
          prev.map((d) =>
            d.id === docId
              ? { ...d, status: 'Failed', error: errMsg }
              : d,
          ),
        )
      }
    },
    [sourceLang, targetLang],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
      e.target.value = ''
    },
    [processFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      const file = e.dataTransfer.files?.[0]
      if (file) processFile(file)
    },
    [processFile],
  )

  const handleDownload = useCallback((doc: TranslatedDoc) => {
    const origExt = doc.name.lastIndexOf('.') >= 0 ? doc.name.slice(doc.name.lastIndexOf('.')) : '.txt'
    const ext = origExt.toLowerCase() === '.pdf' ? '.txt' : origExt
    const baseName = doc.name.replace(/\.[^.]+$/, '')
    const filename = `${baseName}_${doc.to}${ext}`
    downloadTextFile(doc.translatedText, filename)
    setDownloadToast(filename)
    setTimeout(() => setDownloadToast(null), 4000)
  }, [])

  const handleDelete = useCallback((id: number) => {
    setDocs((prev) => prev.filter((d) => d.id !== id))
  }, [])

  return (
    <div className="h-full overflow-y-auto">
      {/* Download toast */}
      {downloadToast && (
        <div className="fixed top-14 right-8 z-50 bg-green-500/15 border border-green-500/30 text-green-400 px-5 py-3 rounded-xl text-sm font-label font-semibold flex items-center gap-2 shadow-lg animate-[fadeIn_0.2s_ease-out]">
          <span className="material-symbols-outlined text-lg">download_done</span>
          Saved to Downloads: {downloadToast}
        </div>
      )}
      <div className="max-w-[1200px] mx-auto px-8 py-10">
        {/* Bento Grid */}
        <div className="grid grid-cols-12 gap-5 mb-10">
          {/* Left: Drag-and-drop upload area */}
          <div className="col-span-8">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`glass-panel rounded-2xl border-2 border-dashed transition-all duration-300 relative overflow-hidden ${
                isDragOver
                  ? 'border-primary-fixed-dim/60 shadow-[0_0_40px_rgba(174,198,255,0.15)] bg-primary-fixed-dim/5 scale-[1.01]'
                  : 'border-outline-variant/10 border-solid hover:border-outline-variant/20'
              }`}
              style={{ height: 380 }}
            >
              {isDragOver && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary-fixed-dim/5 to-transparent pointer-events-none" />
              )}

              <div className="flex flex-col items-center justify-center h-full px-8 relative z-10">
                <div
                  className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 transition-all duration-300 ${
                    isDragOver
                      ? 'bg-primary-fixed-dim/15 scale-110'
                      : 'bg-surface-container-high/60'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-5xl transition-colors duration-300 ${
                      isDragOver ? 'text-primary-fixed-dim' : 'text-on-surface-variant/60'
                    }`}
                  >
                    cloud_upload
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-on-surface mb-2 font-headline">
                  {t('documents.dropTitle')}
                </h3>
                <p className="text-sm text-on-surface-variant/50 mb-8">
                  {t('documents.dropDesc')}
                </p>

                <div className="flex items-center gap-3 mb-8">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2.5 rounded-full liquid-gradient text-sm font-semibold text-white shadow-lg shadow-on-primary-container/20 hover:shadow-on-primary-container/30 transition-all duration-300 active:scale-[0.97] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">folder_open</span>
                      {t('documents.selectFile')}
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".txt,.md,.csv,.json,.srt,.pdf"
                  />
                </div>

                <div className="flex items-center gap-3">
                  {[
                    { icon: 'text_snippet', label: t('documents.textBased') },
                    { icon: 'language', label: `${LANGUAGES.length} ${t('documents.languages')}` },
                    { icon: 'speed', label: t('documents.aiPowered') },
                  ].map((badge) => (
                    <span
                      key={badge.label}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/10 text-xs text-on-surface-variant/60"
                    >
                      <span className="material-symbols-outlined text-sm">{badge.icon}</span>
                      {badge.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Config cards */}
          <div className="col-span-4 flex flex-col gap-5">
            {/* Language Selection */}
            <div className="glass-panel rounded-2xl border border-outline-variant/10 p-6 flex-1">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs uppercase tracking-[0.15em] text-on-surface-variant/50 font-label font-semibold">
                  {t('documents.translationLangs')}
                </h4>
                <span className="material-symbols-outlined text-primary-fixed-dim text-xl">
                  translate
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] text-on-surface-variant/40 font-label mb-1.5">
                    {t('documents.from')}
                  </label>
                  <select
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    className="w-full bg-surface-container rounded-xl border border-outline-variant/15 px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary-fixed-dim/50 transition-colors cursor-pointer"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-on-surface-variant/40 font-label mb-1.5">
                    {t('documents.to')}
                  </label>
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="w-full bg-surface-container rounded-xl border border-outline-variant/15 px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary-fixed-dim/50 transition-colors cursor-pointer"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Supported Formats card */}
            <div className="glass-panel rounded-2xl border border-outline-variant/10 p-6 flex-1">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs uppercase tracking-[0.15em] text-on-surface-variant/50 font-label font-semibold">
                  {t('documents.supportedFormats')}
                </h4>
                <span className="material-symbols-outlined text-secondary-fixed-dim text-xl">
                  extension
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {supportedFormats.map((fmt) => (
                  <span
                    key={fmt}
                    className="px-3.5 py-1.5 rounded-xl bg-surface-container-high/60 border border-outline-variant/10 text-xs font-semibold text-on-surface-variant/80 font-label tracking-wide"
                  >
                    .{fmt}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-on-surface-variant/40 mt-4">
                {t('documents.supportedDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Translations */}
        {docs.length > 0 && (
          <div className="glass-panel rounded-2xl border border-outline-variant/10 mb-10">
            <div className="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-on-surface font-headline">
                  {t('documents.translations')}
                </h3>
                <p className="text-xs text-on-surface-variant/50 mt-0.5">
                  {docs.length} {docs.length !== 1 ? t('documents.documents') : t('documents.document')}
                </p>
              </div>
              <button
                onClick={() => setDocs([])}
                className="px-4 py-2 rounded-full bg-surface-container-high/50 border border-outline-variant/10 text-xs font-semibold text-on-surface-variant/70 hover:text-on-surface hover:bg-surface-container-highest/50 transition-all duration-200 cursor-pointer"
              >
                {t('documents.clearAll')}
              </button>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant/10">
                  <th className="text-left px-6 py-3.5 text-[11px] uppercase tracking-[0.12em] text-on-surface-variant/40 font-label font-semibold">
                    {t('documents.colName')}
                  </th>
                  <th className="text-left px-6 py-3.5 text-[11px] uppercase tracking-[0.12em] text-on-surface-variant/40 font-label font-semibold">
                    {t('documents.colLang')}
                  </th>
                  <th className="text-left px-6 py-3.5 text-[11px] uppercase tracking-[0.12em] text-on-surface-variant/40 font-label font-semibold">
                    {t('documents.colStatus')}
                  </th>
                  <th className="text-right px-6 py-3.5 text-[11px] uppercase tracking-[0.12em] text-on-surface-variant/40 font-label font-semibold">
                    {t('documents.colActions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {docs.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-outline-variant/5 hover:bg-surface-container-low/30 transition-colors duration-150"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-surface-container-high/60 flex items-center justify-center">
                          <span className="material-symbols-outlined text-lg text-primary-fixed-dim/80">
                            description
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-on-surface">{doc.name}</p>
                          <p className="text-[11px] text-on-surface-variant/40">
                            {doc.size} &middot; {doc.date}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high/50 border border-outline-variant/10 text-xs font-semibold text-on-surface-variant/80 font-label">
                        {doc.from}
                        <span className="material-symbols-outlined text-sm text-primary-fixed-dim/60">
                          arrow_forward
                        </span>
                        {doc.to}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-label ${statusColor(doc.status)}`}
                        title={doc.error || undefined}
                      >
                        {doc.status === 'Translating' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed-dim animate-pulse" />
                        )}
                        {doc.status === 'Failed' && (
                          <span className="material-symbols-outlined text-sm">error</span>
                        )}
                        {doc.status === 'Translating' && doc.progress
                          ? doc.progress
                          : doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {doc.status === 'Ready' && (
                          <button
                            onClick={() => handleDownload(doc)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest/40 transition-colors duration-150 cursor-pointer"
                            title={t('documents.download')}
                          >
                            <span className="material-symbols-outlined text-lg text-on-surface-variant/50 hover:text-primary-fixed-dim">
                              download
                            </span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-error/10 transition-colors duration-150 cursor-pointer"
                          title={t('documents.delete')}
                        >
                          <span className="material-symbols-outlined text-lg text-on-surface-variant/50 hover:text-error">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
