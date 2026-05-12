import { useMemo, useState } from 'react'
import { CalendarDayPanel } from '../components/calendar/CalendarDayPanel'
import { CalendarView } from '../components/calendar/CalendarView'
import {
  EventFormModal,
  type EventFormMode,
  type EventFormValues,
} from '../components/calendar/EventFormModal'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useAppSettings } from '../settings/useAppSettings'
import type { CalendarEvent, Project, Reminder, Task } from '../types'
import { storageKeys } from '../utils/storage'

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function toIsoAtTime(dateKey: string, time = '09:00') {
  return new Date(`${dateKey}T${time}:00`).toISOString()
}

function toIsoNoon(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`).toISOString()
}

function getMonthGrid(referenceDate: Date, weekStartsOn: 'monday' | 'sunday') {
  const startOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1)
  const startDay = weekStartsOn === 'monday' ? (startOfMonth.getDay() + 6) % 7 : startOfMonth.getDay()
  const gridStart = new Date(startOfMonth)
  gridStart.setDate(startOfMonth.getDate() - startDay)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    return date
  })
}

function isSameDate(value: string | null, dateKey: string) {
  if (!value) {
    return false
  }

  return toDateKey(new Date(value)) === dateKey
}

function isTaskOverdue(task: Task, todayKey: string) {
  if (!task.deadline || task.status === 'completed') {
    return false
  }

  return toDateKey(new Date(task.deadline)) < todayKey
}

function formatSelectedDate(dateKey: string, dateFormat: 'dd.mm.yyyy' | 'yyyy-mm-dd') {
  if (dateFormat === 'yyyy-mm-dd') {
    return dateKey
  }

  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parseDateKey(dateKey))
}

export function CalendarPage() {
  const { settings } = useAppSettings()
  const today = new Date()
  const todayKey = toDateKey(today)
  const [currentMonth, setCurrentMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey)
  const [modalMode, setModalMode] = useState<EventFormMode | null>(null)
  const { value: tasks, setValue: setTasks } = useLocalStorage<Task[]>(storageKeys.tasks, [])
  const { value: reminders, setValue: setReminders } = useLocalStorage<Reminder[]>(storageKeys.reminders, [])
  const { value: calendarEvents, setValue: setCalendarEvents } = useLocalStorage<CalendarEvent[]>(storageKeys.calendarEvents, [])
  const { value: projects } = useLocalStorage<Project[]>(storageKeys.projects, [])

  const monthDays = useMemo(() => getMonthGrid(currentMonth, settings.calendar.weekStartsOn), [currentMonth, settings.calendar.weekStartsOn])
  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('ru-RU', {
        month: 'long',
        year: 'numeric',
      }).format(currentMonth),
    [currentMonth],
  )

  const summaries = useMemo(() => {
    return monthDays.reduce<Record<string, { taskCount: number; reminderCount: number; eventCount: number; projectCount: number; overdueCount: number }>>((accumulator, date) => {
      const dateKey = toDateKey(date)
      const dayTasks = tasks
        .filter((task) => settings.calendar.showCompletedTasksInCalendar || task.status !== 'completed')
        .filter((task) => isSameDate(task.deadline, dateKey))
      const dayReminders = reminders.filter((reminder) => isSameDate(reminder.remindAt, dateKey))
      const dayEvents = calendarEvents.filter((event) => isSameDate(event.date, dateKey))
      const dayProjects = projects.filter((project) => isSameDate(project.deadline, dateKey))

      accumulator[dateKey] = {
        taskCount: dayTasks.length,
        reminderCount: dayReminders.length,
        eventCount: dayEvents.length,
        projectCount: dayProjects.length,
        overdueCount: dayTasks.filter((task) => isTaskOverdue(task, todayKey)).length,
      }

      return accumulator
    }, {})
  }, [calendarEvents, monthDays, projects, reminders, settings.calendar.showCompletedTasksInCalendar, tasks, todayKey])

  const selectedTasks = useMemo(
    () => tasks.filter((task) => settings.calendar.showCompletedTasksInCalendar || task.status !== 'completed').filter((task) => isSameDate(task.deadline, selectedDateKey)),
    [selectedDateKey, settings.calendar.showCompletedTasksInCalendar, tasks],
  )
  const selectedReminders = useMemo(
    () => reminders.filter((reminder) => isSameDate(reminder.remindAt, selectedDateKey)),
    [reminders, selectedDateKey],
  )
  const selectedProjectEvents = useMemo(
    () => projects.filter((project) => isSameDate(project.deadline, selectedDateKey)),
    [projects, selectedDateKey],
  )
  const selectedCalendarEvents = useMemo(
    () => calendarEvents.filter((event) => isSameDate(event.date, selectedDateKey)),
    [calendarEvents, selectedDateKey],
  )

  function openModal(mode: EventFormMode) {
    setModalMode(mode)
  }

  function closeModal() {
    setModalMode(null)
  }

  function handlePreviousMonth() {
    setCurrentMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
  }

  function handleNextMonth() {
    setCurrentMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
  }

  function handleSelectDate(date: Date) {
    const dateKey = toDateKey(date)
    setSelectedDateKey(dateKey)
    setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1))
  }

  function handleSubmit(values: EventFormValues) {
    const timestamp = new Date().toISOString()

    if (modalMode === 'task') {
      const nextTask: Task = {
        id: crypto.randomUUID(),
        title: values.title,
        description: values.description,
        tags: [],
        status: settings.behavior.defaultTaskStatus,
        priority: values.priority,
        deadline: toIsoNoon(values.date),
        createdAt: timestamp,
        updatedAt: timestamp,
        completedAt: null,
        projectId: null,
        noteIds: [],
        ideaIds: [],
        fileIds: [],
        goalIds: [],
      }

      setTasks((currentTasks) => [nextTask, ...currentTasks])
    }

    if (modalMode === 'reminder') {
      const nextReminder: Reminder = {
        id: crypto.randomUUID(),
        title: values.title,
        description: values.description,
        remindAt: toIsoAtTime(values.date, values.time),
        linkedItemId: null,
        linkedItemType: null,
        completed: false,
        createdAt: timestamp,
      }

      setReminders((currentReminders) => [nextReminder, ...currentReminders])
    }

    if (modalMode === 'event') {
      const nextEvent: CalendarEvent = {
        id: crypto.randomUUID(),
        title: values.title,
        description: values.description,
        date: toIsoAtTime(values.date, values.time),
        type: values.eventType,
        linkedItemId: null,
        linkedItemType: null,
        createdAt: timestamp,
      }

      setCalendarEvents((currentEvents) => [nextEvent, ...currentEvents])
    }

    setSelectedDateKey(values.date)
    closeModal()
  }

  function handleMoveTask(task: Task) {
    const nextDate = window.prompt('Введите новую дату в формате YYYY-MM-DD', selectedDateKey)

    if (!nextDate || Number.isNaN(Date.parse(`${nextDate}T12:00:00`))) {
      return
    }

    const timestamp = new Date().toISOString()

    setTasks((currentTasks) =>
      currentTasks.map((item) =>
        item.id === task.id
          ? {
              ...item,
              deadline: toIsoNoon(nextDate),
              updatedAt: timestamp,
            }
          : item,
      ),
    )
  }

  function handleExtendTask(task: Task) {
    const currentDate = task.deadline ? new Date(task.deadline) : parseDateKey(selectedDateKey)
    const nextDate = new Date(currentDate)
    nextDate.setDate(nextDate.getDate() + 1)
    const timestamp = new Date().toISOString()

    setTasks((currentTasks) =>
      currentTasks.map((item) =>
        item.id === task.id
          ? {
              ...item,
              deadline: toIsoNoon(toDateKey(nextDate)),
              updatedAt: timestamp,
            }
          : item,
      ),
    )
  }

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-(--border) bg-(--panel) p-5 md:p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-(--text-muted)">Planning Surface</p>
        <h1 className="mt-2 text-3xl font-semibold text-(--text-primary)">Календарь</h1>
        <p className="page-description mt-2 max-w-3xl text-sm text-(--text-muted) md:text-base">
          Месячный обзор задач, напоминаний, проектных дат и календарных событий с действиями прямо из выбранного дня.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <CalendarView
          monthLabel={monthLabel}
          weekDays={settings.calendar.weekStartsOn === 'monday' ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] : ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']}
          days={monthDays}
          currentMonth={currentMonth}
          selectedDateKey={selectedDateKey}
          todayKey={todayKey}
          summaries={summaries}
          onPrevMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
          onSelectDate={handleSelectDate}
        />

        <CalendarDayPanel
          selectedDateLabel={formatSelectedDate(selectedDateKey, settings.calendar.dateFormat)}
          tasks={selectedTasks}
          reminders={selectedReminders}
          projects={selectedProjectEvents}
          events={selectedCalendarEvents}
          onAddTask={() => openModal('task')}
          onAddReminder={() => openModal('reminder')}
          onAddEvent={() => openModal('event')}
          onRescheduleTask={handleMoveTask}
          onExtendDeadline={handleExtendTask}
        />
      </div>

      {modalMode ? (
        <EventFormModal
          mode={modalMode}
          selectedDate={selectedDateKey}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      ) : null}
    </section>
  )
}
