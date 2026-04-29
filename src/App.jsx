import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import ClientRegister from './pages/ClientRegister'
import Dashboard from './pages/Dashboard'
import Policies from './pages/Policies'
import Claims from './pages/Claims'
import Commissions from './pages/Commissions'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import KYC from './pages/KYC'
import Team from './pages/Team'
import Products from './pages/Products'
import Promotions from './pages/Promotions'
import PolicyLedger from './pages/PolicyLedger'
import Clients from './pages/Clients'
import Layout from './components/Layout'
import ClientLayout from './components/ClientLayout'
import LandingPage from './pages/LandingPage'
import ClientDashboard from './pages/ClientDashboard'
import ClientProducts from './pages/ClientProducts'
import ClientProductDetails from './pages/ClientProductDetails'
import ClientKYC from './pages/ClientKYC'
import ClientPolicies from './pages/ClientPolicies'
import ClientClaims from './pages/ClientClaims'
import ClientSupport from './pages/ClientSupport'
import PaymentCallback from './pages/PaymentCallback'
import { Box, CircularProgress, Typography } from '@mui/material'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
})

import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Payment Callback (public - PesaPal redirects here) */}
            <Route path="/client/payment/callback" element={<PaymentCallback />} />

            {/* Auth Routes - Portals */}
            <Route path="/client/login" element={<Login portal="client" />} />
            <Route path="/client/register" element={<ClientRegister />} />
            <Route path="/admin/login" element={<Login portal="admin" />} />
            <Route path="/admin/register" element={<Register portal="admin" />} />
            
            {/* Legacy/Redirect Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Organization / Admin Portal */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['platform_admin', 'organization_admin', 'underwriter', 'agent', 'claims_officer']}>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/policies" element={
              <ProtectedRoute>
                <Layout><Policies /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/claims" element={
              <ProtectedRoute allowedRoles={['admin', 'organization_admin', 'claims_officer', 'underwriter', 'broker', 'read_only']}>
                <Layout><Claims /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/commissions" element={
              <ProtectedRoute allowedRoles={['admin', 'organization_admin', 'agent', 'broker', 'senior_agent', 'team_lead']}>
                <Layout><Commissions /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/products" element={
              <ProtectedRoute allowedRoles={['admin', 'organization_admin', 'underwriter']}>
                <Layout><Products /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/profile" element={
              <ProtectedRoute>
                <Layout><Profile /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute allowedRoles={['admin', 'organization_admin', 'platform_admin']}>
                <Layout><Settings /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/kyc" element={
              <ProtectedRoute allowedRoles={['admin', 'organization_admin', 'platform_admin']}>
                <Layout><KYC /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/team" element={
              <ProtectedRoute allowedRoles={['admin', 'organization_admin', 'platform_admin']}>
                <Layout><Team /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/clients" element={
              <ProtectedRoute allowedRoles={['admin', 'organization_admin', 'agent', 'broker', 'senior_agent', 'underwriter']}>
                <Layout><Clients /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/promotions" element={
              <ProtectedRoute>
                <Layout><Promotions /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/ledger" element={
              <ProtectedRoute allowedRoles={['admin', 'organization_admin']}>
                <Layout><PolicyLedger /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/client" element={
              <ProtectedRoute>
                <ClientLayout />
              </ProtectedRoute>
            }>
              <Route index element={<ClientDashboard />} />
              <Route path="products" element={<ClientProducts />} />
              <Route path="products/:id" element={<ClientProductDetails />} />
              <Route path="policies" element={<ClientPolicies />} />
              <Route path="claims" element={<ClientClaims />} />
              <Route path="support" element={<ClientSupport />} />
              <Route path="profile" element={<Box p={4}><Profile /></Box>} />
              <Route path="kyc" element={<Box p={4}><ClientKYC /></Box>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
