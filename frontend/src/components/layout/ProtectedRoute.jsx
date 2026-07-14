import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Skeleton from '../common/Skeleton';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-slate-50">
        <div className="w-full max-w-md space-y-4">
          <Skeleton height={40} variant="rectangular" className="w-12 h-12 rounded-full mx-auto" />
          <Skeleton height={20} className="w-3/4 mx-auto" />
          <Skeleton height={15} className="w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page and keep the current path to return to it later
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if role is allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;

