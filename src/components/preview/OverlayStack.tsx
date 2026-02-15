import { useCallback } from 'react'
import { useStore } from '../../store'
import { SlideWrapper } from '../editor/SlideWrapper'
import { HotspotLayer } from '../editor/HotspotLayer'
import { GraphLinkChips } from './GraphLinkChips'
import type { Slide } from '../../types'

interface OverlayStackProps {
  slides: Slide[]
  aspectRatio: string
}

export function OverlayStack({ slides, aspectRatio }: OverlayStackProps) {
  const navigationStack = useStore((s) => s.navigationStack)
  const pushNavigation = useStore((s) => s.pushNavigation)
  const popNavigation = useStore((s) => s.popNavigation)
  const imageCache = useStore((s) => s.imageCache)

  const handleHotspotClick = useCallback(
    (slide: Slide, hotspotId: string, e: React.MouseEvent) => {
      e.stopPropagation()
      const hotspot = slide.hotspots.find((h) => h.id === hotspotId)
      if (!hotspot) return

      if (hotspot.link_type === 'url' && hotspot.url) {
        window.open(hotspot.url, '_blank', 'noopener')
      } else if (hotspot.link_type === 'slide' && hotspot.target_id) {
        pushNavigation(hotspot.target_id)
      }
    },
    [pushNavigation],
  )

  return (
    <>
      {navigationStack.map((slideId, index) => {
        const slide = slides.find((s) => s.id === slideId)
        if (!slide) return null

        const imageSrc = imageCache[slide.image_path]

        return (
          <div
            key={`${slideId}-${index}`}
            className="overlay-modal"
            style={{ zIndex: 100 + index + 1 }}
          >
            <button className="overlay-back-btn" onClick={() => popNavigation()}>
              &#8592; 戻る
            </button>
            <div className="overlay-content">
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
                  onHotspotClick={(hotspotId, e) =>
                    handleHotspotClick(slide, hotspotId, e)
                  }
                />
              </SlideWrapper>
              <GraphLinkChips
                slide={slide}
                allSlides={slides}
                onNavigate={pushNavigation}
              />
            </div>
          </div>
        )
      })}
    </>
  )
}
