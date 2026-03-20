import { useState } from 'react'
import { useSettings } from '../../hooks/useSettings'
import { AI_PROVIDERS } from '../../services/ai'
import { defaultSettings } from '../../services/settings'

const MODEL_META: Record<string, { description: string; tags: string[]; icon: string }> = {
  'gpt-4.1': {
    description: 'Most capable OpenAI model with best-in-class coding and instruction following',
    tags: ['Most Capable', 'Multilingual'],
    icon: 'bolt',
  },
  'gpt-4.1-mini': {
    description: 'Balanced speed and intelligence for everyday translation tasks',
    tags: ['Balanced', 'Fast'],
    icon: 'speed',
  },
  'gpt-4.1-nano': {
    description: 'Ultra-fast and cost-efficient for simple translations',
    tags: ['Fastest', 'Lightweight'],
    icon: 'flash_on',
  },
  'claude-opus-4-6': {
    description: 'Most powerful Claude model with exceptional reasoning and nuance',
    tags: ['Most Powerful', 'Nuanced'],
    icon: 'neurology',
  },
  'claude-sonnet-4-6': {
    description: 'Best balance of intelligence and speed for professional use',
    tags: ['Balanced', 'Precise'],
    icon: 'psychology',
  },
  'claude-haiku-4-5-20251001': {
    description: 'Fast and efficient for quick translations at lower cost',
    tags: ['Fast', 'Efficient'],
    icon: 'flash_on',
  },
}

const DISPLAY_MODELS = AI_PROVIDERS.filter((p) => p.id in MODEL_META)

