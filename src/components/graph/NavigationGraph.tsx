import { useMemo, useCallback } from 'react'
import { ReactFlow, Background, Controls, type NodeTypes } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useStore } from '../../store'
import { buildGraphData } from '../../utils/build-graph'
import { SlideNode } from './SlideNode'

const nodeTypes: NodeTypes = {
  slideNode: SlideNode,
}

export function NavigationGraph() {
  const project = useStore((s) => s.project)
  const imageCache = useStore((s) => s.imageCache)
  const toggleNavigationGraph = useStore((s) => s.toggleNavigationGraph)
  const selectSlide = useStore((s) => s.selectSlide)

  const { nodes, edges } = useMemo(() => {
    if (!project) return { nodes: [], edges: [] }
    return buildGraphData(project.slides, imageCache)
  }, [project, imageCache])

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      selectSlide(node.id)
      toggleNavigationGraph()
    },
    [selectSlide, toggleNavigationGraph],
  )

  return (
    <div className="navigation-graph-overlay">
      <div className="navigation-graph-header">
        <h3>Navigation Structure</h3>
        <button
          className="toolbar-btn"
          onClick={toggleNavigationGraph}
        >
          Close
        </button>
      </div>
      <div className="navigation-graph-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  )
}
