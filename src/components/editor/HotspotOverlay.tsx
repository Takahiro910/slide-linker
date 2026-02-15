import { useCallback, useRef } from 'react'
import clsx from 'clsx'
import { useStore } from '../../store'
import type { Hotspot } from '../../types'

interface HotspotOverlayProps {
  hotspot: Hotspot
  isSelected: boolean
  mode: 'edit' | 'preview'
  slideId?: string
  onClick?: (e: React.MouseEvent) => void
}

function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

type HandleDir = 'nw' | 'ne' | 'sw' | 'se'

export function HotspotOverlay({
  hotspot,
  isSelected,
  mode,
  slideId,
  onClick,
}: HotspotOverlayProps) {
  const updateHotspot = useStore((s) => s.updateHotspot)

  const dragRef = useRef<{
    type: 'move' | 'resize'
    handle?: HandleDir
    startX: number
    startY: number
    origX: number
    origY: number
    origW: number
    origH: number
    layerRect: DOMRect
  } | null>(null)

  const getLayerRect = useCallback((el: HTMLElement): DOMRect | null => {
    const layer = el.closest('.hotspot-layer')
    return layer ? layer.getBoundingClientRect() : null
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, type: 'move' | 'resize', handle?: HandleDir) => {
      if (mode !== 'edit' || !slideId) return
      e.stopPropagation()
      e.preventDefault()

      const layerRect = getLayerRect(e.currentTarget as HTMLElement)
      if (!layerRect) return

      dragRef.current = {
        type,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        origX: hotspot.x,
        origY: hotspot.y,
        origW: hotspot.w,
        origH: hotspot.h,
        layerRect,
      }

      const onMouseMove = (ev: MouseEvent) => {
        const drag = dragRef.current
        if (!drag) return

        const dxPct =
          ((ev.clientX - drag.startX) / drag.layerRect.width) * 100
        const dyPct =
          ((ev.clientY - drag.startY) / drag.layerRect.height) * 100

        if (drag.type === 'move') {
          const newX = Math.max(
            0,
            Math.min(100 - drag.origW, drag.origX + dxPct),
          )
          const newY = Math.max(
            0,
            Math.min(100 - drag.origH, drag.origY + dyPct),
          )
          updateHotspot(slideId, hotspot.id, { x: newX, y: newY })
        } else if (drag.type === 'resize' && drag.handle) {
          let newX = drag.origX
          let newY = drag.origY
          let newW = drag.origW
          let newH = drag.origH

          if (drag.handle.includes('e')) {
            newW = Math.max(1, Math.min(100 - drag.origX, drag.origW + dxPct))
          }
          if (drag.handle.includes('w')) {
            const moved = Math.min(dxPct, drag.origW - 1)
            newX = Math.max(0, drag.origX + moved)
            newW = drag.origW - (newX - drag.origX)
          }
          if (drag.handle.includes('s')) {
            newH = Math.max(1, Math.min(100 - drag.origY, drag.origH + dyPct))
          }
          if (drag.handle.includes('n')) {
            const moved = Math.min(dyPct, drag.origH - 1)
            newY = Math.max(0, drag.origY + moved)
            newH = drag.origH - (newY - drag.origY)
          }

          updateHotspot(slideId, hotspot.id, {
            x: newX,
            y: newY,
            w: newW,
            h: newH,
          })
        }
      }

      const onMouseUp = () => {
        dragRef.current = null
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    },
    [mode, slideId, hotspot.id, hotspot.x, hotspot.y, hotspot.w, hotspot.h, updateHotspot, getLayerRect],
  )

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${hotspot.x}%`,
    top: `${hotspot.y}%`,
    width: `${hotspot.w}%`,
    height: `${hotspot.h}%`,
  }

  const customStyle = hotspot.style
    ? {
        borderColor: hotspot.style.color,
        backgroundColor: hexToRgba(hotspot.style.color, hotspot.style.opacity),
        borderRadius: `${hotspot.style.borderRadius}%`,
      }
    : {}

  return (
    <div
      className={clsx(
        'hotspot-overlay',
        mode,
        isSelected && 'selected',
        hotspot.link_type === 'url' && 'url-type',
        hotspot.style && 'custom-styled',
      )}
      style={{ ...baseStyle, ...customStyle }}
      onClick={onClick}
      onMouseDown={
        mode === 'edit' && isSelected && slideId
          ? (e) => handleMouseDown(e, 'move')
          : undefined
      }
      title={hotspot.tooltip || undefined}
    >
      {hotspot.name && mode === 'edit' && (
        <span className="hotspot-name-badge">{hotspot.name}</span>
      )}
      {hotspot.style?.icon && (
        <span className="hotspot-icon">{hotspot.style.icon}</span>
      )}
      {mode === 'edit' && isSelected && (
        <>
          <div
            className="resize-handle nw"
            onMouseDown={(e) => handleMouseDown(e, 'resize', 'nw')}
          />
          <div
            className="resize-handle ne"
            onMouseDown={(e) => handleMouseDown(e, 'resize', 'ne')}
          />
          <div
            className="resize-handle sw"
            onMouseDown={(e) => handleMouseDown(e, 'resize', 'sw')}
          />
          <div
            className="resize-handle se"
            onMouseDown={(e) => handleMouseDown(e, 'resize', 'se')}
          />
        </>
      )}
    </div>
  )
}
