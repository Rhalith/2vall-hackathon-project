import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../authcontext/AuthContext';

const PrivateRoute = ({ element: Component, roles, ...rest }) => {
  const { user } = useContext(AuthContext);

  // If no user is logged in, redirect to login
  if (!user) {
    console.log('Bu sayfayı görmek için giriş yapmalısınız!');
    return <Navigate to="/login" />;
  }

  // Extract user roles
  const userRoles = user.roles || [];
  console.log('User Roles:', userRoles);

  // Check if the user has the required role to access this page
  const hasRequiredRole = roles.some(role => userRoles.includes(role));

  if (!hasRequiredRole) {
    alert('Bu sayfayı görmek için izniniz yok!');
    return <Navigate to="/" />;
  }

  return <Component {...rest} />;
};

export default PrivateRoute;