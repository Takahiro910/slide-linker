import { useStore } from '../../store'
import type { Hotspot } from '../../types'

interface GraphLinkListProps {
  slideId: string
  graphLinks: string[]
}

export function GraphLinkList({ slideId, graphLinks }: GraphLinkListProps) {
  const slides = useStore((s) => s.project?.slides ?? [])
  const addHotspot = useStore((s) => s.addHotspot)
  const removeGraphLink = useStore((s) => s.removeGraphLink)

  if (graphLinks.length === 0) return null

  const slideMap = new Map(slides.map((s) => [s.id, s]))

  function handleConvertToHotspot(targetId: string) {
    const target = slideMap.get(targetId)
    const hotspot: Hotspot = {
      id: `hs-${crypto.randomUUID().slice(0, 8)}`,
      name: target?.label ?? targetId,
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      link_type: 'slide',
      target_id: targetId,
      url: null,
    }
    addHotspot(slideId, hotspot)
    removeGraphLink(slideId, targetId)
  }

  function handleDelete(targetId: string) {
    removeGraphLink(slideId, targetId)
  }

  return (
    <div className="graph-link-list">
      {graphLinks.map((targetId) => {
        const target = slideMap.get(targetId)
        return (
          <div key={targetId} className="graph-link-list-item">
            <span className="graph-link-list-indicator" />
            <span className="graph-link-list-label">
              {target?.label ?? targetId}
            </span>
            <button
              className="graph-link-list-convert"
              onClick={() => handleConvertToHotspot(targetId)}
              title="ホットスポットに変換"
            >
              HS
            </button>
            <button
              className="graph-link-list-delete"
              onClick={() => handleDelete(targetId)}
              title="削除"
            >
              &times;
            </button>
          </div>
        )
      })}
    </div>
  )
}
