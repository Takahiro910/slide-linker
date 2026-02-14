import { useMemo } from 'react'
import { useStore } from '../store'
import { checkLinkIntegrity } from '../utils/link-integrity'

export function LinkIntegrityPanel() {
  const project = useStore((s) => s.project)
  const showLinkChecker = useStore((s) => s.showLinkChecker)
  const selectSlide = useStore((s) => s.selectSlide)
  const selectHotspot = useStore((s) => s.selectHotspot)

  const issues = useMemo(
    () => (project ? checkLinkIntegrity(project) : []),
    [project],
  )

  if (!showLinkChecker) return null

  return (
    <div className="link-integrity-panel">
      <div className="link-integrity-header">
        <h3>Link Checker</h3>
        <span className="link-integrity-count">
          {issues.length === 0
            ? 'No issues'
            : `${issues.length} issue${issues.length > 1 ? 's' : ''}`}
        </span>
      </div>
      {issues.length === 0 ? (
        <div className="link-integrity-empty">
          All links are valid.
        </div>
      ) : (
        <ul className="link-integrity-list">
          {issues.map((issue) => (
            <li
              key={`${issue.slideId}-${issue.hotspotId}`}
              className="link-integrity-item"
              onClick={() => {
                selectSlide(issue.slideId)
                selectHotspot(issue.hotspotId)
              }}
            >
              <span className="link-integrity-slide">{issue.slideLabel}</span>
              <span className="link-integrity-desc">{issue.description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
