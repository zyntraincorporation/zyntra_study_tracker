import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CheckinPage from './pages/CheckinPage';
import TimerPage from './pages/TimerPage';
import StatsPage from './pages/StatsPage';
import ChaptersPage from './pages/ChaptersPage';
import AIReportPage  from './pages/AIReportPage';
import RevisionPage  from './pages/RevisionPage';
import MistakePage   from './pages/MistakePage';
import RoutinePage   from './pages/RoutinePage';
import Toast from './components/ui/Toast';

function PrivateRoute({ children }) {
  const isAuthed = useAuthStore((s) => s.isAuthed);
  return isAuthed ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toast />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          <Route index                element={<DashboardPage />} />
          <Route path="checkin"       element={<CheckinPage />} />
          <Route path="timer"         element={<TimerPage />} />
          <Route path="stats"         element={<StatsPage />} />
          <Route path="chapters"      element={<ChaptersPage />} />
          <Route path="ai"            element={<AIReportPage />} />
          <Route path="revision"      element={<RevisionPage />} />
          <Route path="mistakes"      element={<MistakePage />} />
          <Route path="routine"       element={<RoutinePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}