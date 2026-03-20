import { useState } from 'react'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import TranslateWorkspace from './components/translate/TranslateWorkspace'
import ProofreadWorkspace from './components/proofread/ProofreadWorkspace'
import DictionaryWorkspace from './components/dictionary/DictionaryWorkspace'
import DocumentsWorkspace from './components/documents/DocumentsWorkspace'
import SettingsWorkspace from './components/settings/SettingsWorkspace'

export type WorkspaceId = 'translate' | 'proofread' | 'dictionary' | 'documents' | 'settings'

export default function App() {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>('translate')

  return (
    <div className="flex h-screen bg-surface text-on-surface overflow-hidden">
      {/* Titlebar drag region */}
      <div className="fixed top-0 left-0 right-0 h-9 drag-region z-[100]" />

      <Sidebar active={activeWorkspace} onNavigate={setActiveWorkspace} />

      <main className="flex-1 ml-64 flex flex-col h-screen pt-9">
        <TopBar workspace={activeWorkspace} />
        <div className="flex-1 overflow-hidden">
          {activeWorkspace === 'translate' && <TranslateWorkspace />}
          {activeWorkspace === 'proofread' && <ProofreadWorkspace />}
          {activeWorkspace === 'dictionary' && <DictionaryWorkspace />}
          {activeWorkspace === 'documents' && <DocumentsWorkspace />}
          {activeWorkspace === 'settings' && <SettingsWorkspace />}
        </div>
      </main>
    </div>
  )
}
