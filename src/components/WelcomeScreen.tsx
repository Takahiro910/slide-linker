import { useProjectActions } from '../hooks/useProjectActions'
import { RecentProjectList } from './RecentProjectList'

export function WelcomeScreen() {
  const { newProject, openProject } = useProjectActions()

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-logo">
          <svg
            className="welcome-logo-svg"
            viewBox="0 0 48 48"
            width="64"
            height="64"
          >
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#638cff" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            <rect
              x="4"
              y="8"
              width="24"
              height="18"
              rx="3"
              fill="url(#logoGrad)"
              opacity="0.9"
            />
            <rect
              x="20"
              y="22"
              width="24"
              height="18"
              rx="3"
              fill="url(#logoGrad)"
              opacity="0.6"
            />
            <line
              x1="22"
              y1="20"
              x2="28"
              y2="26"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h1 className="welcome-title">Slide Linker</h1>
        <p className="welcome-subtitle">
          PDF / PPTX から<br />
          インタラクティブ HTML を生成
        </p>
        <div className="welcome-actions">
          <button className="welcome-btn primary" onClick={newProject}>
            <span className="welcome-btn-icon">&#43;</span>
            <span className="welcome-btn-label">新規プロジェクト</span>
            <span className="welcome-btn-hint">PDF / PPTX を読み込み</span>
          </button>
          <button className="welcome-btn" onClick={openProject}>
            <span className="welcome-btn-icon">&#128193;</span>
            <span className="welcome-btn-label">プロジェクトを開く</span>
            <span className="welcome-btn-hint">.slproj.json</span>
          </button>
        </div>
        <RecentProjectList />
        <p className="welcome-footer">
          ホットスポットで繋ぐ、非線形プレゼンテーション
        </p>
      </div>
    </div>
  )
}
