import { useStore } from '../../store'
import { HotspotList } from './HotspotList'
import { HotspotDetail } from './HotspotDetail'

export function HotspotSettings() {
  const selectedSlideId = useStore((s) => s.selectedSlideId)
  const selectedHotspotId = useStore((s) => s.selectedHotspotId)
  const currentSlide = useStore((s) =>
    s.project?.slides.find((sl) => sl.id === s.selectedSlideId),
  )
  const currentHotspot = currentSlide?.hotspots.find(
    (h) => h.id === selectedHotspotId,
  )

  if (!currentSlide) {
    return (
      <div className="hotspot-settings empty">
        <p>スライドを選択してください</p>
      </div>
    )
  }

  return (
    <div className="hotspot-settings">
      <div className="hotspot-settings-header">
        <h3>ホットスポット</h3>
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
    </div>
  )
}
