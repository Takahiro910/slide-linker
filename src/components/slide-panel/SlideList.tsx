import { useStore } from '../../store'
import { SlideItem } from './SlideItem'

export function SlideList() {
  const slides = useStore((s) => s.project?.slides ?? [])
  const slideFilter = useStore((s) => s.slideFilter)
  const selectedSlideId = useStore((s) => s.selectedSlideId)
  const selectSlide = useStore((s) => s.selectSlide)

  const filteredSlides = slides.filter((slide) => {
    if (slideFilter === 'main') return slide.is_main
    if (slideFilter === 'sub') return !slide.is_main
    return true
  })

  return (
    <div className="slide-list">
      {filteredSlides.map((slide) => (
        <SlideItem
          key={slide.id}
          slide={slide}
          isSelected={slide.id === selectedSlideId}
          onSelect={() => selectSlide(slide.id)}
        />
      ))}
      {filteredSlides.length === 0 && (
        <p className="slide-list-empty">スライドがありません</p>
      )}
    </div>
  )
}
