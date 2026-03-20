import { useState, useRef, useCallback } from 'react'

interface RecentTranslation {
  id: number
  name: string
  icon: string
  from: string
  to: string
  status: 'Ready' | 'Translating' | 'Failed'
  date: string
  size: string
}

const recentTranslations: RecentTranslation[] = [
  { id: 1, name: 'Annual_Report_2025.pdf', icon: 'picture_as_pdf', from: 'EN', to: 'JP', status: 'Ready', date: '2026-03-18', size: '4.2 MB' },
  { id: 2, name: 'Product_Spec.docx', icon: 'description', from: 'EN', to: 'DE', status: 'Ready', date: '2026-03-17', size: '1.8 MB' },
  { id: 3, name: 'Financial_Summary.xlsx', icon: 'table_chart', from: 'EN', to: 'FR', status: 'Translating', date: '2026-03-17', size: '3.1 MB' },
  { id: 4, name: 'Marketing_Deck.pptx', icon: 'slideshow', from: 'EN', to: 'KO', status: 'Ready', date: '2026-03-16', size: '12.5 MB' },
  { id: 5, name: 'User_Manual.pdf', icon: 'picture_as_pdf', from: 'EN', to: 'ZH', status: 'Failed', date: '2026-03-15', size: '8.7 MB' },
]

const supportedFormats = ['PDF', 'DOCX', 'XLSX', 'PPTX', 'TXT', 'CSV']

