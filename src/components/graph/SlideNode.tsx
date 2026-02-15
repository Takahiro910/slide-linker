import clsx from 'clsx'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { SlideNodeData } from '../../utils/build-graph'

export function SlideNode({ data, selected }: NodeProps) {
  const nodeData = data as SlideNodeData

  return (
    <div
      className={clsx(
        'graph-slide-node',
        !nodeData.enabled && 'disabled',
        nodeData.isOrphan && 'orphan',
        selected && 'selected',
      )}
    >
      {/* Directional handles: vertical flow uses top/bottom, horizontal branching uses left/right */}
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
      <div className="graph-node-thumb">
        {nodeData.thumbnailSrc ? (
          <img src={nodeData.thumbnailSrc} alt={nodeData.label} />
        ) : (
          <div className="graph-node-placeholder" />
        )}
      </div>
      <div className="graph-node-info">
        <span className="graph-node-label">{nodeData.label}</span>
        <div className="graph-node-badges">
          <span
            className={`graph-node-badge ${nodeData.isMain ? 'main' : 'sub'}`}
          >
            {nodeData.isMain ? 'M' : 'S'}
          </span>
          {nodeData.graphLinkCount > 0 && (
            <span className="graph-node-badge graph-link">
              {nodeData.graphLinkCount}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
