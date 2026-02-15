import type { Project, Slide, Hotspot } from '../types'

interface IdMapping {
  readonly oldId: string
  readonly newId: string
}

/**
 * Prepare slides from an external project for merging into the current project.
 *
 * - Re-generates all slide IDs with crypto.randomUUID()
 * - Re-maps hotspot target_id and graph_links references
 * - Reassigns image_path with new index offsets
 * - Records source_file for traceability
 *
 * Returns the remapped slides and the old→new ID mapping (needed for image copy).
 */
export function prepareSlidesMerge(
  externalProject: Project,
  currentSlideCount: number,
  sourceFileName: string,
): {
  readonly slides: Slide[]
  readonly idMappings: readonly IdMapping[]
  readonly imageRenames: readonly { oldPath: string; newPath: string }[]
} {
  // 1. Generate new IDs for every slide
  const idMappings: IdMapping[] = externalProject.slides.map((slide) => ({
    oldId: slide.id,
    newId: crypto.randomUUID(),
  }))

  const oldToNew = new Map(idMappings.map((m) => [m.oldId, m.newId]))
  const newIdSet = new Set(oldToNew.values())

  // 2. Build remapped slides
  const imageRenames: { oldPath: string; newPath: string }[] = []

  const slides: Slide[] = externalProject.slides.map((slide, i) => {
    const newIndex = currentSlideCount + i
    const newId = oldToNew.get(slide.id) ?? slide.id
    const newImagePath = `slides/slide-${String(newIndex + 1).padStart(3, '0')}.png`

    imageRenames.push({
      oldPath: slide.image_path,
      newPath: newImagePath,
    })

    // Remap hotspot targets
    const hotspots: Hotspot[] = slide.hotspots.map((h) => ({
      ...h,
      id: crypto.randomUUID(),
      target_id:
        h.link_type === 'slide' && h.target_id
          ? oldToNew.get(h.target_id) ?? h.target_id
          : h.target_id,
    }))

    // Remap graph_links
    const graphLinks = (slide.graph_links ?? [])
      .map((targetId) => oldToNew.get(targetId) ?? targetId)
      // Filter out targets that don't map to any new slide (broken links)
      .filter((id) => newIdSet.has(id))

    return {
      id: newId,
      index: newIndex,
      label: slide.label,
      is_main: false, // Merged slides start as Sub
      enabled: slide.enabled,
      image_path: newImagePath,
      hotspots,
      text_overlays: (slide.text_overlays ?? []).map((o) => ({
        ...o,
        id: crypto.randomUUID(),
      })),
      graph_links: graphLinks.length > 0 ? graphLinks : undefined,
      source_file: sourceFileName,
    }
  })

  return { slides, idMappings, imageRenames } as const
}

/**
 * Validate an external project before merging.
 * Returns null if valid, or an error message if invalid.
 */
export function validateExternalProject(
  project: unknown,
): string | null {
  if (!project || typeof project !== 'object') {
    return 'プロジェクトデータが不正です'
  }

  const p = project as Record<string, unknown>

  if (!Array.isArray(p.slides)) {
    return 'スライドデータが見つかりません'
  }

  if (p.slides.length === 0) {
    return 'スライドが0枚のプロジェクトは取り込めません'
  }

  return null
}
