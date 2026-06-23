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
import UserManagement from './pages/admin/UserManagement';

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
  if (profile.role === 'admin') return <Navigate to="/admin" replace />;
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
            path="/admin/users" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout><UserManagement /></Layout>
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
