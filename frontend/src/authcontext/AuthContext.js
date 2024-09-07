import React, { createContext, useEffect, useState } from 'react';
import axios from '../components/axiosconfig/Api';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = async (expired = false) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      try {
        if (!expired) {
          await axios.post('/api/auth/logout', {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
        localStorage.removeItem('jwtToken');
        setUser(null);
      } catch (err) {
        console.error('Error during logout', err);
        localStorage.removeItem('jwtToken');
        setUser(null);
      }
    }
  };

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem('jwtToken');
      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          if (decodedToken.exp * 1000 < Date.now()) {
            // If token is expired, log out the user
            await logout();
          } else {
            setUser(decodedToken);
          }
        } catch (error) {
          console.error('Error decoding token:', error);
          localStorage.removeItem('jwtToken');
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkToken();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};