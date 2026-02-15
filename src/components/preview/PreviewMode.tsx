import { useEffect, useMemo, useCallback } from 'react'
import { useStore } from '../../store'
import { MainSlideScroller } from './MainSlideScroller'
import { DotNavigation } from './DotNavigation'
import { OverlayStack } from './OverlayStack'

export function PreviewMode() {
  const project = useStore((s) => s.project)
  const setEditorMode = useStore((s) => s.setEditorMode)
  const popNavigation = useStore((s) => s.popNavigation)
  const navigationStack = useStore((s) => s.navigationStack)
  const clearNavigation = useStore((s) => s.clearNavigation)

  const mainSlides = useMemo(
    () => project?.slides.filter((s) => s.is_main && s.enabled !== false) ?? [],
    [project],
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (navigationStack.length > 0) {
          popNavigation()
        } else {
          setEditorMode('edit')
        }
      }
    },
    [navigationStack.length, popNavigation, setEditorMode],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    return () => clearNavigation()
  }, [clearNavigation])

  if (!project) return null

  return (
    <div className="preview-mode">
      <div className="preview-toolbar">
        <button
          className="preview-back-btn"
          onClick={() => setEditorMode('edit')}
        >
          &#8592; 編集に戻る
        </button>
      </div>
      <MainSlideScroller
        slides={mainSlides}
        aspectRatio={project.aspect_ratio}
      />
      <DotNavigation
        count={mainSlides.length}
      />
      <OverlayStack
        slides={project.slides}
        aspectRatio={project.aspect_ratio}
      />
    </div>
  )
}
