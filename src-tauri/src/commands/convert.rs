use std::path::PathBuf;
use pdfium_render::prelude::*;
use tauri::Emitter;
use tauri::Manager;
use crate::models::{ConvertProgress, SlideInfo};

const RENDER_DPI: f32 = 200.0;

#[tauri::command]
pub async fn convert_pdf_to_images(
    app: tauri::AppHandle,
    pdf_path: String,
    output_dir: String,
) -> Result<Vec<SlideInfo>, String> {
    let output_path = PathBuf::from(&output_dir);
    std::fs::create_dir_all(&output_path)
        .map_err(|e| format!("出力ディレクトリの作成に失敗: {}", e))?;

    let pdfium_dll_path = resolve_pdfium_path(&app)?;

    let pdfium = Pdfium::new(
        Pdfium::bind_to_library(pdfium_dll_path.to_str().unwrap_or_default())
            .map_err(|e| format!("PDFium DLL の読み込みに失敗: {}", e))?,
    );

    let document = pdfium
        .load_pdf_from_file(&pdf_path, None)
        .map_err(|e| format!("PDF ファイルを開けません: {}", e))?;

    let total_pages = document.pages().len() as usize;

    app.emit(
        "convert-progress",
        ConvertProgress {
            current: 0,
            total: total_pages,
            message: "PDF をスライド画像に変換中...".to_string(),
        },
    )
    .ok();

    let render_config = PdfRenderConfig::new()
        .set_target_width(
            (RENDER_DPI / 72.0
                * document
                    .pages()
                    .first()
                    .map(|p| p.width().value)
                    .unwrap_or(792.0)) as i32,
        )
        .set_maximum_height(
            (RENDER_DPI / 72.0
                * document
                    .pages()
                    .first()
                    .map(|p| p.height().value)
                    .unwrap_or(612.0)) as i32,
        );

    let mut slides: Vec<SlideInfo> = Vec::with_capacity(total_pages);

    for (index, page) in document.pages().iter().enumerate() {
        let file_name = format!("slide-{:03}.png", index + 1);
        let file_path = output_path.join(&file_name);

        let bitmap = page
            .render_with_config(&render_config)
            .map_err(|e| format!("ページ {} のレンダリングに失敗: {}", index + 1, e))?;

        let img = bitmap
            .as_image();

        img.into_rgba8()
            .save(&file_path)
            .map_err(|e| format!("画像の保存に失敗 ({}): {}", file_name, e))?;

        let relative_path = format!("slides/{}", file_name);
        slides.push(SlideInfo {
            id: format!("slide-{:03}", index + 1),
            index,
            label: format!("Slide {}", index + 1),
            image_path: relative_path,
        });

        app.emit(
            "convert-progress",
            ConvertProgress {
                current: index + 1,
                total: total_pages,
                message: format!(
                    "変換中... ({}/{})",
                    index + 1,
                    total_pages
                ),
            },
        )
        .ok();
    }

    app.emit(
        "convert-progress",
        ConvertProgress {
            current: total_pages,
            total: total_pages,
            message: "変換完了".to_string(),
        },
    )
    .ok();

    Ok(slides)
}

#[tauri::command]
pub async fn detect_aspect_ratio_from_slides(
    slides_dir: String,
) -> Result<String, String> {
    let dir = PathBuf::from(&slides_dir);
    let entries: Vec<_> = std::fs::read_dir(&dir)
        .map_err(|e| format!("ディレクトリの読み取りに失敗: {}", e))?
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.path()
                .extension()
                .map(|ext| ext == "png")
                .unwrap_or(false)
        })
        .collect();

    if let Some(entry) = entries.first() {
        let dimensions = image::image_dimensions(entry.path())
            .map_err(|e| format!("画像サイズの取得に失敗: {}", e))?;
        Ok(ratio_from_dimensions(dimensions.0, dimensions.1))
    } else {
        Ok("16:9".to_string())
    }
}

fn resolve_pdfium_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dll_name = "pdfium.dll";
    let mut searched_paths: Vec<String> = Vec::new();

    // 1. Tauri resource_dir (production NSIS/MSI build)
    if let Ok(resource_dir) = app.path().resource_dir() {
        let path = resource_dir.join(dll_name);
        searched_paths.push(format!("resource_dir: {}", path.display()));
        if path.exists() {
            return Ok(path);
        }
    }

    // 2. Next to the executable
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let path = exe_dir.join(dll_name);
            searched_paths.push(format!("exe_dir: {}", path.display()));
            if path.exists() {
                return Ok(path);
            }
        }
    }

    // 3. Development: src-tauri/resources/pdfium.dll
    let dev_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("resources")
        .join(dll_name);
    searched_paths.push(format!("dev: {}", dev_path.display()));
    if dev_path.exists() {
        return Ok(dev_path);
    }

    Err(format!(
        "pdfium.dll が見つかりません。\n\
         検索パス:\n{}",
        searched_paths.join("\n")
    ))
}

fn ratio_from_dimensions(width: u32, height: u32) -> String {
    if height == 0 {
        return "16:9".to_string();
    }
    let ratio = width as f64 / height as f64;
    if (ratio - 16.0 / 9.0).abs() < 0.1 {
        "16:9".to_string()
    } else if (ratio - 4.0 / 3.0).abs() < 0.1 {
        "4:3".to_string()
    } else {
        "16:9".to_string()
    }
}
