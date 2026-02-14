use base64::Engine;
use std::path::PathBuf;
use tauri::Emitter;

use crate::models::{ExportProgress, Hotspot, Project, Slide, TextOverlay};

const ANALYTICS_SCRIPT: &str = r#"<script>
(function() {
  var KEY = 'sl_analytics';
  var events = JSON.parse(localStorage.getItem(KEY) || '[]');

  function track(type, id, extra) {
    events.push({
      type: type,
      id: id || '',
      extra: extra || '',
      time: new Date().toISOString()
    });
    try { localStorage.setItem(KEY, JSON.stringify(events)); } catch(e) {}
  }

  var viewObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        var id = e.target.id || e.target.closest('[id]').id;
        track('view', id);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.main-slide,.modal-overlay').forEach(function(el) {
    viewObs.observe(el);
  });

  var origOpen = window.openSlide;
  window.openSlide = function(id) { track('click', id); origOpen(id); };
  var origUrl = window.openUrl;
  window.openUrl = function(url) { track('url_click', '', url); origUrl(url); };

  var btn = document.createElement('button');
  btn.textContent = '\u2193 CSV';
  btn.className = 'analytics-download-btn';
  btn.title = '\u5206\u6790\u30c7\u30fc\u30bf\u3092CSV\u3067\u30c0\u30a6\u30f3\u30ed\u30fc\u30c9';
  btn.onclick = function() {
    var csv = 'type,id,extra,time\n';
    events.forEach(function(e) {
      csv += [e.type,e.id,e.extra,e.time].join(',') + '\n';
    });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
    a.download = 'analytics.csv';
    a.click();
  };
  document.body.appendChild(btn);
})();
</script>"#;

#[tauri::command]
pub async fn export_html(
    app: tauri::AppHandle,
    project_dir: String,
    project: Project,
    output_path: String,
) -> Result<(), String> {
    let template = include_str!("../templates/export.html");

    let main_slides: Vec<&Slide> = project.slides.iter().filter(|s| s.is_main).collect();
    let all_slides: Vec<&Slide> = project.slides.iter().collect();
    let total = all_slides.len();

    let aspect_ratio_css = project.aspect_ratio.replace(":", "/");

    let mut main_html = String::new();
    for (i, slide) in main_slides.iter().enumerate() {
        let base64_img = read_and_encode_image(&project_dir, &slide.image_path).await?;
        main_html.push_str(&render_main_slide(slide, &base64_img, &aspect_ratio_css));

        app.emit(
            "export-progress",
            ExportProgress {
                current: i + 1,
                total,
            },
        )
        .ok();
    }

    let mut sub_html = String::new();
    let mut processed = main_slides.len();
    for slide in &all_slides {
        if slide.is_main && slide.hotspots.is_empty() {
            continue;
        }
        if !slide.is_main {
            let base64_img = read_and_encode_image(&project_dir, &slide.image_path).await?;
            sub_html.push_str(&render_sub_slide(slide, &base64_img, &aspect_ratio_css));
            processed += 1;
            app.emit(
                "export-progress",
                ExportProgress {
                    current: processed,
                    total,
                },
            )
            .ok();
        }
    }

    // Also render main slides as modal targets (main→main links)
    for slide in &main_slides {
        if !slide.hotspots.is_empty() || all_slides.iter().any(|s| {
            s.hotspots.iter().any(|h| h.target_id.as_deref() == Some(&slide.id))
        }) {
            let base64_img = read_and_encode_image(&project_dir, &slide.image_path).await?;
            sub_html.push_str(&render_sub_slide(slide, &base64_img, &aspect_ratio_css));
        }
    }

    let dot_nav: String = main_slides
        .iter()
        .enumerate()
        .map(|(i, _)| {
            let active = if i == 0 { " class=\"active\"" } else { "" };
            format!("<button{}></button>", active)
        })
        .collect::<Vec<_>>()
        .join("\n    ");

    let title = PathBuf::from(&project.source_file)
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "Slide Linker Presentation".to_string());

    let analytics = if project.enable_analytics.unwrap_or(false) {
        ANALYTICS_SCRIPT.to_string()
    } else {
        String::new()
    };

    let html = template
        .replace("{{TITLE}}", &html_escape(&title))
        .replace("{{ASPECT_RATIO}}", &aspect_ratio_css)
        .replace("{{MAIN_SLIDES}}", &main_html)
        .replace("{{SUB_SLIDES}}", &sub_html)
        .replace("{{DOT_NAV}}", &dot_nav)
        .replace("{{ANALYTICS_SCRIPT}}", &analytics);

    tokio::fs::write(&output_path, html)
        .await
        .map_err(|e| format!("Write failed: {}", e))?;

    Ok(())
}

async fn read_and_encode_image(project_dir: &str, image_path: &str) -> Result<String, String> {
    let full_path = PathBuf::from(project_dir).join(image_path);
    let bytes = tokio::fs::read(&full_path)
        .await
        .map_err(|e| format!("Failed to read image {}: {}", image_path, e))?;
    Ok(base64::engine::general_purpose::STANDARD.encode(&bytes))
}

