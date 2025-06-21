// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './App.css';

import WelcomePage        from './pages/WelcomePage';
import TrackPage          from './pages/TrackPage';
import LoginPage          from './pages/LoginPage';
import AdminDashboard     from './pages/AdminDashboard';
import ManagerDashboard   from './pages/ManagerDashboard';
import TechDashboard      from './pages/TechDashboard';
import PainterDashboard   from './pages/PainterDashboard';
import DetailerDashboard  from './pages/DetailerDashboard';

export default function AppWrapper() {
  const [authState, setAuthState] = useState({
    token: sessionStorage.getItem('token'),
    role: sessionStorage.getItem('role'),
    isLoggedIn: Boolean(sessionStorage.getItem('token'))
  });

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setAuthState({
        token: sessionStorage.getItem('token'),
        role: sessionStorage.getItem('role'),
        isLoggedIn: Boolean(sessionStorage.getItem('token'))
      });
    };

    // Listen for custom sessionStorage change event
    window.addEventListener('sessionStorageChange', handleStorageChange);
    
    // Also check on focus (for same-tab updates)
    window.addEventListener('focus', handleStorageChange);
    
    return () => {
      window.removeEventListener('sessionStorageChange', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  console.log("🔍 App state:", { 
    isLoggedIn: authState.isLoggedIn, 
    role: authState.role, 
    currentPath: window.location.pathname,
    tokenExists: Boolean(authState.token),
    tokenLength: authState.token ? authState.token.length : 0
  });

  return (
    <Router>
      <Routes>
        {/* root and catch-all go to welcome */}
        <Route path="/" element={<WelcomePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />

        {/* public */}
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/track"   element={<TrackPage   />} />
        <Route path="/login"   element={<LoginPage   />} />

        {/* protected */}
        <Route
          path="/admin"
          element={
            (() => {
              const shouldShow = authState.isLoggedIn && authState.role === "ROLE_ADMIN";
              console.log("🔒 Admin route check:", { isLoggedIn: authState.isLoggedIn, role: authState.role, shouldShow });
              return shouldShow ? <AdminDashboard /> : <Navigate to="/login" replace />;
            })()
          }
        />
        <Route
          path="/manager"
          element={
            (() => {
              const shouldShow = authState.isLoggedIn && authState.role === "ROLE_MANAGER";
              console.log("🔒 Manager route check:", { isLoggedIn: authState.isLoggedIn, role: authState.role, shouldShow });
              return shouldShow ? <ManagerDashboard /> : <Navigate to="/login" replace />;
            })()
          }
        />
        <Route
          path="/tech"
          element={
            (() => {
              const shouldShow = authState.isLoggedIn && authState.role === "ROLE_TECH";
              console.log("🔒 Tech route check:", { isLoggedIn: authState.isLoggedIn, role: authState.role, shouldShow });
              return shouldShow ? <TechDashboard /> : <Navigate to="/login" replace />;
            })()
          }
        />
        <Route
          path="/painter"
          element={
            (() => {
              const shouldShow = authState.isLoggedIn && authState.role === "ROLE_PAINTER";
              console.log("🔒 Painter route check:", { isLoggedIn: authState.isLoggedIn, role: authState.role, shouldShow });
              return shouldShow ? <PainterDashboard /> : <Navigate to="/login" replace />;
            })()
          }
        />
        <Route
          path="/detailer"
          element={
            (() => {
              const shouldShow = authState.isLoggedIn && authState.role === "ROLE_DETAILER";
              console.log("🔒 Detailer route check:", { isLoggedIn: authState.isLoggedIn, role: authState.role, shouldShow });
              return shouldShow ? <DetailerDashboard /> : <Navigate to="/login" replace />;
            })()
          }
        />
      </Routes>
    </Router>
  );
}