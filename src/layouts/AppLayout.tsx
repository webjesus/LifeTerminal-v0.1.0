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
    <div className={cn('min-h-screen max-w-full overflow-x-clip bg-(--bg) text-(--text-secondary)', getAppearanceClassNames(settings.appearance), !settings.display.showPageDescriptions && 'page-descriptions-hidden')}>
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col md:flex-row">
        <Sidebar />

        <div className="flex min-w-0 max-w-full flex-1 flex-col overflow-x-clip">
          <Topbar />
          <main className="ui-mobile-page flex-1">
            <Outlet />
          </main>
        </div>
      </div>

      <MobileFab />
      <MobileBottomNav />
    </div>
  )
}
