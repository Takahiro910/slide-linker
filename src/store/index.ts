import { create } from 'zustand'
import { createProjectSlice, type ProjectSlice } from './slices/project-slice'
import { createEditorSlice, type EditorSlice } from './slices/editor-slice'
import { createPreviewSlice, type PreviewSlice } from './slices/preview-slice'
import {
  createImageCacheSlice,
  type ImageCacheSlice,
} from './slices/image-cache-slice'

export type AppStore = ProjectSlice &
  EditorSlice &
  PreviewSlice &
  ImageCacheSlice

export const useStore = create<AppStore>()((...args) => ({
  ...createProjectSlice(...args),
  ...createEditorSlice(...args),
  ...createPreviewSlice(...args),
  ...createImageCacheSlice(...args),
}))
