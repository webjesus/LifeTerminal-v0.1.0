import { Outlet } from 'react-router-dom'
import { useAppSettings } from '../settings/useAppSettings'
import { getAppearanceClassNames } from '../settings/appSettingsConfig'
import { cn } from '../utils/cn'
import { MobileFab } from './MobileFab'
import { MobileBottomNav } from './MobileBottomNav'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
  const { settings } = useAppSettings()

  return (
    <div className={cn('h-dvh overflow-hidden bg-(--bg) text-(--text-primary)', getAppearanceClassNames(settings.appearance), !settings.display.showPageDescriptions && 'page-descriptions-hidden')}>
      <div className="grid h-dvh lg:grid-cols-[320px_1fr]">
        <Sidebar />

        <div className="min-w-0 flex flex-col overflow-hidden">
          <Topbar />
          <main className="ui-mobile-page flex-1 overflow-y-auto overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>

      <MobileFab />
      <MobileBottomNav />
    </div>
  )
}
