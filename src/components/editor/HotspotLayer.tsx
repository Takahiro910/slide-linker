import type { Hotspot } from '../../types'
import { HotspotOverlay } from './HotspotOverlay'

interface HotspotLayerProps {
  hotspots: Hotspot[]
  selectedHotspotId: string | null
  mode: 'edit' | 'preview'
  slideId?: string
  onHotspotClick?: (hotspotId: string, e: React.MouseEvent) => void
}

export function HotspotLayer({
  hotspots,
  selectedHotspotId,
  mode,
  slideId,
  onHotspotClick,
}: HotspotLayerProps) {
  return (
    <div className="hotspot-layer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {hotspots.map((hotspot) => (
        <HotspotOverlay
          key={hotspot.id}
          hotspot={hotspot}
          isSelected={hotspot.id === selectedHotspotId}
          mode={mode}
          slideId={slideId}
          onClick={
            onHotspotClick
              ? (e) => onHotspotClick(hotspot.id, e)
              : undefined
          }
        />
      ))}
    </div>
  )
}