export default function SettingsWorkspace() {
  const { settings, updateSettings } = useSettings()

  const [selectedModel, setSelectedModel] = useState(settings.selectedModel)
  const [providerType, setProviderType] = useState(settings.providerType)
  const [openaiApiKey, setOpenaiApiKey] = useState(settings.openaiApiKey)
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState(settings.openaiBaseUrl)
  const [anthropicApiKey, setAnthropicApiKey] = useState(settings.anthropicApiKey)
  const [zeroRetention, setZeroRetention] = useState(settings.zeroRetention)
  const [localProcessing, setLocalProcessing] = useState(settings.localProcessing)

  const [showOpenaiKey, setShowOpenaiKey] = useState(false)
  const [showAnthropicKey, setShowAnthropicKey] = useState(false)

  function handleSelectModel(id: string, type: 'openai' | 'anthropic') {
    setSelectedModel(id)
    setProviderType(type)
  }

  function handleSave() {
    updateSettings({
      selectedModel,
      providerType,
      openaiApiKey,
      openaiBaseUrl,
      anthropicApiKey,
      zeroRetention,
      localProcessing,
    })
  }

  function handleReset() {
    setSelectedModel(defaultSettings.selectedModel)
    setProviderType(defaultSettings.providerType)
    setOpenaiApiKey(defaultSettings.openaiApiKey)
    setOpenaiBaseUrl(defaultSettings.openaiBaseUrl)
    setAnthropicApiKey(defaultSettings.anthropicApiKey)
    setZeroRetention(defaultSettings.zeroRetention)
    setLocalProcessing(defaultSettings.localProcessing)
    updateSettings(defaultSettings)
  }

  const hasOpenaiKey = openaiApiKey.length > 0
  const hasAnthropicKey = anthropicApiKey.length > 0
  const connectionOk =
    (providerType === 'openai' && hasOpenaiKey) ||
    (providerType === 'anthropic' && hasAnthropicKey)

  return (
    <div className="h-full overflow-y-auto px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-headline font-extrabold tracking-tight text-on-surface">
          Workspace Settings
        </h1>
        <p className="text-on-surface-variant/60 mt-2 text-sm font-label">
          Configure your AI models, API keys, and privacy preferences
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* ───── Left Column (col-span-8) ───── */}
        <div className="col-span-8 flex flex-col gap-6">
          {/* AI Engine Panel */}
          <div className="bg-surface-container-low rounded-[24px] border border-outline-variant/15 p-6">
            <div className="flex items-center gap-3 mb-5">
              <span className="material-symbols-outlined text-primary-fixed-dim text-2xl">
                psychology
              </span>
              <div>
                <h2 className="text-lg font-headline font-bold text-on-surface">AI Engine</h2>
                <p className="text-xs text-on-surface-variant/50">
                  Select the model that powers your translations
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {DISPLAY_MODELS.map((provider) => {
                const meta = MODEL_META[provider.id]
                const isSelected = selectedModel === provider.id
                return (
                  <button
                    key={provider.id}
                    onClick={() => handleSelectModel(provider.id, provider.type)}
                    className={`relative text-left p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-primary-fixed-dim bg-primary-fixed-dim/8 shadow-[0_0_24px_rgba(174,198,255,0.08)]'
                        : 'border-outline-variant/15 bg-surface-container hover:border-outline-variant/30 hover:bg-surface-container-high/50'
                    }`}
                  >
                    {/* Checkmark */}
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary-fixed-dim flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-primary text-sm">
                          check
                        </span>
                      </div>
                    )}

                    {/* Provider badge */}
                    <span
                      className={`inline-block text-[10px] uppercase tracking-widest font-bold mb-2 ${
                        provider.type === 'openai'
                          ? 'text-secondary-fixed-dim'
                          : 'text-tertiary-fixed-dim'
                      }`}
                    >
                      {provider.type === 'openai' ? 'OpenAI' : 'Anthropic'}
                    </span>

                    <h3 className="text-base font-headline font-bold text-on-surface mb-1">
                      {provider.name}
                    </h3>
                    <p className="text-xs text-on-surface-variant/60 mb-3 leading-relaxed">
                      {meta.description}
                    </p>

                    {/* Tags */}
                    <div className="flex gap-2">
                      {meta.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                            isSelected
                              ? 'bg-primary-fixed-dim/15 text-primary-fixed-dim'
                              : 'bg-surface-container-highest/40 text-on-surface-variant/60'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                )
              })}
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
                    API Configuration
                  </h2>
                  <p className="text-xs text-on-surface-variant/50">
                    Manage your API keys and endpoints
                  </p>
                </div>
              </div>

              {/* Connection status */}
              <div
                className={`flex items-center gap-2 text-xs font-label font-semibold px-3 py-1.5 rounded-full ${
                  connectionOk
                    ? 'bg-[#00c853]/10 text-[#00c853]'
                    : 'bg-error/10 text-error'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    connectionOk ? 'bg-[#00c853]' : 'bg-error'
                  }`}
                />
                {connectionOk ? 'Connected' : 'Not Connected'}
              </div>
            </div>

            <div className="space-y-5">
              {providerType === 'openai' ? (
                <>
                  {/* OpenAI API Key */}
                  <div>
                    <label className="block text-xs font-label font-semibold text-on-surface-variant mb-2 tracking-wide">
                      OpenAI API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showOpenaiKey ? 'text' : 'password'}
                        value={openaiApiKey}
                        onChange={(e) => setOpenaiApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full bg-surface-container rounded-xl border border-outline-variant/15 px-4 py-3 pr-12 text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none focus:border-primary-fixed-dim/50 transition-colors"
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

                  {/* OpenAI Base URL */}
                  <div>
                    <label className="block text-xs font-label font-semibold text-on-surface-variant mb-2 tracking-wide">
                      Base URL
                      <span className="text-on-surface-variant/30 ml-2 font-normal">
                        (change for compatible APIs like Azure, Ollama, etc.)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={openaiBaseUrl}
                      onChange={(e) => setOpenaiBaseUrl(e.target.value)}
                      placeholder="https://api.openai.com/v1"
                      className="w-full bg-surface-container rounded-xl border border-outline-variant/15 px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none focus:border-primary-fixed-dim/50 transition-colors"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Anthropic API Key */}
                  <div>
                    <label className="block text-xs font-label font-semibold text-on-surface-variant mb-2 tracking-wide">
                      Anthropic API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showAnthropicKey ? 'text' : 'password'}
                        value={anthropicApiKey}
                        onChange={(e) => setAnthropicApiKey(e.target.value)}
                        placeholder="sk-ant-..."
                        className="w-full bg-surface-container rounded-xl border border-outline-variant/15 px-4 py-3 pr-12 text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none focus:border-primary-fixed-dim/50 transition-colors"
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
                </>
              )}
            </div>
          </div>
        </div>

        {/* ───── Right Column (col-span-4) ───── */}
        <div className="col-span-4 flex flex-col gap-6">
          {/* Privacy Toggles */}
          <div className="bg-surface-container-low rounded-[24px] border border-outline-variant/15 p-6">
            <div className="flex items-center gap-3 mb-5">
              <span className="material-symbols-outlined text-primary-fixed-dim text-2xl">
                shield
              </span>
              <div>
                <h2 className="text-lg font-headline font-bold text-on-surface">Privacy</h2>
                <p className="text-xs text-on-surface-variant/50">Control your data handling</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Zero-Retention Mode */}
              <div className="flex items-center justify-between p-4 bg-surface-container rounded-xl border border-outline-variant/10">
                <div className="pr-4">
                  <h3 className="text-sm font-label font-bold text-on-surface">
                    Zero-Retention Mode
                  </h3>
                  <p className="text-[11px] text-on-surface-variant/50 mt-0.5 leading-relaxed">
                    API providers won't store your data
                  </p>
                </div>
                <button
                  onClick={() => setZeroRetention(!zeroRetention)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                    zeroRetention ? 'bg-primary-fixed-dim' : 'bg-surface-container-highest'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                      zeroRetention ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Local Edge Processing */}
              <div className="flex items-center justify-between p-4 bg-surface-container rounded-xl border border-outline-variant/10">
                <div className="pr-4">
                  <h3 className="text-sm font-label font-bold text-on-surface">
                    Local Edge Processing
                  </h3>
                  <p className="text-[11px] text-on-surface-variant/50 mt-0.5 leading-relaxed">
                    Process sensitive content on-device
                  </p>
                </div>
                <button
                  onClick={() => setLocalProcessing(!localProcessing)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                    localProcessing ? 'bg-primary-fixed-dim' : 'bg-surface-container-highest'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                      localProcessing ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* API Usage Card */}
          <div className="liquid-glass rounded-[24px] border border-outline-variant/15 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-secondary-fixed-dim text-2xl">
                bar_chart
              </span>
              <h2 className="text-lg font-headline font-bold text-on-surface">API Usage</h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-label mb-1.5">
                  <span className="text-on-surface-variant/60">Requests today</span>
                  <span className="text-on-surface font-bold">0 / 1,000</span>
                </div>
                <div className="h-1.5 bg-surface-container-highest/50 rounded-full overflow-hidden">
                  <div className="h-full w-0 bg-primary-fixed-dim rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-label mb-1.5">
                  <span className="text-on-surface-variant/60">Tokens used</span>
                  <span className="text-on-surface font-bold">0</span>
                </div>
                <div className="h-1.5 bg-surface-container-highest/50 rounded-full overflow-hidden">
                  <div className="h-full w-0 bg-secondary-fixed-dim rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Help Card */}
          <div className="bg-surface-container-low rounded-[24px] border border-outline-variant/15 p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-tertiary-fixed-dim text-2xl">
                help
              </span>
              <h2 className="text-lg font-headline font-bold text-on-surface">Need Help?</h2>
            </div>
            <p className="text-xs text-on-surface-variant/50 leading-relaxed mb-4">
              Check our documentation for guides on setting up API keys, choosing the right model,
              and optimizing your translation workflow.
            </p>
            <button className="w-full text-sm font-label font-semibold text-primary-fixed-dim bg-primary-fixed-dim/8 hover:bg-primary-fixed-dim/15 rounded-xl py-2.5 transition-colors">
              View Documentation
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 mt-8 pb-4">
        <button
          onClick={handleReset}
          className="px-6 py-2.5 text-sm font-label font-semibold text-on-surface-variant rounded-xl border border-outline-variant/15 hover:bg-surface-container-high/50 transition-colors"
        >
          Reset to Default
        </button>
        <button
          onClick={handleSave}
          className="liquid-gradient px-8 py-2.5 text-sm font-label font-bold text-white rounded-xl shadow-lg shadow-primary-fixed-dim/20 hover:shadow-primary-fixed-dim/30 transition-all active:scale-[0.98]"
        >
          Save Changes
        </button>
      </div>
    </div>
  )
}
