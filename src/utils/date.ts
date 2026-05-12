import { safeDateFormat } from './safe'

export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function toStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function formatDateShort(value: string) {
  return safeDateFormat(value, new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
  }))
}

export function formatDateWithYear(value: string | null, fallback = 'Не задан') {
  return safeDateFormat(value, new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }), fallback)
}

export function formatDateTimeShort(value: string) {
  return safeDateFormat(value, new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }))
}

export function formatDateLong(value: Date) {
  return safeDateFormat(value, new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }))
}