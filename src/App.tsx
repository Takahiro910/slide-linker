import { useStore } from './store'
import { WelcomeScreen } from './components/WelcomeScreen'
import { EditorLayout } from './components/EditorLayout'
import { PreviewMode } from './components/preview/PreviewMode'
import { LoadingOverlay } from './components/LoadingOverlay'

export function App() {
  const project = useStore((s) => s.project)
  const editorMode = useStore((s) => s.editorMode)
  const isLoading = useStore((s) => s.isLoading)
  const loadingMessage = useStore((s) => s.loadingMessage)

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
