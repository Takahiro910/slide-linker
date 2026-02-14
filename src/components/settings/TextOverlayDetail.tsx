import { useStore } from '../../store'
import type { TextOverlay } from '../../types'

interface TextOverlayDetailProps {
  overlay: TextOverlay
  slideId: string
}

export function TextOverlayDetail({ overlay, slideId }: TextOverlayDetailProps) {
  const updateTextOverlay = useStore((s) => s.updateTextOverlay)
  const removeTextOverlay = useStore((s) => s.removeTextOverlay)
  const selectTextOverlay = useStore((s) => s.selectTextOverlay)

  function handleTextChange(text: string) {
    updateTextOverlay(slideId, overlay.id, { text })
  }

  function handleFontSizeChange(fontSize: number) {
    updateTextOverlay(slideId, overlay.id, { fontSize })
  }

  function handleFontWeightToggle() {
    const fontWeight = overlay.fontWeight === 'normal' ? 'bold' : 'normal'
    updateTextOverlay(slideId, overlay.id, { fontWeight })
  }

  function handleColorChange(color: string) {
    updateTextOverlay(slideId, overlay.id, { color })
  }

  function handleBackgroundColorChange(backgroundColor: string) {
    updateTextOverlay(slideId, overlay.id, { backgroundColor })
  }

  function handleTextAlignChange(textAlign: 'left' | 'center' | 'right') {
    updateTextOverlay(slideId, overlay.id, { textAlign })
  }

  function handleBorderRadiusChange(borderRadius: number) {
    updateTextOverlay(slideId, overlay.id, { borderRadius })
  }

  function handleDelete() {
    removeTextOverlay(slideId, overlay.id)
    selectTextOverlay(null)
  }

  return (
    <div className="hotspot-detail">
      <h4>{'\u30c6\u30ad\u30b9\u30c8\u8a2d\u5b9a'}</h4>

      <div className="hotspot-field">
        <label>{'\u30c6\u30ad\u30b9\u30c8\u5185\u5bb9'}</label>
        <textarea
          value={overlay.text}
          onChange={(e) => handleTextChange(e.target.value)}
          className="hotspot-input"
          rows={3}
          style={{ resize: 'vertical' }}
        />
      </div>

      <div className="hotspot-field">
        <label>{'\u30d5\u30a9\u30f3\u30c8\u30b5\u30a4\u30ba'}</label>
        <input
          type="number"
          value={overlay.fontSize}
          onChange={(e) => handleFontSizeChange(Number(e.target.value))}
          min={8}
          max={72}
          className="hotspot-input"
        />
      </div>

      <div className="hotspot-field">
        <label>{'\u592a\u5b57'}</label>
        <div className="link-type-options">
          <button
            className={`link-type-btn${overlay.fontWeight === 'normal' ? ' active' : ''}`}
            onClick={() => overlay.fontWeight !== 'normal' && handleFontWeightToggle()}
          >
            Normal
          </button>
          <button
            className={`link-type-btn${overlay.fontWeight === 'bold' ? ' active' : ''}`}
            onClick={() => overlay.fontWeight !== 'bold' && handleFontWeightToggle()}
          >
            Bold
          </button>
        </div>
      </div>

      <div className="hotspot-field">
        <label>{'\u6587\u5b57\u8272'}</label>
        <input
          type="color"
          value={overlay.color}
          onChange={(e) => handleColorChange(e.target.value)}
          className="hotspot-input"
          style={{ height: 36, padding: 2 }}
        />
      </div>

      <div className="hotspot-field">
        <label>{'\u80cc\u666f\u8272'}</label>
        <input
          type="text"
          value={overlay.backgroundColor}
          onChange={(e) => handleBackgroundColorChange(e.target.value)}
          placeholder="rgba(20, 24, 37, 0.8)"
          className="hotspot-input"
        />
      </div>

      <div className="hotspot-field">
        <label>{'\u30c6\u30ad\u30b9\u30c8\u914d\u7f6e'}</label>
        <div className="link-type-options">
          <button
            className={`link-type-btn${overlay.textAlign === 'left' ? ' active' : ''}`}
            onClick={() => handleTextAlignChange('left')}
          >
            {'\u5de6'}
          </button>
          <button
            className={`link-type-btn${overlay.textAlign === 'center' ? ' active' : ''}`}
            onClick={() => handleTextAlignChange('center')}
          >
            {'\u4e2d\u592e'}
          </button>
          <button
            className={`link-type-btn${overlay.textAlign === 'right' ? ' active' : ''}`}
            onClick={() => handleTextAlignChange('right')}
          >
            {'\u53f3'}
          </button>
        </div>
      </div>

      <div className="hotspot-field">
        <label>{'\u89d2\u4e38 (px)'}</label>
        <input
          type="range"
          value={overlay.borderRadius}
          onChange={(e) => handleBorderRadiusChange(Number(e.target.value))}
          min={0}
          max={24}
          className="hotspot-input"
          style={{ padding: 0 }}
        />
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
          {overlay.borderRadius}px
        </span>
      </div>

      <div className="hotspot-coords">
        <span>x: {overlay.x.toFixed(1)}%</span>
        <span>y: {overlay.y.toFixed(1)}%</span>
        <span>w: {overlay.w.toFixed(1)}%</span>
        <span>h: {overlay.h.toFixed(1)}%</span>
      </div>

      <button className="hotspot-delete-btn" onClick={handleDelete}>
        {'\u524a\u9664'}
      </button>
    </div>
  )
}
