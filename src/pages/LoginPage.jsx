// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";
import "./LoginPage.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
  console.log(' handleLogin fired');
  try {
    const response = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    console.log("🔐 Received token:", { accessToken: response.accessToken.substring(0, 50) + "...", tokenType: response.tokenType });
    
    // Store just the token, api.js will add the Bearer prefix
    sessionStorage.setItem("token", response.accessToken);

    // manually decode the payload
    const base64Payload = response.accessToken.split('.')[1];
    console.log("📦 Base64 payload:", base64Payload);
    
    const payload = JSON.parse(atob(base64Payload));
    console.log("🔍 Full JWT payload:", payload);
    
    const { role } = payload;
    console.log("🎭 Decoded role:", role);
    console.log("🎭 Role type:", typeof role);
    
    sessionStorage.setItem("role", role);
    sessionStorage.setItem("username", username);

    // Dispatch custom event to notify App component
    window.dispatchEvent(new Event('sessionStorageChange'));

    // decide where to go
    const dest = (() => {
      switch (role) {
        case "ROLE_ADMIN":    return "/admin";
        case "ROLE_MANAGER":  return "/manager";
        case "ROLE_TECH":     return "/tech";
        case "ROLE_PAINTER":  return "/painter";
        case "ROLE_DETAILER": return "/detailer";
        default:              
          console.log(" Unknown role:", role, "defaulting to /welcome");
          return "/welcome";
      }
    })();

    console.log(" navigating to", dest);
    navigate(dest);

  } catch (err) {
    console.error(" Login error:", err);
    setError("Invalid credentials. Please try again.");
  }
};

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Employee Login</h2>
        <p className="login-subtitle">Access your dashboard with secure credentials</p>
        {error && <div className="error">{error}</div>}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="login-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="login-input"
        />
        <button className="login-submit" onClick={handleLogin}>
          Sign In
        </button>
        <div className="login-footer">
          Secure access to GearMind management system
        </div>
      </div>
    </div>
  );
};

export default LoginPage;