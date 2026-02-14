export interface Project {
  version: string
  created_at: string
  updated_at: string
  source_file: string
  aspect_ratio: AspectRatio
  slides: Slide[]
}

export type AspectRatio = '16:9' | '4:3'

export interface Slide {
  id: string
  index: number
  label: string
  is_main: boolean
  image_path: string
  hotspots: Hotspot[]
}

export interface Hotspot {
  id: string
  x: number
  y: number
  w: number
  h: number
  link_type: 'slide' | 'url'
  target_id: string | null
  url: string | null
  tooltip?: string
}

export type NavigationStack = string[]
