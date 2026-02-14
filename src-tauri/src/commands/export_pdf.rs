use printpdf::*;
use tauri::Emitter;

use crate::models::{ExportProgress, Project, Slide};

/// Pre-loaded image data for a single slide
struct SlideImageData {
    width: u32,
    height: u32,
    rgb_pixels: Vec<u8>,
}

#[tauri::command]
pub async fn export_pdf(
    app: tauri::AppHandle,
    project_dir: String,
    project: Project,
    output_path: String,
) -> Result<(), String> {
    // Collect all slides in order: main first, then sub
    let main_slides: Vec<&Slide> = project.slides.iter().filter(|s| s.is_main).collect();
    let sub_slides: Vec<&Slide> = project.slides.iter().filter(|s| !s.is_main).collect();
    let mut ordered_slides: Vec<&Slide> = Vec::with_capacity(project.slides.len());
    ordered_slides.extend(&main_slides);
    ordered_slides.extend(&sub_slides);

    let total = ordered_slides.len();

    // Phase 1: Read and decode all images asynchronously
    let mut slide_images: Vec<SlideImageData> = Vec::with_capacity(total);
    for (i, slide) in ordered_slides.iter().enumerate() {
        let image_path = format!("{}/{}", project_dir, slide.image_path);
        let image_bytes = tokio::fs::read(&image_path)
            .await
            .map_err(|e| format!("Failed to read image {}: {}", image_path, e))?;

        let dynamic_image = ::image::load_from_memory(&image_bytes)
            .map_err(|e| format!("Failed to decode image: {}", e))?;

        let width = dynamic_image.width();
        let height = dynamic_image.height();
        let rgb_image = dynamic_image.to_rgb8();
        let rgb_pixels = rgb_image.into_raw();

        slide_images.push(SlideImageData {
            width,
            height,
            rgb_pixels,
        });

        app.emit(
            "export-progress",
            ExportProgress {
                current: i + 1,
                total: total * 2, // loading + rendering phases
            },
        )
        .ok();
    }

    // Phase 2: Build PDF synchronously (PdfDocumentReference is !Send)
    let aspect_ratio = project.aspect_ratio.clone();
    let source_file = project.source_file.clone();

    let pdf_bytes = tokio::task::spawn_blocking(move || -> Result<Vec<u8>, String> {
        let (page_w_mm, page_h_mm) = if aspect_ratio == "4:3" {
            (Mm(297.0), Mm(222.75))
        } else {
            (Mm(340.0), Mm(191.25))
        };

        let (doc, page1, layer1) =
            PdfDocument::new(&source_file, page_w_mm, page_h_mm, "Layer 1");

        for (i, img_data) in slide_images.iter().enumerate() {
            let (current_page, current_layer) = if i == 0 {
                (page1, layer1)
            } else {
                doc.add_page(page_w_mm, page_h_mm, &format!("Layer {}", i + 1))
            };

            let image_xobject = ImageXObject {
                width: Px(img_data.width as usize),
                height: Px(img_data.height as usize),
                color_space: ColorSpace::Rgb,
                bits_per_component: ColorBits::Bit8,
                interpolate: true,
                image_data: img_data.rgb_pixels.clone(),
                image_filter: None,
                smask: None,
                clipping_bbox: None,
            };

            let pdf_image = Image::from(image_xobject);
            let layer_ref = doc.get_page(current_page).get_layer(current_layer);

            pdf_image.add_to_layer(
                layer_ref,
                ImageTransform {
                    translate_x: Some(Mm(0.0)),
                    translate_y: Some(Mm(0.0)),
                    scale_x: Some(page_w_mm.0 / img_data.width as f32),
                    scale_y: Some(page_h_mm.0 / img_data.height as f32),
                    ..Default::default()
                },
            );
        }

        doc.save_to_bytes()
            .map_err(|e| format!("Failed to generate PDF: {}", e))
    })
    .await
    .map_err(|e| format!("PDF generation task failed: {}", e))??;

    // Phase 3: Write PDF to file
    tokio::fs::write(&output_path, pdf_bytes)
        .await
        .map_err(|e| format!("Failed to write PDF: {}", e))?;

    // Emit final progress
    app.emit(
        "export-progress",
        ExportProgress {
            current: total,
            total,
        },
    )
    .ok();

    Ok(())
}
