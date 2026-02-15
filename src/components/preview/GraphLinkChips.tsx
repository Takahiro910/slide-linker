import type { Slide } from '../../types'

interface GraphLinkChipsProps {
  slide: Slide
  allSlides: Slide[]
  onNavigate: (slideId: string) => void
}

/**
 * Displays graph_links as clickable chips below the slide.
 * Only shown when graph_links exist and point to valid slides.
 */
export function GraphLinkChips({
  slide,
  allSlides,
  onNavigate,
}: GraphLinkChipsProps) {
  const graphLinks = slide.graph_links ?? []
  if (graphLinks.length === 0) return null

  const validLinks = graphLinks
    .map((targetId) => {
      const target = allSlides.find(
        (s) => s.id === targetId && s.enabled !== false,
      )
      return target ? { id: target.id, label: target.label } : null
    })
    .filter(Boolean) as { id: string; label: string }[]

  if (validLinks.length === 0) return null

  return (
    <div className="graph-link-chips">
      {validLinks.map((link) => (
        <button
          key={link.id}
          className="graph-link-chip"
          onClick={(e) => {
            e.stopPropagation()
            onNavigate(link.id)
          }}
        >
          {link.label}
        </button>
      ))}
    </div>
  )
}
