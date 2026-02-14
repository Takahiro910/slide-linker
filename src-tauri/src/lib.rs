mod commands;
mod models;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::convert::convert_pdf_to_images,
            commands::convert::detect_aspect_ratio_from_slides,
            commands::project::save_project,
            commands::project::load_project,
            commands::export::export_html,
            commands::export_pdf::export_pdf,
            commands::image::read_image_base64,
            commands::settings::load_settings,
            commands::settings::save_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
