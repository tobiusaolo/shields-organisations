import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle specific error status codes
      if (error.response.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else if (error.response.status === 403) {
        console.error('Access forbidden')
      } else if (error.response.status === 404) {
        console.error('Resource not found')
      } else if (error.response.status >= 500) {
        console.error('Server error')
      }
    } else if (error.request) {
      console.error('Network error - no response received')
    } else {
      console.error('Error setting up request:', error.message)
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  getCurrentUser: () => api.get('/tenancy/users/me'),
}

export const tenancyAPI = {
  getOrganizations: () => api.get('/tenancy/organizations'),
  getMemberships: (userId) => api.get(`/tenancy/users/${userId}/memberships`),
  getOrganizationMemberships: (orgId, params) => api.get(`/tenancy/organizations/${orgId}/memberships`, { params }),
  createUser: (data) => api.post('/tenancy/users', data),
  createMembership: (data) => api.post('/tenancy/memberships', data),
  updateMembership: (membershipId, orgId, data) => api.put(`/tenancy/memberships/${membershipId}`, data, { params: { org_id: orgId } }),
  deleteMembership: (membershipId, orgId) => api.delete(`/tenancy/memberships/${membershipId}`, { params: { org_id: orgId } }),
  
  // KYC Endpoints
  submitKyc: (orgId, data) => api.post(`/tenancy/organizations/${orgId}/kyc/submit`, data),
  approveKyc: (orgId) => api.post(`/tenancy/organizations/${orgId}/kyc/approve`),
  rejectKyc: (orgId, data) => api.post(`/tenancy/organizations/${orgId}/kyc/reject`, data),
  getUserContext: () => api.get('/tenancy/users/me/context'),
  login: (credentials) => api.post('/tenancy/users/login', credentials),
  submitUserKyc: (data) => api.post('/tenancy/users/me/kyc', data),
  approveUser: (userId) => api.post(`/tenancy/users/${userId}/approve`),
  getGlobalUsers: () => api.get('/tenancy/users'),
  
  // Client Management (Personal Portfolio)
  registerClient: (data, kycData) => api.post('/tenancy/clients', { ...data, kyc_data: kycData }),
  getMyClients: (params) => api.get('/tenancy/clients', { params }),
  getPendingPolicies: () => api.get('/tenancy/users/me/pending-policies'),
  getOrganizationPendingPolicies: (orgId) => api.get(`/tenancy/organizations/${orgId}/pending-policies`),
}

export const productAPI = {
  getProducts: (orgId) => api.get(`/products/organizations/${orgId}/products`),
  createProduct: (orgId, data) => api.post(`/products/organizations/${orgId}/products`, data),
  updateProduct: (orgId, productId, data) => api.put(`/products/organizations/${orgId}/products/${productId}`, data),
  deleteProduct: (orgId, productId) => api.delete(`/products/organizations/${orgId}/products/${productId}`),
  createProductTemplate: (orgId, productId, data) => api.post(`/products/organizations/${orgId}/product-templates`, data),
  getProductTemplates: (orgId, productId) => api.get(`/products/organizations/${orgId}/product-templates`, { params: { product_id: productId } }),
  updateProductTemplate: (orgId, templateId, data) => api.put(`/products/organizations/${orgId}/product-templates/${templateId}`, data),
  deleteProductTemplate: (orgId, templateId) => api.delete(`/products/organizations/${orgId}/product-templates/${templateId}`),
  createCalculationTemplate: (orgId, data) => api.post(`/products/organizations/${orgId}/calculation-templates`, data),
  updateCalculationTemplate: (orgId, calcId, data) => api.put(`/products/organizations/${orgId}/calculation-templates/${calcId}`, data),
  deleteCalculationTemplate: (orgId, calcId) => api.delete(`/products/organizations/${orgId}/calculation-templates/${calcId}`),
  createPricingTier: (orgId, data) => api.post(`/products/organizations/${orgId}/pricing-tiers`, data),
  getPricingTiers: (orgId, templateId) => api.get(`/products/organizations/${orgId}/pricing-tiers`, { params: { product_template_id: templateId } }),
  updatePricingTier: (orgId, tierId, data) => api.put(`/products/organizations/${orgId}/pricing-tiers/${tierId}`, data),
  deletePricingTier: (orgId, tierId) => api.delete(`/products/organizations/${orgId}/pricing-tiers/${tierId}`),
  // Product Q&A
  createProductQuestion: (productId, data) => api.post(`/products/${productId}/questions`, data),
  getProductQuestions: (productId) => api.get(`/products/${productId}/questions`),
  answerProductQuestion: (productId, questionId, data) => api.post(`/products/${productId}/questions/${questionId}/answer`, data),
  // Product Reviews
  getProductReviews: (orgId, productId, approvedOnly = true) => api.get(`/products/organizations/${orgId}/products/${productId}/reviews`, { params: { approved_only: approvedOnly } }),
  createProductReview: (orgId, productId, data) => api.post(`/products/organizations/${orgId}/products/${productId}/reviews`, data),
  approveProductReview: (orgId, productId, reviewId) => api.put(`/products/organizations/${orgId}/products/${productId}/reviews/${reviewId}/approve`),
  updateProductReview: (orgId, productId, reviewId, data) => api.put(`/products/organizations/${orgId}/products/${productId}/reviews/${reviewId}`, data),
  deleteProductReview: (orgId, productId, reviewId) => api.delete(`/products/organizations/${orgId}/products/${productId}/reviews/${reviewId}`),
}

