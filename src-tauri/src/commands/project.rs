use crate::models::Project;

#[tauri::command]
pub async fn save_project(path: String, project: Project) -> Result<(), String> {
    let json = serde_json::to_string_pretty(&project)
        .map_err(|e| format!("Serialization failed: {}", e))?;
    tokio::fs::write(&path, json)
        .await
        .map_err(|e| format!("Write failed: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn load_project(path: String) -> Result<Project, String> {
    let content = tokio::fs::read_to_string(&path)
        .await
        .map_err(|e| format!("Read failed: {}", e))?;
    serde_json::from_str(&content).map_err(|e| format!("Parse failed: {}", e))
}
