import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { GuestSite }       from './pages/GuestSite';
import { AdminLogin }      from './pages/AdminLogin';
import { AdminDashboard }  from './pages/AdminDashboard';
import { isAuthenticated } from './lib/auth';

function RequireAuth({ children }: { children: React.ReactNode }) {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"             element={<GuestSite />} />
        <Route path="/admin/login"  element={<AdminLogin />} />
        <Route path="/admin"        element={<RequireAuth><AdminDashboard /></RequireAuth>} />
        <Route path="*"             element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
