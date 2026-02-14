export interface Project {
  version: string
  created_at: string
  updated_at: string
  source_file: string
  aspect_ratio: AspectRatio
  slides: Slide[]
  enable_analytics?: boolean
}

export type AspectRatio = '16:9' | '4:3'

export interface Slide {
  id: string
  index: number
  label: string
  is_main: boolean
  image_path: string
  hotspots: Hotspot[]
  text_overlays?: TextOverlay[]
}

export interface HotspotStyle {
  color: string
  opacity: number
  borderRadius: number
  icon: string | null
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
  style?: HotspotStyle
}

export interface TextOverlay {
  id: string
  x: number
  y: number
  w: number
  h: number
  text: string
  fontSize: number
  fontWeight: 'normal' | 'bold'
  color: string
  backgroundColor: string
  textAlign: 'left' | 'center' | 'right'
  borderRadius: number
}

export type NavigationStack = string[]

export interface RecentProject {
  path: string
  name: string
  openedAt: string
}
