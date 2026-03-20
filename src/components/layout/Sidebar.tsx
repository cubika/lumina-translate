import type { WorkspaceId } from '../../App'

interface SidebarProps {
  active: WorkspaceId
  onNavigate: (id: WorkspaceId) => void
}

const navItems: { id: WorkspaceId; icon: string; label: string }[] = [
  { id: 'translate', icon: 'translate', label: 'Translate' },
  { id: 'proofread', icon: 'spellcheck', label: 'Proofread' },
  { id: 'dictionary', icon: 'menu_book', label: 'Dictionary' },
  { id: 'documents', icon: 'description', label: 'Documents' },
]

export default function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="h-screen w-64 fixed left-0 top-0 z-50 bg-[#111318] border-r border-[#3b494c]/15 flex flex-col py-8 justify-between font-label">
      <div>
        {/* Brand */}
        <div className="px-6 mb-10 pt-4">
          <h1 className="font-black text-primary-fixed-dim tracking-tighter text-2xl">Lumina</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface/40 mt-1">Translation Studio</p>
        </div>

        {/* Nav */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full py-3 px-6 flex items-center gap-3 transition-all cursor-pointer text-left ${
                active === item.id
                  ? 'bg-gradient-to-r from-primary-fixed-dim/10 to-transparent text-primary-fixed-dim border-l-4 border-primary-fixed-dim'
                  : 'text-on-surface/40 hover:text-on-surface/80 hover:bg-surface-container-low border-l-4 border-transparent'
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={active === item.id ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="font-medium text-sm tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom */}
      <div className="px-4">
        <button
          onClick={() => onNavigate('settings')}
          className={`w-full py-3 px-2 flex items-center gap-3 transition-colors duration-200 cursor-pointer rounded-lg ${
            active === 'settings'
              ? 'text-primary-fixed-dim bg-primary-fixed-dim/10'
              : 'text-on-surface/40 hover:text-on-surface/80'
          }`}
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="font-medium text-sm tracking-wide">Settings</span>
        </button>

      </div>
    </aside>
  )
}
