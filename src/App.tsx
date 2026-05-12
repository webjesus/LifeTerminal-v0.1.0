import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { useResolvedTheme } from './hooks/useResolvedTheme'
import { AppLayout } from './layouts/AppLayout'
import { CalendarPage } from './pages/Calendar'
import { DashboardPage } from './pages/DashboardPage'
import { DeadlinesPage } from './pages/Deadlines'
import { FilesPage } from './pages/Files'
import { IdeaDetailPage } from './pages/IdeaDetail'
import { IdeasPage } from './pages/Ideas'
import { LoginPage } from './pages/Login'
import { NoteDetailPage } from './pages/NoteDetail'
import { NotesPage } from './pages/Notes'
import { ProjectDetailPage } from './pages/ProjectDetail'
import { ProjectsPage } from './pages/Projects'
import { RegisterPage } from './pages/Register'
import { RemindersPage } from './pages/Reminders'
import { SettingsPage } from './pages/SettingsPage'
import { TasksPage } from './pages/Tasks'
import { useAppSettings } from './settings/useAppSettings'

function App() {
  const { settings } = useAppSettings()
  const resolvedTheme = useResolvedTheme(
    settings.appearance.theme,
    settings.appearance.accentColor,
  )

  return (
    <div className={`theme-${resolvedTheme} accent-${settings.appearance.accentColor}`}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            element={(
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            )}
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/deadlines" element={<DeadlinesPage />} />
            <Route path="/reminders" element={<RemindersPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/notes/:noteId" element={<NoteDetailPage />} />
            <Route path="/ideas" element={<IdeasPage />} />
            <Route path="/ideas/:ideaId" element={<IdeaDetailPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
            <Route path="/files" element={<FilesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
