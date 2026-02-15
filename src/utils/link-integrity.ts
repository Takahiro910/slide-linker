import type { Project, Slide, Hotspot } from '../types'

export interface LinkIssue {
  slideId: string
  slideLabel: string
  hotspotId: string
  issue: 'missing_target' | 'self_link' | 'empty_url' | 'disabled_target'
  description: string
}

export function checkLinkIntegrity(project: Project): LinkIssue[] {
  const issues: LinkIssue[] = []
  const slideIds = new Set(project.slides.map((s) => s.id))

  for (const slide of project.slides.filter((s) => s.enabled !== false)) {
    // Check hotspot links
    for (const hotspot of slide.hotspots) {
      const slideIssues = checkHotspot(slide, hotspot, slideIds, project.slides)
      issues.push(...slideIssues)
    }

    // Check graph_links
    for (const targetId of slide.graph_links ?? []) {
      const graphIssues = checkGraphLink(slide, targetId, slideIds, project.slides)
      issues.push(...graphIssues)
    }
  }

  return issues
}

function checkHotspot(
  slide: Slide,
  hotspot: Hotspot,
  slideIds: Set<string>,
  allSlides: Slide[],
): LinkIssue[] {
  const issues: LinkIssue[] = []

  if (hotspot.link_type === 'slide') {
    if (!hotspot.target_id) {
      issues.push({
        slideId: slide.id,
        slideLabel: slide.label,
        hotspotId: hotspot.id,
        issue: 'missing_target',
        description: `ホットスポットのリンク先スライドが未設定です`,
      })
    } else if (!slideIds.has(hotspot.target_id)) {
      issues.push({
        slideId: slide.id,
        slideLabel: slide.label,
        hotspotId: hotspot.id,
        issue: 'missing_target',
        description: `リンク先スライドが存在しません (ID: ${hotspot.target_id})`,
      })
    } else if (hotspot.target_id === slide.id) {
      issues.push({
        slideId: slide.id,
        slideLabel: slide.label,
        hotspotId: hotspot.id,
        issue: 'self_link',
        description: `自身のスライドへのリンクです`,
      })
    } else {
      const targetSlide = allSlides.find((s) => s.id === hotspot.target_id)
      if (targetSlide && targetSlide.enabled === false) {
        issues.push({
          slideId: slide.id,
          slideLabel: slide.label,
          hotspotId: hotspot.id,
          issue: 'disabled_target',
          description: `リンク先スライドが無効化されています`,
        })
      }
    }
  }

  if (hotspot.link_type === 'url') {
    if (!hotspot.url || hotspot.url.trim() === '') {
      issues.push({
        slideId: slide.id,
        slideLabel: slide.label,
        hotspotId: hotspot.id,
        issue: 'empty_url',
        description: `URLが未入力です`,
      })
    }
  }

  return issues
}

function checkGraphLink(
  slide: Slide,
  targetId: string,
  slideIds: Set<string>,
  allSlides: Slide[],
): LinkIssue[] {
  const issues: LinkIssue[] = []

  if (!slideIds.has(targetId)) {
    issues.push({
      slideId: slide.id,
      slideLabel: slide.label,
      hotspotId: `graph_link:${targetId}`,
      issue: 'missing_target',
      description: `Graphリンク先スライドが存在しません (ID: ${targetId})`,
    })
  } else if (targetId === slide.id) {
    issues.push({
      slideId: slide.id,
      slideLabel: slide.label,
      hotspotId: `graph_link:${targetId}`,
      issue: 'self_link',
      description: `自身へのGraphリンクです`,
    })
  } else {
    const targetSlide = allSlides.find((s) => s.id === targetId)
    if (targetSlide && targetSlide.enabled === false) {
      issues.push({
        slideId: slide.id,
        slideLabel: slide.label,
        hotspotId: `graph_link:${targetId}`,
        issue: 'disabled_target',
        description: `Graphリンク先スライドが無効化されています`,
      })
    }
  }

  return issues
}
