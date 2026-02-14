import { Toolbar } from './Toolbar'
import { SlidePanel } from './slide-panel/SlidePanel'
import { EditorCanvas } from './editor/EditorCanvas'
import { HotspotSettings } from './settings/HotspotSettings'
import { LinkIntegrityPanel } from './LinkIntegrityPanel'
import { NavigationGraph } from './graph/NavigationGraph'
import { useStore } from '../store'

export function EditorLayout() {
  const showNavigationGraph = useStore((s) => s.showNavigationGraph)

  return (
    <div className="editor-layout">
      <Toolbar />
      <div className="editor-body">
        <SlidePanel />
        <EditorCanvas />
        <HotspotSettings />
      </div>
      <LinkIntegrityPanel />
      {showNavigationGraph && <NavigationGraph />}
    </div>
  )
}
