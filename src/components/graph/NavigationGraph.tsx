import { useMemo, useCallback, useEffect, useState, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  addEdge,
  type Connection,
  type Edge,
  type NodeChange,
  type NodeTypes,
  type Node,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { getCurrentWebview } from '@tauri-apps/api/webview'
import { dirname, basename } from '@tauri-apps/api/path'
import { useStore } from '../../store'
import { buildGraphData, parseEdgeId, type SlideNodeData } from '../../utils/build-graph'
import type { Hotspot } from '../../types'
import { tauriCommands } from '../../api/tauri-commands'
import {
  prepareSlidesMerge,
  validateExternalProject,
} from '../../utils/merge-project'
import { SlideNode } from './SlideNode'
import { GraphSidePanel } from './GraphSidePanel'
import { GraphContextMenu } from './GraphContextMenu'

const nodeTypes: NodeTypes = {
  slideNode: SlideNode,
}

interface ContextMenuState {
  x: number
  y: number
  slideId: string
}

interface MergeConfirmState {
  readonly filePath: string
  readonly fileName: string
  readonly slideCount: number
}

function NavigationGraphInner() {
  const project = useStore((s) => s.project)
  const projectDir = useStore((s) => s.projectDir)
  const imageCache = useStore((s) => s.imageCache)
  const setImageCache = useStore((s) => s.setImageCache)
  const toggleNavigationGraph = useStore((s) => s.toggleNavigationGraph)
  const selectSlide = useStore((s) => s.selectSlide)
  const addHotspot = useStore((s) => s.addHotspot)
  const removeGraphLink = useStore((s) => s.removeGraphLink)
  const removeHotspot = useStore((s) => s.removeHotspot)
  const mergeSlides = useStore((s) => s.mergeSlides)
  const batchSetSlideMain = useStore((s) => s.batchSetSlideMain)

  const { fitView } = useReactFlow()

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [mergeConfirm, setMergeConfirm] = useState<MergeConfirmState | null>(
    null,
  )
  const [merging, setMerging] = useState(false)
  const mergeConfirmRef = useRef(mergeConfirm)
  const handleDropRef = useRef<(filePath: string) => void>(() => {})

  // Derive graph data from project
  const graphData = useMemo(() => {
    if (!project) return { nodes: [], edges: [] }
    return buildGraphData(project.slides, imageCache)
  }, [project, imageCache])

  // ReactFlow interactive state
  const [nodes, setNodes, onNodesChange] = useNodesState(graphData.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphData.edges)

  // Sync when project changes (undo/redo, external edits)
  useEffect(() => {
    setNodes(graphData.nodes)
    setEdges(graphData.edges)
  }, [graphData, setNodes, setEdges])

  // Filtered node change handler: allow position changes (drag) but ignore removes
  const handleNodesChange = useCallback(
    (changes: NodeChange<Node<SlideNodeData>>[]) => {
      const filtered = changes.filter((c) => c.type !== 'remove')
      onNodesChange(filtered)
    },
    [onNodesChange],
  )

  // Create hotspot on edge connection + auto Main/Sub
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      if (connection.source === connection.target) return

      // Create a full-slide hotspot instead of a graph_link
      const targetSlide = project?.slides.find(
        (s) => s.id === connection.target,
      )
      const hotspot: Hotspot = {
        id: `hs-${crypto.randomUUID().slice(0, 8)}`,
        name: targetSlide?.label ?? connection.target,
        x: 0,
        y: 0,
        w: 100,
        h: 100,
        link_type: 'slide',
        target_id: connection.target,
        url: null,
      }
      addHotspot(connection.source, hotspot)

      // Auto Main/Sub based on connection direction:
      // right→left = horizontal branching → target becomes Sub
      // bottom→top = vertical flow → target inherits source's Main/Sub
      if (project) {
        const sourceSlide = project.slides.find(
          (s) => s.id === connection.source,
        )
        if (
          connection.sourceHandle === 'right' &&
          connection.targetHandle === 'left'
        ) {
          batchSetSlideMain([connection.target], false)
        } else if (
          connection.sourceHandle === 'bottom' &&
          connection.targetHandle === 'top' &&
          sourceSlide
        ) {
          batchSetSlideMain([connection.target], sourceSlide.is_main)
        }
      }

      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            id: `hotspot__${connection.source}__${hotspot.id}`,
            animated: true,
            style: { stroke: '#638cff', strokeWidth: 2 },
          },
          eds,
        ),
      )
    },
    [addHotspot, setEdges, project, batchSetSlideMain],
  )

  // Delete edges
  const handleEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      for (const edge of deletedEdges) {
        const parsed = parseEdgeId(edge.id)
        if (!parsed) continue

        if (parsed.type === 'graph') {
          removeGraphLink(parsed.sourceId, parsed.targetKey)
        } else if (parsed.type === 'hotspot') {
          removeHotspot(parsed.sourceId, parsed.targetKey)
        }
        // seq edges have deletable: false, should not reach here
      }
    },
    [removeGraphLink, removeHotspot],
  )

  // Validate connections: no self-links, no duplicates
  const isValidConnection = useCallback(
    (connection: Edge | Connection) => {
      if (!connection.source || !connection.target) return false
      if (connection.source === connection.target) return false
      const exists = edges.some(
        (e) =>
          e.source === connection.source && e.target === connection.target,
      )
      return !exists
    },
    [edges],
  )

  // Node click: select in side panel (don't close graph)
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      setSelectedNodeId(node.id)
      selectSlide(node.id)
      setContextMenu(null)
    },
    [selectSlide],
  )

  // Pane click: deselect
  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null)
    setContextMenu(null)
  }, [])

  // Context menu
  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: { id: string }) => {
      event.preventDefault()
      setContextMenu({ x: event.clientX, y: event.clientY, slideId: node.id })
      setSelectedNodeId(node.id)
      selectSlide(node.id)
    },
    [selectSlide],
  )

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  const handleOpenInEditor = useCallback(
    (slideId: string) => {
      selectSlide(slideId)
      toggleNavigationGraph()
    },
    [selectSlide, toggleNavigationGraph],
  )

  // Keyboard: Escape closes graph or merge confirm
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mergeConfirmRef.current) {
          setMergeConfirm(null)
        } else if (contextMenu) {
          setContextMenu(null)
        } else {
          toggleNavigationGraph()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [contextMenu, toggleNavigationGraph])

  // Keep ref in sync
  useEffect(() => {
    mergeConfirmRef.current = mergeConfirm
  }, [mergeConfirm])

  // Handle dropped .slproj.json file — load and show confirm dialog
  const handleDrop = useCallback(
    async (filePath: string) => {
      try {
        const externalProject = await tauriCommands.loadProject(filePath)
        const error = validateExternalProject(externalProject)
        if (error) {
          window.alert(error)
          return
        }
        const fileName = await basename(filePath)
        setMergeConfirm({
          filePath,
          fileName,
          slideCount: externalProject.slides.length,
        })
      } catch (err) {
        window.alert(
          `プロジェクトの読み込みに失敗しました: ${err instanceof Error ? err.message : String(err)}`,
        )
      }
    },
    [],
  )

  // Keep handleDrop ref in sync for event listener
  useEffect(() => {
    handleDropRef.current = handleDrop
  }, [handleDrop])

  // Tauri drag-and-drop listener for .slproj.json files
  useEffect(() => {
    let unlisten: (() => void) | null = null

    getCurrentWebview()
      .onDragDropEvent((event) => {
        if (event.payload.type === 'enter') {
          const hasSlproj = event.payload.paths.some((p: string) =>
            p.endsWith('.slproj.json'),
          )
          setIsDragOver(hasSlproj)
        } else if (event.payload.type === 'over') {
          // keep drag-over state as-is (set by 'enter')
        } else if (event.payload.type === 'leave') {
          setIsDragOver(false)
        } else if (event.payload.type === 'drop') {
          setIsDragOver(false)
          const slprojFiles = event.payload.paths.filter((p: string) =>
            p.endsWith('.slproj.json'),
          )
          if (slprojFiles.length > 0) {
            handleDropRef.current(slprojFiles[0])
          }
        }
      })
      .then((fn) => {
        unlisten = fn
      })

    return () => {
      unlisten?.()
    }
  }, [])

  // Execute merge after user confirmation
  const executeMerge = useCallback(async () => {
    if (!mergeConfirm || !project || !projectDir) return

    setMerging(true)
    try {
      // 1. Load external project
      const externalProject = await tauriCommands.loadProject(
        mergeConfirm.filePath,
      )
      const sourceDir = await dirname(mergeConfirm.filePath)

      // 2. Prepare merge (remap IDs, paths)
      const { slides, imageRenames } = prepareSlidesMerge(
        externalProject,
        project.slides.length,
        mergeConfirm.fileName,
      )

      // 3. Copy images via Tauri
      const renames = imageRenames.map((r) => ({
        old_path: r.oldPath,
        new_path: r.newPath,
      }))
      await tauriCommands.copySlideImages(sourceDir, projectDir, renames)

      // 4. Add slides to store
      mergeSlides(slides)

      // 5. Load images into cache
      for (const slide of slides) {
        const fullPath = `${projectDir}/${slide.image_path}`
        try {
          const base64 = await tauriCommands.readImageBase64(fullPath)
          setImageCache(slide.image_path, `data:image/png;base64,${base64}`)
        } catch {
          // ignore individual image load failures
        }
      }

      // 6. Fit view to show new nodes
      setTimeout(() => fitView({ duration: 400 }), 100)

      setMergeConfirm(null)
    } catch (err) {
      window.alert(
        `マージに失敗しました: ${err instanceof Error ? err.message : String(err)}`,
      )
    } finally {
      setMerging(false)
    }
  }, [mergeConfirm, project, projectDir, mergeSlides, setImageCache, fitView])

  const selectedSlide =
    project?.slides.find((s) => s.id === selectedNodeId) ?? null

  return (
    <div className="navigation-graph-overlay">
      <div className="navigation-graph-header">
        <h3>Navigation Graph</h3>
        <span className="navigation-graph-hint">
          .slproj.json をドラッグ&amp;ドロップでプロジェクト合体
        </span>
        <button className="toolbar-btn" onClick={toggleNavigationGraph}>
          Close
        </button>
      </div>
      <div className="navigation-graph-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onEdgesDelete={handleEdgesDelete}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          onNodeContextMenu={handleNodeContextMenu}
          isValidConnection={isValidConnection}
          fitView
          nodesDraggable
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls />
          <MiniMap
            style={{ background: 'var(--color-surface)' }}
            maskColor="rgba(0, 0, 0, 0.5)"
          />
        </ReactFlow>

        {selectedSlide && (
          <GraphSidePanel
            slide={selectedSlide}
            allSlides={project?.slides ?? []}
            imageCache={imageCache}
            onClose={() => setSelectedNodeId(null)}
            onOpenInEditor={handleOpenInEditor}
          />
        )}

        {contextMenu && (
          <GraphContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            slideId={contextMenu.slideId}
            onClose={handleCloseContextMenu}
            onOpenInEditor={handleOpenInEditor}
          />
        )}

        {/* Drop indicator overlay */}
        {isDragOver && (
          <div className="graph-drop-overlay">
            <div className="graph-drop-message">
              プロジェクトファイルをドロップして合体
            </div>
          </div>
        )}

        {/* Merge confirmation dialog */}
        {mergeConfirm && (
          <div className="graph-merge-dialog-backdrop">
            <div className="graph-merge-dialog">
              <h4>プロジェクト合体</h4>
              <p>
                <strong>{mergeConfirm.fileName}</strong> から{' '}
                <strong>{mergeConfirm.slideCount}枚</strong>{' '}
                のスライドを取り込みます。
              </p>
              <p className="graph-merge-dialog-note">
                取り込んだスライドはSub扱いで追加されます。
                Graph上でリンクを繋ぎ直してください。
              </p>
              <div className="graph-merge-dialog-actions">
                <button
                  className="toolbar-btn"
                  onClick={() => setMergeConfirm(null)}
                  disabled={merging}
                >
                  キャンセル
                </button>
                <button
                  className="toolbar-btn primary"
                  onClick={executeMerge}
                  disabled={merging}
                >
                  {merging ? '取り込み中...' : '取り込む'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/** Wrap with ReactFlowProvider so useReactFlow() is available */
export function NavigationGraph() {
  return (
    <ReactFlowProvider>
      <NavigationGraphInner />
    </ReactFlowProvider>
  )
}
