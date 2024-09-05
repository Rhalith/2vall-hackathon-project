import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './authcontext/AuthContext';  // Correctly import AuthProvider
import Home from './components/Home';
import Login from './components/Login';
import Logout from './components/Logout';
import Register from './components/Register';
import PrivateRoute from './components/PrivateRoute';
import './App.module.css';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Private Route for SUPERADMIN */}
            <Route
              path="/register"
              element={<PrivateRoute element={Register} roles={['SUPERADMIN']} />}
            />
            <Route path="/logout" element={<Logout />} />
            {/* Home Route */}
            <Route path="/" element={<Home />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;