export default function DocumentsWorkspace() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file.name)
    }
  }, [])

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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setSelectedFile(file.name)
    }
  }, [])

  const statusColor = (status: RecentTranslation['status']) => {
    switch (status) {
      case 'Ready':
        return 'bg-green-500/15 text-green-400 border border-green-500/20'
      case 'Translating':
        return 'bg-secondary-fixed-dim/15 text-secondary-fixed-dim border border-secondary-fixed-dim/20'
      case 'Failed':
        return 'bg-error/15 text-error border border-error/20'
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1200px] mx-auto px-8 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight font-headline">
            Document Hub
          </h1>
          <p className="text-[11px] uppercase tracking-[0.25em] text-on-surface-variant/50 mt-2 font-label">
            Preserve Formatting with AI Precision
          </p>
        </div>

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
              style={{ height: 420 }}
            >
              {/* Subtle gradient overlay on drag */}
              {isDragOver && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary-fixed-dim/5 to-transparent pointer-events-none" />
              )}

              <div className="flex flex-col items-center justify-center h-full px-8 relative z-10">
                {/* Upload icon */}
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 transition-all duration-300 ${
                  isDragOver
                    ? 'bg-primary-fixed-dim/15 scale-110'
                    : 'bg-surface-container-high/60'
                }`}>
                  <span className={`material-symbols-outlined text-5xl transition-colors duration-300 ${
                    isDragOver ? 'text-primary-fixed-dim' : 'text-on-surface-variant/60'
                  }`}>
                    cloud_upload
                  </span>
                </div>

                {/* Text */}
                <h3 className="text-xl font-semibold text-on-surface mb-2 font-headline">
                  {selectedFile ? selectedFile : 'Drop files here to translate'}
                </h3>
                <p className="text-sm text-on-surface-variant/50 mb-8">
                  {selectedFile
                    ? 'File selected — ready to translate'
                    : 'Drag and drop your documents, or use the buttons below'}
                </p>

                {/* Action buttons */}
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
                    accept=".pdf,.docx,.xlsx,.pptx,.txt,.csv"
                  />
                  <button className="px-6 py-2.5 rounded-full bg-surface-container-high/70 border border-outline-variant/15 text-sm font-semibold text-on-surface hover:bg-surface-container-highest/50 transition-all duration-300 active:scale-[0.97] cursor-pointer">
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">cloud</span>
                      Cloud Import
                    </span>
                  </button>
                </div>

                {/* Feature badges */}
                <div className="flex items-center gap-3">
                  {[
                    { icon: 'storage', label: 'Max 50MB' },
                    { icon: 'document_scanner', label: 'OCR Enabled' },
                    { icon: 'language', label: '100+ Languages' },
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

          {/* Right: Stacked cards */}
          <div className="col-span-4 flex flex-col gap-5">
            {/* Current Plan card */}
            <div className="glass-panel rounded-2xl border border-outline-variant/10 p-6 flex-1">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs uppercase tracking-[0.15em] text-on-surface-variant/50 font-label font-semibold">
                  Current Plan
                </h4>
                <span className="material-symbols-outlined text-primary-fixed-dim text-xl">workspace_premium</span>
              </div>
              <p className="text-2xl font-bold text-on-surface font-headline mb-1">Professional</p>
              <p className="text-xs text-on-surface-variant/50 mb-5">Unlimited document translations</p>

              {/* Usage bar */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-on-surface-variant/60 font-label">Monthly Usage</span>
                  <span className="text-xs font-semibold text-primary-fixed-dim font-label">82%</span>
                </div>
                <div className="h-2 rounded-full bg-surface-container-highest/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-fixed-dim to-secondary-fixed-dim transition-all duration-700"
                    style={{ width: '82%' }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-on-surface-variant/40">41 of 50 documents used this month</p>
            </div>

            {/* Supported Formats card */}
            <div className="glass-panel rounded-2xl border border-outline-variant/10 p-6 flex-1">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs uppercase tracking-[0.15em] text-on-surface-variant/50 font-label font-semibold">
                  Supported Formats
                </h4>
                <span className="material-symbols-outlined text-secondary-fixed-dim text-xl">extension</span>
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
                All formats preserve original layout, fonts, and styling after translation.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Translations */}
        <div className="glass-panel rounded-2xl border border-outline-variant/10 mb-10">
          <div className="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-on-surface font-headline">Recent Translations</h3>
              <p className="text-xs text-on-surface-variant/50 mt-0.5">{recentTranslations.length} documents processed</p>
            </div>
            <button className="px-4 py-2 rounded-full bg-surface-container-high/50 border border-outline-variant/10 text-xs font-semibold text-on-surface-variant/70 hover:text-on-surface hover:bg-surface-container-highest/50 transition-all duration-200 cursor-pointer">
              View All
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
              {recentTranslations.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b border-outline-variant/5 hover:bg-surface-container-low/30 transition-colors duration-150"
                >
                  {/* Document Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-surface-container-high/60 flex items-center justify-center">
                        <span className="material-symbols-outlined text-lg text-primary-fixed-dim/80">{doc.icon}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-on-surface">{doc.name}</p>
                        <p className="text-[11px] text-on-surface-variant/40">{doc.size} &middot; {doc.date}</p>
                      </div>
                    </div>
                  </td>

                  {/* Language */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high/50 border border-outline-variant/10 text-xs font-semibold text-on-surface-variant/80 font-label">
                      {doc.from}
                      <span className="material-symbols-outlined text-sm text-primary-fixed-dim/60">arrow_forward</span>
                      {doc.to}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-label ${statusColor(doc.status)}`}>
                      {doc.status === 'Translating' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed-dim animate-pulse" />
                      )}
                      {doc.status === 'Failed' && (
                        <span className="material-symbols-outlined text-sm">error</span>
                      )}
                      {doc.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest/40 transition-colors duration-150 cursor-pointer"
                        title="Download"
                      >
                        <span className="material-symbols-outlined text-lg text-on-surface-variant/50 hover:text-primary-fixed-dim">download</span>
                      </button>
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest/40 transition-colors duration-150 cursor-pointer"
                        title="View"
                      >
                        <span className="material-symbols-outlined text-lg text-on-surface-variant/50 hover:text-primary-fixed-dim">visibility</span>
                      </button>
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-error/10 transition-colors duration-150 cursor-pointer"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-lg text-on-surface-variant/50 hover:text-error">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between py-6 border-t border-outline-variant/10">
          <p className="text-xs text-on-surface-variant/30 font-label">
            &copy; 2026 Lumina Translate. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {['Privacy', 'Terms', 'API Docs'].map((link) => (
              <button
                key={link}
                className="text-xs text-on-surface-variant/40 hover:text-primary-fixed-dim transition-colors duration-200 cursor-pointer font-label"
              >
                {link}
              </button>
            ))}
          </div>
        </footer>
      </div>
    </div>
  )
}
