import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import Profile from './pages/Profile';
import ProfileSlider from './components/ProfileSlider';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthContext } from './AuthContextInstance';

function App() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, loading } = React.useContext(AuthContext);

  if (loading) return null; // Wait for auth to initialize

  return (
    <Router>
      <div className="min-h-screen flex flex-col transition-colors duration-300" style={{ backgroundColor: 'var(--bg-main)' }}>
        <Header onProfileClick={() => setIsProfileOpen(true)} />
        <ProfileSlider isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/" 
              element={
                user ? (
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                ) : (
                  <Landing />
                )
              } 
            />
            <Route 
              path="/projects" 
              element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/projects/:id" 
              element={
                <ProtectedRoute>
                  <ProjectDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
