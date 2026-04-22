import React, { createContext, useContext, useState, useEffect } from 'react'
import { tenancyAPI } from '../services/api'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const restoreSession = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        const res = await tenancyAPI.getUserContext()
        const { user: userData, organization } = res.data
        
        console.log('Organization data from context:', organization)
        
        // For organization admins, use organization KYC status if user's is pending
        const isOrgAdmin = userData.role === 'organization_admin' || userData.role === 'admin'
        const effectiveKycStatus = (isOrgAdmin && userData.kyc_status === 'pending' && organization?.kyc_status === 'approved')
          ? 'approved'
          : userData.kyc_status || organization?.kyc_status
        
        setUser({
          ...userData,
          organization_id: organization?.id || userData.default_organization_id,
          organization_name: organization?.name,
          organization_type: organization?.organization_type,
          kyc_status: effectiveKycStatus,
          logo: organization?.logo,
          organization_tax_id: organization?.tax_id,
          organization_contact_phone: organization?.contact_phone,
          organization_address: organization?.address,
          organization_website: organization?.website,
        })
        
        console.log('User KYC status:', userData.kyc_status)
        console.log('Organization KYC status:', organization?.kyc_status)
        console.log('Is org admin:', isOrgAdmin)
        console.log('Final KYC status:', effectiveKycStatus)
      } catch (err) {
        console.error('Session restoration failed:', err)
        localStorage.removeItem('token')
        delete api.defaults.headers.common['Authorization']
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    restoreSession()
  }, [])

  const login = async (email, password) => {
    try {
      const res = await tenancyAPI.login({ email, password })
      const { access_token, user: userData } = res.data
      
      localStorage.setItem('token', access_token)
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      
      // Initial user state from login (contains basic org info)
      setUser({
        ...userData,
        organization_id: userData.default_organization_id,
        kyc_status: userData.kyc_status || 'pending',
        logo: userData.logo
      })
      
      // Fetch full context to ensure logo is loaded
      await restoreSession()
      
      return userData
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  const value = {
    user,
    organizationId: user?.default_organization_id,
    userRole: user?.role,
    loading,
    login,
    logout,
    refreshContext: restoreSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Note: useAuth is exported separately to ensure compatible Fast Refresh in Vite
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
