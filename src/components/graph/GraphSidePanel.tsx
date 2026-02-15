import type { Slide } from '../../types'
import { useStore } from '../../store'

interface GraphSidePanelProps {
  slide: Slide
  allSlides: Slide[]
  imageCache: Record<string, string>
  onClose: () => void
  onOpenInEditor: (slideId: string) => void
}

export function GraphSidePanel({
  slide,
  allSlides,
  imageCache,
  onClose,
  onOpenInEditor,
}: GraphSidePanelProps) {
  const removeHotspot = useStore((s) => s.removeHotspot)
  const removeGraphLink = useStore((s) => s.removeGraphLink)
  const toggleSlideMain = useStore((s) => s.toggleSlideMain)
  const addHotspot = useStore((s) => s.addHotspot)

  const slideMap = new Map(allSlides.map((s) => [s.id, s]))

  // Hotspot links (slide type only)
  const hotspotLinks = slide.hotspots.filter(
    (h) => h.link_type === 'slide' && h.target_id,
  )

  // Graph links
  const graphLinks = slide.graph_links ?? []

  const handleConvertToHotspot = (targetId: string) => {
    // Create a full-slide hotspot covering 100%
    const hotspot = {
      id: `hs-${crypto.randomUUID().slice(0, 8)}`,
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      link_type: 'slide' as const,
      target_id: targetId,
      url: null,
    }
    addHotspot(slide.id, hotspot)
    removeGraphLink(slide.id, targetId)
  }

  return (
    <div className="graph-side-panel">
      <div className="graph-side-panel-header">
        <h4>{slide.label}</h4>
        <button className="graph-side-panel-close" onClick={onClose}>
          &times;
        </button>
      </div>

      <div className="graph-side-panel-thumb">
        {imageCache[slide.image_path] ? (
          <img src={imageCache[slide.image_path]} alt={slide.label} />
        ) : (
          <div className="graph-node-placeholder" />
        )}
      </div>

      <div className="graph-side-panel-actions">
        <button
          className="graph-side-panel-btn"
          onClick={() => toggleSlideMain(slide.id)}
        >
          {slide.is_main ? 'Sub に変更' : 'Main に変更'}
        </button>
        <button
          className="graph-side-panel-btn"
          onClick={() => onOpenInEditor(slide.id)}
        >
          エディタで開く
        </button>
      </div>

      {hotspotLinks.length > 0 && (
        <div className="graph-side-panel-section">
          <h5>ホットスポットリンク</h5>
          <ul className="graph-side-panel-links">
            {hotspotLinks.map((h) => {
              const target = h.target_id ? slideMap.get(h.target_id) : null
              return (
                <li key={h.id} className="graph-side-panel-link hotspot">
                  <span className="graph-link-indicator hotspot" />
                  <span className="graph-link-label">
                    {target?.label ?? h.target_id ?? '不明'}
                  </span>
                  <button
                    className="graph-link-delete"
                    onClick={() => removeHotspot(slide.id, h.id)}
                    title="削除"
                  >
                    &times;
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {graphLinks.length > 0 && (
        <div className="graph-side-panel-section">
          <h5>グラフリンク</h5>
          <ul className="graph-side-panel-links">
            {graphLinks.map((targetId) => {
              const target = slideMap.get(targetId)
              return (
                <li key={targetId} className="graph-side-panel-link graph">
                  <span className="graph-link-indicator graph" />
                  <span className="graph-link-label">
                    {target?.label ?? targetId}
                  </span>
                  <button
                    className="graph-link-convert"
                    onClick={() => handleConvertToHotspot(targetId)}
                    title="ホットスポットに変換"
                  >
                    HS
                  </button>
                  <button
                    className="graph-link-delete"
                    onClick={() => removeGraphLink(slide.id, targetId)}
                    title="削除"
                  >
                    &times;
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {hotspotLinks.length === 0 && graphLinks.length === 0 && (
        <div className="graph-side-panel-empty">
          リンクなし。ノード間をドラッグして接続できます。
        </div>
      )}
    </div>
  )
}
