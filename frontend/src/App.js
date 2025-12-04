import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Chat from './pages/Chat';
import AdminPanel from './pages/AdminPanel';
import PasswordReset from './pages/PasswordReset';
import Home from './pages/Home';
import Services from './pages/Services';
import Contact from './pages/Contact';

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="app-background text-slate-100">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/projects" />}
        />
        <Route
          path="/register"
          element={!user ? <Register /> : <Navigate to="/projects" />}
        />
        <Route
          path="/reset-password"
          element={!user ? <PasswordReset /> : <Navigate to="/projects" />}
        />
        <Route
          path="/projects"
          element={user ? <Projects /> : <Navigate to="/login" />}
        />
        <Route
          path="/projects/:id"
          element={user ? <ProjectDetail /> : <Navigate to="/login" />}
        />
        <Route
          path="/chat"
          element={user ? <Chat /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin"
          element={user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/projects" />}
        />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </>
  );
}

export default App;
