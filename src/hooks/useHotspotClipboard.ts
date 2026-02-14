import { v4 as uuidv4 } from 'uuid'
import { useStore } from '../store'
import type { Hotspot } from '../types'

export function useHotspotClipboard() {
  const clipboardHotspots = useStore((s) => s.clipboardHotspots)
  const copyHotspots = useStore((s) => s.copyHotspots)
  const addHotspot = useStore((s) => s.addHotspot)
  const selectedSlideId = useStore((s) => s.selectedSlideId)
  const project = useStore((s) => s.project)

  function copySelectedHotspot() {
    if (!selectedSlideId || !project) return
    const slide = project.slides.find((s) => s.id === selectedSlideId)
    if (!slide) return

    const selectedHotspotId = useStore.getState().selectedHotspotId
    if (!selectedHotspotId) return

    const hotspot = slide.hotspots.find((h) => h.id === selectedHotspotId)
    if (!hotspot) return

    copyHotspots([hotspot])
  }

  function copyAllHotspots() {
    if (!selectedSlideId || !project) return
    const slide = project.slides.find((s) => s.id === selectedSlideId)
    if (!slide || slide.hotspots.length === 0) return

    copyHotspots(slide.hotspots)
  }

  function pasteHotspots() {
    if (!selectedSlideId || clipboardHotspots.length === 0) return

    for (const hotspot of clipboardHotspots) {
      const newHotspot: Hotspot = {
        ...hotspot,
        id: uuidv4(),
        x: hotspot.x + 2,
        y: hotspot.y + 2,
      }
      addHotspot(selectedSlideId, newHotspot)
    }
  }

  return {
    clipboardHotspots,
    copySelectedHotspot,
    copyAllHotspots,
    pasteHotspots,
    hasClipboard: clipboardHotspots.length > 0,
  }
}
