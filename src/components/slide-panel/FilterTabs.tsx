import clsx from 'clsx'
import type { SlideFilter } from '../../types'

interface FilterTabsProps {
  filter: SlideFilter
  onChange: (filter: SlideFilter) => void
}

const tabs: { value: SlideFilter; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'main', label: 'メイン' },
  { value: 'sub', label: 'サブ' },
]

export function FilterTabs({ filter, onChange }: FilterTabsProps) {
  return (
    <div className="filter-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className={clsx('filter-tab', filter === tab.value && 'active')}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
