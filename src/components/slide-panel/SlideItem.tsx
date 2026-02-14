import clsx from 'clsx'
import { useStore } from '../../store'
import type { Slide } from '../../types'

interface SlideItemProps {
  slide: Slide
  isSelected: boolean
  onSelect: () => void
}

export function SlideItem({ slide, isSelected, onSelect }: SlideItemProps) {
  const imageCache = useStore((s) => s.imageCache)
  const toggleSlideMain = useStore((s) => s.toggleSlideMain)

  const thumbSrc = imageCache[slide.image_path]

  return (
    <div
      className={clsx('slide-item', isSelected && 'selected')}
      onClick={onSelect}
    >
      <div className="slide-item-thumb">
        {thumbSrc ? (
          <img src={thumbSrc} alt={slide.label} draggable={false} />
        ) : (
          <div className="slide-item-placeholder" />
        )}
      </div>
      <div className="slide-item-info">
        <span className="slide-item-label">{slide.label}</span>
        <div className="slide-item-meta">
          <span
            className={clsx(
              'slide-badge',
              slide.is_main ? 'main' : 'sub',
            )}
          >
            {slide.is_main ? 'メイン' : 'サブ'}
          </span>
          <span className="slide-item-hotspot-count">
            {slide.hotspots.length > 0 && `${slide.hotspots.length} HS`}
          </span>
        </div>
      </div>
      <button
        className="slide-toggle-btn"
        onClick={(e) => {
          e.stopPropagation()
          toggleSlideMain(slide.id)
        }}
        title={slide.is_main ? 'サブに変更' : 'メインに変更'}
      >
        &#8644;
      </button>
    </div>
  )
}
