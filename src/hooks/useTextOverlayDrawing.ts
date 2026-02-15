import { useCallback, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useStore } from '../store'
import type { TextOverlay } from '../types'

interface DrawRect {
  x: number
  y: number
  w: number
  h: number
}

const MIN_SIZE_PERCENT = 1

export function useTextOverlayDrawing() {
  const selectedSlideId = useStore((s) => s.selectedSlideId)
  const addTextOverlay = useStore((s) => s.addTextOverlay)
  const selectTextOverlay = useStore((s) => s.selectTextOverlay)
  const setEditorTool = useStore((s) => s.setEditorTool)

  const [drawRect, setDrawRect] = useState<DrawRect | null>(null)
  const originRef = useRef<{ x: number; y: number } | null>(null)
  const layerRef = useRef<HTMLDivElement | null>(null)

  const toPercent = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const layer = layerRef.current
      if (!layer) return { x: 0, y: 0 }
      const rect = layer.getBoundingClientRect()
      const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
      const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100))
      return { x, y }
    },
    [],
  )

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return
      const pos = toPercent(e.clientX, e.clientY)
      originRef.current = pos
      setDrawRect({ x: pos.x, y: pos.y, w: 0, h: 0 })
    },
    [toPercent],
  )

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!originRef.current) return
      const pos = toPercent(e.clientX, e.clientY)
      const origin = originRef.current

      const x = Math.min(origin.x, pos.x)
      const y = Math.min(origin.y, pos.y)
      const w = Math.abs(pos.x - origin.x)
      const h = Math.abs(pos.y - origin.y)

      setDrawRect({ x, y, w, h })
    },
    [toPercent],
  )

  const onMouseUp = useCallback(() => {
    if (!originRef.current || !drawRect || !selectedSlideId) {
      originRef.current = null
      setDrawRect(null)
      return
    }

    if (drawRect.w >= MIN_SIZE_PERCENT && drawRect.h >= MIN_SIZE_PERCENT) {
      const overlay: TextOverlay = {
        id: `to-${uuidv4().slice(0, 8)}`,
        x: drawRect.x,
        y: drawRect.y,
        w: drawRect.w,
        h: drawRect.h,
        text: '\u30c6\u30ad\u30b9\u30c8',
        fontSize: 14,
        fontWeight: 'normal',
        color: '#e2e8f0',
        backgroundColor: 'rgba(20, 24, 37, 0.8)',
        textAlign: 'center',
        borderRadius: 4,
      }
      addTextOverlay(selectedSlideId, overlay)
      selectTextOverlay(overlay.id)
      setEditorTool('select')
    }

    originRef.current = null
    setDrawRect(null)
  }, [drawRect, selectedSlideId, addTextOverlay, selectTextOverlay, setEditorTool])

  return {
    layerRef,
    drawRect,
    onMouseDown,
    onMouseMove,
    onMouseUp,
  }
}
