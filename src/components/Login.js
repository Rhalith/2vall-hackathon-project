import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode'; // Correct import
import axios from './axiosconfig/Api';
import { AuthContext } from '../authcontext/AuthContext';
import styles from './css/Login.module.css';

// Import PNG images from the src folder
import t3aiLogo from '../images/t3ai.png';
import teknofestLogo from '../images/teknofest.png';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State to handle show/hide password
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

  // Toggle show/hide password
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles.loginScreen}>
      {/* Left and Right Logos */}
      <div className={styles.leftLogo}>
        <img src={t3aiLogo} alt="T3AI Logo" />
      </div>
      <div className={styles.rightLogo}>
        <img src={teknofestLogo} alt="Teknofest Logo" />
      </div>

      <form onSubmit={handleLogin} className={styles.loginForm}>
        <h1>Giriş Yap</h1>
        <input
          type="text"
          placeholder="Kullanıcı Adı"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={styles.input}
          required
        />
        <div className={styles.passwordWrapper}>
          <input
            type={showPassword ? 'text' : 'password'} // Toggle between text and password
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            required
          />
          <span
            onClick={togglePasswordVisibility}
            className={styles.passwordToggle}
          >
            {showPassword ? 'Gizle' : 'Göster'} {/* Show/Hide text */}
          </span>
        </div>
        <button type="submit" className={styles.button}>GİRİŞ</button>
        {error && <p className={styles.errorMessage}>{error}</p>}
      </form>
    </div>
  );
};

export default Login;