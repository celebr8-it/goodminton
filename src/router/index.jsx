import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../lib/AuthContext';

import LandingPage from '../pages/LandingPage';
import AuthPage from '../pages/Auth';
import Home from '../pages/Home';
import Groups from '../pages/Groups';
import GroupDetail from '../pages/GroupDetail';
import CreateTournament from '../pages/CreateTournament';
import CreateMatch from '../pages/CreateMatch';
import Tournaments from '../pages/Tournaments';
import TournamentDetail from '../pages/TournamentDetailNew';
import MatchDetail from '../pages/MatchDetail';
import UserMap from '../pages/UserMap';
import { UserService } from '../services/UserService';

/**
 * Protected Route Wrapper
 * Redirects to /auth if user is not authenticated
 */
const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    return <Layout>{children}</Layout>;
};

/**
 * Admin Route Wrapper
 * Redirects to /home if user is not an admin
 */
const AdminRoute = ({ children }) => {
    const { user } = useAuth();

    if (!user || !UserService.isAdmin(user)) {
        return <Navigate to="/home" replace />;
    }

    return <Layout>{children}</Layout>;
};

/**
 * Public Route Wrapper
 * Redirects to /home if user is already authenticated
 */
const PublicRoute = ({ children }) => {
    const { user } = useAuth();

    if (user) {
        return <Navigate to="/home" replace />;
    }

    return children;
};

/**
 * App Router Configuration
 * Defines all application routes
 */
function AppRouter() {
    return (
        <Routes>
            {/* Public Routes - Redirect to /home if authenticated */}
            <Route
                path="/"
                element={
                    <PublicRoute>
                        <LandingPage />
                    </PublicRoute>
                }
            />
            <Route
                path="/auth"
                element={
                    <PublicRoute>
                        <AuthPage />
                    </PublicRoute>
                }
            />

            {/* Protected Routes - Require authentication */}
            <Route
                path="/home"
                element={
                    <ProtectedRoute>
                        <Home />
                    </ProtectedRoute>
                }
            />

            {/* Group Routes */}
            <Route
                path="/groups"
                element={
                    <ProtectedRoute>
                        <Groups />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/groups/:groupId"
                element={
                    <ProtectedRoute>
                        <GroupDetail />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/groups/:groupId/create-tournament"
                element={
                    <ProtectedRoute>
                        <CreateTournament />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/groups/:groupId/create-match"
                element={
                    <ProtectedRoute>
                        <CreateMatch />
                    </ProtectedRoute>
                }
            />

            {/* Tournament Routes */}
            <Route
                path="/tournaments"
                element={
                    <ProtectedRoute>
                        <Tournaments />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/tournaments/:tournamentId"
                element={
                    <ProtectedRoute>
                        <TournamentDetail />
                    </ProtectedRoute>
                }
            />

            {/* Match Routes */}
            <Route
                path="/matches/:matchId"
                element={
                    <ProtectedRoute>
                        <MatchDetail />
                    </ProtectedRoute>
                }
            />

            {/* Admin Routes */}
            <Route
                path="/user-map"
                element={
                    <AdminRoute>
                        <UserMap />
                    </AdminRoute>
                }
            />

            {/* 404 - Redirect to home or landing based on auth status */}
            <Route
                path="*"
                element={<Navigate to="/" replace />}
            />
        </Routes>
    );
}

export default AppRouter;
