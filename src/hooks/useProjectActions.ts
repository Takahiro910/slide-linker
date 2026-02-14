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

  async function newProject() {
    const sourcePath = await open({
      title: 'プレゼンファイルを選択',
      filters: [
        { name: 'プレゼンテーション (PDF / PPTX)', extensions: ['pdf', 'pptx'] },
        { name: 'PDF', extensions: ['pdf'] },
        { name: 'PowerPoint', extensions: ['pptx'] },
      ],
    })
    if (!sourcePath) return

    const isPptx = sourcePath.toLowerCase().endsWith('.pptx')
    if (isPptx) {
      alert(
        'PPTX対応は今後のアップデートで追加予定です。\n' +
          '現在はPDFに変換してからお使いください。',
      )
      return
    }

    const projectDir = await save({
      title: 'プロジェクトの保存先を選択',
      filters: [
        { name: 'Slide Linker Project', extensions: ['slproj.json'] },
      ],
    })
    if (!projectDir) return

    const dir = projectDir.replace(/[\\/][^\\/]+$/, '')
    const slidesDir = `${dir}/slides`

    setLoading(true, 'PDFをスライド画像に変換中...')
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

      await loadAllImages(project, dir)

      if (project.slides.length > 0) {
        selectSlide(project.slides[0].id)
      }
    } catch (err) {
      console.error('Failed to create project:', err)
      alert(`プロジェクトの作成に失敗しました: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  async function openProject() {
    const path = await open({
      title: 'プロジェクトを開く',
      filters: [
        { name: 'Slide Linker Project', extensions: ['slproj.json'] },
      ],
    })
    if (!path) return

    setLoading(true, 'プロジェクトを読み込み中...')
    try {
      const project = await tauriCommands.loadProject(path)
      const dir = path.replace(/[\\/][^\\/]+$/, '')

      setProject(project)
      setProjectPath(path)
      setProjectDir(dir)

      await loadAllImages(project, dir)

      if (project.slides.length > 0) {
        selectSlide(project.slides[0].id)
      }
    } catch (err) {
      console.error('Failed to open project:', err)
      alert(`プロジェクトを開けませんでした: ${err}`)
    } finally {
      setLoading(false)
    }
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
      alert(`保存に失敗しました: ${err}`)
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
    } catch (err) {
      console.error('Failed to save project:', err)
      alert(`保存に失敗しました: ${err}`)
    }
  }

  async function exportHtml() {
    const project = useStore.getState().project
    const projectDir = useStore.getState().projectDir
    if (!project || !projectDir) return

    const outputPath = await save({
      title: 'HTMLをエクスポート',
      filters: [{ name: 'HTML', extensions: ['html'] }],
    })
    if (!outputPath) return

    setLoading(true, 'HTMLを生成中...')
    try {
      await tauriCommands.exportHtml(projectDir, project, outputPath)
      alert('エクスポートが完了しました！')
    } catch (err) {
      console.error('Failed to export HTML:', err)
      alert(`エクスポートに失敗しました: ${err}`)
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
    saveProject,
    saveProjectAs,
    exportHtml,
    closeProject,
  }
}
