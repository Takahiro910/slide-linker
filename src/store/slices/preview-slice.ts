import type { StateCreator } from 'zustand'

export interface PreviewSlice {
  navigationStack: string[]
  currentMainSlideIndex: number

  pushNavigation: (slideId: string) => void
  popNavigation: () => string | undefined
  clearNavigation: () => void
  setMainSlideIndex: (index: number) => void
}

export const createPreviewSlice: StateCreator<PreviewSlice> = (set, get) => ({
  navigationStack: [],
  currentMainSlideIndex: 0,

  pushNavigation: (slideId) =>
    set((state) => ({
      navigationStack: [...state.navigationStack, slideId],
    })),

  popNavigation: () => {
    const state = get()
    if (state.navigationStack.length === 0) return undefined
    const popped = state.navigationStack[state.navigationStack.length - 1]
    set({
      navigationStack: state.navigationStack.slice(0, -1),
    })
    return popped
  },

  clearNavigation: () => set({ navigationStack: [] }),

  setMainSlideIndex: (currentMainSlideIndex) =>
    set({ currentMainSlideIndex }),
})
