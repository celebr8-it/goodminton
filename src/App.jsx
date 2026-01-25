import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { ThemeProvider } from './lib/ThemeContext';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/Auth';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import CreateTournament from './pages/CreateTournament';
import TournamentDetail from './pages/TournamentDetail';

// Home Page
const Home = () => (
  <div>
    <div className="header-row">
      <div>
        <h1 className="page-title">Welcome back! 👋</h1>
        <p className="page-subtitle">Ready for some badminton?</p>
      </div>
    </div>

    <div className="grid-2 section-gap">
      <div className="card card-hover" style={{ cursor: 'pointer', textAlign: 'center', padding: '32px' }}>
        <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>🏸</span>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Quick Match</span>
      </div>
      <div className="card card-hover" style={{ cursor: 'pointer', textAlign: 'center', padding: '32px' }}>
        <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>🏆</span>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Tournament</span>
      </div>
    </div>

    <div className="card">
      <h2 className="section-title" style={{ marginBottom: '16px' }}>Recent Activity</h2>
      <div className="empty-state">
        <p>No recent matches. Start playing!</p>
      </div>
    </div>
  </div>
);

// Tournaments List Page
const Tournaments = () => (
  <div>
    <div className="header-row">
      <div>
        <h1 className="page-title">My Tournaments</h1>
        <p className="page-subtitle">View all tournaments you're part of</p>
      </div>
    </div>
    <div className="card empty-state">
      <p>Join a group to participate in tournaments!</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  return <Layout>{children}</Layout>;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/home" replace />} />
      <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/home" replace />} />

      {/* Protected Routes */}
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
      <Route path="/groups/:groupId" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
      <Route path="/groups/:groupId/create-tournament" element={<ProtectedRoute><CreateTournament /></ProtectedRoute>} />
      <Route path="/tournaments" element={<ProtectedRoute><Tournaments /></ProtectedRoute>} />
      <Route path="/tournaments/:tournamentId" element={<ProtectedRoute><TournamentDetail /></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
