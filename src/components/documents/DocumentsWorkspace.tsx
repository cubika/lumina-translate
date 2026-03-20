import { useState, useRef, useCallback } from 'react'
import { translate, downloadTextFile } from '../../services/ai'
import { loadSettings, LANGUAGES } from '../../services/settings'

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
}

const supportedFormats = ['TXT', 'MD', 'CSV', 'JSON', 'SRT']

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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(
    async (file: File) => {
      const settings = loadSettings()
      const text = await file.text()
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
        const result = await translate({
          text,
          sourceLang,
          targetLang,
          model: settings.selectedModel,
          providerType: settings.providerType,
        })

        setDocs((prev) =>
          prev.map((d) =>
            d.id === docId ? { ...d, status: 'Ready', translatedText: result } : d,
          ),
        )
      } catch (err) {
        setDocs((prev) =>
          prev.map((d) =>
            d.id === docId
              ? { ...d, status: 'Failed', error: err instanceof Error ? err.message : 'Translation failed' }
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
    const ext = doc.name.lastIndexOf('.') >= 0 ? doc.name.slice(doc.name.lastIndexOf('.')) : '.txt'
    const baseName = doc.name.replace(/\.[^.]+$/, '')
    downloadTextFile(doc.translatedText, `${baseName}_${doc.to}${ext}`)
  }, [])

  const handleDelete = useCallback((id: number) => {
    setDocs((prev) => prev.filter((d) => d.id !== id))
  }, [])

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1200px] mx-auto px-8 py-10">
        {/* Bento Grid */}
        <div className="grid grid-cols-12 gap-5 mb-10">
          {/* Left: Drag-and-drop upload area */}
          <div className="col-span-8">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`glass-panel rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                isDragOver
                  ? 'border-primary-fixed-dim/60 shadow-[0_0_40px_rgba(174,198,255,0.12)]'
                  : 'border-outline-variant/10 hover:border-outline-variant/20'
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
                  Drop files here to translate
                </h3>
                <p className="text-sm text-on-surface-variant/50 mb-8">
                  Drag and drop your text documents, or click to browse
                </p>

                <div className="flex items-center gap-3 mb-8">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2.5 rounded-full liquid-gradient text-sm font-semibold text-white shadow-lg shadow-on-primary-container/20 hover:shadow-on-primary-container/30 transition-all duration-300 active:scale-[0.97] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">folder_open</span>
                      Select File
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".txt,.md,.csv,.json,.srt"
                  />
                </div>

                <div className="flex items-center gap-3">
                  {[
                    { icon: 'text_snippet', label: 'Text-based files' },
                    { icon: 'language', label: `${LANGUAGES.length} Languages` },
                    { icon: 'speed', label: 'AI-powered' },
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
                  Translation Languages
                </h4>
                <span className="material-symbols-outlined text-primary-fixed-dim text-xl">
                  translate
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] text-on-surface-variant/40 font-label mb-1.5">
                    From
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
                    To
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
                  Supported Formats
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
                Text-based files are translated while preserving structure and formatting.
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
                  Translations
                </h3>
                <p className="text-xs text-on-surface-variant/50 mt-0.5">
                  {docs.length} document{docs.length !== 1 ? 's' : ''} processed
                </p>
              </div>
              <button
                onClick={() => setDocs([])}
                className="px-4 py-2 rounded-full bg-surface-container-high/50 border border-outline-variant/10 text-xs font-semibold text-on-surface-variant/70 hover:text-on-surface hover:bg-surface-container-highest/50 transition-all duration-200 cursor-pointer"
              >
                Clear All
              </button>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant/10">
                  <th className="text-left px-6 py-3.5 text-[11px] uppercase tracking-[0.12em] text-on-surface-variant/40 font-label font-semibold">
                    Document Name
                  </th>
                  <th className="text-left px-6 py-3.5 text-[11px] uppercase tracking-[0.12em] text-on-surface-variant/40 font-label font-semibold">
                    Language
                  </th>
                  <th className="text-left px-6 py-3.5 text-[11px] uppercase tracking-[0.12em] text-on-surface-variant/40 font-label font-semibold">
                    Status
                  </th>
                  <th className="text-right px-6 py-3.5 text-[11px] uppercase tracking-[0.12em] text-on-surface-variant/40 font-label font-semibold">
                    Actions
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
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {doc.status === 'Ready' && (
                          <button
                            onClick={() => handleDownload(doc)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest/40 transition-colors duration-150 cursor-pointer"
                            title="Download translated file"
                          >
                            <span className="material-symbols-outlined text-lg text-on-surface-variant/50 hover:text-primary-fixed-dim">
                              download
                            </span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-error/10 transition-colors duration-150 cursor-pointer"
                          title="Delete"
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
