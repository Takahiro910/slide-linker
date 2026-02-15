import { open, save } from '@tauri-apps/plugin-dialog'
import { useStore } from '../store'
import { tauriCommands } from '../api/tauri-commands'
import type { Project, Slide, AspectRatio } from '../types'

/** Normalize a directory path for comparison (Windows-safe). */
function normalizeDir(dir: string): string {
  return dir.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase()
}

export function useProjectActions() {
  const setProject = useStore((s) => s.setProject)
  const setProjectPath = useStore((s) => s.setProjectPath)
  const setProjectDir = useStore((s) => s.setProjectDir)
  const setLoading = useStore((s) => s.setLoading)
  const setImageCache = useStore((s) => s.setImageCache)
  const selectSlide = useStore((s) => s.selectSlide)
  const clearProject = useStore((s) => s.clearProject)
  const clearImageCache = useStore((s) => s.clearImageCache)
  const addRecentProject = useStore((s) => s.addRecentProject)

  async function loadAllImages(project: Project, projectDir: string) {
    for (const slide of project.slides) {
      const fullPath = `${projectDir}/${slide.image_path}`
      try {
        const base64 = await tauriCommands.readImageBase64(fullPath)
        setImageCache(
          slide.image_path,
          `data:image/png;base64,${base64}`,
        )
      } catch (err) {
        console.error(`Failed to load image for ${slide.id}:`, err)
      }
    }
  }

  function recordRecentProject(path: string, project: Project) {
    const name = project.source_file
      ? project.source_file.replace(/^.*[\\/]/, '').replace(/\.[^.]+$/, '')
      : 'Untitled'
    addRecentProject({
      path,
      name,
      openedAt: new Date().toISOString(),
    })
  }

  async function newProject() {
    const sourcePath = await open({
      title: 'Select presentation file',
      filters: [
        { name: 'Presentation (PDF / PPTX)', extensions: ['pdf', 'pptx'] },
        { name: 'PDF', extensions: ['pdf'] },
        { name: 'PowerPoint', extensions: ['pptx'] },
      ],
    })
    if (!sourcePath) return

    const projectDir = await save({
      title: 'Choose project save location',
      filters: [
        { name: 'Slide Linker Project', extensions: ['slproj.json'] },
      ],
    })
    if (!projectDir) return

    const dir = projectDir.replace(/[\\/][^\\/]+$/, '')
    const slidesDir = `${dir}/slides`

    // Warn if the target slides directory already contains images
    try {
      const existingCount =
        await tauriCommands.countSlideImages(slidesDir)
      if (existingCount > 0) {
        const proceed = window.confirm(
          `選択したフォルダの slides/ ディレクトリには既に ${existingCount} 枚の画像があります。\n` +
            `上書きすると他のプロジェクトに影響する可能性があります。\n\n` +
            `続行しますか？（別のフォルダを選ぶことを推奨します）`,
        )
        if (!proceed) return
      }
    } catch {
      // Directory doesn't exist yet — safe to proceed
    }

    setLoading(true, 'スライド画像を変換中...')
    try {
      const slides = await tauriCommands.convertPdfToImages(sourcePath, slidesDir)
      const aspectRatio = await tauriCommands.detectAspectRatio(slidesDir)

      const project: Project = {
        version: '1.0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source_file: sourcePath,
        source_files: [sourcePath],
        aspect_ratio: aspectRatio as AspectRatio,
        slides: slides.map(
          (s): Slide => ({
            ...s,
            is_main: true,
            enabled: true,
            hotspots: [],
            source_file: sourcePath,
          }),
        ),
      }

      await tauriCommands.saveProject(projectDir, project)

      setProject(project)
      setProjectPath(projectDir)
      setProjectDir(dir)
      recordRecentProject(projectDir, project)

      await loadAllImages(project, dir)

      if (project.slides.length > 0) {
        selectSlide(project.slides[0].id)
      }
    } catch (err) {
      console.error('Failed to create project:', err)
      alert(`Failed to create project: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  async function openProject() {
    const path = await open({
      title: 'Open project',
      filters: [
        { name: 'Slide Linker Project', extensions: ['slproj.json'] },
      ],
    })
    if (!path) return

    await openProjectByPath(path)
  }

  async function openProjectByPath(path: string) {
    setLoading(true, 'Loading project...')
    try {
      const project = await tauriCommands.loadProject(path)
      const dir = path.replace(/[\\/][^\\/]+$/, '')

      setProject(project)
      setProjectPath(path)
      setProjectDir(dir)
      recordRecentProject(path, project)

      await loadAllImages(project, dir)

      if (project.slides.length > 0) {
        selectSlide(project.slides[0].id)
      }
    } catch (err) {
      console.error('Failed to open project:', err)
      alert(`Failed to open project: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  async function openRecentProject(path: string) {
    await openProjectByPath(path)
  }

  async function saveProject() {
    const project = useStore.getState().project
    const projectPath = useStore.getState().projectPath
    if (!project || !projectPath) return

    const updated: Project = {
      ...project,
      updated_at: new Date().toISOString(),
    }

    try {
      await tauriCommands.saveProject(projectPath, updated)
      useStore.getState().setProject(updated)
      useStore.getState().markClean()
    } catch (err) {
      console.error('Failed to save project:', err)
      alert(`Failed to save: ${err}`)
    }
  }

  async function saveProjectAs() {
    const project = useStore.getState().project
    const currentProjectDir = useStore.getState().projectDir
    if (!project) return

    const path = await save({
      filters: [
        { name: 'Slide Linker Project', extensions: ['slproj.json'] },
      ],
    })
    if (!path) return

    const newDir = path.replace(/[\\/][^\\/]+$/, '')
    const updated: Project = {
      ...project,
      updated_at: new Date().toISOString(),
    }

    try {
      // Copy slide images if saving to a different directory
      if (
        currentProjectDir &&
        normalizeDir(newDir) !== normalizeDir(currentProjectDir)
      ) {
        setLoading(true, 'スライド画像をコピー中...')
        await tauriCommands.copySlidesDirectory(currentProjectDir, newDir)
      }

      await tauriCommands.saveProject(path, updated)
      setProject(updated)
      setProjectPath(path)
      setProjectDir(newDir)
      recordRecentProject(path, updated)
    } catch (err) {
      console.error('Failed to save project:', err)
      alert(`Failed to save: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  async function exportHtml() {
    const project = useStore.getState().project
    const projectDir = useStore.getState().projectDir
    if (!project || !projectDir) return

    const outputPath = await save({
      title: 'Export HTML',
      filters: [{ name: 'HTML', extensions: ['html'] }],
    })
    if (!outputPath) return

    setLoading(true, 'Generating HTML...')
    try {
      await tauriCommands.exportHtml(projectDir, project, outputPath)
      alert('Export completed!')
    } catch (err) {
      console.error('Failed to export HTML:', err)
      alert(`Export failed: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  async function exportPdf() {
    const project = useStore.getState().project
    const projectDir = useStore.getState().projectDir
    if (!project || !projectDir) return

    const outputPath = await save({
      title: 'PDFをエクスポート',
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    })
    if (!outputPath) return

    setLoading(true, 'PDFを生成中...')
    try {
      await tauriCommands.exportPdf(projectDir, project, outputPath)
      alert('PDFエクスポートが完了しました！')
    } catch (err) {
      alert(`PDFエクスポートに失敗しました: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  async function importAdditionalSlides() {
    const project = useStore.getState().project
    const projectDir = useStore.getState().projectDir
    const projectPath = useStore.getState().projectPath
    if (!project || !projectDir || !projectPath) return

    const sourcePath = await open({
      title: 'スライドを追加するファイルを選択',
      filters: [
        {
          name: 'Presentation (PDF / PPTX)',
          extensions: ['pdf', 'pptx', 'ppt'],
        },
      ],
    })
    if (!sourcePath) return

    const slidesDir = `${projectDir}/slides`
    const existingMaxIndex = project.slides.reduce(
      (max, s) => Math.max(max, s.index),
      -1,
    )
    const startIndex = existingMaxIndex + 1

    setLoading(true, 'スライド画像を変換中...')
    try {
      const newSlideInfos = await tauriCommands.convertToImagesWithOffset(
        sourcePath,
        slidesDir,
        startIndex,
      )

      const newSlides: Slide[] = newSlideInfos.map(
        (s): Slide => ({
          ...s,
          is_main: true,
          enabled: true,
          hotspots: [],
          source_file: sourcePath,
        }),
      )

      const currentProject = useStore.getState().project
      if (currentProject) {
        ;(useStore.getState() as any).pushHistory(currentProject)
      }

      const updatedSourceFiles = [
        ...(project.source_files ?? [project.source_file]),
      ]
      if (!updatedSourceFiles.includes(sourcePath)) {
        updatedSourceFiles.push(sourcePath)
      }

      const updatedProject: Project = {
        ...project,
        source_files: updatedSourceFiles,
        slides: [...project.slides, ...newSlides],
        updated_at: new Date().toISOString(),
      }

      setProject(updatedProject)
      useStore.getState().markDirty()

      for (const slide of newSlides) {
        const fullPath = `${projectDir}/${slide.image_path}`
        try {
          const base64 = await tauriCommands.readImageBase64(fullPath)
          setImageCache(slide.image_path, `data:image/png;base64,${base64}`)
        } catch {
          // ignore individual image load failures
        }
      }

      if (newSlides.length > 0) {
        selectSlide(newSlides[0].id)
      }
    } catch (err) {
      alert(`追加インポートに失敗しました: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  function closeProject() {
    clearProject()
    clearImageCache()
  }

  return {
    newProject,
    openProject,
    openRecentProject,
    saveProject,
    saveProjectAs,
    exportHtml,
    exportPdf,
    importAdditionalSlides,
    closeProject,
  }
}
