import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Correct import
import axios from './axiosconfig/Api';
import { AuthContext } from '../authcontext/AuthContext';
import styles from './css/Auth.module.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUser(decodedToken);
        navigate('/'); // Navigate to main page if already logged in
      } catch (err) {
        console.error('Error decoding token:', err);
      }
    }
  }, [navigate, setUser]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/auth/login', { username, password });
      if (response.status === 200) {
        const token = response.data;
        localStorage.setItem('jwtToken', token); // Store token in localStorage
        const decodedToken = jwtDecode(token); // Decode the JWT
        setUser(decodedToken); // Set user in the context
        navigate('/'); // Navigate to main page
      } else {
        setError('Giriş yapılırken hata oluştu');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Kullanıcı adı veya şifre hatalı');
    }
  };

  return (
    <div className={styles.loginScreen}>
      <form onSubmit={handleLogin} className={styles.loginForm}>
        <input
          type="text"
          placeholder="Kullanıcı Adı"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">GİRİŞ</button>
        {error && <p className={styles.errorMessage}>{error}</p>}
      </form>
    </div>
  );
};

export default Login;