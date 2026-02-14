import type { Node, Edge } from '@xyflow/react'
import dagre from '@dagrejs/dagre'
import type { Slide } from '../types'

export interface SlideNodeData {
  label: string
  thumbnailSrc: string | undefined
  isMain: boolean
  hotspotCount: number
  [key: string]: unknown
}

const NODE_WIDTH = 160
const NODE_HEIGHT = 110

export function buildGraphData(
  slides: Slide[],
  imageCache: Record<string, string>,
): { nodes: Node<SlideNodeData>[]; edges: Edge[] } {
  const allIds = new Set(slides.map((s) => s.id))

  const nodes: Node<SlideNodeData>[] = slides.map((slide) => ({
    id: slide.id,
    type: 'slideNode',
    position: { x: 0, y: 0 },
    data: {
      label: slide.label,
      thumbnailSrc: imageCache[slide.image_path],
      isMain: slide.is_main,
      hotspotCount: slide.hotspots.length,
    },
  }))

  const edges: Edge[] = []
  for (const slide of slides) {
    for (const hotspot of slide.hotspots) {
      if (hotspot.link_type === 'slide' && hotspot.target_id) {
        const isBroken = !allIds.has(hotspot.target_id)
        edges.push({
          id: `${slide.id}-${hotspot.id}`,
          source: slide.id,
          target: hotspot.target_id,
          animated: !isBroken,
          style: {
            stroke: isBroken ? '#ef4444' : '#638cff',
            strokeWidth: 2,
          },
          label: hotspot.tooltip || undefined,
        })
      }
    }
  }

  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'LR', nodesep: 50, ranksep: 80 })
  g.setDefaultEdgeLabel(() => ({}))

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target)
  }

  dagre.layout(g)

  const layoutNodes = nodes.map((node) => {
    const pos = g.node(node.id)
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    }
  })

  return { nodes: layoutNodes, edges }
}
