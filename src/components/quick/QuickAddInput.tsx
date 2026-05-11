import { useMemo, useState, type KeyboardEvent } from 'react'
import { useAppSettings } from '../../settings/useAppSettings'
import { storageKeys } from '../../utils/storage'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import type { Goal, Idea, Note, Project, Reminder, Task, TaskPriority } from '../../types'

export type QuickAddKind = 'task' | 'note' | 'idea' | 'goal' | 'reminder'

export type QuickAddResult = {
  kind: QuickAddKind
  createdId: string
}

type QuickAddInputProps = {
  compact?: boolean
  onCreated?: (result: QuickAddResult) => void
}

function extractTitleAndContent(raw: string) {
  const trimmed = raw.trim()
  const [firstLine, ...rest] = trimmed.split(' — ')
  return {
    title: (firstLine ?? '').slice(0, 120) || 'Без названия',
    content: rest.join(' — ').trim(),
  }
}

function supportsDate(kind: QuickAddKind) {
  return kind === 'task' || kind === 'goal' || kind === 'reminder'
}

export function QuickAddInput({ compact, onCreated }: QuickAddInputProps) {
  const { settings } = useAppSettings()
  const [kind, setKind] = useState<QuickAddKind>('task')
  const [text, setText] = useState('')
  const [priority, setPriority] = useState<TaskPriority>(settings.behavior.defaultTaskPriority)
  const [deadlineDate, setDeadlineDate] = useState('')
  const [projectId, setProjectId] = useState('')

  const { setValue: setTasks } = useLocalStorage<Task[]>(storageKeys.tasks, [])
  const { setValue: setNotes } = useLocalStorage<Note[]>(storageKeys.notes, [])
  const { setValue: setIdeas } = useLocalStorage<Idea[]>(storageKeys.ideas, [])
  const { setValue: setGoals } = useLocalStorage<Goal[]>(storageKeys.goals, [])
  const { setValue: setReminders } = useLocalStorage<Reminder[]>(storageKeys.reminders, [])
  const { value: projects } = useLocalStorage<Project[]>(storageKeys.projects, [])

  const canSubmit = useMemo(() => text.trim().length > 0, [text])
  const isCompact = Boolean(compact)

  function resetForm() {
    setText('')
    setDeadlineDate('')
    setProjectId('')
    setPriority(settings.behavior.defaultTaskPriority)
  }

  function toIsoNoon(dateValue: string) {
    if (!dateValue) return null
    return new Date(`${dateValue}T12:00:00`).toISOString()
  }

  function toIsoAtTime(dateValue: string, time = '09:00') {
    if (!dateValue) return new Date().toISOString()
    return new Date(`${dateValue}T${time}:00`).toISOString()
  }

  function handleSubmit() {
    if (!canSubmit) return

    const timestamp = new Date().toISOString()
    const id = crypto.randomUUID()
    const { title, content } = extractTitleAndContent(text)
    const selectedProjectId = projectId || null

    if (kind === 'task') {
      const nextTask: Task = {
        id,
        title,
        description: content,
        status: settings.behavior.defaultTaskStatus,
        priority,
        deadline: toIsoNoon(deadlineDate),
        createdAt: timestamp,
        updatedAt: timestamp,
        completedAt: null,
        projectId: selectedProjectId,
        noteIds: [],
        ideaIds: [],
        fileIds: [],
        goalIds: [],
      }
      setTasks((current) => [nextTask, ...current])
    }

    if (kind === 'note') {
      const nextNote: Note = {
        id,
        title,
        content: content || '',
        tags: [],
        createdAt: timestamp,
        updatedAt: timestamp,
        projectId: selectedProjectId,
        taskIds: [],
        ideaIds: [],
        fileIds: [],
        goalIds: [],
      }
      setNotes((current) => [nextNote, ...current])
    }

    if (kind === 'idea') {
      const nextIdea: Idea = {
        id,
        title,
        description: content,
        status: 'new',
        createdAt: timestamp,
        updatedAt: timestamp,
        projectId: selectedProjectId,
        taskIds: [],
        noteIds: [],
        goalIds: [],
      }
      setIdeas((current) => [nextIdea, ...current])
    }

    if (kind === 'goal') {
      const nextGoal: Goal = {
        id,
        title,
        description: content,
        status: 'new',
        deadline: toIsoNoon(deadlineDate),
        createdAt: timestamp,
        updatedAt: timestamp,
        projectId: selectedProjectId,
        taskIds: [],
        noteIds: [],
        ideaIds: [],
      }
      setGoals((current) => [nextGoal, ...current])
    }

    if (kind === 'reminder') {
      const nextReminder: Reminder = {
        id,
        title,
        description: content,
        remindAt: toIsoAtTime(deadlineDate || new Date().toISOString().slice(0, 10), '09:00'),
        linkedItemId: selectedProjectId,
        linkedItemType: selectedProjectId ? 'project' : null,
        completed: false,
        createdAt: timestamp,
      }
      setReminders((current) => [nextReminder, ...current])
    }

    resetForm()
    onCreated?.({ kind, createdId: id })
  }

  function handleTextKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter' || event.shiftKey) {
      return
    }

    event.preventDefault()
    handleSubmit()
  }

  return (
    <div className={isCompact ? 'space-y-3' : 'space-y-4'}>
      <div className="max-w-full rounded-[26px] border border-(--border) bg-white p-3.5 shadow-[0_10px_24px_rgba(11,16,32,0.08)] sm:p-4">
        <div className="ui-filter-scroll -mx-1 px-1 md:mx-0 md:px-0">
          {(
            [
              { id: 'task', label: 'Задача' },
              { id: 'note', label: 'Заметка' },
              { id: 'idea', label: 'Идея' },
              { id: 'goal', label: 'Цель' },
              { id: 'reminder', label: 'Напоминание' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setKind(item.id)}
              className={[
                'shrink-0 rounded-full border px-3.5 py-2 text-[11px] uppercase tracking-[0.12em] transition-colors duration-200',
                kind === item.id
                  ? 'border-(--accent) bg-(--accent-soft) text-(--accent)'
                  : 'border-(--border) bg-(--panel-elevated) text-(--text-muted) hover:border-(--accent) hover:text-(--text-primary)',
              ].join(' ')}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-start">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-(--accent)">+</span>
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={handleTextKeyDown}
              placeholder="Добавьте задачу, заметку или идею..."
              className="h-11 w-full min-w-0 rounded-2xl border border-(--border) bg-(--panel-elevated) pl-8 pr-3 text-sm text-(--text-primary) placeholder:text-(--text-muted) outline-none transition-colors duration-200 focus:border-(--accent)"
            />
          </div>

          <select
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            className="h-11 w-full min-w-0 rounded-2xl border border-(--border) bg-(--panel-elevated) px-3 text-sm text-(--text-primary) outline-none transition-colors duration-200 focus:border-(--accent)"
          >
            <option value="">Без проекта</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className={[
              'h-11 w-full rounded-full border px-4 text-sm font-medium transition-colors duration-200 lg:w-auto',
              canSubmit
                ? 'border-(--accent) bg-(--accent) text-white hover:opacity-90'
                : 'cursor-not-allowed border-(--border) bg-(--panel-elevated) text-(--text-muted)',
            ].join(' ')}
          >
            Добавить
          </button>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(180px,220px)_1fr] lg:items-start">
          {supportsDate(kind) ? (
            <input
              type="date"
              value={deadlineDate}
              onChange={(event) => setDeadlineDate(event.target.value)}
              className="h-11 w-full rounded-2xl border border-(--border) bg-(--panel-elevated) px-3 text-sm text-(--text-primary) outline-none transition-colors duration-200 focus:border-(--accent)"
            />
          ) : (
            <div className="grid h-11 place-items-center rounded-2xl border border-dashed border-(--border) bg-(--panel-elevated) px-3 text-center text-sm text-(--text-muted)">
              Дата не требуется
            </div>
          )}

          {kind === 'task' ? (
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'low', label: 'Низкий' },
                  { id: 'medium', label: 'Средний' },
                  { id: 'high', label: 'Высокий' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPriority(item.id)}
                  className={[
                    'min-h-10 rounded-full border px-3.5 text-[11px] uppercase tracking-[0.12em] transition-colors duration-200',
                    priority === item.id
                      ? 'border-(--accent) bg-(--accent-soft) text-(--accent)'
                      : 'border-(--border) bg-(--panel-elevated) text-(--text-muted) hover:border-(--accent)',
                  ].join(' ')}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid h-11 place-items-center rounded-2xl border border-dashed border-(--border) bg-(--panel-elevated) px-3 text-center text-sm text-(--text-muted)">
              Нажмите Enter или кнопку «Добавить»
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

