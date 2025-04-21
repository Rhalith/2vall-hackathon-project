import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './authcontext/AuthContext';  // Correctly import AuthProvider
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import PrivateRoute from './components/PrivateRoute';
import AllLocationsMap from './components/AllLocationsMap'; // Import AllLocationsMap
import './App.module.css';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/locations" element={<AllLocationsMap />} /> {/* New Route for all locations map */}

            {/* Private Route for SUPERADMIN */}
            <Route
              path="/register"
              element={<PrivateRoute element={Register} roles={['SUPERADMIN']} />}
            />
            {/* Home Route */}
            <Route path="/" element={<Home />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;