fn render_main_slide(slide: &Slide, base64_img: &str, aspect_ratio: &str) -> String {
    format!(
        r#"  <section class="main-slide" id="{id}">
    <div class="slide-container" style="position:relative;width:100%;aspect-ratio:{ar};">
      <img src="data:image/png;base64,{img}" alt="{label}" />
      <div class="hotspot-layer">{hotspots}</div>
      {text_overlays}
    </div>
  </section>
"#,
        id = slide.id,
        ar = aspect_ratio,
        img = base64_img,
        label = html_escape(&slide.label),
        hotspots = render_hotspots(&slide.hotspots),
        text_overlays = render_text_overlays(&slide.text_overlays),
    )
}

fn render_sub_slide(slide: &Slide, base64_img: &str, aspect_ratio: &str) -> String {
    format!(
        r#"  <div class="modal-overlay" id="modal-{id}">
    <button class="back-btn" onclick="event.stopPropagation();goBack()">&#8592; 戻る</button>
    <div class="modal-content" onclick="event.stopPropagation()" style="position:relative;aspect-ratio:{ar};">
      <img src="data:image/png;base64,{img}" alt="{label}" />
      <div class="hotspot-layer">{hotspots}</div>
      {text_overlays}
    </div>
  </div>
"#,
        id = slide.id,
        ar = aspect_ratio,
        img = base64_img,
        label = html_escape(&slide.label),
        hotspots = render_hotspots(&slide.hotspots),
        text_overlays = render_text_overlays(&slide.text_overlays),
    )
}

fn hex_to_rgb(hex: &str) -> (u8, u8, u8) {
    let hex = hex.trim_start_matches('#');
    let r = u8::from_str_radix(&hex[0..2], 16).unwrap_or(99);
    let g = u8::from_str_radix(&hex[2..4], 16).unwrap_or(200);
    let b = u8::from_str_radix(&hex[4..6], 16).unwrap_or(255);
    (r, g, b)
}

fn render_hotspots(hotspots: &[Hotspot]) -> String {
    hotspots
        .iter()
        .map(|h| {
            let data_type = if h.link_type == "url" {
                " data-type=\"url\""
            } else {
                ""
            };

            let onclick = match h.link_type.as_str() {
                "url" => {
                    let url = h.url.as_deref().unwrap_or("#");
                    format!("openUrl('{}')", html_escape(url))
                }
                _ => {
                    let target = h.target_id.as_deref().unwrap_or("");
                    format!("openSlide('{}')", html_escape(target))
                }
            };

            let title_attr = h
                .tooltip
                .as_ref()
                .map(|t| format!(" title=\"{}\"", html_escape(t)))
                .unwrap_or_default();

            let style_css = match &h.style {
                Some(s) => {
                    let (r, g, b) = hex_to_rgb(&s.color);
                    format!(
                        "border-color:{color};background:rgba({r},{g},{b},{opacity});border-radius:{radius}%;",
                        color = s.color,
                        r = r,
                        g = g,
                        b = b,
                        opacity = s.opacity,
                        radius = s.border_radius,
                    )
                }
                None => String::new(),
            };

            let icon_html = match &h.style {
                Some(s) => match &s.icon {
                    Some(icon) if !icon.is_empty() => {
                        format!(r#"<span class="hotspot-icon">{}</span>"#, html_escape(icon))
                    }
                    _ => String::new(),
                },
                None => String::new(),
            };

            format!(
                r#"      <div class="hotspot"{data_type}{title} style="left:{x}%;top:{y}%;width:{w}%;height:{h}%;{extra_style}" onclick="{onclick}">{icon}</div>"#,
                data_type = data_type,
                title = title_attr,
                x = h.x,
                y = h.y,
                w = h.w,
                h = h.h,
                extra_style = style_css,
                onclick = onclick,
                icon = icon_html,
            )
        })
        .collect::<Vec<_>>()
        .join("\n")
}

fn render_text_overlays(overlays: &[TextOverlay]) -> String {
    overlays
        .iter()
        .map(|o| {
            format!(
                r#"      <div class="text-overlay" style="left:{x}%;top:{y}%;width:{w}%;height:{h}%;font-size:{fs}px;font-weight:{fw};color:{color};background:{bg};text-align:{ta};border-radius:{br}px;">{text}</div>"#,
                x = o.x,
                y = o.y,
                w = o.w,
                h = o.h,
                fs = o.font_size,
                fw = html_escape(&o.font_weight),
                color = html_escape(&o.color),
                bg = html_escape(&o.background_color),
                ta = html_escape(&o.text_align),
                br = o.border_radius,
                text = html_escape(&o.text),
            )
        })
        .collect::<Vec<_>>()
        .join("\n")
}

fn html_escape(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}
