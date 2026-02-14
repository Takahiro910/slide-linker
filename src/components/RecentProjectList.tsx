import { useStore } from '../store'
import { useProjectActions } from '../hooks/useProjectActions'

export function RecentProjectList() {
  const recentProjects = useStore((s) => s.recentProjects)
  const removeRecentProject = useStore((s) => s.removeRecentProject)
  const { openRecentProject } = useProjectActions()

  if (recentProjects.length === 0) return null

  return (
    <div className="recent-projects">
      <h3 className="recent-projects-title">Recent Projects</h3>
      <ul className="recent-projects-list">
        {recentProjects.map((rp) => (
          <li key={rp.path} className="recent-project-item">
            <button
              className="recent-project-btn"
              onClick={() => openRecentProject(rp.path)}
              title={rp.path}
            >
              <span className="recent-project-name">{rp.name}</span>
              <span className="recent-project-path">
                {rp.path.replace(/[\\/][^\\/]+$/, '')}
              </span>
            </button>
            <button
              className="recent-project-remove"
              onClick={(e) => {
                e.stopPropagation()
                removeRecentProject(rp.path)
              }}
              title="Remove from recent"
            >
              &times;
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
