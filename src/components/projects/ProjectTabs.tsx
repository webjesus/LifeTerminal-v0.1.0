export type ProjectTab = 'overview' | 'workspace' | 'goals' | 'tasks' | 'notes' | 'ideas' | 'files' | 'relations' | 'activity' | 'settings'

type ProjectTabsProps = {
  activeTab: ProjectTab
  onChange: (tab: ProjectTab) => void
  counts?: {
    tasks?: number
    goals?: number
    notes?: number
    ideas?: number
    files?: number
    relations?: number
    blocks?: number
    activity?: number
  }
}

const TABS: Array<{ key: ProjectTab; label: string; countKey?: keyof NonNullable<ProjectTabsProps['counts']> }> = [
  { key: 'overview', label: 'Обзор' },
  { key: 'workspace', label: 'Рабочая область', countKey: 'blocks' },
  { key: 'goals', label: 'Цели', countKey: 'goals' },
  { key: 'tasks', label: 'Задачи', countKey: 'tasks' },
  { key: 'notes', label: 'Заметки', countKey: 'notes' },
  { key: 'ideas', label: 'Идеи', countKey: 'ideas' },
  { key: 'files', label: 'Файлы', countKey: 'files' },
  { key: 'relations', label: 'Связи', countKey: 'relations' },
  { key: 'activity', label: 'Активность', countKey: 'activity' },
  { key: 'settings', label: 'Настройки' },
]

export function ProjectTabs({ activeTab, onChange, counts }: ProjectTabsProps) {
  return (
    <section className="ui-panel p-4 md:p-5">
      <div className="ui-filter-scroll">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={[
              'ui-filter-pill',
              activeTab === tab.key
                ? 'border-(--accent-border) bg-(--accent-soft) text-(--accent)'
                : 'border-(--border) bg-(--panel) text-(--text-secondary) hover:border-(--accent-border) hover:text-(--text-primary)',
            ].join(' ')}
          >
            <span>{tab.label}</span>
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
