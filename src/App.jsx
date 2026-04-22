import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
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
import { Box, CircularProgress } from '@mui/material'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
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
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/policies" element={
              <ProtectedRoute>
                <Layout><Policies /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/policies/:id" element={
              <ProtectedRoute>
                <Layout><Policies /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/claims" element={
              <ProtectedRoute allowedRoles={['admin', 'organization_admin', 'claims_officer', 'underwriter', 'broker', 'read_only']}>
                <Layout><Claims /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/commissions" element={
              <ProtectedRoute allowedRoles={['admin', 'organization_admin', 'agent', 'broker', 'senior_agent', 'team_lead']}>
                <Layout><Commissions /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/products" element={
              <ProtectedRoute allowedRoles={['admin', 'organization_admin', 'underwriter']}>
                <Layout><Products /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout><Profile /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute allowedRoles={['admin', 'organization_admin', 'platform_admin']}>
                <Layout><Settings /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/kyc" element={
              <ProtectedRoute allowedRoles={['admin', 'organization_admin', 'platform_admin']}>
                <Layout><KYC /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/team" element={
              <ProtectedRoute allowedRoles={['admin', 'organization_admin', 'platform_admin']}>
                <Layout><Team /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/clients" element={
              <ProtectedRoute allowedRoles={['admin', 'organization_admin', 'agent', 'broker', 'senior_agent', 'underwriter']}>
                <Layout><Clients /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/promotions" element={
              <ProtectedRoute>
                <Layout><Promotions /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/ledger" element={
              <ProtectedRoute allowedRoles={['admin', 'organization_admin']}>
                <Layout><PolicyLedger /></Layout>
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
