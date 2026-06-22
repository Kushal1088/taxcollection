import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-medium text-muted-foreground">Authenticating session...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user || !profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Block pending/rejected citizens from accessing actual dashboard
  if (profile.role === 'citizen' && profile.status !== 'active') {
    // If they are on register, login, or the pending page itself, let them through
    if (location.pathname === '/pending-review') {
      return children;
    }
    return <Navigate to="/pending-review" replace />;
  }

  // If already active citizen but trying to access the pending page, send to citizen dashboard
  if (profile.role === 'citizen' && profile.status === 'active' && location.pathname === '/pending-review') {
    return <Navigate to="/citizen" replace />;
  }

  // Check roles
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
