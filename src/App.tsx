import { useState, useEffect } from 'react'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault()
        const appWindow = getCurrentWebviewWindow()
        appWindow.isFullscreen().then(full => appWindow.setFullscreen(!full))
      }
      if (e.ctrlKey || e.metaKey) {
        const workspaces: WorkspaceId[] = ['translate', 'proofread', 'dictionary', 'documents', 'settings']
        const num = parseInt(e.key)
        if (num >= 1 && num <= 5) {
          e.preventDefault()
          setActiveWorkspace(workspaces[num - 1])
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const goOffline = () => setIsOffline(true)
    const goOnline = () => setIsOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  return (
    <div className="flex h-screen bg-surface text-on-surface overflow-hidden">
      {/* Titlebar drag region */}
      <div className="fixed top-0 left-0 right-0 h-9 drag-region z-[100]" />

      {isOffline && (
        <div className="fixed top-9 left-64 right-0 z-50 bg-error/15 border-b border-error/20 px-4 py-2 flex items-center justify-center gap-2 text-error text-xs font-label font-semibold">
          <span className="material-symbols-outlined text-sm">cloud_off</span>
          You are offline. Translation requires an internet connection.
        </div>
      )}

      <Sidebar active={activeWorkspace} onNavigate={setActiveWorkspace} />

      <main className="flex-1 ml-64 flex flex-col h-screen pt-9">
        <TopBar workspace={activeWorkspace} />
        <div className="flex-1 overflow-hidden">
          {/* Use display:none instead of unmount to preserve workspace state */}
          <div className={`h-full ${activeWorkspace !== 'translate' ? 'hidden' : 'animate-fadeIn'}`}><ErrorBoundary><TranslateWorkspace /></ErrorBoundary></div>
          <div className={`h-full ${activeWorkspace !== 'proofread' ? 'hidden' : 'animate-fadeIn'}`}><ErrorBoundary><ProofreadWorkspace /></ErrorBoundary></div>
          <div className={`h-full ${activeWorkspace !== 'dictionary' ? 'hidden' : 'animate-fadeIn'}`}><ErrorBoundary><DictionaryWorkspace /></ErrorBoundary></div>
          <div className={`h-full ${activeWorkspace !== 'documents' ? 'hidden' : 'animate-fadeIn'}`}><ErrorBoundary><DocumentsWorkspace /></ErrorBoundary></div>
          <div className={`h-full ${activeWorkspace !== 'settings' ? 'hidden' : 'animate-fadeIn'}`}><ErrorBoundary><SettingsWorkspace /></ErrorBoundary></div>
        </div>
      </main>
    </div>
  )
}