export const policyAPI = {
  getPolicies: (orgId, params) => api.get(`/policies/organizations/${orgId}/policies`, { params }),
  getQuotations: (orgId, params) => api.get(`/policies/organizations/${orgId}/quotations`, { params }),
  createPolicy: (orgId, data) => api.post(`/policies/organizations/${orgId}/policies`, data),
  createQuotation: (orgId, data) => api.post(`/policies/organizations/${orgId}/quotations`, data),
  // Policy Q&A
  createPolicyQuestion: (policyId, data) => api.post(`/policies/${policyId}/questions`, data),
  getPolicyQuestions: (policyId) => api.get(`/policies/${policyId}/questions`),
  answerPolicyQuestion: (policyId, questionId, data) => api.post(`/policies/${policyId}/questions/${questionId}/answer`, data),
}

export const claimAPI = {
  getClaims: (orgId, params) => api.get(`/claims/organizations/${orgId}/claims`, { params }),
  getPolicyClaims: (orgId, policyId, params) => api.get(`/claims/organizations/${orgId}/policies/${policyId}/claims`, { params }),
  createClaim: (orgId, data) => api.post(`/claims/organizations/${orgId}/claims`, data),
  uploadSignedDocuments: (orgId, policyId, documents) => api.post(`/policies/organizations/${orgId}/policies/${policyId}/signed-documents`, documents),
  approvePolicyDocumentation: (orgId, policyId) => api.post(`/policies/organizations/${orgId}/policies/${policyId}/approve-documentation`),
}

export const commissionAPI = {
  getLedger: (orgId, membershipId) => api.get(`/commissions/organizations/${orgId}/memberships/${membershipId}/ledger`),
  getPayouts: (orgId) => api.get(`/commissions/organizations/${orgId}/commission-payouts`),
}

export const kycAPI = {
  uploadOrganizationKyc: (orgId, data) => api.post(`/kyc/organizations/${orgId}/kyc-documents`, data),
  getOrganizationKycDocuments: (orgId) => api.get(`/kyc/organizations/${orgId}/kyc-documents`),
  verifyOrganizationKyc: (orgId, docId, data) => api.put(`/kyc/organizations/${orgId}/kyc-documents/${docId}/verify`, data),
  uploadPolicyholderIdentification: (orgId, data) => api.post(`/kyc/organizations/${orgId}/policyholder-identifications`, data),
  getPolicyholderIdentifications: (orgId, accountId) => api.get(`/kyc/organizations/${orgId}/customer-accounts/${accountId}/identifications`),
  verifyPolicyholderIdentification: (orgId, docId, data) => api.put(`/kyc/organizations/${orgId}/policyholder-identifications/${docId}/verify`, data),
}

export const operationalAPI = {
  getTrips: (orgId) => api.get(`/operational/organizations/${orgId}/trips`),
  createTrip: (orgId, data) => api.post(`/operational/organizations/${orgId}/trips`, data),
  getTripCheckins: (orgId, tripId) => api.get(`/operational/organizations/${orgId}/trips/${tripId}/checkins`),
  createTripCheckin: (orgId, tripId, data) => api.post(`/operational/organizations/${orgId}/trips/${tripId}/checkins`, data),
  getFundRequisitions: (orgId) => api.get(`/operational/organizations/${orgId}/fund-requisitions`),
  createFundRequisition: (orgId, data) => api.post(`/operational/organizations/${orgId}/fund-requisitions`, data),
  approveFundRequisition: (orgId, reqId) => api.put(`/operational/organizations/${orgId}/fund-requisitions/${reqId}/approve`),
}

