import type { StateCreator } from 'zustand'

export interface ImageCacheSlice {
  imageCache: Record<string, string>

  setImageCache: (path: string, dataUrl: string) => void
  getImageDataUrl: (path: string) => string | undefined
  clearImageCache: () => void
}

export const createImageCacheSlice: StateCreator<ImageCacheSlice> = (
  set,
  get,
) => ({
  imageCache: {},

  setImageCache: (path, dataUrl) =>
    set((state) => ({
      imageCache: { ...state.imageCache, [path]: dataUrl },
    })),

  getImageDataUrl: (path) => get().imageCache[path],

  clearImageCache: () => set({ imageCache: {} }),
})
