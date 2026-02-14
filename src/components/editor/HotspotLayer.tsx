import type { Hotspot } from '../../types'
import { HotspotOverlay } from './HotspotOverlay'

interface HotspotLayerProps {
  hotspots: Hotspot[]
  selectedHotspotId: string | null
  mode: 'edit' | 'preview'
  onHotspotClick?: (hotspotId: string, e: React.MouseEvent) => void
}

export function HotspotLayer({
  hotspots,
  selectedHotspotId,
  mode,
  onHotspotClick,
}: HotspotLayerProps) {
  return (
    <div className="hotspot-layer" style={{ position: 'absolute', inset: 0 }}>
      {hotspots.map((hotspot) => (
        <HotspotOverlay
          key={hotspot.id}
          hotspot={hotspot}
          isSelected={hotspot.id === selectedHotspotId}
          mode={mode}
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
