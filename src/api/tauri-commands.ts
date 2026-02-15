import { invoke } from '@tauri-apps/api/core'
import type { Project } from '../types'

export interface SlideInfo {
  id: string
  index: number
  label: string
  image_path: string
}

export const tauriCommands = {
  convertPdfToImages(pdfPath: string, outputDir: string): Promise<SlideInfo[]> {
    return invoke('convert_pdf_to_images', { pdfPath, outputDir })
  },

  convertToImagesWithOffset(
    sourcePath: string,
    outputDir: string,
    startIndex: number,
  ): Promise<SlideInfo[]> {
    return invoke('convert_to_images_with_offset', {
      sourcePath,
      outputDir,
      startIndex,
    })
  },

  detectAspectRatio(slidesDir: string): Promise<string> {
    return invoke('detect_aspect_ratio_from_slides', { slidesDir })
  },

  saveProject(path: string, project: Project): Promise<void> {
    return invoke('save_project', { path, project })
  },

  loadProject(path: string): Promise<Project> {
    return invoke('load_project', { path })
  },

  exportHtml(
    projectDir: string,
    project: Project,
    outputPath: string,
  ): Promise<void> {
    return invoke('export_html', { projectDir, project, outputPath })
  },

  exportPdf(
    projectDir: string,
    project: Project,
    outputPath: string,
  ): Promise<void> {
    return invoke('export_pdf', { projectDir, project, outputPath })
  },

  readImageBase64(path: string): Promise<string> {
    return invoke('read_image_base64', { path })
  },

  copySlideImages(
    sourceDir: string,
    targetDir: string,
    renames: { old_path: string; new_path: string }[],
  ): Promise<number> {
    return invoke('copy_slide_images', { sourceDir, targetDir, renames })
  },

  copySlidesDirectory(
    sourceDir: string,
    targetDir: string,
  ): Promise<number> {
    return invoke('copy_slides_directory', { sourceDir, targetDir })
  },

  countSlideImages(slidesDir: string): Promise<number> {
    return invoke('count_slide_images', { slidesDir })
  },

  loadSettings(): Promise<AppSettings> {
    return invoke('load_settings')
  },

  saveSettings(settings: AppSettings): Promise<void> {
    return invoke('save_settings', { settings })
  },
} as const

export interface RecentProjectEntry {
  path: string
  name: string
  opened_at: string
}

export interface AppSettings {
  recent_projects: RecentProjectEntry[]
}
