import React, { useState, useEffect } from 'react';
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

function App() {
    const [darkMode, setDarkMode] = useState(true);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }}, [darkMode]);

    return (
        <AuthProvider>
            <Router>
                <div
                    className={`min-h-screen ${darkMode
                        ? 'bg-slate-950 text-slate-100'
                        : 'bg-slate-100 text-slate-900'}`}>
                    <div
                        className={`min-h-screen ${
                            darkMode 
                                ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950' 
                                : 'bg-gradient-to-b from-white via-slate-100 to-white'
                        }`}>
                        <AppRoutes darkMode={darkMode} setDarkMode={setDarkMode} />
                    </div>
                </div>
            </Router>
        </AuthProvider>
    );
}

function AppRoutes({ darkMode, setDarkMode }) {
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
            <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
            <main className="pt-6 pb-12">
                <Routes>
                    <Route path="/login" element={!user ? <Login /> : <Navigate to="/projects" />} />
                    <Route path="/register" element={!user ? <Register /> : <Navigate to="/projects" />}/>
                    <Route path="/reset-password" element={!user ? <PasswordReset /> : <Navigate to="/projects" />} />
                    <Route path="/projects" element={user ? <Projects /> : <Navigate to="/login" />} />
                    <Route path="/projects/:id" element={user ? <ProjectDetail /> : <Navigate to="/login" />} />
                    <Route path="/chat" element={user ? <Chat /> : <Navigate to="/login" />} />
                    <Route path="/admin" element={user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/projects" />} />
                    <Route path="/" element={<Home />} />
                </Routes>
            </main>
        </>
    );
}

export default App;
