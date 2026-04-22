import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Box, CircularProgress } from '@mui/material'

function LoadingScreen() {
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', bgcolor: '#F8F9FE',
    }}>
      <CircularProgress size={36} sx={{ color: '#1A73E8' }} />
    </Box>
  )
}

const ProtectedRoute = ({ children, allowedRoles, bypassKyc = false }) => {
  const { user, loading } = useAuth()
  const location = window.location.pathname
  
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  
  // Role Check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  // Mandatory KYC Check
  // If not verified/approved, and not already on KYC or Profile page, redirect to KYC
  // Platform Admins are exempted from this check as they are the verifiers
  const isKycVerified = user.kyc_status === 'verified' || user.kyc_status === 'approved'
  const isKycRestricted = user.role !== 'platform_admin' && !isKycVerified
  const isOnKycPage = location === '/kyc'
  const isOnProfilePage = location === '/profile'
  
  console.log('ProtectedRoute check:', {
    userRole: user.role,
    userKycStatus: user.kyc_status,
    isKycVerified,
    isKycRestricted,
    isOnKycPage,
    isOnProfilePage,
    bypassKyc,
    currentPath: location
  })
  
  if (isKycRestricted && !isOnKycPage && !isOnProfilePage && !bypassKyc) {
    return <Navigate to="/kyc" replace />
  }

  return children
}

export default ProtectedRoute
