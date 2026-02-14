import type { StateCreator } from 'zustand'
import type { RecentProject } from '../../types'

const MAX_RECENT = 10

export interface RecentProjectsSlice {
  recentProjects: RecentProject[]

  addRecentProject: (project: RecentProject) => void
  removeRecentProject: (path: string) => void
  setRecentProjects: (projects: RecentProject[]) => void
}

export const createRecentProjectsSlice: StateCreator<RecentProjectsSlice> = (
  set,
) => ({
  recentProjects: [],

  addRecentProject: (project) =>
    set((state) => {
      const filtered = state.recentProjects.filter(
        (p) => p.path !== project.path,
      )
      return {
        recentProjects: [project, ...filtered].slice(0, MAX_RECENT),
      }
    }),

  removeRecentProject: (path) =>
    set((state) => ({
      recentProjects: state.recentProjects.filter((p) => p.path !== path),
    })),

  setRecentProjects: (recentProjects) => set({ recentProjects }),
})
