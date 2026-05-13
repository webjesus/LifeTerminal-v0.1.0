import { Outlet, useLocation } from 'react-router-dom'
import { useAppSettings } from '../settings/useAppSettings'
import { getAppearanceClassNames } from '../settings/appSettingsConfig'
import { cn } from '../utils/cn'
import { MobileFab } from './MobileFab'
import { MobileBottomNav } from './MobileBottomNav'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
  const { settings } = useAppSettings()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const isHomePage = location.pathname === '/' || location.pathname === '/home' || location.pathname === '/dashboard'
  const isCompactSidebar = !isHomePage
  const isProjectDetailRoute = /^\/projects\/[^/]+$/.test(location.pathname)
  const isProjectWorkspaceRoute = isProjectDetailRoute && searchParams.get('tab') === 'workspace'

  return (
    <div className={cn('h-dvh overflow-hidden bg-(--bg) text-(--text-primary)', getAppearanceClassNames(settings.appearance), !settings.display.showPageDescriptions && 'page-descriptions-hidden')}>
      <div className={cn('grid h-dvh', isCompactSidebar ? 'lg:grid-cols-[80px_1fr]' : 'lg:grid-cols-[320px_1fr]')}>
        <Sidebar compact={isCompactSidebar} />

        <div className="min-w-0 flex flex-col overflow-hidden">
          <Topbar />
          <main className={cn('ui-mobile-page flex-1 overflow-y-auto overflow-x-hidden', isProjectWorkspaceRoute && 'workspace-editor-page lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-hidden lg:px-6 lg:pt-2')}>
            <Outlet />
          </main>
        </div>
      </div>

      <MobileFab />
      <MobileBottomNav />
    </div>
  )
}
