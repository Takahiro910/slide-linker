import type { TextOverlay } from '../../types'

interface TextOverlayItemProps {
  overlay: TextOverlay
  isSelected: boolean
  onClick?: (e: React.MouseEvent) => void
}

export function TextOverlayItem({
  overlay,
  isSelected,
  onClick,
}: TextOverlayItemProps) {
  return (
    <div
      className={`text-overlay-item${isSelected ? ' selected' : ''}`}
      style={{
        position: 'absolute',
        left: `${overlay.x}%`,
        top: `${overlay.y}%`,
        width: `${overlay.w}%`,
        height: `${overlay.h}%`,
        fontSize: `${overlay.fontSize}px`,
        fontWeight: overlay.fontWeight,
        color: overlay.color,
        background: overlay.backgroundColor,
        textAlign: overlay.textAlign,
        borderRadius: `${overlay.borderRadius}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent:
          overlay.textAlign === 'left'
            ? 'flex-start'
            : overlay.textAlign === 'right'
              ? 'flex-end'
              : 'center',
        overflow: 'hidden',
        wordBreak: 'break-word',
        padding: '2px 4px',
        cursor: 'pointer',
        pointerEvents: 'auto',
      }}
      onClick={onClick}
    >
      {overlay.text}
    </div>
  )
}
