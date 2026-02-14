import type { TextOverlay } from '../../types'
import { TextOverlayItem } from './TextOverlayItem'

interface TextOverlayLayerProps {
  overlays: TextOverlay[]
  selectedOverlayId: string | null
  onOverlayClick?: (overlayId: string, e: React.MouseEvent) => void
}

export function TextOverlayLayer({
  overlays,
  selectedOverlayId,
  onOverlayClick,
}: TextOverlayLayerProps) {
  return (
    <div
      className="text-overlay-layer"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      {overlays.map((overlay) => (
        <TextOverlayItem
          key={overlay.id}
          overlay={overlay}
          isSelected={overlay.id === selectedOverlayId}
          onClick={
            onOverlayClick
              ? (e) => onOverlayClick(overlay.id, e)
              : undefined
          }
        />
      ))}
    </div>
  )
}
