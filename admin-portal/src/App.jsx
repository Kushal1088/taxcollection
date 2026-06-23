import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { ToastContainer } from './components/ui/Toast';

// Auth Pages
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Unauthorized from './pages/Unauthorized';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import CollectorManagement from './pages/admin/CollectorManagement';
import CitizenRequests from './pages/admin/CitizenRequests';
import PropertyVerification from './pages/admin/PropertyVerification';
import PropertyManagement from './pages/admin/PropertyManagement';
import TaxManagement from './pages/admin/TaxManagement';
import TaxNotices from './pages/admin/TaxNotices';
import Reports from './pages/admin/Reports';
import AddProperty from './pages/admin/AddProperty';
import Settings from './pages/admin/Settings';
import Profile from './pages/admin/Profile';

// Redirect admin login requests to the main portal login page
const AdminLoginRedirector = () => {
  const mainPortalUrl = import.meta.env.VITE_MAIN_PORTAL_URL || 'http://localhost:5173';
  const currentOrigin = window.location.origin;
  window.location.href = `${mainPortalUrl}/login?redirect_to=${encodeURIComponent(currentOrigin)}`;
  return null;
};

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
    const mainPortalUrl = import.meta.env.VITE_MAIN_PORTAL_URL || 'http://localhost:5173';
    const currentOrigin = window.location.origin;
    window.location.href = `${mainPortalUrl}/login?redirect_to=${encodeURIComponent(currentOrigin)}`;
    return null;
  }

  // Active admin user redirect
  if (profile.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // If logged in user is not admin, send them to unauthorized page
  return <Navigate to="/unauthorized" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<AdminLoginRedirector />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Admin Protected Panel */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout><AdminDashboard /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/properties" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout><PropertyManagement /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/properties/add" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout><AddProperty /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/collectors" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout><CollectorManagement /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/requests" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout><CitizenRequests /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/verifications" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout><PropertyVerification /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/taxes" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout><TaxManagement /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/notices" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout><TaxNotices /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/reports" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout><Reports /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/settings" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout><Settings /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/profile" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout><Profile /></Layout>
              </ProtectedRoute>
            } 
          />

          {/* Root Redirector */}
          <Route path="/" element={<RootRedirector />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      {/* Toast Notification Container */}
      <ToastContainer />
    </AuthProvider>
  );
}

export default App;
