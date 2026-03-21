use serde::{Deserialize, Serialize};
use tauri::State;

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

async fn call_openai(client: &reqwest::Client, req: &AiCallRequest) -> Result<String, String> {
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

async fn call_anthropic(client: &reqwest::Client, req: &AiCallRequest) -> Result<String, String> {
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
async fn ai_call(client: State<'_, reqwest::Client>, req: AiCallRequest) -> Result<AiCallResponse, String> {
    let result = if req.provider == "anthropic" {
        call_anthropic(&client, &req).await
    } else {
        call_openai(&client, &req).await
    };

    Ok(match result {
        Ok(text) => AiCallResponse { ok: true, result: Some(text), error: None },
        Err(e) => AiCallResponse { ok: false, result: None, error: Some(e) },
    })
}

/// Edge TTS — same cloud neural voices as Edge browser "Read Aloud".
/// Microsoft disabled online voices in WebView2 (cost), so we call the endpoint directly.
mod edge_tts {
    use futures_util::{SinkExt, StreamExt};
    use sha2::{Sha256, Digest};
    use tokio::time::{timeout, Duration};
    use tokio_tungstenite::tungstenite::Message;
    use tokio_tungstenite::tungstenite::client::IntoClientRequest;

    const TRUSTED_CLIENT_TOKEN: &str = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
    const CHROMIUM_FULL_VERSION: &str = "143.0.3650.75";
    const TTS_TIMEOUT: Duration = Duration::from_secs(30);
    const MAX_AUDIO_BYTES: usize = 10 * 1024 * 1024; // 10 MB

    const VOICE_MAP: &[(&str, &str)] = &[
        ("zh", "zh-CN-XiaoxiaoNeural"), ("ja", "ja-JP-NanamiNeural"),
        ("ko", "ko-KR-SunHiNeural"),   ("fr", "fr-FR-DeniseNeural"),
        ("de", "de-DE-KatjaNeural"),    ("es", "es-ES-ElviraNeural"),
        ("pt", "pt-BR-FranciscaNeural"),("ru", "ru-RU-SvetlanaNeural"),
        ("ar", "ar-SA-ZariyahNeural"),  ("it", "it-IT-ElsaNeural"),
        ("nl", "nl-NL-ColetteNeural"),  ("tr", "tr-TR-EmelNeural"),
        ("vi", "vi-VN-HoaiMyNeural"),   ("th", "th-TH-PremwadeeNeural"),
        ("id", "id-ID-GadisNeural"),    ("hi", "hi-IN-SwaraNeural"),
        ("pl", "pl-PL-AgnieszkaNeural"),("sv", "sv-SE-SofieNeural"),
        ("cs", "cs-CZ-VlastaNeural"),   ("ro", "ro-RO-AlinaNeural"),
        ("hu", "hu-HU-NoemiNeural"),    ("uk", "uk-UA-PolinaNeural"),
        ("el", "el-GR-AthinaNeural"),   ("en", "en-US-JennyNeural"),
    ];

    fn voice_for_lang(lang: &str) -> &'static str {
        let prefix = lang.split('-').next().unwrap_or("en");
        VOICE_MAP.iter().find(|(l, _)| *l == prefix).map(|(_, v)| *v).unwrap_or("en-US-JennyNeural")
    }

    fn generate_sec_ms_gec() -> String {
        use std::time::{SystemTime, UNIX_EPOCH};
        let secs = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        let win_epoch = secs + 11644473600;
        let rounded = win_epoch - (win_epoch % 300);
        let ticks = rounded * 10_000_000;
        let to_hash = format!("{}{}", ticks, TRUSTED_CLIENT_TOKEN);
        format!("{:X}", Sha256::digest(to_hash.as_bytes()))
    }

    pub async fn synthesize(text: &str, lang: &str) -> Result<Vec<u8>, String> {
        let voice = voice_for_lang(lang);
        let request_id = uuid::Uuid::new_v4().to_string().replace('-', "");
        let chromium_major = CHROMIUM_FULL_VERSION.split('.').next().unwrap();

        let url = format!(
            "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken={}&Sec-MS-GEC={}&Sec-MS-GEC-Version=1-{}&ConnectionId={}",
            TRUSTED_CLIENT_TOKEN, generate_sec_ms_gec(), CHROMIUM_FULL_VERSION, request_id
        );

        let mut request = url.into_client_request().map_err(|e| format!("TTS request failed: {}", e))?;
        let h = request.headers_mut();
        h.insert("Pragma", "no-cache".parse().unwrap());
        h.insert("Cache-Control", "no-cache".parse().unwrap());
        h.insert("Origin", "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold".parse().unwrap());
        h.insert("User-Agent", format!(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{}.0.0.0 Safari/537.36 Edg/{}.0.0.0",
            chromium_major, chromium_major
        ).parse().unwrap());
        h.insert("Accept-Encoding", "gzip, deflate, br, zstd".parse().unwrap());
        h.insert("Accept-Language", "en-US,en;q=0.9".parse().unwrap());
        let muid = uuid::Uuid::new_v4().to_string().replace('-', "").to_uppercase();
        h.insert("Cookie", format!("muid={};", muid).parse().unwrap());

        let (mut ws, _) = tokio_tungstenite::connect_async_tls_with_config(request, None, false, None)
            .await.map_err(|e| format!("TTS connect failed: {}", e))?;

        // Send config
        let config = "X-Timestamp:0\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{\"context\":{\"synthesis\":{\"audio\":{\"metadataoptions\":{\"sentenceBoundaryEnabled\":\"false\",\"wordBoundaryEnabled\":\"false\"},\"outputFormat\":\"audio-24khz-48kbitrate-mono-mp3\"}}}}";
        ws.send(Message::Text(config.into())).await.map_err(|e| format!("TTS config failed: {}", e))?;

        // Send SSML
        let escaped = text.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;");
        let ssml_msg = format!(
            "X-RequestId:{}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:0\r\nPath:ssml\r\n\r\n<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='{}'><voice name='{}'>{}</voice></speak>",
            request_id, lang, voice, escaped
        );
        ws.send(Message::Text(ssml_msg.into())).await.map_err(|e| format!("TTS send failed: {}", e))?;

        // Collect audio bytes with timeout
        let audio = timeout(TTS_TIMEOUT, async {
            let mut buf = Vec::new();
            while let Some(msg) = ws.next().await {
                match msg {
                    Ok(Message::Binary(data)) => {
                        if let Some(pos) = data.windows(12).position(|w| w == b"Path:audio\r\n") {
                            buf.extend_from_slice(&data[pos + 12..]);
                            if buf.len() > MAX_AUDIO_BYTES {
                                break;
                            }
                        }
                    }
                    Ok(Message::Text(t)) => {
                        if t.contains("Path:turn.end") { break; }
                    }
                    Err(_) => break,
                    _ => {}
                }
            }
            buf
        }).await.map_err(|_| "TTS request timed out".to_string())?;

        if audio.is_empty() {
            return Err("No audio received from TTS service".into());
        }
        Ok(audio)
    }
}

#[tauri::command]
async fn speak(text: String, lang: String) -> Result<Vec<u8>, String> {
    edge_tts::synthesize(&text, &lang).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(
            reqwest::Client::builder()
                .pool_max_idle_per_host(5)
                .pool_idle_timeout(std::time::Duration::from_secs(90))
                .connect_timeout(std::time::Duration::from_secs(10))
                .user_agent("LuminaTranslate/1.0")
                .build()
                .expect("failed to build HTTP client")
        )
        .invoke_handler(tauri::generate_handler![ai_call, speak])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
