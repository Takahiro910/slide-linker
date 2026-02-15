use std::path::PathBuf;
use serde::Deserialize;
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

#[derive(Debug, Deserialize)]
pub struct ImageRename {
    pub old_path: String,
    pub new_path: String,
}

/// Validate that a path stays within the given base directory (prevent path traversal).
fn validate_path_within(base: &std::path::Path, relative: &str) -> Result<PathBuf, String> {
    let joined = base.join(relative);
    // Normalize components to resolve .. and .
    let mut normalized = PathBuf::new();
    for component in joined.components() {
        match component {
            std::path::Component::ParentDir => {
                if !normalized.pop() {
                    return Err(format!("Path traversal detected: {}", relative));
                }
            }
            std::path::Component::Normal(c) => normalized.push(c),
            std::path::Component::RootDir => normalized.push(std::path::MAIN_SEPARATOR_STR),
            std::path::Component::Prefix(p) => normalized.push(p.as_os_str()),
            std::path::Component::CurDir => {} // skip .
        }
    }

    if !normalized.starts_with(base) {
        return Err(format!("Path traversal detected: {}", relative));
    }
    Ok(normalized)
}

/// Copy slide images from an external project's directory into the current project's directory.
/// `source_dir` is the directory of the external project (contains `slides/`).
/// `target_dir` is the directory of the current project (contains `slides/`).
/// `renames` maps old relative paths to new relative paths (e.g. `slides/slide-001.png` -> `slides/slide-005.png`).
#[tauri::command]
pub async fn copy_slide_images(
    source_dir: String,
    target_dir: String,
    renames: Vec<ImageRename>,
) -> Result<usize, String> {
    let source_base = PathBuf::from(&source_dir);
    let target_base = PathBuf::from(&target_dir);

    // Ensure target slides directory exists
    let target_slides = target_base.join("slides");
    tokio::fs::create_dir_all(&target_slides)
        .await
        .map_err(|e| format!("Failed to create target slides dir: {}", e))?;

    let mut copied = 0usize;

    for rename in &renames {
        // Validate paths to prevent directory traversal attacks
        let src = validate_path_within(&source_base, &rename.old_path)?;
        let dst = validate_path_within(&target_base, &rename.new_path)?;

        if !src.exists() {
            // Skip missing source images (non-fatal)
            continue;
        }

        tokio::fs::copy(&src, &dst)
            .await
            .map_err(|e| format!("Failed to copy {} -> {}: {}", rename.old_path, rename.new_path, e))?;

        copied += 1;
    }

    Ok(copied)
}

/// Copy all slide images (PNGs) from one project directory to another.
/// Used by "Save As" to copy the slides/ folder when saving to a different directory.
#[tauri::command]
pub async fn copy_slides_directory(
    source_dir: String,
    target_dir: String,
) -> Result<usize, String> {
    let source_slides = PathBuf::from(&source_dir).join("slides");
    let target_slides = PathBuf::from(&target_dir).join("slides");

    if !source_slides.exists() {
        return Ok(0);
    }

    tokio::fs::create_dir_all(&target_slides)
        .await
        .map_err(|e| format!("Failed to create target slides dir: {}", e))?;

    let mut copied = 0usize;
    let mut entries = tokio::fs::read_dir(&source_slides)
        .await
        .map_err(|e| format!("Failed to read source slides dir: {}", e))?;

    while let Some(entry) = entries
        .next_entry()
        .await
        .map_err(|e| format!("Failed to read directory entry: {}", e))?
    {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) == Some("png") {
            if let Some(filename) = path.file_name() {
                let dest = target_slides.join(filename);
                tokio::fs::copy(&path, &dest)
                    .await
                    .map_err(|e| format!("Failed to copy {}: {}", path.display(), e))?;
                copied += 1;
            }
        }
    }

    Ok(copied)
}

/// Count PNG files in a slides directory. Returns 0 if the directory doesn't exist.
/// Used to detect if a directory already contains slide images before creating a new project.
#[tauri::command]
pub async fn count_slide_images(slides_dir: String) -> Result<usize, String> {
    let dir = PathBuf::from(&slides_dir);
    if !dir.exists() {
        return Ok(0);
    }

    let mut count = 0usize;
    let mut entries = tokio::fs::read_dir(&dir)
        .await
        .map_err(|e| format!("Failed to read directory: {}", e))?;

    while let Some(entry) = entries
        .next_entry()
        .await
        .map_err(|e| format!("Failed to read entry: {}", e))?
    {
        if entry
            .path()
            .extension()
            .and_then(|e| e.to_str())
            == Some("png")
        {
            count += 1;
        }
    }

    Ok(count)
}
