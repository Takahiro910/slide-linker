import type { ReactNode } from 'react'

interface SlideWrapperProps {
  aspectRatio: string
  children: ReactNode
  className?: string
}

export function SlideWrapper({
  aspectRatio,
  children,
  className = '',
}: SlideWrapperProps) {
  const arCss = aspectRatio.replace(':', '/')

  return (
    <div
      className={`slide-wrapper ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: arCss,
      }}
    >
      {children}
    </div>
  )
}
