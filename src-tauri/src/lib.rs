use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct AiCallRequest {
    provider: String,
    model: String,
    messages: Vec<Message>,
    system: Option<String>,
    #[serde(rename = "openaiKey")]
    openai_key: Option<String>,
    #[serde(rename = "openaiBase")]
    openai_base: Option<String>,
    #[serde(rename = "anthropicKey")]
    anthropic_key: Option<String>,
    #[serde(rename = "maxTokens")]
    max_tokens: Option<u32>,
}

#[derive(Deserialize, Serialize, Clone)]
struct Message {
    role: String,
    content: String,
}

#[derive(Serialize)]
struct AiCallResponse {
    ok: bool,
    result: Option<String>,
    error: Option<String>,
}

async fn call_openai(req: &AiCallRequest) -> Result<String, String> {
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
    });

    let client = reqwest::Client::new();
    let resp = client
        .post(format!("{}/chat/completions", base))
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", key))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("OpenAI request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status().as_u16();
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("OpenAI API error ({}): {}", status, text));
    }

    let data: serde_json::Value = resp.json().await.map_err(|e| format!("Parse error: {}", e))?;
    data["choices"][0]["message"]["content"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "Unexpected OpenAI response format".into())
}

async fn call_anthropic(req: &AiCallRequest) -> Result<String, String> {
    let key = req.anthropic_key.as_deref()
        .filter(|k| !k.is_empty())
        .ok_or("Anthropic API key not configured. Please set it in Settings.")?;

    let messages: Vec<&Message> = req.messages.iter().filter(|m| m.role != "system").collect();

    let mut body = serde_json::json!({
        "model": req.model,
        "max_tokens": req.max_tokens.unwrap_or(4096),
        "messages": messages,
    });

    if let Some(sys) = &req.system {
        body["system"] = serde_json::Value::String(sys.clone());
    }

    let client = reqwest::Client::new();
    let resp = client
        .post("https://api.anthropic.com/v1/messages")
        .header("Content-Type", "application/json")
        .header("x-api-key", key)
        .header("anthropic-version", "2023-06-01")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Anthropic request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status().as_u16();
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("Anthropic API error ({}): {}", status, text));
    }

    let data: serde_json::Value = resp.json().await.map_err(|e| format!("Parse error: {}", e))?;
    data["content"][0]["text"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "Unexpected Anthropic response format".into())
}

#[tauri::command]
async fn ai_call(req: AiCallRequest) -> AiCallResponse {
    let result = if req.provider == "anthropic" {
        call_anthropic(&req).await
    } else {
        call_openai(&req).await
    };

    match result {
        Ok(text) => AiCallResponse { ok: true, result: Some(text), error: None },
        Err(e) => AiCallResponse { ok: false, result: None, error: Some(e) },
    }
}

#[cfg(windows)]
mod tts {
    use windows::Media::SpeechSynthesis::SpeechSynthesizer;
    use windows::Storage::Streams::DataReader;

    pub fn speak_sync(text: &str, lang: &str) -> Result<Vec<u8>, String> {
        let synth = SpeechSynthesizer::new().map_err(|e| format!("TTS init failed: {}", e))?;

        // Try to find a voice matching the requested language
        let lang_prefix = lang.split('-').next().unwrap_or("");
        let voices = SpeechSynthesizer::AllVoices().map_err(|e| format!("Get voices failed: {}", e))?;
        let mut found_voice = false;
        for i in 0..voices.Size().unwrap_or(0) {
            if let Ok(voice) = voices.GetAt(i) {
                if let Ok(voice_lang) = voice.Language() {
                    if voice_lang.to_string().starts_with(lang_prefix) {
                        let _ = synth.SetVoice(&voice);
                        found_voice = true;
                        break;
                    }
                }
            }
        }
        if !found_voice && lang_prefix != "en" {
            return Err(format!("No voice installed for '{}'. Install the language pack in Windows Settings → Time & Language.", lang));
        }

        let stream = synth
            .SynthesizeTextToStreamAsync(&text.into())
            .map_err(|e| format!("TTS synthesis failed: {}", e))?
            .get()
            .map_err(|e| format!("TTS await failed: {}", e))?;

        let size = stream.Size().map_err(|e| format!("Stream size error: {}", e))? as u32;
        let reader = DataReader::CreateDataReader(&stream.GetInputStreamAt(0).map_err(|e| format!("{}", e))?)
            .map_err(|e| format!("Reader error: {}", e))?;
        reader.LoadAsync(size).map_err(|e| format!("{}", e))?.get().map_err(|e| format!("{}", e))?;

        let mut buf = vec![0u8; size as usize];
        reader.ReadBytes(&mut buf).map_err(|e| format!("Read error: {}", e))?;
        Ok(buf)
    }
}

#[tauri::command]
async fn speak(text: String, lang: String) -> Result<Vec<u8>, String> {
    #[cfg(windows)]
    {
        tokio::task::spawn_blocking(move || tts::speak_sync(&text, &lang))
            .await
            .map_err(|e| format!("Task error: {}", e))?
    }
    #[cfg(not(windows))]
    {
        let _ = (text, lang);
        Err("TTS not supported on this platform".into())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![ai_call, speak])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
