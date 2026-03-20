import type { WorkspaceId } from '../../App'

const workspaceLabels: Record<WorkspaceId, string> = {
  translate: 'Workspace',
  proofread: 'Proofread Workspace',
  dictionary: 'Dictionary Workspace',
  documents: 'Document Hub',
  settings: 'Workspace Settings',
}

interface TopBarProps {
  workspace: WorkspaceId
}

export default function TopBar({ workspace }: TopBarProps) {
  return (
    <header className="bg-surface-container-low/40 backdrop-blur-3xl shadow-[0px_24px_48px_rgba(0,0,0,0.4)] no-drag">
      <div className="flex justify-between items-center px-8 h-16 w-full">
        <div className="flex items-center gap-8">
          <span className="font-headline font-semibold tracking-tight text-lg text-primary-fixed-dim">
            {workspaceLabels[workspace]}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-surface-container-low px-4 py-1.5 rounded-full border border-outline-variant/10">
            <span className="material-symbols-outlined text-on-surface-variant text-lg mr-2">search</span>
            <input
              className="bg-transparent border-none outline-none text-sm text-on-surface placeholder:text-on-surface-variant/50 w-48"
              placeholder="Search..."
              type="text"
            />
          </div>
        </div>
      </div>
      <div className="bg-gradient-to-b from-outline-variant/15 to-transparent h-[1px] w-full" />
    </header>
  )
}
