import clsx from 'clsx'
import { useStore } from '../../store'
import type { TextOverlay } from '../../types'

interface TextOverlayListProps {
  overlays: TextOverlay[]
  selectedOverlayId: string | null
}

export function TextOverlayList({
  overlays,
  selectedOverlayId,
}: TextOverlayListProps) {
  const selectTextOverlay = useStore((s) => s.selectTextOverlay)

  if (overlays.length === 0) {
    return (
      <div className="hotspot-list-empty">
        <p>ツールバーで「テキスト」を選択し、キャンバス上をドラッグして追加</p>
      </div>
    )
  }

  return (
    <div className="hotspot-list">
      {overlays.map((overlay) => (
        <div
          key={overlay.id}
          className={clsx(
            'hotspot-list-item',
            overlay.id === selectedOverlayId && 'selected',
          )}
          onClick={() => selectTextOverlay(overlay.id)}
        >
          <span
            className="hotspot-type-indicator"
            style={{ background: 'var(--color-accent-purple, #a855f7)' }}
          />
          <span className="hotspot-list-label">
            {overlay.text.length > 20
              ? `${overlay.text.slice(0, 20)}...`
              : overlay.text}
          </span>
          <span className="hotspot-list-target">
            {overlay.fontSize}px
          </span>
        </div>
      ))}
    </div>
  )
}
