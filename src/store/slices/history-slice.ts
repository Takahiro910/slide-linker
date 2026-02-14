import type { StateCreator } from 'zustand'
import type { Project } from '../../types'

export interface HistoryEntry {
  project: Project
  timestamp: number
}

const MAX_HISTORY = 50

export interface HistorySlice {
  undoStack: HistoryEntry[]
  redoStack: HistoryEntry[]
  canUndo: boolean
  canRedo: boolean
  pushHistory: (project: Project) => void
  undo: () => void
  redo: () => void
  clearHistory: () => void
}

export const createHistorySlice: StateCreator<HistorySlice> = (set, get) => ({
  undoStack: [],
  redoStack: [],
  canUndo: false,
  canRedo: false,

  pushHistory: (project) =>
    set((state) => {
      const entry: HistoryEntry = {
        project: structuredClone(project),
        timestamp: Date.now(),
      }
      const newStack = [...state.undoStack.slice(-(MAX_HISTORY - 1)), entry]
      return {
        undoStack: newStack,
        redoStack: [],
        canUndo: true,
        canRedo: false,
      }
    }),

  undo: () => {
    const state = get() as HistorySlice & { project: Project | null; isDirty: boolean }
    if (state.undoStack.length === 0 || !state.project) return

    const newUndo = state.undoStack.slice(0, -1)
    const popped = state.undoStack[state.undoStack.length - 1]

    set({
      undoStack: newUndo,
      redoStack: [
        ...state.redoStack,
        { project: structuredClone(state.project), timestamp: Date.now() },
      ],
      project: popped.project,
      isDirty: true,
      canUndo: newUndo.length > 0,
      canRedo: true,
    } as Partial<HistorySlice>)
  },

  redo: () => {
    const state = get() as HistorySlice & { project: Project | null; isDirty: boolean }
    if (state.redoStack.length === 0 || !state.project) return

    const newRedo = state.redoStack.slice(0, -1)
    const popped = state.redoStack[state.redoStack.length - 1]

    set({
      redoStack: newRedo,
      undoStack: [
        ...state.undoStack,
        { project: structuredClone(state.project), timestamp: Date.now() },
      ],
      project: popped.project,
      isDirty: true,
      canUndo: true,
      canRedo: newRedo.length > 0,
    } as Partial<HistorySlice>)
  },

  clearHistory: () =>
    set({
      undoStack: [],
      redoStack: [],
      canUndo: false,
      canRedo: false,
    }),
})
