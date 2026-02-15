import type { Node, Edge } from '@xyflow/react'
import type { Slide } from '../types'

export interface SlideNodeData {
  label: string
  thumbnailSrc: string | undefined
  isMain: boolean
  hotspotCount: number
  enabled: boolean
  isOrphan: boolean
  graphLinkCount: number
  [key: string]: unknown
}

const NODE_WIDTH = 160
const NODE_HEIGHT = 110
const H_GAP = 60 // horizontal gap between columns
const V_GAP = 40 // vertical gap between rows
const EDGE_DELIMITER = '__'

/** Parse an edge ID into its components */
export function parseEdgeId(edgeId: string): {
  type: 'hotspot' | 'graph' | 'seq'
  sourceId: string
  targetKey: string
} | null {
  const parts = edgeId.split(EDGE_DELIMITER)
  if (parts.length < 3) return null
  const [type, sourceId, ...rest] = parts
  if (type !== 'hotspot' && type !== 'graph' && type !== 'seq') return null
  return { type, sourceId, targetKey: rest.join(EDGE_DELIMITER) }
}

/**
 * Determine edge handle direction based on source/target Main/Sub status.
 *
 * - Main→Main (seq or link): bottom → top (vertical flow)
 * - Main→Sub: right → left (horizontal branching)
 * - Sub→Sub: bottom → top (vertical flow)
 * - Sub→Main: right → left (horizontal)
 */
function getEdgeHandles(
  sourceIsMain: boolean,
  targetIsMain: boolean,
): { sourceHandle: string; targetHandle: string } {
  if (sourceIsMain && !targetIsMain) {
    return { sourceHandle: 'right', targetHandle: 'left' }
  }
  if (!sourceIsMain && targetIsMain) {
    return { sourceHandle: 'right', targetHandle: 'left' }
  }
  // Main→Main or Sub→Sub: vertical
  return { sourceHandle: 'bottom', targetHandle: 'top' }
}

// --- Sub tree with depth tracking ---

interface SubEntry {
  slideId: string
  depth: number // 1 = direct sub of Main, 2 = sub of sub, etc.
  parentId: string // ID of the slide that links to this Sub
}

/** Collect all slide-link targets (hotspot + graph_link) from a slide. */
function getLinkedSubIds(
  slide: Slide,
  allIds: Set<string>,
  slideMap: Map<string, Slide>,
): string[] {
  const targets: string[] = []

  for (const hs of slide.hotspots) {
    if (
      hs.link_type === 'slide' &&
      hs.target_id &&
      allIds.has(hs.target_id)
    ) {
      const target = slideMap.get(hs.target_id)
      if (target && !target.is_main) {
        targets.push(hs.target_id)
      }
    }
  }

  for (const targetId of slide.graph_links ?? []) {
    if (allIds.has(targetId)) {
      const target = slideMap.get(targetId)
      if (target && !target.is_main) {
        targets.push(targetId)
      }
    }
  }

  return targets
}

/**
 * Build a depth-aware Sub tree for each Main slide via BFS.
 * Each Sub gets a depth level (1, 2, 3, ...) representing how many
 * hops away it is from the Main. Supports unlimited depth.
 */
function buildSubTree(
  slides: Slide[],
  allIds: Set<string>,
  slideMap: Map<string, Slide>,
): Map<string, SubEntry[]> {
  const mainToSubs = new Map<string, SubEntry[]>()
  const assignedSubs = new Set<string>()

  const activeMainSlides = slides.filter(
    (s) => s.is_main && s.enabled !== false,
  )

  for (const main of activeMainSlides) {
    const entries: SubEntry[] = []

    // BFS: start from Main, walk links to find Subs at increasing depth
    const queue: Array<{ parentId: string; depth: number }> = [
      { parentId: main.id, depth: 1 },
    ]

    while (queue.length > 0) {
      const { parentId, depth } = queue.shift()!
      const parentSlide = slideMap.get(parentId)
      if (!parentSlide) continue

      const targets = getLinkedSubIds(parentSlide, allIds, slideMap)

      for (const targetId of targets) {
        if (assignedSubs.has(targetId)) continue
        // Only include non-Main, non-self targets
        if (targetId === main.id) continue

        assignedSubs.add(targetId)
        entries.push({ slideId: targetId, depth, parentId })

        // Continue BFS from this Sub to find deeper Subs
        queue.push({ parentId: targetId, depth: depth + 1 })
      }
    }

    mainToSubs.set(main.id, entries)
  }

  return mainToSubs
}

