use base64::Engine;

#[tauri::command]
pub async fn read_image_base64(path: String) -> Result<String, String> {
    let bytes = tokio::fs::read(&path)
        .await
        .map_err(|e| format!("Failed to read image: {}", e))?;
    Ok(base64::engine::general_purpose::STANDARD.encode(&bytes))
}
