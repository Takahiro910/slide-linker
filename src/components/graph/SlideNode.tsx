import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { SlideNodeData } from '../../utils/build-graph'

export function SlideNode({ data }: NodeProps) {
  const nodeData = data as SlideNodeData

  return (
    <div className="graph-slide-node">
      <Handle type="target" position={Position.Left} />
      <div className="graph-node-thumb">
        {nodeData.thumbnailSrc ? (
          <img src={nodeData.thumbnailSrc} alt={nodeData.label} />
        ) : (
          <div className="graph-node-placeholder" />
        )}
      </div>
      <div className="graph-node-info">
        <span className="graph-node-label">{nodeData.label}</span>
        <span className={`graph-node-badge ${nodeData.isMain ? 'main' : 'sub'}`}>
          {nodeData.isMain ? 'M' : 'S'}
        </span>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
