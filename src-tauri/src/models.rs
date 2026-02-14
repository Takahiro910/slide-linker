use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub version: String,
    pub created_at: String,
    pub updated_at: String,
    pub source_file: String,
    pub aspect_ratio: String,
    pub slides: Vec<Slide>,
    #[serde(default)]
    pub enable_analytics: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Slide {
    pub id: String,
    pub index: usize,
    pub label: String,
    pub is_main: bool,
    pub image_path: String,
    pub hotspots: Vec<Hotspot>,
    #[serde(default)]
    pub text_overlays: Vec<TextOverlay>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextOverlay {
    pub id: String,
    pub x: f64,
    pub y: f64,
    pub w: f64,
    pub h: f64,
    pub text: String,
    pub font_size: f64,
    pub font_weight: String,
    pub color: String,
    pub background_color: String,
    pub text_align: String,
    pub border_radius: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HotspotStyle {
    pub color: String,
    pub opacity: f64,
    pub border_radius: f64,
    pub icon: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Hotspot {
    pub id: String,
    pub x: f64,
    pub y: f64,
    pub w: f64,
    pub h: f64,
    pub link_type: String,
    pub target_id: Option<String>,
    pub url: Option<String>,
    pub tooltip: Option<String>,
    #[serde(default)]
    pub style: Option<HotspotStyle>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SlideInfo {
    pub id: String,
    pub index: usize,
    pub label: String,
    pub image_path: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct ConvertProgress {
    pub current: usize,
    pub total: usize,
    pub message: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct ExportProgress {
    pub current: usize,
    pub total: usize,
}