export const notificationAPI = {
  createTemplate: (orgId, data) => api.post(`/notifications/organizations/${org_id}/templates`, data),
  getTemplates: (orgId) => api.get(`/notifications/organizations/${orgId}/templates`),
  sendNotification: (orgId, data) => api.post(`/notifications/organizations/${orgId}/send`, data),
  getLogs: (orgId, recipientAccountId) => api.get(`/notifications/organizations/${orgId}/logs`, { params: { recipient_account_id: recipientAccountId } }),
}

export const auditAPI = {
  createLog: (orgId, data) => api.post(`/audit/organizations/${orgId}/logs`, data),
  getLogs: (orgId, severity, limit) => api.get(`/audit/organizations/${orgId}/logs`, { params: { severity, limit } }),
  getCriticalLogs: (orgId, limit) => api.get(`/audit/organizations/${orgId}/logs/critical`, { params: { limit } }),
}

export const paymentAPI = {
  createPayment: (orgId, data) => api.post(`/payments/organizations/${orgId}/payments`, data),
  getPayments: (orgId, direction, status) => api.get(`/payments/organizations/${orgId}/payments`, { params: { direction, status } }),
  getPayment: (orgId, paymentId) => api.get(`/payments/organizations/${orgId}/payments/${paymentId}`),
  updatePaymentStatus: (orgId, paymentId, data) => api.put(`/payments/organizations/${orgId}/payments/${paymentId}`, data),
  getPolicyPayments: (orgId, policyId) => api.get(`/payments/organizations/${orgId}/policies/${policyId}/payments`),
  getPesapalConfig: (orgId) => api.get(`/payments/organizations/${orgId}/pesapal/config`),
  savePesapalConfig: (orgId, data) => api.post(`/payments/organizations/${orgId}/pesapal/config`, data),
  // Payment Configuration for KYC
  getPaymentConfig: (orgId) => api.get(`/payments/organizations/${orgId}/payment-config`),
  createPaymentConfig: (orgId, data) => api.post(`/payments/organizations/${orgId}/payment-config`, data),
  verifyPaymentConfig: (orgId, data) => api.put(`/payments/organizations/${orgId}/payment-config/verify`, data),
}

export const policyDocumentAPI = {
  createDocument: (orgId, data) => api.post(`/policy-documents/organizations/${orgId}/policy-documents`, data),
  getPolicyDocuments: (orgId, policyId) => api.get(`/policy-documents/organizations/${orgId}/policies/${policyId}/documents`),
  getDocument: (orgId, documentId) => api.get(`/policy-documents/organizations/${orgId}/policy-documents/${documentId}`),
  incrementDownloadCount: (orgId, documentId) => api.post(`/policy-documents/organizations/${orgId}/policy-documents/${documentId}/download`),
}

export const publicAPI = {
  getPublicProducts: () => api.get('/public/products'),
  getPublicProduct: (productId) => api.get(`/public/products/${productId}`),
  createPublicQuotation: (data) => api.post('/public/quotations', data),
  checkPolicyStatus: (policyNumber) => api.get('/public/policies/status', { params: { policy_number: policyNumber } }),
  // Client Claims
  submitClaim: (data) => api.post('/public/claims/submit', data),
  getClaimStatus: (claimId) => api.get(`/public/claims/${claimId}/status`),
  // Client Policy Details with installment tracking
  getClientPolicyDetails: (policyId) => api.get(`/public/policies/${policyId}/details`),
  // Public Reviews
  getProductReviews: (productId, approvedOnly = true) => api.get(`/public/products/${productId}/reviews`, { params: { approved_only: approvedOnly } }),
}

export const promotionAPI = {
  // Coupons
  getCoupons: (orgId) => api.get('/promotions/coupons', { params: orgId ? { org_id: orgId } : {} }),
  validateCoupon: (code, orgId, premium) => api.post('/promotions/coupons/validate', { code, org_id: orgId, premium }),
  // Referrals
  getMyReferralCode: () => api.get('/promotions/referrals/my-code'),
}

export default api
