import { useState } from 'react'
import { useSettings } from '../../hooks/useSettings'
import { useTranslation } from '../../hooks/useTranslation'
import { AI_PROVIDERS, testConnection } from '../../services/ai'
import { defaultSettings, LANGUAGES } from '../../services/settings'
import { themeMetas, applyTheme, type ThemeId } from '../../services/themes'

const openaiModels = AI_PROVIDERS.filter((p) => p.type === 'openai')
const anthropicModels = AI_PROVIDERS.filter((p) => p.type === 'anthropic')

function ModelRow({
  id,
  name,
  type,
  selectedModel,
  onSelect,
}: {
  id: string
  name: string
  type: 'openai' | 'anthropic'
  selectedModel: string
  onSelect: (id: string, type: 'openai' | 'anthropic') => void
}) {
  const isSelected = selectedModel === id
  return (
    <button
      onClick={() => onSelect(id, type)}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 cursor-pointer text-left ${
        isSelected
          ? 'bg-primary-fixed-dim/10 border border-primary-fixed-dim/40'
          : 'border border-transparent hover:bg-surface-container-high/50'
      }`}
    >
      {/* Radio indicator */}
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          isSelected ? 'border-primary-fixed-dim' : 'border-outline-variant/40'
        }`}
      >
        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary-fixed-dim" />}
      </div>

      <span
        className={`text-sm font-headline font-semibold flex-1 ${
          isSelected ? 'text-primary-fixed-dim' : 'text-on-surface'
        }`}
      >
        {name}
      </span>

    </button>
  )
}

