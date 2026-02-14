import clsx from 'clsx'

interface LinkTypeSelectorProps {
  linkType: 'slide' | 'url'
  onChange: (linkType: 'slide' | 'url') => void
}

export function LinkTypeSelector({
  linkType,
  onChange,
}: LinkTypeSelectorProps) {
  return (
    <div className="link-type-selector">
      <label>リンク種別</label>
      <div className="link-type-options">
        <button
          className={clsx('link-type-btn', linkType === 'slide' && 'active')}
          onClick={() => onChange('slide')}
        >
          スライド
        </button>
        <button
          className={clsx('link-type-btn', linkType === 'url' && 'active')}
          onClick={() => onChange('url')}
        >
          URL
        </button>
      </div>
    </div>
  )
}
