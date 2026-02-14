import clsx from 'clsx'
import { useStore } from '../../store'

interface DotNavigationProps {
  count: number
}

export function DotNavigation({ count }: DotNavigationProps) {
  const currentMainSlideIndex = useStore((s) => s.currentMainSlideIndex)

  function scrollToSlide(index: number) {
    const slides = document.querySelectorAll('.preview-slide')
    slides[index]?.scrollIntoView({ behavior: 'smooth' })
  }

  if (count <= 1) return null

  return (
    <nav className="dot-navigation">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          className={clsx('dot', currentMainSlideIndex === i && 'active')}
          onClick={() => scrollToSlide(i)}
          aria-label={`Go to slide ${i + 1}`}
        />
      ))}
    </nav>
  )
}
