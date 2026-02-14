import { open, save } from '@tauri-apps/plugin-dialog'
import { useStore } from '../store'
import { tauriCommands } from '../api/tauri-commands'
import type { Project, Slide, AspectRatio } from '../types'

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

    const isPptx = sourcePath.toLowerCase().endsWith('.pptx')
    if (isPptx) {
      alert(
        'PPTX support will be added in a future update.\n' +
          'Please convert to PDF first.',
      )
      return
    }

    const projectDir = await save({
      title: 'Choose project save location',
      filters: [
        { name: 'Slide Linker Project', extensions: ['slproj.json'] },
      ],
    })
    if (!projectDir) return

    const dir = projectDir.replace(/[\\/][^\\/]+$/, '')
    const slidesDir = `${dir}/slides`

    setLoading(true, 'Converting PDF to slide images...')
    try {
      const slides = await tauriCommands.convertPdfToImages(sourcePath, slidesDir)
      const aspectRatio = await tauriCommands.detectAspectRatio(slidesDir)

      const project: Project = {
        version: '1.0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source_file: sourcePath,
        aspect_ratio: aspectRatio as AspectRatio,
        slides: slides.map(
          (s): Slide => ({
            ...s,
            is_main: true,
            hotspots: [],
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
    if (!project) return

    const path = await save({
      filters: [
        { name: 'Slide Linker Project', extensions: ['slproj.json'] },
      ],
    })
    if (!path) return

    const updated: Project = {
      ...project,
      updated_at: new Date().toISOString(),
    }

    try {
      await tauriCommands.saveProject(path, updated)
      const dir = path.replace(/[\\/][^\\/]+$/, '')
      setProject(updated)
      setProjectPath(path)
      setProjectDir(dir)
      recordRecentProject(path, updated)
    } catch (err) {
      console.error('Failed to save project:', err)
      alert(`Failed to save: ${err}`)
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
    closeProject,
  }
}
