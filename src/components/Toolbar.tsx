import { useStore } from '../store'
import { useProjectActions } from '../hooks/useProjectActions'

export function Toolbar() {
  const project = useStore((s) => s.project)
  const isDirty = useStore((s) => s.isDirty)
  const editorMode = useStore((s) => s.editorMode)
  const setEditorMode = useStore((s) => s.setEditorMode)
  const { saveProject, saveProjectAs, exportHtml, closeProject } =
    useProjectActions()

  const title = project?.source_file
    ? project.source_file.replace(/^.*[\\/]/, '').replace(/\.[^.]+$/, '')
    : 'Untitled'

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button className="toolbar-btn" onClick={closeProject} title="閉じる">
          &#8592;
        </button>
        <span className="toolbar-title">
          {title}
          {isDirty ? ' *' : ''}
        </span>
      </div>
      <div className="toolbar-center">
        <button
          className={`toolbar-mode-btn ${editorMode === 'edit' ? 'active' : ''}`}
          onClick={() => setEditorMode('edit')}
        >
          編集
        </button>
        <button
          className={`toolbar-mode-btn ${editorMode === 'preview' ? 'active' : ''}`}
          onClick={() => setEditorMode('preview')}
        >
          プレビュー
        </button>
      </div>
      <div className="toolbar-right">
        <button className="toolbar-btn" onClick={saveProject}>
          保存
        </button>
        <button className="toolbar-btn" onClick={saveProjectAs}>
          別名保存
        </button>
        <button className="toolbar-btn primary" onClick={exportHtml}>
          HTML出力
        </button>
      </div>
    </div>
  )
}
