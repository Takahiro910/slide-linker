import { create } from 'zustand'
import { createProjectSlice, type ProjectSlice } from './slices/project-slice'
import { createEditorSlice, type EditorSlice } from './slices/editor-slice'
import { createPreviewSlice, type PreviewSlice } from './slices/preview-slice'
import {
  createImageCacheSlice,
  type ImageCacheSlice,
} from './slices/image-cache-slice'
import {
  createRecentProjectsSlice,
  type RecentProjectsSlice,
} from './slices/recent-projects-slice'
import {
  createClipboardSlice,
  type ClipboardSlice,
} from './slices/clipboard-slice'
import {
  createHistorySlice,
  type HistorySlice,
} from './slices/history-slice'

export type AppStore = ProjectSlice &
  EditorSlice &
  PreviewSlice &
  ImageCacheSlice &
  RecentProjectsSlice &
  ClipboardSlice &
  HistorySlice

export const useStore = create<AppStore>()((...args) => ({
  ...createProjectSlice(...args),
  ...createEditorSlice(...args),
  ...createPreviewSlice(...args),
  ...createImageCacheSlice(...args),
  ...createRecentProjectsSlice(...args),
  ...createClipboardSlice(...args),
  ...createHistorySlice(...args),
}))
