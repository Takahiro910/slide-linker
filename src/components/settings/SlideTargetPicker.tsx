import clsx from 'clsx'
import { useStore } from '../../store'

interface SlideTargetPickerProps {
  targetId: string | null
  onChange: (targetId: string) => void
}

export function SlideTargetPicker({
  targetId,
  onChange,
}: SlideTargetPickerProps) {
  const slides = useStore((s) => s.project?.slides ?? [])
  const imageCache = useStore((s) => s.imageCache)

  return (
    <div className="slide-target-picker">
      <label>リンク先</label>
      <div className="slide-target-grid">
        {slides.map((slide) => (
          <div
            key={slide.id}
            className={clsx(
              'slide-target-item',
              slide.id === targetId && 'selected',
            )}
            onClick={() => onChange(slide.id)}
          >
            <div className="slide-target-thumb">
              {imageCache[slide.image_path] ? (
                <img
                  src={imageCache[slide.image_path]}
                  alt={slide.label}
                  draggable={false}
                />
              ) : (
                <div className="slide-target-placeholder" />
              )}
            </div>
            <span className="slide-target-label">{slide.label}</span>
            <span
              className={clsx(
                'slide-badge small',
                slide.is_main ? 'main' : 'sub',
              )}
            >
              {slide.is_main ? 'M' : 'S'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
