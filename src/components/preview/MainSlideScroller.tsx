import { useRef, useEffect } from 'react'
import { PreviewSlide } from './PreviewSlide'
import { useStore } from '../../store'
import type { Slide } from '../../types'

interface MainSlideScrollerProps {
  slides: Slide[]
  aspectRatio: string
}

export function MainSlideScroller({
  slides,
  aspectRatio,
}: MainSlideScrollerProps) {
  const setMainSlideIndex = useStore((s) => s.setMainSlideIndex)
  const containerRef = useRef<HTMLDivElement>(null)
  const flashedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const slideEl = entry.target as HTMLElement
            const slideId = slideEl.dataset.slideId

            if (slideId && !flashedRef.current.has(slideId)) {
              flashedRef.current.add(slideId)
              slideEl.classList.add('in-view')
            }

            const idx = slides.findIndex((s) => s.id === slideId)
            if (idx >= 0) {
              setMainSlideIndex(idx)
            }
          }
        })
      },
      { threshold: 0.3 },
    )

    const slideEls = container.querySelectorAll('.preview-slide')
    slideEls.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [slides, setMainSlideIndex])

  return (
    <div className="main-slide-scroller" ref={containerRef}>
      {slides.map((slide) => (
        <PreviewSlide
          key={slide.id}
          slide={slide}
          aspectRatio={aspectRatio}
        />
      ))}
    </div>
  )
}
