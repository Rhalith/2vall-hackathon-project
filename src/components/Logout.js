import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../authcontext/AuthContext'; // Use AuthContext, not AuthProvider

export default function Logout() {
  const { logout } = useContext(AuthContext); // Correctly use AuthContext here
  const navigate = useNavigate();

  useEffect(() => {
    logout(); // Call the logout function to clear the user session
    navigate('/login'); // Redirect to the login page after logging out
  }, [logout, navigate]);

  return <div>Logging out...</div>;
}