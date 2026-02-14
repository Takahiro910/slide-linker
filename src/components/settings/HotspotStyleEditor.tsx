import type { HotspotStyle } from '../../types'

const DEFAULT_STYLE: HotspotStyle = {
  color: '#63c8ff',
  opacity: 0.3,
  borderRadius: 0,
  icon: null,
}

interface HotspotStyleEditorProps {
  style: HotspotStyle | undefined
  onChange: (style: HotspotStyle) => void
}

export function HotspotStyleEditor({
  style,
  onChange,
}: HotspotStyleEditorProps) {
  const current = style ?? DEFAULT_STYLE

  function handleColorChange(color: string) {
    onChange({ ...current, color })
  }

  function handleOpacityChange(opacity: number) {
    onChange({ ...current, opacity })
  }

  function handleBorderRadiusChange(borderRadius: number) {
    onChange({ ...current, borderRadius })
  }

  function handleIconChange(value: string) {
    onChange({ ...current, icon: value || null })
  }

  return (
    <div className="hotspot-style-editor">
      <div className="style-field">
        <label>色</label>
        <input
          type="color"
          value={current.color}
          onChange={(e) => handleColorChange(e.target.value)}
        />
      </div>

      <div className="style-field">
        <label>不透明度</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={current.opacity}
          onChange={(e) => handleOpacityChange(Number(e.target.value))}
        />
        <span className="style-value">{current.opacity.toFixed(2)}</span>
      </div>

      <div className="style-field">
        <label>角丸</label>
        <input
          type="range"
          min="0"
          max="50"
          step="1"
          value={current.borderRadius}
          onChange={(e) => handleBorderRadiusChange(Number(e.target.value))}
        />
        <span className="style-value">{current.borderRadius}%</span>
      </div>

      <div className="style-field">
        <label>アイコン</label>
        <input
          type="text"
          value={current.icon ?? ''}
          onChange={(e) => handleIconChange(e.target.value)}
          placeholder="絵文字（任意）"
          maxLength={4}
        />
      </div>
    </div>
  )
}
