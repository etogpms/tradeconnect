import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RoleRoute } from './components/auth/RoleRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { TradieDirectory } from './pages/public/TradieDirectory';
import { CategoriesPage } from './pages/public/CategoriesPage';
import { AboutPage } from './pages/public/AboutPage';
import { ContactPage } from './pages/public/ContactPage';

// Auth Pages
import { LoginPage, RegisterPage, ForgotPasswordPage } from './pages/auth/AuthPages';

// Dashboards
import { ClientDashboard } from './pages/dashboard/ClientDashboard';
import { TradieDashboard } from './pages/dashboard/TradieDashboard';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/directory" element={<TradieDirectory />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Client Dashboard Paths */}
          <Route 
            path="/client/*" 
            element={
              <RoleRoute allowedRoles={['client']}>
                <DashboardLayout>
                  <ClientDashboard />
                </DashboardLayout>
              </RoleRoute>
            } 
          />

          {/* Tradie Dashboard Paths */}
          <Route 
            path="/tradie/*" 
            element={
              <RoleRoute allowedRoles={['tradie']}>
                <DashboardLayout>
                  <TradieDashboard />
                </DashboardLayout>
              </RoleRoute>
            } 
          />

          {/* Admin / Super Admin Dashboard Paths */}
          <Route 
            path="/admin/*" 
            element={
              <RoleRoute allowedRoles={['admin', 'super_admin']}>
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </RoleRoute>
            } 
          />

          {/* Fallback Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
