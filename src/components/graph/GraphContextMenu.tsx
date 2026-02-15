import { useEffect, useRef } from 'react'
import { useStore } from '../../store'

interface GraphContextMenuProps {
  x: number
  y: number
  slideId: string
  onClose: () => void
  onOpenInEditor: (slideId: string) => void
}

export function GraphContextMenu({
  x,
  y,
  slideId,
  onClose,
  onOpenInEditor,
}: GraphContextMenuProps) {
  const project = useStore((s) => s.project)
  const toggleSlideMain = useStore((s) => s.toggleSlideMain)
  const toggleSlideEnabled = useStore((s) => s.toggleSlideEnabled)
  const removeAllLinksFromSlide = useStore((s) => s.removeAllLinksFromSlide)

  const menuRef = useRef<HTMLDivElement>(null)

  const slide = project?.slides.find((s) => s.id === slideId)

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  if (!slide) return null

  const handleToggleMain = () => {
    toggleSlideMain(slideId)
    onClose()
  }

  const handleToggleEnabled = () => {
    toggleSlideEnabled(slideId)
    onClose()
  }

  const handleOpenEditor = () => {
    onOpenInEditor(slideId)
    onClose()
  }

  const handleDeleteAllLinks = () => {
    removeAllLinksFromSlide(slideId)
    onClose()
  }

  const hasLinks =
    (slide.graph_links ?? []).length > 0 ||
    slide.hotspots.some((h) => h.link_type === 'slide' && h.target_id)

  return (
    <div
      ref={menuRef}
      className="graph-context-menu"
      style={{ left: x, top: y }}
    >
      <button className="graph-context-item" onClick={handleToggleMain}>
        {slide.is_main ? 'Sub に変更' : 'Main に変更'}
      </button>
      <button className="graph-context-item" onClick={handleToggleEnabled}>
        {slide.enabled !== false ? '無効にする' : '有効にする'}
      </button>
      <button className="graph-context-item" onClick={handleOpenEditor}>
        エディタで開く
      </button>
      {hasLinks && (
        <button
          className="graph-context-item danger"
          onClick={handleDeleteAllLinks}
        >
          リンク全削除
        </button>
      )}
    </div>
  )
}
