import type { WorkspaceId } from '../../App'
import { useTranslation } from '../../hooks/useTranslation'
import type { TranslationKey } from '../../i18n'

const workspaceLabelKeys: Record<WorkspaceId, TranslationKey> = {
  translate: 'nav.translate',
  proofread: 'nav.proofread',
  dictionary: 'nav.dictionary',
  documents: 'nav.documents',
  settings: 'nav.settings',
}

interface TopBarProps {
  workspace: WorkspaceId
}

export default function TopBar({ workspace }: TopBarProps) {
  const t = useTranslation()

  return (
    <header className="bg-surface/80 backdrop-blur-3xl no-drag">
      <div className="flex justify-between items-center px-8 h-16 w-full">
        <div className="flex items-center gap-8">
          <span className="font-headline font-semibold tracking-tight text-lg text-primary-fixed-dim">
            {t(workspaceLabelKeys[workspace])}
          </span>
        </div>
      </div>
      <div className="bg-gradient-to-b from-outline-variant/15 to-transparent h-[1px] w-full" />
    </header>
  )
}
