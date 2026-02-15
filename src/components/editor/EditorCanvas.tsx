import { useCallback, useEffect, useRef, useState } from 'react'
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

  const [zoomLevel, setZoomLevel] = useState(100)

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(200, prev + 10))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(30, prev - 10))
  }, [])

  const handleZoomReset = useCallback(() => {
    setZoomLevel(100)
  }, [])

  const canvasRef = useRef<HTMLDivElement>(null)

  // Native wheel listener with { passive: false } so preventDefault works
  // to block the browser's default Ctrl+Scroll page zoom
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      const delta = e.deltaY < 0 ? 10 : -10
      setZoomLevel((prev) => Math.max(30, Math.min(200, prev + delta)))
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

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
      // Don't intercept keys when typing in form inputs
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

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
      ref={canvasRef}
      className="editor-canvas"
      onClick={handleCanvasClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="editor-canvas-viewport" style={{ maxWidth: `${zoomLevel * 10}px` }}>
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
            slideId={selectedSlideId ?? undefined}
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
              cursor:
                editorTool === 'select'
                  ? 'default'
                  : editorTool === 'text'
                    ? 'text'
                    : 'crosshair',
              pointerEvents: editorTool === 'select' ? 'none' : 'auto',
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
      <div className="editor-zoom-controls">
        <button className="editor-zoom-btn" onClick={handleZoomOut} title="縮小">
          −
        </button>
        <button className="editor-zoom-label" onClick={handleZoomReset} title="リセット">
          {zoomLevel}%
        </button>
        <button className="editor-zoom-btn" onClick={handleZoomIn} title="拡大">
          +
        </button>
      </div>
    </div>
  )
}
