import type { Project, Slide, Hotspot } from '../types'

export interface LinkIssue {
  slideId: string
  slideLabel: string
  hotspotId: string
  issue: 'missing_target' | 'self_link' | 'empty_url'
  description: string
}

export function checkLinkIntegrity(project: Project): LinkIssue[] {
  const issues: LinkIssue[] = []
  const slideIds = new Set(project.slides.map((s) => s.id))

  for (const slide of project.slides) {
    for (const hotspot of slide.hotspots) {
      const slideIssues = checkHotspot(slide, hotspot, slideIds)
      issues.push(...slideIssues)
    }
  }

  return issues
}

function checkHotspot(
  slide: Slide,
  hotspot: Hotspot,
  slideIds: Set<string>,
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
