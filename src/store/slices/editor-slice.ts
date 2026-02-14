import type { StateCreator } from 'zustand'
import type { EditorMode, SlideFilter, DrawingState, DragOrigin } from '../../types'

export interface EditorSlice {
  selectedSlideId: string | null
  selectedHotspotId: string | null
  editorMode: EditorMode
  slideFilter: SlideFilter
  drawingState: DrawingState
  dragOrigin: DragOrigin | null
  isLoading: boolean
  loadingMessage: string

  selectSlide: (id: string | null) => void
  selectHotspot: (id: string | null) => void
  deselectAll: () => void
  setEditorMode: (mode: EditorMode) => void
  setSlideFilter: (filter: SlideFilter) => void
  setDrawingState: (state: DrawingState) => void
  setDragOrigin: (origin: DragOrigin | null) => void
  setLoading: (loading: boolean, message?: string) => void
}

export const createEditorSlice: StateCreator<EditorSlice> = (set) => ({
  selectedSlideId: null,
  selectedHotspotId: null,
  editorMode: 'edit',
  slideFilter: 'all',
  drawingState: 'idle',
  dragOrigin: null,
  isLoading: false,
  loadingMessage: '',

  selectSlide: (id) =>
    set({ selectedSlideId: id, selectedHotspotId: null }),

  selectHotspot: (id) => set({ selectedHotspotId: id }),

  deselectAll: () =>
    set({ selectedSlideId: null, selectedHotspotId: null }),

  setEditorMode: (editorMode) => set({ editorMode }),

  setSlideFilter: (slideFilter) => set({ slideFilter }),

  setDrawingState: (drawingState) => set({ drawingState }),

  setDragOrigin: (dragOrigin) => set({ dragOrigin }),

  setLoading: (isLoading, loadingMessage = '') =>
    set({ isLoading, loadingMessage }),
})
