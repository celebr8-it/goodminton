import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { ThemeProvider } from './lib/ThemeContext';
import AuthPage from './pages/Auth';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import CreateTournament from './pages/CreateTournament';
import TournamentDetail from './pages/TournamentDetail';

// Placeholder Pages
const Home = () => (
  <div className="max-w-4xl mx-auto">
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        Welcome back! 👋
      </h1>
      <p style={{ color: 'var(--text-muted)' }}>Ready for some badminton?</p>
    </div>

    <div className="grid grid-cols-2 gap-4 mb-8">
      <div className="card card-hover cursor-pointer">
        <span className="text-3xl mb-2 block">🏸</span>
        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>New Match</span>
      </div>
      <div className="card card-hover cursor-pointer">
        <span className="text-3xl mb-2 block">🏆</span>
        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Create Tournament</span>
      </div>
    </div>

    <div>
      <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Activity</h2>
      <div className="card text-center py-12" style={{ color: 'var(--text-muted)' }}>
        No recent matches. Start playing!
      </div>
    </div>
  </div>
);

const Tournaments = () => (
  <div className="max-w-4xl mx-auto">
    <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>My Tournaments</h1>
    <p className="mb-6" style={{ color: 'var(--text-muted)' }}>View all tournaments you're part of</p>
    <div className="card text-center py-12" style={{ color: 'var(--text-muted)' }}>
      Join a group to participate in tournaments!
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
      <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/" replace />} />
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
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
