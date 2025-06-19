
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getRoleFromToken } from '../utils/jwt';

interface PrivateRouteProps {
  allowedRoles: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles }) => {
  const userRole = getRoleFromToken();

  const hasAccess = userRole ? allowedRoles.includes(userRole) : false;

  return hasAccess ? <Outlet /> : <Navigate to="/unauthorized" />;
};

export default PrivateRoute;