import { Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from './components/MainLayout'
import AuditTrailPage from './pages/AuditTrailPage'
import CleaningRecordsPage from './pages/CleaningRecordsPage'
import DashboardPage from './pages/DashboardPage'
import EquipmentPage from './pages/EquipmentPage'

const App = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="equipment" element={<EquipmentPage />} />
        <Route path="cleaning-records" element={<CleaningRecordsPage />} />
        <Route path="audit-trail" element={<AuditTrailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
