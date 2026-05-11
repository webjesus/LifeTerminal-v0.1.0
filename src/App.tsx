import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { CalendarPage } from './pages/Calendar'
import { DashboardPage } from './pages/DashboardPage'
import { DeadlinesPage } from './pages/Deadlines'
import { FilesPage } from './pages/Files'
import { IdeasPage } from './pages/Ideas'
import { NotesPage } from './pages/Notes'
import { ProjectDetailPage } from './pages/ProjectDetail'
import { ProjectsPage } from './pages/Projects'
import { RemindersPage } from './pages/Reminders'
import { SettingsPage } from './pages/SettingsPage'
import { TasksPage } from './pages/Tasks'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/deadlines" element={<DeadlinesPage />} />
          <Route path="/reminders" element={<RemindersPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/ideas" element={<IdeasPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
