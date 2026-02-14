import { Toolbar } from './Toolbar'
import { SlidePanel } from './slide-panel/SlidePanel'
import { EditorCanvas } from './editor/EditorCanvas'
import { HotspotSettings } from './settings/HotspotSettings'

export function EditorLayout() {
  return (
    <div className="editor-layout">
      <Toolbar />
      <div className="editor-body">
        <SlidePanel />
        <EditorCanvas />
        <HotspotSettings />
      </div>
    </div>
  )
}