export function buildGraphData(
  slides: Slide[],
  imageCache: Record<string, string>,
): { nodes: Node<SlideNodeData>[]; edges: Edge[] } {
  const allIds = new Set(slides.map((s) => s.id))
  const slideMap = new Map(slides.map((s) => [s.id, s]))

  // --- Classify slides ---

  const activeMainSlides = slides
    .filter((s) => s.is_main && s.enabled !== false)
    .sort((a, b) => a.index - b.index)

  // Collect all slides that are targeted by any link
  const linkedIds = new Set<string>()
  for (const slide of slides) {
    for (const hs of slide.hotspots) {
      if (
        hs.link_type === 'slide' &&
        hs.target_id &&
        allIds.has(hs.target_id)
      ) {
        linkedIds.add(hs.target_id)
      }
    }
    for (const targetId of slide.graph_links ?? []) {
      if (allIds.has(targetId)) {
        linkedIds.add(targetId)
      }
    }
  }

  const mainIdSet = new Set(activeMainSlides.map((s) => s.id))
  const orphanSet = new Set(
    slides
      .filter((s) => !mainIdSet.has(s.id) && !linkedIds.has(s.id))
      .map((s) => s.id),
  )

  // --- Build edges ---

  const edges: Edge[] = []
  const edgeSet = new Set<string>()

  // Hotspot link edges
  for (const slide of slides) {
    for (const hotspot of slide.hotspots) {
      if (hotspot.link_type === 'slide' && hotspot.target_id) {
        const isBroken = !allIds.has(hotspot.target_id)
        const edgeKey = `${slide.id}->${hotspot.target_id}`
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey)
          const target = slideMap.get(hotspot.target_id)
          const handles = getEdgeHandles(
            slide.is_main,
            target?.is_main ?? false,
          )
          edges.push({
            id: `hotspot${EDGE_DELIMITER}${slide.id}${EDGE_DELIMITER}${hotspot.id}`,
            source: slide.id,
            target: hotspot.target_id,
            sourceHandle: handles.sourceHandle,
            targetHandle: handles.targetHandle,
            animated: !isBroken,
            style: {
              stroke: isBroken ? '#ef4444' : '#638cff',
              strokeWidth: 2,
            },
            label: hotspot.name || hotspot.tooltip || undefined,
          })
        }
      }
    }
  }

  // Graph link edges (legacy — new connections create hotspots)
  for (const slide of slides) {
    for (const targetId of slide.graph_links ?? []) {
      if (!allIds.has(targetId)) continue
      const edgeKey = `${slide.id}->${targetId}`
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey)
        const target = slideMap.get(targetId)
        const handles = getEdgeHandles(
          slide.is_main,
          target?.is_main ?? false,
        )
        edges.push({
          id: `graph${EDGE_DELIMITER}${slide.id}${EDGE_DELIMITER}${targetId}`,
          source: slide.id,
          target: targetId,
          sourceHandle: handles.sourceHandle,
          targetHandle: handles.targetHandle,
          animated: true,
          style: {
            stroke: '#22c55e',
            strokeWidth: 2,
          },
        })
      }
    }
  }

  // Main→Main sequence edges (non-deletable, vertical)
  for (let i = 0; i < activeMainSlides.length - 1; i++) {
    edges.push({
      id: `seq${EDGE_DELIMITER}${activeMainSlides[i].id}${EDGE_DELIMITER}${activeMainSlides[i + 1].id}`,
      source: activeMainSlides[i].id,
      target: activeMainSlides[i + 1].id,
      sourceHandle: 'bottom',
      targetHandle: 'top',
      animated: false,
      deletable: false,
      style: {
        stroke: 'rgba(255, 255, 255, 0.15)',
        strokeWidth: 1,
        strokeDasharray: '6 4',
      },
    })
  }

  // --- Multi-column layout ---
  // Left column: orphans/disabled
  // Center column: Main slides (vertical)
  // Right columns: Sub slides at depth 1, 2, 3, ... (grouped by parent Main)

  const subTree = buildSubTree(slides, allIds, slideMap)
  const positionMap = new Map<string, { x: number; y: number }>()

  // Center column: Main slides
  const mainX = NODE_WIDTH + H_GAP // leave room for left column
  let mainY = 0
  const mainRowY = new Map<string, number>()

  for (const main of activeMainSlides) {
    positionMap.set(main.id, { x: mainX, y: mainY })
    mainRowY.set(main.id, mainY)

    // Calculate block height: count Subs per depth level,
    // take the maximum count across all depths
    const entries = subTree.get(main.id) ?? []
    const countPerDepth = new Map<number, number>()
    for (const entry of entries) {
      countPerDepth.set(
        entry.depth,
        (countPerDepth.get(entry.depth) ?? 0) + 1,
      )
    }

    let maxSubsAtAnyDepth = 0
    for (const count of countPerDepth.values()) {
      maxSubsAtAnyDepth = Math.max(maxSubsAtAnyDepth, count)
    }

    const blockHeight =
      Math.max(1, maxSubsAtAnyDepth) * (NODE_HEIGHT + V_GAP)
    mainY += Math.max(NODE_HEIGHT + V_GAP, blockHeight)
  }

  // Right columns: Sub slides positioned next to their parent
  // Depth-1 subs stack vertically from the Main's startY.
  // Depth-2+ subs are placed at the same Y as their parent,
  // offset down if multiple children share the same parent.
  for (const main of activeMainSlides) {
    const entries = subTree.get(main.id) ?? []
    const startY = mainRowY.get(main.id) ?? 0

    // Sort entries by depth so we process parents before children
    const sorted = [...entries].sort((a, b) => a.depth - b.depth)

    // Track how many children have been placed per parent at each depth
    const childCountPerParent = new Map<string, number>()

    // First pass: place depth-1 subs sequentially
    let depth1Index = 0
    for (const entry of sorted) {
      if (entry.depth === 1) {
        const colX = mainX + (NODE_WIDTH + H_GAP)
        positionMap.set(entry.slideId, {
          x: colX,
          y: startY + depth1Index * (NODE_HEIGHT + V_GAP),
        })
        depth1Index++
      }
    }

    // Second pass: place depth-2+ subs next to their parent
    for (const entry of sorted) {
      if (entry.depth <= 1) continue

      const parentPos = positionMap.get(entry.parentId)
      if (!parentPos) continue

      const colX = mainX + entry.depth * (NODE_WIDTH + H_GAP)
      const siblingIndex = childCountPerParent.get(entry.parentId) ?? 0
      childCountPerParent.set(entry.parentId, siblingIndex + 1)

      positionMap.set(entry.slideId, {
        x: colX,
        y: parentPos.y + siblingIndex * (NODE_HEIGHT + V_GAP),
      })
    }
  }

  // Left column: orphans and unassigned slides
  const orphanX = 0
  let orphanY = 0
  for (const slide of slides) {
    if (!positionMap.has(slide.id)) {
      positionMap.set(slide.id, { x: orphanX, y: orphanY })
      orphanY += NODE_HEIGHT + V_GAP
    }
  }

  // --- Build nodes ---

  const nodes: Node<SlideNodeData>[] = slides.map((slide) => {
    const pos = positionMap.get(slide.id) ?? { x: 0, y: 0 }
    return {
      id: slide.id,
      type: 'slideNode',
      position: { x: pos.x, y: pos.y },
      data: {
        label: slide.label,
        thumbnailSrc: imageCache[slide.image_path],
        isMain: slide.is_main,
        hotspotCount: slide.hotspots.length,
        enabled: slide.enabled !== false,
        isOrphan: orphanSet.has(slide.id),
        graphLinkCount: (slide.graph_links ?? []).length,
      },
    }
  })

  return { nodes, edges }
}
