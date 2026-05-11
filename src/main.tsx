import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppErrorBoundary } from './components/AppErrorBoundary.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { SettingsProvider } from './context/SettingsContext.tsx'
import { CloudSyncProvider } from './hooks/useCloudSync.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <CloudSyncProvider>
            <App />
          </CloudSyncProvider>
        </SettingsProvider>
      </AuthProvider>
    </AppErrorBoundary>
  </StrictMode>,
)
