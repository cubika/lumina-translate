# Small Improvements Batch Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship 19 small-to-medium improvements that collectively level up Lumina Translate's polish, robustness, and UX.

**Architecture:** Purely incremental changes across existing files. No new dependencies except a CSS animation. Streaming (#27) is the largest item — uses Tauri event system to emit tokens progressively. Everything else is surgical edits.

**Tech Stack:** React, TypeScript, Tailwind CSS, Rust (Tauri v2), reqwest

**Verification:** `npx tsc --noEmit` after each task. No test suite exists.

---

### Task 1: Disable swap button during translation

Prevents state corruption when user swaps languages mid-translation.

**Files:**
- Modify: `src/components/translate/TranslateWorkspace.tsx:95-103`

**Step 1: Add disabled prop to swap button**

At line 96, add `disabled={isTranslating}` and the disabled styling class:

```tsx
<button
  onClick={handleSwapLanguages}
  disabled={isTranslating}
  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-highest/50 transition-all duration-200 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
  title={t('translate.swap')}
>
```

**Step 2: Verify**

Run: `npx tsc --noEmit`

---

### Task 2: Validate same source/target language

Show a warning instead of wasting an API call when source === target.

**Files:**
- Modify: `src/components/translate/TranslateWorkspace.tsx:29-51`
- Modify: `src/i18n/en.ts`

**Step 1: Add i18n key**

In `en.ts`, add after `'translate.chars'`:
```ts
'translate.sameLangWarning': 'Source and target languages are the same.',
```

Add same key in `zh.ts` and `ja.ts`.

**Step 2: Add validation in handleTranslate**

At the top of `handleTranslate` (line 30), after the trim check:

```tsx
const handleTranslate = useCallback(async () => {
  if (!sourceText.trim() || isTranslating) return
  if (sourceLang === targetLang) {
    setTranslatedText(sourceText)
    return
  }
  // ... rest unchanged
```

Also disable the translate button when same language. At line 206:

```tsx
disabled={!sourceText.trim() || isTranslating || sourceLang === targetLang}
```

**Step 3: Verify**

Run: `npx tsc --noEmit`

---

### Task 3: Add empty file check before document translation

Prevent uploading 0-byte files.

**Files:**
- Modify: `src/components/documents/DocumentsWorkspace.tsx:50-53`
- Modify: `src/i18n/en.ts`

**Step 1: Add i18n key**

In `en.ts`:
```ts
'documents.emptyFile': 'File is empty. Please select a file with content.',
```

**Step 2: Add validation in processFile**

After `const text = await file.text()` (line 53), add:

```tsx
if (!text.trim()) {
  // Don't process empty files — just ignore silently
  return
}
```

**Step 3: Verify**

Run: `npx tsc --noEmit`

---

### Task 4: Swap button rotate animation

Add a smooth rotate animation when the swap button is clicked.

**Files:**
- Modify: `src/components/translate/TranslateWorkspace.tsx:95-103`

**Step 1: Add rotation state and animation**

Add state:
```tsx
const [swapRotation, setSwapRotation] = useState(0)
```

Update `handleSwapLanguages`:
```tsx
const handleSwapLanguages = useCallback(() => {
  setSwapRotation(r => r + 180)
  setSourceLang(targetLang)
  setTargetLang(sourceLang)
  if (translatedText) {
    setSourceText(translatedText)
    setTranslatedText(sourceText)
  }
}, [sourceLang, targetLang, sourceText, translatedText])
```

Update the icon span inside the swap button:
```tsx
<span
  className="material-symbols-outlined text-on-surface-variant text-lg transition-transform duration-300"
  style={{ transform: `rotate(${swapRotation}deg)` }}
>
  swap_horiz
</span>
```

**Step 2: Verify**

Run: `npx tsc --noEmit`

---

### Task 5: Better empty state placeholder in translate output

Replace plain text with an icon + styled placeholder.

**Files:**
- Modify: `src/components/translate/TranslateWorkspace.tsx:191-194`

**Step 1: Replace empty state markup**

Replace the empty state block (lines 191-194):

```tsx
) : (
  <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30">
    <span className="material-symbols-outlined text-4xl">translate</span>
    <p className="text-on-surface-variant font-body text-sm">
      {t('translate.outputPlaceholder')}
    </p>
  </div>
)}
```

**Step 2: Verify**

Run: `npx tsc --noEmit`

---

### Task 6: Responsive grid for Dictionary examples

Change from fixed 2-column to responsive.

**Files:**
- Modify: `src/components/dictionary/DictionaryWorkspace.tsx:352`

**Step 1: Update grid class**

Change `grid grid-cols-2 gap-3` to:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
```

**Step 2: Verify**

Run: `npx tsc --noEmit`

---

### Task 7: Enhanced drag-and-drop visual feedback

Add a dashed border and pulsing glow when dragging files over the drop zone.

**Files:**
- Modify: `src/components/documents/DocumentsWorkspace.tsx:154-158`

**Step 1: Improve drag-over styling**

Replace the isDragOver className logic (lines 154-158):

```tsx
className={`glass-panel rounded-2xl border-2 border-dashed transition-all duration-300 relative overflow-hidden ${
  isDragOver
    ? 'border-primary-fixed-dim/60 shadow-[0_0_40px_rgba(174,198,255,0.15)] bg-primary-fixed-dim/5 scale-[1.01]'
    : 'border-outline-variant/10 border-solid hover:border-outline-variant/20'
}`}
```

**Step 2: Verify**

Run: `npx tsc --noEmit`

---

### Task 8: Add timeout to AI API calls in Rust backend

Prevent indefinite hangs when APIs are slow.

**Files:**
- Modify: `src-tauri/src/lib.rs:52-59` (call_openai)
- Modify: `src-tauri/src/lib.rs:91-99` (call_anthropic)

**Step 1: Add timeout to call_openai**

Replace the `client.post(...)...send().await` block (lines 52-59) with:

```rust
let resp = client
    .post(format!("{}/chat/completions", base))
    .header("Content-Type", "application/json")
    .header("Authorization", format!("Bearer {}", key))
    .timeout(std::time::Duration::from_secs(120))
    .json(&body)
    .send()
    .await
    .map_err(|e| {
        if e.is_timeout() {
            "Request timed out. Please try again or use a shorter text.".to_string()
        } else {
            format!("OpenAI request failed: {}", e)
        }
    })?;
```

**Step 2: Add timeout to call_anthropic**

Same pattern for lines 91-99:

```rust
let resp = client
    .post("https://api.anthropic.com/v1/messages")
    .header("Content-Type", "application/json")
    .header("x-api-key", key)
    .header("anthropic-version", "2023-06-01")
    .timeout(std::time::Duration::from_secs(120))
    .json(&body)
    .send()
    .await
    .map_err(|e| {
        if e.is_timeout() {
            "Request timed out. Please try again or use a shorter text.".to_string()
        } else {
            format!("Anthropic request failed: {}", e)
        }
    })?;
```

**Step 3: Verify**

Run: `cd src-tauri && cargo check`

---

### Task 9: Add max audio size check for TTS

Prevent memory exhaustion from unbounded audio accumulation.

**Files:**
- Modify: `src-tauri/src/lib.rs:211-228`

**Step 1: Add size limit constant and check**

Add constant near the top of `edge_tts` module (after line 139):
```rust
const MAX_AUDIO_BYTES: usize = 10 * 1024 * 1024; // 10 MB
```

In the audio collection loop (inside the `timeout` block, after `buf.extend_from_slice`), add:
```rust
Ok(Message::Binary(data)) => {
    if let Some(pos) = data.windows(12).position(|w| w == b"Path:audio\r\n") {
        buf.extend_from_slice(&data[pos + 12..]);
        if buf.len() > MAX_AUDIO_BYTES {
            break;
        }
    }
}
```

**Step 2: Verify**

Run: `cd src-tauri && cargo check`

---

### Task 10: Streaming translation output

The biggest change. Use Tauri's event system to stream tokens from the AI backend to the frontend.

**Files:**
- Modify: `src-tauri/src/lib.rs` — add streaming AI call command
- Modify: `src/services/ai.ts` — add streaming callAI variant
- Modify: `src/components/translate/TranslateWorkspace.tsx` — consume stream

#### Step 1: Add streaming command to Rust backend

In `lib.rs`, add a new streaming command. Add `use tauri::{AppHandle, Emitter};` at the top alongside existing imports.

Add this new command before `ai_call`:

```rust
#[tauri::command]
async fn ai_call_stream(
    app: AppHandle,
    client: State<'_, reqwest::Client>,
    req: AiCallRequest,
) -> Result<AiCallResponse, String> {
    let result = if req.provider == "anthropic" {
        stream_anthropic(&app, &client, &req).await
    } else {
        stream_openai(&app, &client, &req).await
    };

    Ok(match result {
        Ok(text) => AiCallResponse { ok: true, result: Some(text), error: None },
        Err(e) => AiCallResponse { ok: false, result: None, error: Some(e) },
    })
}
```

Add streaming functions for OpenAI:

```rust
async fn stream_openai(app: &AppHandle, client: &reqwest::Client, req: &AiCallRequest) -> Result<String, String> {
    let base = req.openai_base.as_deref().unwrap_or("https://api.openai.com/v1");
    let key = req.openai_key.as_deref()
        .filter(|k| !k.is_empty())
        .ok_or("OpenAI API key not configured. Please set it in Settings.")?;

    let mut messages: Vec<Message> = Vec::new();
    if let Some(sys) = &req.system {
        messages.push(Message { role: "system".into(), content: sys.clone() });
    }
    messages.extend(req.messages.clone());

    let body = serde_json::json!({
        "model": req.model,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": req.max_tokens.unwrap_or(4096),
        "stream": true,
    });

    let resp = client
        .post(format!("{}/chat/completions", base))
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", key))
        .timeout(std::time::Duration::from_secs(120))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("OpenAI request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status().as_u16();
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("OpenAI API error ({}): {}", status, text));
    }

    use futures_util::StreamExt;
    let mut stream = resp.bytes_stream();
    let mut full_text = String::new();
    let mut buffer = String::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Stream error: {}", e))?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        // Process complete SSE lines
        while let Some(line_end) = buffer.find('\n') {
            let line = buffer[..line_end].trim().to_string();
            buffer = buffer[line_end + 1..].to_string();

            if line.starts_with("data: ") {
                let data = &line[6..];
                if data == "[DONE]" { break; }
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(data) {
                    if let Some(content) = json["choices"][0]["delta"]["content"].as_str() {
                        full_text.push_str(content);
                        let _ = app.emit("ai-stream-chunk", content);
                    }
                }
            }
        }
    }

    Ok(full_text)
}
```

Add streaming for Anthropic:

```rust
async fn stream_anthropic(app: &AppHandle, client: &reqwest::Client, req: &AiCallRequest) -> Result<String, String> {
    let key = req.anthropic_key.as_deref()
        .filter(|k| !k.is_empty())
        .ok_or("Anthropic API key not configured. Please set it in Settings.")?;

    let messages: Vec<&Message> = req.messages.iter().filter(|m| m.role != "system").collect();

    let mut body = serde_json::json!({
        "model": req.model,
        "max_tokens": req.max_tokens.unwrap_or(4096),
        "messages": messages,
        "stream": true,
    });

    if let Some(sys) = &req.system {
        body["system"] = serde_json::Value::String(sys.clone());
    }

    let resp = client
        .post("https://api.anthropic.com/v1/messages")
        .header("Content-Type", "application/json")
        .header("x-api-key", key)
        .header("anthropic-version", "2023-06-01")
        .timeout(std::time::Duration::from_secs(120))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Anthropic request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status().as_u16();
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("Anthropic API error ({}): {}", status, text));
    }

    use futures_util::StreamExt;
    let mut stream = resp.bytes_stream();
    let mut full_text = String::new();
    let mut buffer = String::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Stream error: {}", e))?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        while let Some(line_end) = buffer.find('\n') {
            let line = buffer[..line_end].trim().to_string();
            buffer = buffer[line_end + 1..].to_string();

            if line.starts_with("data: ") {
                let data = &line[6..];
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(data) {
                    if json["type"] == "content_block_delta" {
                        if let Some(text) = json["delta"]["text"].as_str() {
                            full_text.push_str(text);
                            let _ = app.emit("ai-stream-chunk", text);
                        }
                    }
                }
            }
        }
    }

    Ok(full_text)
}
```

Register the new command in `run()`:
```rust
.invoke_handler(tauri::generate_handler![ai_call, ai_call_stream, speak])
```

#### Step 2: Add streaming support to frontend ai.ts

Add a new `callAIStream` function in `src/services/ai.ts`. Add import at top:

```ts
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
```

Add the streaming function after `callAI`:

```ts
async function callAIStream(
  messages: { role: string; content: string }[],
  model: string,
  providerType: 'openai' | 'anthropic',
  onChunk: (text: string) => void,
  system?: string,
  maxTokens?: number
): Promise<string> {
  const settings = loadSettings()
  const config = { openaiKey: settings.openaiApiKey, openaiBase: settings.openaiBaseUrl, anthropicKey: settings.anthropicApiKey }

  if (window.__TAURI_INTERNALS__) {
    const unlisten = await listen<string>('ai-stream-chunk', (event) => {
      onChunk(event.payload)
    })

    try {
      const resp = await invoke<{ ok: boolean; result?: string; error?: string }>('ai_call_stream', {
        req: {
          provider: providerType,
          model,
          messages,
          system,
          openaiKey: config.openaiKey,
          openaiBase: config.openaiBase,
          anthropicKey: config.anthropicKey,
          maxTokens: maxTokens || 4096,
        },
      })
      if (!resp.ok) throw new Error(resp.error)
      return resp.result!
    } finally {
      unlisten()
    }
  }

  // Browser fallback — no streaming, just use regular callAI
  return callAI(messages, model, providerType, system, maxTokens)
}
```

Add a new `translateStream` export:

```ts
export async function translateStream(
  req: TranslationRequest,
  onChunk: (text: string) => void
): Promise<string> {
  const systemMsg = `You are a master translator fluent in ${req.sourceLang} and ${req.targetLang}. Follow these three principles:

1. Faithful: Accurately convey the original meaning — no additions, omissions, or distortions
2. Expressive: Write naturally in ${req.targetLang} — the translation should read as if originally written in ${req.targetLang}, not as a word-for-word rendering. Use idiomatic expressions and natural sentence structures of ${req.targetLang}
3. Elegant: Match or elevate the literary quality — choose precise, refined wording appropriate to the register

Additional rules:
- Preserve formatting: line breaks, bullet points, markdown, tables, code blocks
- For technical terms with no standard translation, keep the original in parentheses
- For proper nouns (names, brands, places), keep as-is unless a widely accepted translation exists
- Output ONLY the translated text, no explanations or commentary`

  const messages = [{ role: 'user', content: req.text }]
  const estimatedTokens = Math.ceil(req.text.length / 3) * 2
  const maxTokens = Math.max(4096, estimatedTokens)

  return callAIStream(messages, req.model, req.providerType, onChunk, systemMsg, maxTokens)
}
```

#### Step 3: Update TranslateWorkspace to use streaming

In `TranslateWorkspace.tsx`, update the import:
```ts
import { translate, translateStream, speakText } from '../../services/ai'
```

Replace `handleTranslate` with:

```tsx
const handleTranslate = useCallback(async () => {
  if (!sourceText.trim() || isTranslating) return
  if (sourceLang === targetLang) {
    setTranslatedText(sourceText)
    return
  }

  setIsTranslating(true)
  setTranslatedText('')

  try {
    const settings = loadSettings()
    const result = await translateStream(
      {
        text: sourceText,
        sourceLang,
        targetLang,
        model: settings.selectedModel,
        providerType: settings.providerType,
      },
      (chunk) => {
        setTranslatedText(prev => prev + chunk)
      }
    )
    // Set final complete text (in case streaming missed anything)
    setTranslatedText(result)
  } catch (err) {
    setTranslatedText(
      err instanceof Error ? err.message : 'Translation failed. Please check your API settings.'
    )
  } finally {
    setIsTranslating(false)
  }
}, [sourceText, sourceLang, targetLang, isTranslating])
```

#### Step 4: Verify

Run: `cd src-tauri && cargo check` then `npx tsc --noEmit`

---

### Task 11: Loading skeleton placeholder

Show a pulsing skeleton instead of a spinner during translation.

**Files:**
- Modify: `src/components/translate/TranslateWorkspace.tsx:180-186`

**Step 1: Replace spinner with skeleton**

Replace the loading block (lines 180-186):

```tsx
{isTranslating && !translatedText ? (
  <div className="flex flex-col gap-3 animate-pulse">
    <div className="h-4 bg-surface-container-highest/30 rounded-lg w-full" />
    <div className="h-4 bg-surface-container-highest/30 rounded-lg w-11/12" />
    <div className="h-4 bg-surface-container-highest/30 rounded-lg w-4/5" />
    <div className="h-4 bg-surface-container-highest/30 rounded-lg w-9/12" />
    <div className="h-4 bg-surface-container-highest/30 rounded-lg w-full" />
    <div className="h-4 bg-surface-container-highest/30 rounded-lg w-3/4" />
  </div>
) : isTranslating && translatedText ? (
  <p className="text-on-surface font-body text-[15px] leading-relaxed whitespace-pre-wrap">
    {translatedText}
    <span className="inline-block w-0.5 h-4 bg-secondary-fixed-dim animate-pulse ml-0.5 align-text-bottom" />
  </p>
) : translatedText ? (
```

This shows: skeleton when no text yet, blinking cursor while streaming, then final text.

**Step 2: Verify**

Run: `npx tsc --noEmit`

---

### Task 12: Ctrl+1-5 workspace switching

Add global keyboard shortcuts for workspace navigation.

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add keyboard event listener**

Add a `useEffect` after the existing one (after line 23):

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
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
```

**Step 2: Verify**

Run: `npx tsc --noEmit`

---

### Task 13: Add API documentation links in Settings

Help users find where to get API keys.

**Files:**
- Modify: `src/components/settings/SettingsWorkspace.tsx:240-260, 280-300`
- Modify: `src/i18n/en.ts`

**Step 1: Add i18n key**

In `en.ts`:
```ts
'settings.getKey': 'Get API key',
```

**Step 2: Add link after OpenAI API key label**

After the OpenAI key label text (line 241), add a link:
```tsx
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
```

Same for Anthropic key label (line 281):
```tsx
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
```

**Step 3: Verify**

Run: `npx tsc --noEmit`

---

### Task 14: Network error detection with offline indicator

Show an offline banner when the network is down.

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add online/offline state**

Add state and effect in `App`:

```tsx
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
```

**Step 2: Add offline banner in JSX**

After the titlebar drag region div (line 28), add:

```tsx
{isOffline && (
  <div className="fixed top-9 left-64 right-0 z-50 bg-error/15 border-b border-error/20 px-4 py-2 flex items-center justify-center gap-2 text-error text-xs font-label font-semibold">
    <span className="material-symbols-outlined text-sm">cloud_off</span>
    You are offline. Translation requires an internet connection.
  </div>
)}
```

**Step 3: Verify**

Run: `npx tsc --noEmit`

---

### Task 15: Add Content Security Policy

Close XSS vulnerability (currently `"csp": null`).

**Files:**
- Modify: `src-tauri/tauri.conf.json:25-27`

**Step 1: Set CSP**

Replace `"csp": null` with:

```json
"csp": "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://api.openai.com https://api.anthropic.com wss://speech.platform.bing.com; frame-src 'none'; object-src 'none'"
```

**Step 2: Verify**

Run: `cd src-tauri && cargo check`

---

### Task 16: Update Tauri capabilities

Add needed permissions for clipboard, HTTP, and window management.

**Files:**
- Modify: `src-tauri/capabilities/default.json`

**Step 1: Expand permissions**

Replace the permissions array:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "enables the default permissions",
  "windows": [
    "main"
  ],
  "permissions": [
    "core:default",
    "core:window:allow-set-focus",
    "core:window:allow-set-size",
    "core:window:allow-set-position",
    "core:window:allow-set-fullscreen",
    "core:window:allow-set-title"
  ]
}
```

**Step 2: Verify**

Run: `cd src-tauri && cargo check`

---

### Task 17: Configure reqwest client with connection pooling

Set proper timeouts and pooling on the shared reqwest Client.

**Files:**
- Modify: `src-tauri/src/lib.rs:245`

**Step 1: Replace `reqwest::Client::new()` with configured client**

Replace line 245:

```rust
.manage(
    reqwest::Client::builder()
        .pool_max_idle_per_host(5)
        .pool_idle_timeout(std::time::Duration::from_secs(90))
        .connect_timeout(std::time::Duration::from_secs(10))
        .user_agent("LuminaTranslate/1.0")
        .build()
        .expect("failed to build HTTP client")
)
```

**Step 2: Verify**

Run: `cd src-tauri && cargo check`

---

### Task 18: Fix pronunciation language in Dictionary

Currently hardcoded to 'en', should use the word's detected language.

**Files:**
- Modify: `src/components/dictionary/DictionaryWorkspace.tsx:256`
- Modify: `src/services/settings.ts` (use `langToBcp47`)

**Step 1: Detect language from source input context**

Import `langToBcp47` in DictionaryWorkspace:
```tsx
import { loadSettings, langToBcp47 } from '../../services/settings'
```

Add state to track the source language for pronunciation:
```tsx
const [pronounceLang, setPronounceLang] = useState('en')
```

In `lookupSelectedWord`, after `setResult(data)` (line 70), detect language:
```tsx
// Use source language setting for pronunciation, fallback to English
const settings = loadSettings()
setPronounceLang(langToBcp47(settings.sourceLang))
```

Update the speak button (line 256):
```tsx
onClick={() => speakText(result.word, pronounceLang)}
```

**Step 2: Verify**

Run: `npx tsc --noEmit`

---

### Task 19: Debounce rapid token clicks in Dictionary

Prevent duplicate API calls from rapid clicking.

**Files:**
- Modify: `src/components/dictionary/DictionaryWorkspace.tsx:105-112`

**Step 1: Add debounce guard using loading state**

The simplest approach: `handleTokenClick` already sets `loading=true` via `lookupSelectedWord`. Just check loading at the start:

```tsx
const handleTokenClick = useCallback(
  (word: string) => {
    if (loading) return
    setSelectedToken(word)
    const context = tokens.length > 1 ? tokens.join(' ') : undefined
    lookupSelectedWord(word, context)
  },
  [tokens, lookupSelectedWord, loading],
)
```

Also add disabled styling to token buttons when loading:

```tsx
<button
  key={`${token}-${i}`}
  onClick={() => handleTokenClick(token)}
  disabled={loading}
  className={`px-4 py-2 rounded-full text-sm font-label font-medium transition-all duration-300 ${loading ? 'cursor-wait' : 'cursor-pointer'} ${
```

**Step 2: Verify**

Run: `npx tsc --noEmit`

---

## Task Dependency Order

Tasks can mostly be done in parallel, except:
- Task 10 (streaming) should be done before Task 11 (skeleton) since skeleton needs to handle streaming state
- Task 2 (same-lang validation) before Task 10 since Task 10 also includes the validation

**Recommended execution order:**
1. Tasks 1, 3, 4, 5, 6, 7 (trivial frontend fixes — parallel)
2. Tasks 8, 9, 15, 16, 17 (backend fixes — parallel)
3. Task 2 (same-lang validation)
4. Task 10 (streaming — depends on backend)
5. Task 11 (skeleton — depends on streaming)
6. Tasks 12, 13, 14 (app-level features — parallel)
7. Tasks 18, 19 (dictionary fixes — parallel)

**Commit after each logical group.**
