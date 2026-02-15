import { useStore } from '../store'
import { useProjectActions } from '../hooks/useProjectActions'
import type { EditorTool } from '../types'

export function Toolbar() {
  const project = useStore((s) => s.project)
  const isDirty = useStore((s) => s.isDirty)
  const editorMode = useStore((s) => s.editorMode)
  const setEditorMode = useStore((s) => s.setEditorMode)
  const editorTool = useStore((s) => s.editorTool)
  const setEditorTool = useStore((s) => s.setEditorTool)
  const showLinkChecker = useStore((s) => s.showLinkChecker)
  const toggleLinkChecker = useStore((s) => s.toggleLinkChecker)
  const showNavigationGraph = useStore((s) => s.showNavigationGraph)
  const toggleNavigationGraph = useStore((s) => s.toggleNavigationGraph)
  const canUndo = useStore((s) => s.canUndo)
  const canRedo = useStore((s) => s.canRedo)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const setProject = useStore((s) => s.setProject)
  const markDirty = useStore((s) => s.markDirty)
  const {
    saveProject,
    saveProjectAs,
    exportHtml,
    exportPdf,
    importAdditionalSlides,
    closeProject,
  } = useProjectActions()

  const handleToggleAnalytics = () => {
    if (!project) return
    setProject({
      ...project,
      enable_analytics: !project.enable_analytics,
    })
    markDirty()
  }

  const title = project?.source_file
    ? project.source_file.replace(/^.*[\\/]/, '').replace(/\.[^.]+$/, '')
    : 'Untitled'

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button className="toolbar-btn" onClick={closeProject} title="Close">
          &#8592;
        </button>
        <span className="toolbar-title">
          {title}
          {isDirty ? ' *' : ''}
        </span>
        <button
          className="toolbar-btn"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          &#8630;
        </button>
        <button
          className="toolbar-btn"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
        >
          &#8631;
        </button>
      </div>
      <div className="toolbar-center">
        <button
          className={`toolbar-mode-btn ${editorMode === 'edit' ? 'active' : ''}`}
          onClick={() => setEditorMode('edit')}
        >
          Edit
        </button>
        <button
          className={`toolbar-mode-btn ${editorMode === 'preview' ? 'active' : ''}`}
          onClick={() => setEditorMode('preview')}
        >
          Preview
        </button>
        {editorMode === 'edit' && (
          <div className="toolbar-tool-selector">
            <button
              className={`toolbar-tool-btn${editorTool === 'select' ? ' active select-tool' : ''}`}
              onClick={() => setEditorTool('select' as EditorTool)}
              title={'\u9078\u629e'}
            >
              &#9654;
            </button>
            <button
              className={`toolbar-tool-btn${editorTool === 'hotspot' ? ' active' : ''}`}
              onClick={() => setEditorTool('hotspot' as EditorTool)}
              title={'\u30db\u30c3\u30c8\u30b9\u30dd\u30c3\u30c8'}
            >
              &#9547;
            </button>
            <button
              className={`toolbar-tool-btn${editorTool === 'text' ? ' active' : ''}`}
              onClick={() => setEditorTool('text' as EditorTool)}
              title={'\u30c6\u30ad\u30b9\u30c8'}
            >
              T
            </button>
          </div>
        )}
      </div>
      <div className="toolbar-right">
        <button
          className={`toolbar-btn ${showNavigationGraph ? 'active' : ''}`}
          onClick={toggleNavigationGraph}
          title="Navigation Graph"
        >
          Graph
        </button>
        <button
          className={`toolbar-btn ${showLinkChecker ? 'active' : ''}`}
          onClick={toggleLinkChecker}
          title="Link Checker"
        >
          Link Check
        </button>
        <button className="toolbar-btn" onClick={saveProject}>
          Save
        </button>
        <button className="toolbar-btn" onClick={saveProjectAs}>
          Save As
        </button>
        <button
          className="toolbar-btn"
          onClick={importAdditionalSlides}
          title="追加インポート"
        >
          追加
        </button>
        <label
          className="toolbar-analytics-toggle"
          title="Export時に閲覧分析トラッキングを埋め込む"
        >
          <input
            type="checkbox"
            checked={project?.enable_analytics ?? false}
            onChange={handleToggleAnalytics}
          />
          分析
        </label>
        <button className="toolbar-btn primary" onClick={exportHtml}>
          Export HTML
        </button>
        <button className="toolbar-btn primary" onClick={exportPdf}>
          PDF出力
        </button>
      </div>
    </div>
  )
}
