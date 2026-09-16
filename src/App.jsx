import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import RoleSelection from './pages/RoleSelection';
import ClientDashboard from './pages/ClientDashboard';
import FinisherDashboard from './pages/FinisherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ChatPage from './pages/ChatPage';

const RootRedirect = () => {
  const { user, profile, loading } = useAuth();
  
  if (loading) return null; // Let ProtectedRoute handle loading if needed, or just blank
  
  if (!user) return <Navigate to="/login" replace />;
  if (!profile?.role) return <Navigate to="/role-selection" replace />;
  
  if (profile.role === 'admin') return <Navigate to="/admin" replace />;
  if (profile.role === 'finisher') return <Navigate to="/finisher" replace />;
  return <Navigate to="/client" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Role Selection (Auth required, but no specific role) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/role-selection" element={<RoleSelection />} />
        </Route>

        {/* Protected Client Routes */}
        <Route element={<ProtectedRoute allowedRoles={['client']} />}>
          <Route path="/client" element={<ClientDashboard />} />
        </Route>

        {/* Protected Finisher Routes */}
        <Route element={<ProtectedRoute allowedRoles={['finisher']} />}>
          <Route path="/finisher" element={<FinisherDashboard />} />
        </Route>

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* Shared Chat Route (Access checks happen inside based on DB RLS) */}
        <Route element={<ProtectedRoute allowedRoles={['client', 'finisher', 'admin']} />}>
          <Route path="/chat/:conversationId" element={<ChatPage />} />
        </Route>

        {/* Fallback */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
