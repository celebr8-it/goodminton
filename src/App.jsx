import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './lib/AuthContext';
import AuthPage from './pages/Auth';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';

// Placeholder Pages
const Home = () => (
  <div className="space-y-6">
    <header className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Goodminton
        </h1>
        <p className="text-muted text-sm">Welcome back!</p>
      </div>
      <div className="h-10 w-10 rounded-full bg-surface border border-white/10 overflow-hidden">
        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" className="h-full w-full" />
      </div>
    </header>

    <div className="glass-card space-y-2">
      <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3">
        <button className="p-3 rounded-lg bg-surface hover:bg-white/5 border border-white/5 flex flex-col items-center gap-2 transition-colors">
          <span className="text-2xl">🏸</span>
          <span className="text-sm font-medium">New Match</span>
        </button>
        <button className="p-3 rounded-lg bg-surface hover:bg-white/5 border border-white/5 flex flex-col items-center gap-2 transition-colors">
          <span className="text-2xl">🏆</span>
          <span className="text-sm font-medium">Create Tourney</span>
        </button>
      </div>
    </div>

    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
      <div className="glass-card py-8 text-center text-muted">
        No recent matches
      </div>
    </div>
  </div>
);


const Tournaments = () => <div className="text-2xl font-bold">Tournaments Page</div>;

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  return <Layout>{children}</Layout>; // Wrap protected routes in Layout
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/" replace />} />
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
      <Route path="/groups/:groupId" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
      <Route path="/tournaments" element={<ProtectedRoute><Tournaments /></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
