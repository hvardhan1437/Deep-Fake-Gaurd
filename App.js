import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import UploadPage from "./pages/UploadPage";
import FeedPage from "./pages/FeedPage";
import Navbar from "./components/Navbar";
import "./App.css";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication token on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("token");
  };

  return (
    <Router>
      <div className="App">
        {/* Navbar only visible when authenticated */}
        {isAuthenticated && <Navbar onLogout={handleLogout} />}

        {/* Add margin top only if navbar exists */}
        <main className={isAuthenticated ? "pt-20" : ""}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />

            {/* Protected routes */}
            <Route
              path="/upload"
              element={isAuthenticated ? <UploadPage /> : <Navigate to="/login" />}
            />
            <Route
              path="/feed"
              element={isAuthenticated ? <FeedPage /> : <Navigate to="/login" />}
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
