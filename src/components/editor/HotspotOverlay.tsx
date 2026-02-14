import clsx from 'clsx'
import type { Hotspot } from '../../types'

interface HotspotOverlayProps {
  hotspot: Hotspot
  isSelected: boolean
  mode: 'edit' | 'preview'
  onClick?: (e: React.MouseEvent) => void
}

export function HotspotOverlay({
  hotspot,
  isSelected,
  mode,
  onClick,
}: HotspotOverlayProps) {
  return (
    <div
      className={clsx(
        'hotspot-overlay',
        mode,
        isSelected && 'selected',
        hotspot.link_type === 'url' && 'url-type',
      )}
      style={{
        position: 'absolute',
        left: `${hotspot.x}%`,
        top: `${hotspot.y}%`,
        width: `${hotspot.w}%`,
        height: `${hotspot.h}%`,
      }}
      onClick={onClick}
      title={hotspot.tooltip || undefined}
    >
      {mode === 'edit' && isSelected && (
        <>
          <div className="resize-handle nw" />
          <div className="resize-handle ne" />
          <div className="resize-handle sw" />
          <div className="resize-handle se" />
        </>
      )}
    </div>
  )
}
