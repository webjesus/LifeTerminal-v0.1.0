import { cn } from '../../utils/cn'

export type ProjectLegacyTab = 'goals' | 'notes' | 'ideas' | 'files' | 'relations' | 'activity' | 'map'
export type ProjectSurfaceTab = 'overview' | 'workspace' | 'tasks' | 'materials' | 'progress' | 'settings'
export type ProjectTab = ProjectSurfaceTab | ProjectLegacyTab

type ProjectTabsProps = {
  activeTab: ProjectSurfaceTab
  onChange: (tab: ProjectSurfaceTab) => void
  compact?: boolean
  className?: string
  counts?: {
    tasks?: number
    blocks?: number
    materials?: number
    progress?: number
  }
}

const TABS: Array<{ key: ProjectSurfaceTab; label: string; mobileLabel?: string; countKey?: keyof NonNullable<ProjectTabsProps['counts']> }> = [
  { key: 'overview', label: 'Обзор' },
  { key: 'workspace', label: 'Рабочая область', mobileLabel: 'Работа', countKey: 'blocks' },
  { key: 'tasks', label: 'Задачи', countKey: 'tasks' },
  { key: 'materials', label: 'Материалы', countKey: 'materials' },
  { key: 'progress', label: 'Прогресс', countKey: 'progress' },
  { key: 'settings', label: 'Настройки' },
]

export function ProjectTabs({ activeTab, onChange, counts, compact = false, className }: ProjectTabsProps) {
  return (
    <section className={cn('ui-panel shrink-0 overflow-hidden', compact ? 'p-3 md:p-3.5' : 'p-4 md:p-5', className)}>
      <div className="ui-filter-scroll">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={[
              'ui-filter-pill',
              compact ? 'px-3 py-2 text-sm' : '',
              activeTab === tab.key
                ? 'border-(--accent-border) bg-(--accent-soft) text-(--accent)'
                : 'border-(--border) bg-(--panel) text-(--text-secondary) hover:border-(--accent-border) hover:text-(--text-primary)',
            ].join(' ')}
          >
            <span className="md:hidden">{tab.mobileLabel ?? tab.label}</span>
            <span className="hidden md:inline">{tab.label}</span>
            {tab.countKey && typeof counts?.[tab.countKey] === 'number' ? (
              <span className="ml-2 rounded-full border border-current/20 px-2 py-0.5 text-[11px] leading-none">
                {counts[tab.countKey]}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  )
}
