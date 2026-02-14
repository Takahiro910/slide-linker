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

  readImageBase64(path: string): Promise<string> {
    return invoke('read_image_base64', { path })
  },
} as const
