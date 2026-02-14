import type { StateCreator } from 'zustand'
import type { Project, Slide, Hotspot } from '../../types'

export interface ProjectSlice {
  project: Project | null
  projectPath: string | null
  projectDir: string | null
  isDirty: boolean

  setProject: (project: Project) => void
  setProjectPath: (path: string | null) => void
  setProjectDir: (dir: string | null) => void
  markDirty: () => void
  markClean: () => void
  clearProject: () => void

  updateSlide: (slideId: string, updates: Partial<Slide>) => void
  toggleSlideMain: (slideId: string) => void
  reorderMainSlides: (fromIndex: number, toIndex: number) => void

  addHotspot: (slideId: string, hotspot: Hotspot) => void
  removeHotspot: (slideId: string, hotspotId: string) => void
  updateHotspot: (
    slideId: string,
    hotspotId: string,
    updates: Partial<Hotspot>,
  ) => void
}

export const createProjectSlice: StateCreator<ProjectSlice> = (set) => ({
  project: null,
  projectPath: null,
  projectDir: null,
  isDirty: false,

  setProject: (project) => set({ project, isDirty: false }),

  setProjectPath: (projectPath) => set({ projectPath }),

  setProjectDir: (projectDir) => set({ projectDir }),

  markDirty: () => set({ isDirty: true }),

  markClean: () => set({ isDirty: false }),

  clearProject: () =>
    set({
      project: null,
      projectPath: null,
      projectDir: null,
      isDirty: false,
    }),

  updateSlide: (slideId, updates) =>
    set((state) => {
      if (!state.project) return state
      return {
        project: {
          ...state.project,
          slides: state.project.slides.map((slide) =>
            slide.id === slideId ? { ...slide, ...updates } : slide,
          ),
        },
        isDirty: true,
      }
    }),

  toggleSlideMain: (slideId) =>
    set((state) => {
      if (!state.project) return state
      return {
        project: {
          ...state.project,
          slides: state.project.slides.map((slide) =>
            slide.id === slideId
              ? { ...slide, is_main: !slide.is_main }
              : slide,
          ),
        },
        isDirty: true,
      }
    }),

  reorderMainSlides: (fromIndex, toIndex) =>
    set((state) => {
      if (!state.project) return state
      const mainSlides = state.project.slides.filter((s) => s.is_main)
      const subSlides = state.project.slides.filter((s) => !s.is_main)

      const newMain = [...mainSlides]
      const [moved] = newMain.splice(fromIndex, 1)
      newMain.splice(toIndex, 0, moved)

      return {
        project: {
          ...state.project,
          slides: [...newMain, ...subSlides],
        },
        isDirty: true,
      }
    }),

  addHotspot: (slideId, hotspot) =>
    set((state) => {
      if (!state.project) return state
      return {
        project: {
          ...state.project,
          slides: state.project.slides.map((slide) =>
            slide.id === slideId
              ? { ...slide, hotspots: [...slide.hotspots, hotspot] }
              : slide,
          ),
        },
        isDirty: true,
      }
    }),

  removeHotspot: (slideId, hotspotId) =>
    set((state) => {
      if (!state.project) return state
      return {
        project: {
          ...state.project,
          slides: state.project.slides.map((slide) =>
            slide.id === slideId
              ? {
                  ...slide,
                  hotspots: slide.hotspots.filter((h) => h.id !== hotspotId),
                }
              : slide,
          ),
        },
        isDirty: true,
      }
    }),

  updateHotspot: (slideId, hotspotId, updates) =>
    set((state) => {
      if (!state.project) return state
      return {
        project: {
          ...state.project,
          slides: state.project.slides.map((slide) =>
            slide.id === slideId
              ? {
                  ...slide,
                  hotspots: slide.hotspots.map((h) =>
                    h.id === hotspotId ? { ...h, ...updates } : h,
                  ),
                }
              : slide,
          ),
        },
        isDirty: true,
      }
    }),
})
