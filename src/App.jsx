import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { ToastContainer } from './components/ui/Toast';
import { supabase } from './lib/supabase';

// Auth Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Unauthorized from './pages/Unauthorized';
import PendingReview from './pages/PendingReview';

// Collector Pages
import CollectorDashboard from './pages/collector/Dashboard';
import AssignedProperties from './pages/collector/AssignedProperties';
import PropertySurvey from './pages/collector/PropertySurvey';
import CompletedSurveys from './pages/collector/CompletedSurveys';

// Citizen Pages
import CitizenDashboard from './pages/citizen/Dashboard';
import CitizenProfile from './pages/citizen/Profile';

// Helper Root Redirector based on User Role
const RootRedirector = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (profile.role === 'citizen' && profile.status !== 'active') {
    return <Navigate to="/pending-review" replace />;
  }

  // Active user redirect
  if (profile.role === 'admin') {
    const adminPortalUrl = import.meta.env.VITE_ADMIN_PORTAL_URL || 'http://localhost:5174/';
    supabase.auth.getSession().then(({ data: { session } }) => {
      const accessToken = session?.access_token || '';
      const refreshToken = session?.refresh_token || '';
      window.location.href = `${adminPortalUrl}#access_token=${accessToken}&refresh_token=${refreshToken}`;
    });
    return null;
  }
  if (profile.role === 'collector') return <Navigate to="/collector" replace />;
  return <Navigate to="/citizen" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Pending Approval tracker for Citizens */}
          <Route 
            path="/pending-review" 
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <PendingReview />
              </ProtectedRoute>
            } 
          />

          {/* Collector Protected Panel */}
          <Route 
            path="/collector" 
            element={
              <ProtectedRoute allowedRoles={['collector']}>
                <Layout><CollectorDashboard /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/collector/assigned" 
            element={
              <ProtectedRoute allowedRoles={['collector']}>
                <Layout><AssignedProperties /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/collector/survey/:id" 
            element={
              <ProtectedRoute allowedRoles={['collector']}>
                <Layout><PropertySurvey /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/collector/completed" 
            element={
              <ProtectedRoute allowedRoles={['collector']}>
                <Layout><CompletedSurveys /></Layout>
              </ProtectedRoute>
            } 
          />

          {/* Citizen Protected Panel */}
          <Route 
            path="/citizen" 
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <Layout><CitizenDashboard /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/citizen/bills" 
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <Layout><CitizenDashboard /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/citizen/profile" 
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <Layout><CitizenProfile /></Layout>
              </ProtectedRoute>
            } 
          />

          {/* Root Redirector */}
          <Route path="/" element={<Landing />} />
          <Route path="*" element={<RootRedirector />} />
        </Routes>
      </BrowserRouter>
      {/* Toast Notification Container */}
      <ToastContainer />
    </AuthProvider>
  );
}

export default App;
