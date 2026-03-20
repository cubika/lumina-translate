import { useState } from 'react'
import { useSettings } from '../../hooks/useSettings'
import { AI_PROVIDERS } from '../../services/ai'
import { defaultSettings } from '../../services/settings'

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

      {/* "Latest" badge for the first model in each group */}
      {((type === 'openai' && id === openaiModels[0].id) ||
        (type === 'anthropic' && id === anthropicModels[0].id)) && (
        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary-fixed-dim/15 text-secondary-fixed-dim">
          Latest
        </span>
      )}
    </button>
  )
}

export default function SettingsWorkspace() {
  const { settings, updateSettings } = useSettings()

  const [selectedModel, setSelectedModel] = useState(settings.selectedModel)
  const [providerType, setProviderType] = useState(settings.providerType)
  const [openaiApiKey, setOpenaiApiKey] = useState(settings.openaiApiKey)
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState(settings.openaiBaseUrl)
  const [anthropicApiKey, setAnthropicApiKey] = useState(settings.anthropicApiKey)

  const [showOpenaiKey, setShowOpenaiKey] = useState(false)
  const [showAnthropicKey, setShowAnthropicKey] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

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
    })
    setSaveMessage('Settings saved successfully!')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  function handleReset() {
    setSelectedModel(defaultSettings.selectedModel)
    setProviderType(defaultSettings.providerType)
    setOpenaiApiKey(defaultSettings.openaiApiKey)
    setOpenaiBaseUrl(defaultSettings.openaiBaseUrl)
    setAnthropicApiKey(defaultSettings.anthropicApiKey)
    updateSettings(defaultSettings)
  }

  const hasOpenaiKey = openaiApiKey.length > 0
  const hasAnthropicKey = anthropicApiKey.length > 0
  const connectionOk =
    (providerType === 'openai' && hasOpenaiKey) ||
    (providerType === 'anthropic' && hasAnthropicKey)

  return (
    <div className="h-full overflow-y-auto px-8 py-8">
      {/* Save feedback toast */}
      {saveMessage && (
        <div className="fixed top-14 right-8 z-50 bg-green-500/15 border border-green-500/30 text-green-400 px-5 py-3 rounded-xl text-sm font-label font-semibold flex items-center gap-2 shadow-lg animate-[fadeIn_0.2s_ease-out]">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          {saveMessage}
        </div>
      )}

      {/* Bento Grid */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-6">
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
                  <div>
                    <label className="block text-xs font-label font-semibold text-on-surface-variant mb-2 tracking-wide">
                      Base URL
                      <span className="text-on-surface-variant/30 ml-2 font-normal">
                        (change for Azure, Ollama, etc.)
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
              )}
            </div>
          </div>

          {/* AI Engine Panel — stacked sections with flex-wrap grids */}
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
