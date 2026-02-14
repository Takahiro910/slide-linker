import { useStore } from '../../store'
import { FilterTabs } from './FilterTabs'
import { SlideList } from './SlideList'

export function SlidePanel() {
  const slideFilter = useStore((s) => s.slideFilter)
  const setSlideFilter = useStore((s) => s.setSlideFilter)

  return (
    <div className="slide-panel">
      <div className="slide-panel-header">
        <h3>スライド</h3>
      </div>
      <FilterTabs filter={slideFilter} onChange={setSlideFilter} />
      <SlideList />
    </div>
  )
}
