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


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![ai_call])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
