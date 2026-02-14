import clsx from 'clsx'
import type { Hotspot } from '../../types'

interface HotspotOverlayProps {
  hotspot: Hotspot
  isSelected: boolean
  mode: 'edit' | 'preview'
  onClick?: (e: React.MouseEvent) => void
}

function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

export function HotspotOverlay({
  hotspot,
  isSelected,
  mode,
  onClick,
}: HotspotOverlayProps) {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${hotspot.x}%`,
    top: `${hotspot.y}%`,
    width: `${hotspot.w}%`,
    height: `${hotspot.h}%`,
  }

  const customStyle = hotspot.style
    ? {
        borderColor: hotspot.style.color,
        backgroundColor: hexToRgba(hotspot.style.color, hotspot.style.opacity),
        borderRadius: `${hotspot.style.borderRadius}%`,
      }
    : {}

  return (
    <div
      className={clsx(
        'hotspot-overlay',
        mode,
        isSelected && 'selected',
        hotspot.link_type === 'url' && 'url-type',
        hotspot.style && 'custom-styled',
      )}
      style={{ ...baseStyle, ...customStyle }}
      onClick={onClick}
      title={hotspot.tooltip || undefined}
    >
      {hotspot.style?.icon && (
        <span className="hotspot-icon">{hotspot.style.icon}</span>
      )}
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
