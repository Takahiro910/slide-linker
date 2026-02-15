import clsx from 'clsx'
import { useStore } from '../../store'
import type { Hotspot } from '../../types'

interface HotspotListProps {
  hotspots: Hotspot[]
  selectedHotspotId: string | null
}

export function HotspotList({
  hotspots,
  selectedHotspotId,
}: HotspotListProps) {
  const selectHotspot = useStore((s) => s.selectHotspot)

  if (hotspots.length === 0) {
    return (
      <div className="hotspot-list-empty">
        <p>キャンバス上をドラッグしてホットスポットを追加</p>
      </div>
    )
  }

  return (
    <div className="hotspot-list">
      {hotspots.map((hotspot) => (
        <div
          key={hotspot.id}
          className={clsx(
            'hotspot-list-item',
            hotspot.id === selectedHotspotId && 'selected',
          )}
          onClick={() => selectHotspot(hotspot.id)}
        >
          <span
            className={clsx(
              'hotspot-type-indicator',
              hotspot.link_type === 'url' ? 'url' : 'slide',
            )}
          />
          <span className="hotspot-list-label">
            {hotspot.name || hotspot.tooltip || hotspot.id}
          </span>
          <span className="hotspot-list-target">
            {hotspot.link_type === 'url'
              ? hotspot.url || 'URL未設定'
              : hotspot.target_id || '未設定'}
          </span>
        </div>
      ))}
    </div>
  )
}
