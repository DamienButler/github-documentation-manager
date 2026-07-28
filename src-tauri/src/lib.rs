use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tauri::{LogicalPosition, LogicalSize, Manager, State, WebviewUrl, Window};

/// Label of the native child webview used to render documentation pages.
const VIEWER: &str = "viewer";

#[derive(Default)]
struct ViewerState {
    /// Current URL shown in the viewer, so we can skip redundant navigations.
    url: Mutex<Option<String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
struct Bounds {
    x: f64,
    y: f64,
    width: f64,
    height: f64,
}

// ---------------------------------------------------------------- storage

fn library_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("no app data dir: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("library.json"))
}

#[tauri::command]
fn load_library(app: tauri::AppHandle) -> Result<Option<serde_json::Value>, String> {
    let path = library_path(&app)?;
    match fs::read_to_string(&path) {
        Ok(text) => serde_json::from_str(&text)
            .map(Some)
            .map_err(|e| format!("library.json is not valid JSON: {e}")),
        Err(ref e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn save_library(app: tauri::AppHandle, data: serde_json::Value) -> Result<(), String> {
    let path = library_path(&app)?;
    let text = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    // Write to a temp file then rename, so a crash mid-write can't corrupt the library.
    let tmp = path.with_extension("json.tmp");
    fs::write(&tmp, text).map_err(|e| e.to_string())?;
    fs::rename(&tmp, &path).map_err(|e| e.to_string())
}

#[tauri::command]
fn library_location(app: tauri::AppHandle) -> Result<String, String> {
    Ok(library_path(&app)?.to_string_lossy().into_owned())
}

#[tauri::command]
fn read_json_file(path: String) -> Result<serde_json::Value, String> {
    let text = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&text).map_err(|e| format!("not valid JSON: {e}"))
}

#[tauri::command]
fn write_json_file(path: String, data: serde_json::Value) -> Result<(), String> {
    let text = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    fs::write(&path, text).map_err(|e| e.to_string())
}

// ---------------------------------------------------------------- viewer

fn only_http(url: &str) -> Result<url::Url, String> {
    let parsed = url::Url::parse(url).map_err(|e| format!("invalid URL: {e}"))?;
    match parsed.scheme() {
        "http" | "https" => Ok(parsed),
        other => Err(format!("refusing to open scheme `{other}`")),
    }
}

/// Show (creating on first use) the native child webview and point it at `url`.
///
/// A real WKWebView is used rather than an `<iframe>` so that sites which send
/// `X-Frame-Options` / `frame-ancestors` — github.com among them — still render.
#[tauri::command]
async fn viewer_show(
    window: Window,
    state: State<'_, ViewerState>,
    url: String,
    bounds: Bounds,
) -> Result<(), String> {
    let parsed = only_http(&url)?;

    let position = LogicalPosition::new(bounds.x, bounds.y);
    let size = LogicalSize::new(bounds.width.max(1.0), bounds.height.max(1.0));

    if let Some(view) = window.get_webview(VIEWER) {
        let changed = {
            let current = state.url.lock().unwrap();
            current.as_deref() != Some(url.as_str())
        };
        if changed {
            view.navigate(parsed).map_err(|e| e.to_string())?;
        }
        view.set_position(position).map_err(|e| e.to_string())?;
        view.set_size(size).map_err(|e| e.to_string())?;
        view.show().map_err(|e| e.to_string())?;
    } else {
        let builder =
            tauri::webview::WebviewBuilder::new(VIEWER, WebviewUrl::External(parsed)).auto_resize();
        window
            .add_child(builder, position, size)
            .map_err(|e| e.to_string())?;
    }

    *state.url.lock().unwrap() = Some(url);
    Ok(())
}

#[tauri::command]
fn viewer_set_bounds(window: Window, bounds: Bounds) -> Result<(), String> {
    if let Some(view) = window.get_webview(VIEWER) {
        view.set_position(LogicalPosition::new(bounds.x, bounds.y))
            .map_err(|e| e.to_string())?;
        view.set_size(LogicalSize::new(
            bounds.width.max(1.0),
            bounds.height.max(1.0),
        ))
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn viewer_hide(window: Window, state: State<'_, ViewerState>) -> Result<(), String> {
    if let Some(view) = window.get_webview(VIEWER) {
        view.hide().map_err(|e| e.to_string())?;
    }
    *state.url.lock().unwrap() = None;
    Ok(())
}

#[tauri::command]
fn viewer_reload(window: Window, state: State<'_, ViewerState>) -> Result<(), String> {
    let url = state.url.lock().unwrap().clone();
    if let (Some(view), Some(url)) = (window.get_webview(VIEWER), url) {
        view.navigate(only_http(&url)?).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(ViewerState::default())
        .invoke_handler(tauri::generate_handler![
            load_library,
            save_library,
            library_location,
            read_json_file,
            write_json_file,
            viewer_show,
            viewer_set_bounds,
            viewer_hide,
            viewer_reload,
        ])
        .run(tauri::generate_context!())
        .expect("error while running the application");
}
