import { useStore } from '../../store'
import { HotspotStyleEditor } from './HotspotStyleEditor'
import { LinkTypeSelector } from './LinkTypeSelector'
import { SlideTargetPicker } from './SlideTargetPicker'
import { UrlInput } from './UrlInput'
import type { Hotspot, HotspotStyle } from '../../types'

interface HotspotDetailProps {
  hotspot: Hotspot
  slideId: string
}

export function HotspotDetail({ hotspot, slideId }: HotspotDetailProps) {
  const updateHotspot = useStore((s) => s.updateHotspot)
  const removeHotspot = useStore((s) => s.removeHotspot)
  const selectHotspot = useStore((s) => s.selectHotspot)

  function handleLinkTypeChange(linkType: 'slide' | 'url') {
    updateHotspot(slideId, hotspot.id, {
      link_type: linkType,
      target_id: linkType === 'slide' ? hotspot.target_id : null,
      url: linkType === 'url' ? hotspot.url : null,
    })
  }

  function handleTargetChange(targetId: string) {
    updateHotspot(slideId, hotspot.id, { target_id: targetId })
  }

  function handleUrlChange(url: string) {
    updateHotspot(slideId, hotspot.id, { url })
  }

  function handleTooltipChange(tooltip: string) {
    updateHotspot(slideId, hotspot.id, { tooltip: tooltip || undefined })
  }

  function handleStyleChange(newStyle: HotspotStyle) {
    updateHotspot(slideId, hotspot.id, { style: newStyle })
  }

  function handleDelete() {
    removeHotspot(slideId, hotspot.id)
    selectHotspot(null)
  }

  return (
    <div className="hotspot-detail">
      <h4>ホットスポット設定</h4>

      <LinkTypeSelector
        linkType={hotspot.link_type}
        onChange={handleLinkTypeChange}
      />

      {hotspot.link_type === 'slide' ? (
        <SlideTargetPicker
          targetId={hotspot.target_id}
          onChange={handleTargetChange}
        />
      ) : (
        <UrlInput url={hotspot.url ?? ''} onChange={handleUrlChange} />
      )}

      <div className="hotspot-field">
        <label>ツールチップ</label>
        <input
          type="text"
          value={hotspot.tooltip ?? ''}
          onChange={(e) => handleTooltipChange(e.target.value)}
          placeholder="ホバー時の説明文（任意）"
          className="hotspot-input"
        />
      </div>

      <div className="hotspot-field">
        <label>スタイル</label>
        <HotspotStyleEditor
          style={hotspot.style}
          onChange={handleStyleChange}
        />
      </div>

      <div className="hotspot-coords">
        <span>x: {hotspot.x.toFixed(1)}%</span>
        <span>y: {hotspot.y.toFixed(1)}%</span>
        <span>w: {hotspot.w.toFixed(1)}%</span>
        <span>h: {hotspot.h.toFixed(1)}%</span>
      </div>

      <button className="hotspot-delete-btn" onClick={handleDelete}>
        削除
      </button>
    </div>
  )
}
