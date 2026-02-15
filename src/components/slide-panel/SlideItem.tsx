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
  const toggleSlideEnabled = useStore((s) => s.toggleSlideEnabled)

  const thumbSrc = imageCache[slide.image_path]
  const isEnabled = slide.enabled !== false

  return (
    <div
      className={clsx('slide-item', isSelected && 'selected', !isEnabled && 'disabled')}
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
        className={clsx('slide-visibility-btn', !isEnabled && 'off')}
        onClick={(e) => {
          e.stopPropagation()
          toggleSlideEnabled(slide.id)
        }}
        title={isEnabled ? 'スライドを無効化' : 'スライドを有効化'}
      >
        {isEnabled ? '\u{1F441}' : '\u25CB'}
      </button>
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
