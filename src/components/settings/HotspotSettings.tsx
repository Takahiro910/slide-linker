import { useStore } from '../../store'
import { HotspotList } from './HotspotList'
import { HotspotDetail } from './HotspotDetail'
import { TextOverlayDetail } from './TextOverlayDetail'

export function HotspotSettings() {
  const selectedSlideId = useStore((s) => s.selectedSlideId)
  const selectedHotspotId = useStore((s) => s.selectedHotspotId)
  const selectedTextOverlayId = useStore((s) => s.selectedTextOverlayId)
  const currentSlide = useStore((s) =>
    s.project?.slides.find((sl) => sl.id === s.selectedSlideId),
  )
  const currentHotspot = currentSlide?.hotspots.find(
    (h) => h.id === selectedHotspotId,
  )
  const currentTextOverlay = (currentSlide?.text_overlays ?? []).find(
    (o) => o.id === selectedTextOverlayId,
  )

  const textOverlayCount = (currentSlide?.text_overlays ?? []).length

  if (!currentSlide) {
    return (
      <div className="hotspot-settings empty">
        <p>{'\u30b9\u30e9\u30a4\u30c9\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044'}</p>
      </div>
    )
  }

  return (
    <div className="hotspot-settings">
      <div className="hotspot-settings-header">
        <h3>{'\u30db\u30c3\u30c8\u30b9\u30dd\u30c3\u30c8'}</h3>
        <span className="hotspot-count">
          {currentSlide.hotspots.length}
        </span>
      </div>
      <HotspotList
        hotspots={currentSlide.hotspots}
        selectedHotspotId={selectedHotspotId}
      />
      {currentHotspot && selectedSlideId && (
        <HotspotDetail
          hotspot={currentHotspot}
          slideId={selectedSlideId}
        />
      )}

      <div className="hotspot-settings-header" style={{ marginTop: 8 }}>
        <h3>{'\u30c6\u30ad\u30b9\u30c8'}</h3>
        <span className="hotspot-count">
          {textOverlayCount}
        </span>
      </div>
      {currentTextOverlay && selectedSlideId && (
        <TextOverlayDetail
          overlay={currentTextOverlay}
          slideId={selectedSlideId}
        />
      )}
    </div>
  )
}
