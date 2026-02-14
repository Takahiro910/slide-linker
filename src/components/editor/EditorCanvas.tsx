import { useCallback } from 'react'
import { useStore } from '../../store'
import { SlideWrapper } from './SlideWrapper'
import { HotspotLayer } from './HotspotLayer'
import { useHotspotDrawing } from '../../hooks/useHotspotDrawing'

export function EditorCanvas() {
  const project = useStore((s) => s.project)
  const selectedSlideId = useStore((s) => s.selectedSlideId)
  const selectedHotspotId = useStore((s) => s.selectedHotspotId)
  const imageCache = useStore((s) => s.imageCache)
  const selectHotspot = useStore((s) => s.selectHotspot)
  const removeHotspot = useStore((s) => s.removeHotspot)

  const currentSlide = project?.slides.find((s) => s.id === selectedSlideId)
  const imageSrc = currentSlide ? imageCache[currentSlide.image_path] : undefined

  const { layerRef, drawRect, onMouseDown, onMouseMove, onMouseUp } =
    useHotspotDrawing()

  const handleHotspotClick = useCallback(
    (hotspotId: string, e: React.MouseEvent) => {
      e.stopPropagation()
      selectHotspot(hotspotId)
    },
    [selectHotspot],
  )

  const handleCanvasClick = useCallback(() => {
    selectHotspot(null)
  }, [selectHotspot])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Delete' && selectedHotspotId && selectedSlideId) {
        removeHotspot(selectedSlideId, selectedHotspotId)
        selectHotspot(null)
      }
      if (e.key === 'Escape') {
        selectHotspot(null)
      }
    },
    [selectedHotspotId, selectedSlideId, removeHotspot, selectHotspot],
  )

  if (!currentSlide) {
    return (
      <div className="editor-canvas empty">
        <p>スライドを選択して編集を開始</p>
      </div>
    )
  }

  return (
    <div
      className="editor-canvas"
      onClick={handleCanvasClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="editor-canvas-viewport">
        <SlideWrapper aspectRatio={project?.aspect_ratio ?? '16:9'}>
          {imageSrc && (
            <img
              src={imageSrc}
              alt={currentSlide.label}
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
            hotspots={currentSlide.hotspots}
            selectedHotspotId={selectedHotspotId}
            mode="edit"
            onHotspotClick={handleHotspotClick}
          />
          {/* Drawing layer */}
          <div
            ref={layerRef}
            className="drawing-layer"
            style={{ position: 'absolute', inset: 0, cursor: 'crosshair' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            {drawRect && (
              <div
                className="draw-rect"
                style={{
                  position: 'absolute',
                  left: `${drawRect.x}%`,
                  top: `${drawRect.y}%`,
                  width: `${drawRect.w}%`,
                  height: `${drawRect.h}%`,
                  border: '2px dashed rgba(99, 200, 255, 0.8)',
                  background: 'rgba(99, 200, 255, 0.1)',
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
        </SlideWrapper>
      </div>
    </div>
  )
}
