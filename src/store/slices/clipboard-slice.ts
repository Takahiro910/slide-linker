import type { StateCreator } from 'zustand'
import type { Hotspot } from '../../types'

export interface ClipboardSlice {
  clipboardHotspots: Hotspot[]

  copyHotspots: (hotspots: Hotspot[]) => void
  clearClipboard: () => void
}

export const createClipboardSlice: StateCreator<ClipboardSlice> = (set) => ({
  clipboardHotspots: [],

  copyHotspots: (hotspots) =>
    set({ clipboardHotspots: hotspots.map((h) => ({ ...h })) }),

  clearClipboard: () => set({ clipboardHotspots: [] }),
})
