// src/components/NavBar.jsx
import { Link, useNavigate } from 'react-router-dom';
import React from 'react';
import './NavBar.css';

export default function NavBar() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem('token');
  const role = sessionStorage.getItem('role');

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    // Dispatch custom event to notify App component
    window.dispatchEvent(new Event('sessionStorageChange'));
    navigate('/login', { replace: true });
  };

  const getDashboardLink = () => {
    switch (role) {
      case 'ROLE_ADMIN': return '/admin';
      case 'ROLE_MANAGER': return '/manager';
      case 'ROLE_TECH': return '/tech';
      case 'ROLE_PAINTER': return '/painter';
      case 'ROLE_DETAILER': return '/detailer';
      default: return null;
    }
  };

  const getRoleDisplayName = () => {
    switch (role) {
      case 'ROLE_ADMIN': return 'Admin';
      case 'ROLE_MANAGER': return 'Manager';
      case 'ROLE_TECH': return 'Tech';
      case 'ROLE_PAINTER': return 'Painter';
      case 'ROLE_DETAILER': return 'Detailer';
      default: return 'User';
    }
  };

  return (
    <nav className="navbar">
      <Link to="/welcome">Home</Link>
      <Link to="/track">Track</Link>
      {token ? (
        <>
          <Link to={getDashboardLink()}>{getRoleDisplayName()} Dashboard</Link>
          <button onClick={handleLogout}>Log Out</button>
        </>
      ) : (
        <Link to="/login">Log In</Link>
      )}
    </nav>
  );
}