import type { WorkspaceId } from '../../App'
import { useTranslation } from '../../hooks/useTranslation'
import type { TranslationKey } from '../../i18n'

const navItems: { id: WorkspaceId; icon: string; labelKey: TranslationKey }[] = [
  { id: 'translate', icon: 'translate', labelKey: 'nav.translate' },
  { id: 'proofread', icon: 'spellcheck', labelKey: 'nav.proofread' },
  { id: 'dictionary', icon: 'menu_book', labelKey: 'nav.dictionary' },
  { id: 'documents', icon: 'description', labelKey: 'nav.documents' },
]

interface SidebarProps {
  active: WorkspaceId
  onNavigate: (id: WorkspaceId) => void
}

export default function Sidebar({ active, onNavigate }: SidebarProps) {
  const t = useTranslation()

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 z-50 bg-surface border-r border-outline-variant/15 flex flex-col py-8 justify-between font-label">
      <div>
        {/* Brand */}
        <div className="px-6 mb-10 pt-4">
          <h1 className="font-black text-primary-fixed-dim tracking-tighter text-2xl" style={{ textShadow: '0 0 40px rgba(174,198,255,0.3), 0 0 80px rgba(174,198,255,0.1)' }}>{t('app.name')}</h1>
          <p className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant/70 mt-1">{t('app.tagline')}</p>
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
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low border-l-4 border-transparent'
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={active === item.id ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="font-medium text-sm tracking-wide">{t(item.labelKey)}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom */}
      <div className="px-6">
        <button
          onClick={() => onNavigate('settings')}
          className={`w-full py-3 px-2 flex items-center gap-3 transition-colors duration-200 cursor-pointer rounded-lg ${
            active === 'settings'
              ? 'text-primary-fixed-dim bg-primary-fixed-dim/10'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="font-medium text-sm tracking-wide">{t('nav.settings')}</span>
        </button>

      </div>
    </aside>
  )
}
