import { useCallback } from 'react'
import { useStore } from '../../store'
import { SlideWrapper } from './SlideWrapper'
import { HotspotLayer } from './HotspotLayer'
import { TextOverlayLayer } from './TextOverlayLayer'
import { useHotspotDrawing } from '../../hooks/useHotspotDrawing'
import { useTextOverlayDrawing } from '../../hooks/useTextOverlayDrawing'

export function EditorCanvas() {
  const project = useStore((s) => s.project)
  const selectedSlideId = useStore((s) => s.selectedSlideId)
  const selectedHotspotId = useStore((s) => s.selectedHotspotId)
  const selectedTextOverlayId = useStore((s) => s.selectedTextOverlayId)
  const editorTool = useStore((s) => s.editorTool)
  const imageCache = useStore((s) => s.imageCache)
  const selectHotspot = useStore((s) => s.selectHotspot)
  const selectTextOverlay = useStore((s) => s.selectTextOverlay)
  const removeHotspot = useStore((s) => s.removeHotspot)
  const removeTextOverlay = useStore((s) => s.removeTextOverlay)

  const currentSlide = project?.slides.find((s) => s.id === selectedSlideId)
  const imageSrc = currentSlide ? imageCache[currentSlide.image_path] : undefined

  const hotspotDrawing = useHotspotDrawing()
  const textOverlayDrawing = useTextOverlayDrawing()

  const drawing = editorTool === 'text' ? textOverlayDrawing : hotspotDrawing

  const drawBorderColor =
    editorTool === 'text'
      ? 'rgba(168, 85, 247, 0.8)'
      : 'rgba(99, 200, 255, 0.8)'

  const drawBgColor =
    editorTool === 'text'
      ? 'rgba(168, 85, 247, 0.1)'
      : 'rgba(99, 200, 255, 0.1)'

  const handleHotspotClick = useCallback(
    (hotspotId: string, e: React.MouseEvent) => {
      e.stopPropagation()
      selectHotspot(hotspotId)
    },
    [selectHotspot],
  )

  const handleTextOverlayClick = useCallback(
    (overlayId: string, e: React.MouseEvent) => {
      e.stopPropagation()
      selectTextOverlay(overlayId)
    },
    [selectTextOverlay],
  )

  const handleCanvasClick = useCallback(() => {
    selectHotspot(null)
    selectTextOverlay(null)
  }, [selectHotspot, selectTextOverlay])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Delete' && selectedSlideId) {
        if (selectedHotspotId) {
          removeHotspot(selectedSlideId, selectedHotspotId)
          selectHotspot(null)
        } else if (selectedTextOverlayId) {
          removeTextOverlay(selectedSlideId, selectedTextOverlayId)
          selectTextOverlay(null)
        }
      }
      if (e.key === 'Escape') {
        selectHotspot(null)
        selectTextOverlay(null)
      }
    },
    [
      selectedHotspotId,
      selectedTextOverlayId,
      selectedSlideId,
      removeHotspot,
      removeTextOverlay,
      selectHotspot,
      selectTextOverlay,
    ],
  )

  if (!currentSlide) {
    return (
      <div className="editor-canvas empty">
        <p>{'\u30b9\u30e9\u30a4\u30c9\u3092\u9078\u629e\u3057\u3066\u7de8\u96c6\u3092\u958b\u59cb'}</p>
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
          <TextOverlayLayer
            overlays={currentSlide.text_overlays ?? []}
            selectedOverlayId={selectedTextOverlayId}
            onOverlayClick={handleTextOverlayClick}
          />
          {/* Drawing layer */}
          <div
            ref={drawing.layerRef}
            className="drawing-layer"
            style={{
              position: 'absolute',
              inset: 0,
              cursor: editorTool === 'text' ? 'text' : 'crosshair',
            }}
            onMouseDown={drawing.onMouseDown}
            onMouseMove={drawing.onMouseMove}
            onMouseUp={drawing.onMouseUp}
            onMouseLeave={drawing.onMouseUp}
          >
            {drawing.drawRect && (
              <div
                className="draw-rect"
                style={{
                  position: 'absolute',
                  left: `${drawing.drawRect.x}%`,
                  top: `${drawing.drawRect.y}%`,
                  width: `${drawing.drawRect.w}%`,
                  height: `${drawing.drawRect.h}%`,
                  border: `2px dashed ${drawBorderColor}`,
                  background: drawBgColor,
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
