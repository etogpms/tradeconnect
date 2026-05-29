import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface RoleRouteProps {
  children: React.ReactElement;
  allowedRoles: ('client' | 'tradie' | 'admin' | 'super_admin')[];
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-zinc-400 font-medium">Checking authorization...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // If user has a valid role but tried to access an incorrect route, redirect to their home dashboard
    if (user.role === 'client') {
      return <Navigate to="/client" replace />;
    } else if (user.role === 'tradie') {
      return <Navigate to="/tradie" replace />;
    } else if (user.role === 'admin' || user.role === 'super_admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};
export default RoleRoute;
