use std::path::PathBuf;
use pdfium_render::prelude::*;
use tauri::Emitter;
use tauri::Manager;
use crate::models::{ConvertProgress, SlideInfo};

const RENDER_DPI: f32 = 200.0;

fn find_libreoffice() -> Option<PathBuf> {
    // 1. Next to the executable (for portable distribution)
    if let Ok(exe) = std::env::current_exe() {
        if let Some(exe_dir) = exe.parent() {
            let portable = exe_dir
                .join("LibreOfficePortable")
                .join("App")
                .join("libreoffice")
                .join("program")
                .join("soffice.exe");
            if portable.exists() {
                return Some(portable);
            }
        }
    }

    // 2. Standard install paths
    for dir in &[
        r"C:\Program Files\LibreOffice\program",
        r"C:\Program Files (x86)\LibreOffice\program",
    ] {
        let path = PathBuf::from(dir).join("soffice.exe");
        if path.exists() {
            return Some(path);
        }
    }

    // 3. Environment variable
    if let Ok(custom_path) = std::env::var("LIBREOFFICE_PATH") {
        let path = PathBuf::from(&custom_path);
        if path.exists() {
            return Some(path);
        }
    }

    None
}

fn convert_pptx_to_pdf(
    soffice_path: &std::path::Path,
    pptx_path: &str,
    output_dir: &str,
) -> Result<String, String> {
    let output = std::process::Command::new(soffice_path)
        .args(&[
            "--headless",
            "--convert-to", "pdf",
            "--outdir", output_dir,
            pptx_path,
        ])
        .output()
        .map_err(|e| format!("LibreOffice の起動に失敗: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("PPTX→PDF 変換に失敗: {}", stderr));
    }

    // Derive the PDF filename from the PPTX filename
    let pptx_name = std::path::Path::new(pptx_path)
        .file_stem()
        .ok_or("ファイル名の取得に失敗")?
        .to_str()
        .ok_or("ファイル名のUTF-8変換に失敗")?;
    let pdf_path = std::path::Path::new(output_dir).join(format!("{}.pdf", pptx_name));

    if !pdf_path.exists() {
        return Err("変換されたPDFファイルが見つかりません".to_string());
    }

    Ok(pdf_path.to_str().unwrap().to_string())
}

fn convert_internal(
    app: &tauri::AppHandle,
    source_path: &str,
    output_dir: &str,
    start_index: usize,
) -> Result<Vec<SlideInfo>, String> {
    let output_path = PathBuf::from(output_dir);
    std::fs::create_dir_all(&output_path)
        .map_err(|e| format!("出力ディレクトリの作成に失敗: {}", e))?;

    // Handle PPTX/PPT: convert to PDF first via LibreOffice
    let lower = source_path.to_lowercase();
    let is_pptx = lower.ends_with(".pptx") || lower.ends_with(".ppt");

    let effective_pdf_path = if is_pptx {
        let soffice = find_libreoffice().ok_or_else(|| {
            "PPTX ファイルを変換するには LibreOffice が必要です。\n\
             以下のいずれかの方法で設定してください：\n\
             1. アプリと同じフォルダに LibreOfficePortable を配置\n\
             2. LibreOffice をインストール\n\
             3. 環境変数 LIBREOFFICE_PATH に soffice.exe のパスを設定\n\n\
             または、PDFに変換してからインポートしてください。"
                .to_string()
        })?;

        app.emit(
            "convert-progress",
            ConvertProgress {
                current: 0,
                total: 0,
                message: "PPTX を PDF に変換中 (LibreOffice)...".to_string(),
            },
        )
        .ok();

        convert_pptx_to_pdf(&soffice, source_path, output_dir)?
    } else {
        source_path.to_string()
    };

    let pdfium_dll_path = resolve_pdfium_path(app)?;

    let pdfium = Pdfium::new(
        Pdfium::bind_to_library(pdfium_dll_path.to_str().unwrap_or_default())
            .map_err(|e| format!("PDFium DLL の読み込みに失敗: {}", e))?,
    );

    let document = pdfium
        .load_pdf_from_file(&effective_pdf_path, None)
        .map_err(|e| format!("PDF ファイルを開けません: {}", e))?;

    let total_pages = document.pages().len() as usize;

    app.emit(
        "convert-progress",
        ConvertProgress {
            current: 0,
            total: total_pages,
            message: "スライド画像に変換中...".to_string(),
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
        let global_index = start_index + index;
        let file_name = format!("slide-{:03}.png", global_index + 1);
        let file_path = output_path.join(&file_name);

        let bitmap = page
            .render_with_config(&render_config)
            .map_err(|e| format!("ページ {} のレンダリングに失敗: {}", index + 1, e))?;

        let img = bitmap.as_image();

        img.into_rgba8()
            .save(&file_path)
            .map_err(|e| format!("画像の保存に失敗 ({}): {}", file_name, e))?;

        let relative_path = format!("slides/{}", file_name);
        slides.push(SlideInfo {
            id: format!("slide-{:03}", global_index + 1),
            index: global_index,
            label: format!("Slide {}", global_index + 1),
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

    // Clean up temporary PDF if we converted from PPTX
    if is_pptx {
        let _ = std::fs::remove_file(&effective_pdf_path);
    }

    Ok(slides)
}

#[tauri::command]
pub async fn convert_pdf_to_images(
    app: tauri::AppHandle,
    pdf_path: String,
    output_dir: String,
) -> Result<Vec<SlideInfo>, String> {
    convert_internal(&app, &pdf_path, &output_dir, 0)
}

#[tauri::command]
pub async fn convert_to_images_with_offset(
    app: tauri::AppHandle,
    source_path: String,
    output_dir: String,
    start_index: usize,
) -> Result<Vec<SlideInfo>, String> {
    convert_internal(&app, &source_path, &output_dir, start_index)
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
