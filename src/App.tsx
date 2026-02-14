import { useEffect } from 'react'
import { useStore } from './store'
import { WelcomeScreen } from './components/WelcomeScreen'
import { EditorLayout } from './components/EditorLayout'
import { PreviewMode } from './components/preview/PreviewMode'
import { LoadingOverlay } from './components/LoadingOverlay'
import { tauriCommands } from './api/tauri-commands'
import { useUndoRedo } from './hooks/useUndoRedo'

export function App() {
  const project = useStore((s) => s.project)
  const editorMode = useStore((s) => s.editorMode)
  const isLoading = useStore((s) => s.isLoading)
  const loadingMessage = useStore((s) => s.loadingMessage)
  const setRecentProjects = useStore((s) => s.setRecentProjects)

  useUndoRedo()

  useEffect(() => {
    tauriCommands.loadSettings().then((settings) => {
      setRecentProjects(
        settings.recent_projects.map((rp) => ({
          path: rp.path,
          name: rp.name,
          openedAt: rp.opened_at,
        })),
      )
    }).catch((err) => {
      console.error('Failed to load settings:', err)
    })
  }, [setRecentProjects])

  return (
    <div className="app">
      {isLoading && <LoadingOverlay message={loadingMessage} />}
      {!project ? (
        <WelcomeScreen />
      ) : editorMode === 'preview' ? (
        <PreviewMode />
      ) : (
        <EditorLayout />
      )}
    </div>
  )
}
