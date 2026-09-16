import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center flex-col">
        <img src="/asclogo.jpg" alt="Loading..." className="w-24 h-24 mb-4 object-contain filter drop-shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse" />
        <p className="text-gray-400">Loading your secure environment...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user has no role yet (e.g., from Google OAuth), force them to select a role
  if (!profile?.role && window.location.pathname !== '/role-selection') {
    return <Navigate to="/role-selection" replace />;
  }

  if (allowedRoles && profile?.role && !allowedRoles.includes(profile.role)) {
    // Redirect based on role if they try to access something unauthorized
    if (profile.role === 'admin') return <Navigate to="/admin" replace />;
    if (profile.role === 'finisher') return <Navigate to="/finisher" replace />;
    return <Navigate to="/client" replace />;
  }

  return <Outlet />;
};
