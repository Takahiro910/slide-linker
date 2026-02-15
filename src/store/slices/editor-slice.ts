import type { StateCreator } from 'zustand'
import type { EditorMode, EditorTool, SlideFilter, DrawingState, DragOrigin } from '../../types'

export interface EditorSlice {
  selectedSlideId: string | null
  selectedHotspotId: string | null
  editorTool: EditorTool
  selectedTextOverlayId: string | null
  editorMode: EditorMode
  slideFilter: SlideFilter
  drawingState: DrawingState
  dragOrigin: DragOrigin | null
  isLoading: boolean
  loadingMessage: string
  showLinkChecker: boolean
  showNavigationGraph: boolean
  selectedSlideIds: string[]

  selectSlide: (id: string | null) => void
  selectHotspot: (id: string | null) => void
  setEditorTool: (tool: EditorTool) => void
  selectTextOverlay: (id: string | null) => void
  deselectAll: () => void
  setEditorMode: (mode: EditorMode) => void
  setSlideFilter: (filter: SlideFilter) => void
  setDrawingState: (state: DrawingState) => void
  setDragOrigin: (origin: DragOrigin | null) => void
  setLoading: (loading: boolean, message?: string) => void
  toggleLinkChecker: () => void
  toggleNavigationGraph: () => void
  toggleSlideSelection: (slideId: string) => void
  selectSlideRange: (slideIds: string[]) => void
  clearSlideSelection: () => void
}

export const createEditorSlice: StateCreator<EditorSlice> = (set) => ({
  selectedSlideId: null,
  selectedHotspotId: null,
  editorTool: 'select',
  selectedTextOverlayId: null,
  editorMode: 'edit',
  slideFilter: 'all',
  drawingState: 'idle',
  dragOrigin: null,
  isLoading: false,
  loadingMessage: '',
  showLinkChecker: false,
  showNavigationGraph: false,
  selectedSlideIds: [],

  selectSlide: (id) =>
    set({ selectedSlideId: id, selectedHotspotId: null, selectedTextOverlayId: null }),

  selectHotspot: (id) => set({ selectedHotspotId: id, selectedTextOverlayId: null }),

  setEditorTool: (editorTool) => set({ editorTool }),

  selectTextOverlay: (id) => set({ selectedTextOverlayId: id, selectedHotspotId: null }),

  deselectAll: () =>
    set({ selectedSlideId: null, selectedHotspotId: null, selectedTextOverlayId: null }),

  setEditorMode: (editorMode) => set({ editorMode }),

  setSlideFilter: (slideFilter) => set({ slideFilter }),

  setDrawingState: (drawingState) => set({ drawingState }),

  setDragOrigin: (dragOrigin) => set({ dragOrigin }),

  setLoading: (isLoading, loadingMessage = '') =>
    set({ isLoading, loadingMessage }),

  toggleLinkChecker: () =>
    set((state) => ({ showLinkChecker: !state.showLinkChecker })),

  toggleNavigationGraph: () =>
    set((state) => ({ showNavigationGraph: !state.showNavigationGraph })),

  toggleSlideSelection: (slideId) =>
    set((state) => {
      const exists = state.selectedSlideIds.includes(slideId)
      return {
        selectedSlideIds: exists
          ? state.selectedSlideIds.filter((id) => id !== slideId)
          : [...state.selectedSlideIds, slideId],
      }
    }),

  selectSlideRange: (slideIds) => set({ selectedSlideIds: slideIds }),

  clearSlideSelection: () => set({ selectedSlideIds: [] }),
})
