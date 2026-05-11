import type { LucideIcon } from 'lucide-react'
import {
  Bot,
  Bell,
  BookCopy,
  CalendarDays,
  Clock3,
  Files,
  FolderKanban,
  LayoutDashboard,
  Lightbulb,
  MoreHorizontal,
  Network,
  NotebookPen,
  Repeat2,
  Settings,
  Target,
  Briefcase,
  ListTodo,
} from 'lucide-react'
import type { SectionKey } from '../../types/navigation'

type SectionIconProps = {
  section: SectionKey
  className?: string
  size?: number
  strokeWidth?: number
}

const iconMap: Record<SectionKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  tasks: ListTodo,
  habits: Repeat2,
  calendar: CalendarDays,
  deadlines: Clock3,
  reminders: Bell,
  notes: NotebookPen,
  knowledge: BookCopy,
  ideas: Lightbulb,
  projects: FolderKanban,
  files: Files,
  settings: Settings,
  more: MoreHorizontal,
  project: Briefcase,
  workspace: FolderKanban,
  map: Network,
  goals: Target,
  assistant: Bot,
}

export function SectionIcon({ section, className, size = 20, strokeWidth = 2 }: SectionIconProps) {
  const Icon = iconMap[section]

  return <Icon className={className} size={size} strokeWidth={strokeWidth} />
}