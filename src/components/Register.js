import React, { useState } from 'react';
import styles from './css/Auth.module.css';
import axios from './axiosconfig/Api';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/auth/register', { username, password });
      console.log('Registration successful:', response.data);
      // Handle successful registration (e.g., redirect to login page)
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <div className={styles.authContainer}>
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}