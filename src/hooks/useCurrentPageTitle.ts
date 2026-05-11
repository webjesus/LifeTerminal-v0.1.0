import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { navigationItems } from '../data/navigation'
import type { SectionKey } from '../types/navigation'

type CurrentPageTitle = {
  label: string
  section: SectionKey
}

export function useCurrentPageTitle() {
  const location = useLocation()

  return useMemo<CurrentPageTitle>(() => {
    if (location.pathname.startsWith('/projects/')) {
      return { label: 'Проект', section: 'project' }
    }

    const current =
      navigationItems.find((item) => item.path === location.pathname) ??
      navigationItems.find((item) => location.pathname.startsWith(`${item.path}/`) && item.path !== '/')

    return current ?? { label: 'Главная', section: 'dashboard' }
  }, [location.pathname])
}
