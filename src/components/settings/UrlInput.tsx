interface UrlInputProps {
  url: string
  onChange: (url: string) => void
}

export function UrlInput({ url, onChange }: UrlInputProps) {
  return (
    <div className="hotspot-field">
      <label>URL</label>
      <input
        type="url"
        value={url}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://..."
        className="hotspot-input"
      />
    </div>
  )
}
