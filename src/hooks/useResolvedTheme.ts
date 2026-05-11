import { useEffect, useState } from 'react'
import type { AccentColor, AppTheme } from '../types/settings'

type ResolvedTheme = 'light' | 'dark'

const THEME_CLASSES: ResolvedTheme[] = ['light', 'dark']
const ACCENT_CLASSES: AccentColor[] = ['violet', 'blue', 'purple', 'indigo']

function getSystemTheme() {
  if (typeof window === 'undefined') {
    return 'light' as ResolvedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useResolvedTheme(theme: AppTheme, accentColor: AccentColor) {
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme())

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => setSystemTheme(media.matches ? 'dark' : 'light')

    handleChange()
    media.addEventListener('change', handleChange)

    return () => {
      media.removeEventListener('change', handleChange)
    }
  }, [])

  const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : theme

  useEffect(() => {
    const root = document.documentElement

    root.classList.remove(...THEME_CLASSES.map((item) => `theme-${item}`))
    root.classList.remove(...ACCENT_CLASSES.map((item) => `accent-${item}`))

    root.classList.add(`theme-${resolvedTheme}`)
    root.classList.add(`accent-${accentColor}`)
    root.style.colorScheme = resolvedTheme
  }, [accentColor, resolvedTheme])

  return resolvedTheme
}
