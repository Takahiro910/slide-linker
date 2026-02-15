import { useCallback } from 'react'
import { useStore } from '../../store'
import { SlideWrapper } from '../editor/SlideWrapper'
import { HotspotLayer } from '../editor/HotspotLayer'
import { GraphLinkChips } from './GraphLinkChips'
import type { Slide } from '../../types'

interface PreviewSlideProps {
  slide: Slide
  aspectRatio: string
}

export function PreviewSlide({ slide, aspectRatio }: PreviewSlideProps) {
  const project = useStore((s) => s.project)
  const imageCache = useStore((s) => s.imageCache)
  const pushNavigation = useStore((s) => s.pushNavigation)
  const imageSrc = imageCache[slide.image_path]

  const handleHotspotClick = useCallback(
    (hotspotId: string, e: React.MouseEvent) => {
      e.stopPropagation()
      const hotspot = slide.hotspots.find((h) => h.id === hotspotId)
      if (!hotspot) return

      if (hotspot.link_type === 'url' && hotspot.url) {
        window.open(hotspot.url, '_blank', 'noopener')
      } else if (hotspot.link_type === 'slide' && hotspot.target_id) {
        pushNavigation(hotspot.target_id)
      }
    },
    [slide.hotspots, pushNavigation],
  )

  return (
    <div className="preview-slide" data-slide-id={slide.id}>
      <SlideWrapper aspectRatio={aspectRatio}>
        {imageSrc && (
          <img
            src={imageSrc}
            alt={slide.label}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              display: 'block',
            }}
            draggable={false}
          />
        )}
        <HotspotLayer
          hotspots={slide.hotspots}
          selectedHotspotId={null}
          mode="preview"
          onHotspotClick={handleHotspotClick}
        />
      </SlideWrapper>
      <GraphLinkChips
        slide={slide}
        allSlides={project?.slides ?? []}
        onNavigate={pushNavigation}
      />
    </div>
  )
}
