import { useState, useEffect } from 'react'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import ErrorBoundary from './components/ui/ErrorBoundary'
import TranslateWorkspace from './components/translate/TranslateWorkspace'
import ProofreadWorkspace from './components/proofread/ProofreadWorkspace'
import DictionaryWorkspace from './components/dictionary/DictionaryWorkspace'
import DocumentsWorkspace from './components/documents/DocumentsWorkspace'
import SettingsWorkspace from './components/settings/SettingsWorkspace'

export type WorkspaceId = 'translate' | 'proofread' | 'dictionary' | 'documents' | 'settings'

const WORKSPACE_KEY = 'lumina-active-workspace'

export default function App() {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>(() => {
    const saved = localStorage.getItem(WORKSPACE_KEY)
    return (saved as WorkspaceId) || 'translate'
  })

  useEffect(() => {
    localStorage.setItem(WORKSPACE_KEY, activeWorkspace)
  }, [activeWorkspace])

  return (
    <div className="flex h-screen bg-surface text-on-surface overflow-hidden">
      {/* Titlebar drag region */}
      <div className="fixed top-0 left-0 right-0 h-9 drag-region z-[100]" />

      <Sidebar active={activeWorkspace} onNavigate={setActiveWorkspace} />

      <main className="flex-1 ml-64 flex flex-col h-screen pt-9">
        <TopBar workspace={activeWorkspace} />
        <div className="flex-1 overflow-hidden">
          {/* Use display:none instead of unmount to preserve workspace state */}
          <div className={`h-full ${activeWorkspace !== 'translate' ? 'hidden' : ''}`}><ErrorBoundary><TranslateWorkspace /></ErrorBoundary></div>
          <div className={`h-full ${activeWorkspace !== 'proofread' ? 'hidden' : ''}`}><ErrorBoundary><ProofreadWorkspace /></ErrorBoundary></div>
          <div className={`h-full ${activeWorkspace !== 'dictionary' ? 'hidden' : ''}`}><ErrorBoundary><DictionaryWorkspace /></ErrorBoundary></div>
          <div className={`h-full ${activeWorkspace !== 'documents' ? 'hidden' : ''}`}><ErrorBoundary><DocumentsWorkspace /></ErrorBoundary></div>
          <div className={`h-full ${activeWorkspace !== 'settings' ? 'hidden' : ''}`}><ErrorBoundary><SettingsWorkspace /></ErrorBoundary></div>
        </div>
      </main>
    </div>
  )
}
