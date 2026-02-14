import type { StateCreator } from 'zustand'
import type { Project, Slide, Hotspot, TextOverlay } from '../../types'

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

  batchSetSlideMain: (slideIds: string[], isMain: boolean) => void

  addHotspot: (slideId: string, hotspot: Hotspot) => void
  removeHotspot: (slideId: string, hotspotId: string) => void
  updateHotspot: (
    slideId: string,
    hotspotId: string,
    updates: Partial<Hotspot>,
  ) => void

  addTextOverlay: (slideId: string, overlay: TextOverlay) => void
  removeTextOverlay: (slideId: string, overlayId: string) => void
  updateTextOverlay: (
    slideId: string,
    overlayId: string,
    updates: Partial<TextOverlay>,
  ) => void
}

export const createProjectSlice: StateCreator<ProjectSlice> = (set, get) => ({
  project: null,
  projectPath: null,
  projectDir: null,
  isDirty: false,

  setProject: (project) => set({ project, isDirty: false }),

  setProjectPath: (projectPath) => set({ projectPath }),

  setProjectDir: (projectDir) => set({ projectDir }),

  markDirty: () => set({ isDirty: true }),

  markClean: () => set({ isDirty: false }),

  clearProject: () => {
    ;(get() as any).clearHistory()
    set({
      project: null,
      projectPath: null,
      projectDir: null,
      isDirty: false,
    })
  },

  updateSlide: (slideId, updates) => {
    const currentProject = (get() as any).project
    if (currentProject) {
      ;(get() as any).pushHistory(currentProject)
    }
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
    })
  },

  toggleSlideMain: (slideId) => {
    const currentProject = (get() as any).project
    if (currentProject) {
      ;(get() as any).pushHistory(currentProject)
    }
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
    })
  },

  reorderMainSlides: (fromIndex, toIndex) => {
    const currentProject = (get() as any).project
    if (currentProject) {
      ;(get() as any).pushHistory(currentProject)
    }
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
    })
  },

  batchSetSlideMain: (slideIds, isMain) => {
    const currentProject = (get() as any).project
    if (currentProject) {
      ;(get() as any).pushHistory(currentProject)
    }
    set((state) => {
      if (!state.project) return state
      return {
        project: {
          ...state.project,
          slides: state.project.slides.map((slide) =>
            slideIds.includes(slide.id)
              ? { ...slide, is_main: isMain }
              : slide,
          ),
        },
        isDirty: true,
      }
    })
  },

  addHotspot: (slideId, hotspot) => {
    const currentProject = (get() as any).project
    if (currentProject) {
      ;(get() as any).pushHistory(currentProject)
    }
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
    })
  },

  removeHotspot: (slideId, hotspotId) => {
    const currentProject = (get() as any).project
    if (currentProject) {
      ;(get() as any).pushHistory(currentProject)
    }
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
    })
  },

  updateHotspot: (slideId, hotspotId, updates) => {
    const currentProject = (get() as any).project
    if (currentProject) {
      ;(get() as any).pushHistory(currentProject)
    }
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
    })
  },

  addTextOverlay: (slideId, overlay) => {
    const currentProject = (get() as any).project
    if (currentProject) {
      ;(get() as any).pushHistory(currentProject)
    }
    set((state) => {
      if (!state.project) return state
      return {
        project: {
          ...state.project,
          slides: state.project.slides.map((slide) =>
            slide.id === slideId
              ? {
                  ...slide,
                  text_overlays: [...(slide.text_overlays ?? []), overlay],
                }
              : slide,
          ),
        },
        isDirty: true,
      }
    })
  },

  removeTextOverlay: (slideId, overlayId) => {
    const currentProject = (get() as any).project
    if (currentProject) {
      ;(get() as any).pushHistory(currentProject)
    }
    set((state) => {
      if (!state.project) return state
      return {
        project: {
          ...state.project,
          slides: state.project.slides.map((slide) =>
            slide.id === slideId
              ? {
                  ...slide,
                  text_overlays: (slide.text_overlays ?? []).filter(
                    (o) => o.id !== overlayId,
                  ),
                }
              : slide,
          ),
        },
        isDirty: true,
      }
    })
  },

  updateTextOverlay: (slideId, overlayId, updates) => {
    const currentProject = (get() as any).project
    if (currentProject) {
      ;(get() as any).pushHistory(currentProject)
    }
    set((state) => {
      if (!state.project) return state
      return {
        project: {
          ...state.project,
          slides: state.project.slides.map((slide) =>
            slide.id === slideId
              ? {
                  ...slide,
                  text_overlays: (slide.text_overlays ?? []).map((o) =>
                    o.id === overlayId ? { ...o, ...updates } : o,
                  ),
                }
              : slide,
          ),
        },
        isDirty: true,
      }
    })
  },
})
