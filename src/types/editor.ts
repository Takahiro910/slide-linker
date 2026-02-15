export type EditorMode = 'edit' | 'preview'
export type EditorTool = 'select' | 'hotspot' | 'text'
export type SlideFilter = 'all' | 'main' | 'sub' | 'disabled'
export type DrawingState = 'idle' | 'drawing' | 'moving' | 'resizing'

export interface DragOrigin {
  x: number
  y: number
}

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w'