export default function SettingsWorkspace() {
  const { settings, updateSettings } = useSettings()
  const t = useTranslation()

  const [theme, setTheme] = useState<ThemeId>(settings.theme)
  const [selectedModel, setSelectedModel] = useState(settings.selectedModel)
  const [providerType, setProviderType] = useState(settings.providerType)
  const [openaiApiKey, setOpenaiApiKey] = useState(settings.openaiApiKey)
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState(settings.openaiBaseUrl)
  const [anthropicApiKey, setAnthropicApiKey] = useState(settings.anthropicApiKey)
  const [targetLang, setTargetLang] = useState(settings.targetLang)
  const [translationTone, setTranslationTone] = useState(settings.translationTone)
  const [simplicity, setSimplicity] = useState(settings.simplicity)
  const [proofreadMode, setProofreadMode] = useState(settings.proofreadMode)

  const [showOpenaiKey, setShowOpenaiKey] = useState(false)
  const [showAnthropicKey, setShowAnthropicKey] = useState(false)
  const [showSaveToast, setShowSaveToast] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'untested' | 'testing' | 'ok' | 'failed'>('untested')
  const [connectionError, setConnectionError] = useState('')

  function handleSelectModel(id: string, type: 'openai' | 'anthropic') {
    setSelectedModel(id)
    setProviderType(type)
  }

  async function handleSave() {
    // Check if API-related fields changed (only test connection when they do)
    const apiChanged =
      selectedModel !== settings.selectedModel ||
      providerType !== settings.providerType ||
      openaiApiKey !== settings.openaiApiKey ||
      openaiBaseUrl !== settings.openaiBaseUrl ||
      anthropicApiKey !== settings.anthropicApiKey

    updateSettings({
      theme,
      selectedModel,
      providerType,
      openaiApiKey,
      openaiBaseUrl,
      anthropicApiKey,
      targetLang,
      translationTone,
      simplicity,
      proofreadMode,
    })
    setShowSaveToast(true)
    setTimeout(() => setShowSaveToast(false), 3000)

    if (!apiChanged) return

    const hasKey =
      (providerType === 'openai' && openaiApiKey.length > 0) ||
      (providerType === 'anthropic' && anthropicApiKey.length > 0)
    if (!hasKey) {
      setConnectionStatus('untested')
      return
    }
    setConnectionStatus('testing')
    setConnectionError('')
    const result = await testConnection(selectedModel, providerType)
    setConnectionStatus(result.ok ? 'ok' : 'failed')
    if (!result.ok) setConnectionError(result.error ?? 'Connection failed')
  }

  function handleReset() {
    setTheme(defaultSettings.theme)
    applyTheme(defaultSettings.theme)
    setSelectedModel(defaultSettings.selectedModel)
    setProviderType(defaultSettings.providerType)
    setOpenaiApiKey(defaultSettings.openaiApiKey)
    setOpenaiBaseUrl(defaultSettings.openaiBaseUrl)
    setAnthropicApiKey(defaultSettings.anthropicApiKey)
    setTargetLang(defaultSettings.targetLang)
    setTranslationTone(defaultSettings.translationTone)
    setSimplicity(defaultSettings.simplicity)
    setProofreadMode(defaultSettings.proofreadMode)
    setConnectionStatus('untested')
    updateSettings(defaultSettings)
  }


  return (
    <div className="h-full overflow-y-auto px-8 py-8">
      {/* Save feedback toast */}
      {showSaveToast && (
        <div className="fixed top-14 right-8 z-50 bg-green-500/15 border border-green-500/30 text-green-400 px-5 py-3 rounded-xl text-sm font-label font-semibold flex items-center gap-2 shadow-lg animate-[fadeIn_0.2s_ease-out]">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          {t('settings.saved')}
        </div>
      )}

      {/* Bento Grid */}
      <div className="flex flex-col gap-6 pb-20">
        {/* Section: Appearance */}
        <h3 className="text-xs font-label font-bold uppercase tracking-widest text-on-surface-variant/60 px-1">
          Appearance
        </h3>
        <div className="bg-surface-container-low rounded-[24px] border border-outline-variant/15 p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="material-symbols-outlined text-primary-fixed-dim text-2xl">palette</span>
            <div>
              <h2 className="text-lg font-headline font-bold text-on-surface">Theme</h2>
              <p className="text-xs text-on-surface-variant/50">Choose your color scheme</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {themeMetas.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); applyTheme(t.id) }}
                className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all duration-150 cursor-pointer ${
                  theme === t.id
                    ? 'bg-primary-fixed-dim/10 border-2 border-primary-fixed-dim/50'
                    : 'border-2 border-transparent hover:bg-surface-container-high/50'
                }`}
              >
                {/* Color swatches */}
                <div className="flex gap-1.5">
                  {t.swatches.map((color, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border border-outline-variant/20"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="text-center">
                  <span className={`text-xs font-label font-bold block ${
                    theme === t.id ? 'text-primary-fixed-dim' : 'text-on-surface'
                  }`}>
                    {t.name}
                  </span>
                  <span className="text-[10px] text-on-surface-variant/50 font-label uppercase tracking-wider">
                    {t.type}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Section: Preferences */}
        <h3 className="text-xs font-label font-bold uppercase tracking-widest text-on-surface-variant/60 px-1 mt-4">
          Preferences
        </h3>
        <div className="flex flex-col gap-6">
          {/* Native Language */}
          <div className="bg-surface-container-low rounded-[24px] border border-outline-variant/15 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-primary-fixed-dim text-2xl">
                language
              </span>
              <div>
                <h2 className="text-lg font-headline font-bold text-on-surface">{t('settings.nativeLang')}</h2>
                <p className="text-xs text-on-surface-variant/50">
                  {t('settings.nativeLangDesc')}
                </p>
              </div>
            </div>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full bg-surface-container rounded-xl border border-outline-variant/15 px-4 py-3 text-sm text-on-surface outline-none focus:border-primary-fixed-dim/50 transition-colors cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Translation Style */}
          <div className="bg-surface-container-low rounded-[24px] border border-outline-variant/15 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-primary-fixed-dim text-2xl">
                tune
              </span>
              <div>
                <h2 className="text-lg font-headline font-bold text-on-surface">{t('settings.translationStyle')}</h2>
                <p className="text-xs text-on-surface-variant/50">
                  {t('settings.translationStyleDesc')}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Tone */}
              <div>
                <label className="block text-xs font-label font-semibold text-on-surface-variant mb-2 tracking-wide">
                  {t('settings.tone')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {([
                    ['standard', t('settings.toneStandard')],
                    ['formal', t('settings.toneFormal')],
                    ['casual', t('settings.toneCasual')],
                    ['academic', t('settings.toneAcademic')],
                    ['creative', t('settings.toneCreative')],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setTranslationTone(value)}
                      className={`px-4 py-2 rounded-xl text-sm font-label font-semibold transition-all duration-150 cursor-pointer ${
                        translationTone === value
                          ? 'bg-primary-fixed-dim/10 border border-primary-fixed-dim/40 text-primary-fixed-dim'
                          : 'border border-transparent hover:bg-surface-container-high/50 text-on-surface'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Simplicity */}
              <div>
                <label className="block text-xs font-label font-semibold text-on-surface-variant mb-2 tracking-wide">
                  {t('settings.simplicity')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {([
                    ['default', t('settings.simplicityDefault')],
                    ['simplified', t('settings.simplicitySimplified')],
                    ['advanced', t('settings.simplicityAdvanced')],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setSimplicity(value)}
                      className={`px-4 py-2 rounded-xl text-sm font-label font-semibold transition-all duration-150 cursor-pointer ${
                        simplicity === value
                          ? 'bg-primary-fixed-dim/10 border border-primary-fixed-dim/40 text-primary-fixed-dim'
                          : 'border border-transparent hover:bg-surface-container-high/50 text-on-surface'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Proofread Mode */}
          <div className="bg-surface-container-low rounded-[24px] border border-outline-variant/15 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-primary-fixed-dim text-2xl">
                spellcheck
              </span>
              <div>
                <h2 className="text-lg font-headline font-bold text-on-surface">{t('settings.proofreadMode')}</h2>
                <p className="text-xs text-on-surface-variant/50">
                  {t('settings.proofreadModeDesc')}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {([
                ['grammar', t('settings.proofreadGrammar'), t('settings.proofreadGrammarDesc')],
                ['readability', t('settings.proofreadReadability'), t('settings.proofreadReadabilityDesc')],
                ['style', t('settings.proofreadStyle'), t('settings.proofreadStyleDesc')],
              ] as const).map(([value, label, desc]) => (
                <button
                  key={value}
                  onClick={() => setProofreadMode(value)}
                  className={`flex items-start gap-3 px-4 py-3 rounded-xl transition-all duration-150 cursor-pointer text-left ${
                    proofreadMode === value
                      ? 'bg-primary-fixed-dim/10 border border-primary-fixed-dim/40'
                      : 'border border-transparent hover:bg-surface-container-high/50'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                      proofreadMode === value ? 'border-primary-fixed-dim' : 'border-outline-variant/40'
                    }`}
                  >
                    {proofreadMode === value && <div className="w-2.5 h-2.5 rounded-full bg-primary-fixed-dim" />}
                  </div>
                  <div>
                    <span className={`text-sm font-headline font-semibold ${
                      proofreadMode === value ? 'text-primary-fixed-dim' : 'text-on-surface'
                    }`}>
                      {label}
                    </span>
                    <p className="text-xs text-on-surface-variant/50 mt-0.5">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Section: AI Engine */}
        <h3 className="text-xs font-label font-bold uppercase tracking-widest text-on-surface-variant/60 px-1 mt-4">
          AI Engine
        </h3>
        <div className="flex flex-col gap-6">
          {/* AI Engine Panel — stacked sections with flex-wrap grids */}
          <div className="bg-surface-container-low rounded-[24px] border border-outline-variant/15 p-6">
            <div className="flex items-center gap-3 mb-5">
              <span className="material-symbols-outlined text-primary-fixed-dim text-2xl">
                psychology
              </span>
              <div>
                <h2 className="text-lg font-headline font-bold text-on-surface">{t('settings.aiEngine')}</h2>
                <p className="text-xs text-on-surface-variant/50">
                  {t('settings.aiEngineDesc')}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {/* OpenAI group */}
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-secondary-fixed-dim">
                    OpenAI
                  </span>
                  <div className="flex-1 h-px bg-outline-variant/15" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {openaiModels.map((m) => (
                    <ModelRow key={m.id} {...m} selectedModel={selectedModel} onSelect={handleSelectModel} />
                  ))}
                </div>
              </div>

              {/* Anthropic group */}
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-tertiary-fixed-dim">
                    Anthropic
                  </span>
                  <div className="flex-1 h-px bg-outline-variant/15" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {anthropicModels.map((m) => (
                    <ModelRow key={m.id} {...m} selectedModel={selectedModel} onSelect={handleSelectModel} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* API Configuration Panel */}
          <div className="bg-surface-container-low rounded-[24px] border border-outline-variant/15 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary-fixed-dim text-2xl">
                  key
                </span>
                <div>
                  <h2 className="text-lg font-headline font-bold text-on-surface">
                    {t('settings.apiConfig')}
                  </h2>
                  <p className="text-xs text-on-surface-variant/50">
                    {t('settings.apiConfigDesc')}
                  </p>
                </div>
              </div>

              {/* Connection status */}
              {connectionStatus === 'testing' ? (
                <div className="flex items-center gap-2 text-xs font-label font-semibold px-3 py-1.5 rounded-full bg-secondary-fixed-dim/10 text-secondary-fixed-dim">
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  {t('settings.testing')}
                </div>
              ) : connectionStatus === 'ok' ? (
                <div className="flex items-center gap-2 text-xs font-label font-semibold px-3 py-1.5 rounded-full bg-[#00c853]/10 text-[#00c853]">
                  <span className="w-2 h-2 rounded-full bg-[#00c853]" />
                  {t('settings.connected')}
                </div>
              ) : connectionStatus === 'failed' ? (
                <div className="flex items-center gap-2 text-xs font-label font-semibold px-3 py-1.5 rounded-full bg-error/10 text-error" title={connectionError}>
                  <span className="w-2 h-2 rounded-full bg-error" />
                  {t('settings.failed')}
                </div>
              ) : null}
            </div>

            <div className="space-y-5">
              {providerType === 'openai' ? (
                <>
                  <div>
                    <label className="block text-xs font-label font-semibold text-on-surface-variant mb-2 tracking-wide">
                      {t('settings.openaiKey')}
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-primary-fixed-dim/60 hover:text-primary-fixed-dim font-normal transition-colors"
                      >
                        {t('settings.getKey')} ↗
                      </a>
                    </label>
                    <div className="relative">
                      <input
                        type={showOpenaiKey ? 'text' : 'password'}
                        value={openaiApiKey}
                        onChange={(e) => setOpenaiApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full bg-surface-container rounded-xl border border-outline-variant/15 px-4 py-3 pr-12 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:border-primary-fixed-dim/50 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {showOpenaiKey ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-label font-semibold text-on-surface-variant mb-2 tracking-wide">
                      {t('settings.baseUrl')}
                      <span className="text-on-surface-variant/30 ml-2 font-normal">
                        {t('settings.baseUrlHint')}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={openaiBaseUrl}
                      onChange={(e) => setOpenaiBaseUrl(e.target.value)}
                      placeholder="https://api.openai.com/v1"
                      className="w-full bg-surface-container rounded-xl border border-outline-variant/15 px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:border-primary-fixed-dim/50 transition-colors"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-label font-semibold text-on-surface-variant mb-2 tracking-wide">
                    {t('settings.anthropicKey')}
                    <a
                      href="https://console.anthropic.com/settings/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-primary-fixed-dim/60 hover:text-primary-fixed-dim font-normal transition-colors"
                    >
                      {t('settings.getKey')} ↗
                    </a>
                  </label>
                  <div className="relative">
                    <input
                      type={showAnthropicKey ? 'text' : 'password'}
                      value={anthropicApiKey}
                      onChange={(e) => setAnthropicApiKey(e.target.value)}
                      placeholder="sk-ant-..."
                      className="w-full bg-surface-container rounded-xl border border-outline-variant/15 px-4 py-3 pr-12 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:border-primary-fixed-dim/50 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showAnthropicKey ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 flex justify-end gap-3 py-4 -mx-8 px-8 bg-surface border-t border-outline-variant/10 z-10">
        <button
          onClick={handleReset}
          className="px-6 py-2.5 text-sm font-label font-semibold text-on-surface-variant rounded-xl border border-outline-variant/15 hover:bg-surface-container-high/50 transition-colors"
        >
          {t('settings.reset')}
        </button>
        <button
          onClick={handleSave}
          className="liquid-gradient px-8 py-2.5 text-sm font-label font-bold text-white rounded-xl shadow-lg shadow-primary-fixed-dim/20 hover:shadow-primary-fixed-dim/30 transition-all active:scale-[0.98]"
        >
          {t('settings.save')}
        </button>
      </div>
    </div>
  )
}
