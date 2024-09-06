import React, { useState } from 'react';
import styles from './css/Register.module.css'; // Import the new CSS module
import axios from './axiosconfig/Api';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState(''); // İsim
  const [lastName, setLastName] = useState(''); // Soyisim
  const [showPassword, setShowPassword] = useState(false); // Show/hide password

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/auth/register', { 
        username, 
        firstName, 
        lastName,
        password
      });
      alert('Kullanıcı başarıyla kaydedildi!');
      // Handle successful registration (e.g., redirect to login page)
    } catch (error) {
      alert('Kullanıcı kaydı yapılırken hata oluştu!');
    }
  };

  // Toggle show/hide password
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles.registerContainer}>
      <div className={styles.logoContainer}>
        <img src={require('../images/t3ai.png')} alt="T3AI Logo" className={styles.logo} />
        <img src={require('../images/teknofest.png')} alt="Teknofest Logo" className={styles.logo} />
      </div>
      <h2 className={styles.title}>Yetkili Kaydı Yap</h2>
      <form onSubmit={handleRegister} className={styles.registerForm}>
        <input
          type="text"
          placeholder="İsim" // First Name
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Soyisim" // Last Name
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Kullanıcı Adı" // Username
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <div className={styles.passwordWrapper}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Şifre" // Password
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span
            onClick={togglePasswordVisibility}
            className={styles.passwordToggle}
          >
            {showPassword ? 'Gizle' : 'Göster'}
          </span>
        </div>
        <button type="submit" className={styles.button}>Kayıt Ol</button>
      </form>
    </div>
  );
}