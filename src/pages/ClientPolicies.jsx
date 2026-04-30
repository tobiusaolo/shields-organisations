import React, { useState } from 'react'
import Swal from 'sweetalert2'
import {
  Box, Typography, Paper, Button, Stack, Grid,
  CircularProgress, Skeleton, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Divider,
  Table, TableBody, TableCell, TableHead, TableRow,
  Menu, MenuItem, Pagination, Drawer, Tabs, Tab,
  Fade, Zoom, Collapse
} from '@mui/material'
import {
  Description as PolicyIcon,
  ShoppingBag as MarketIcon,
  History as HistoryIcon,
  AddCircleOutline as AddIcon,
  DeleteOutline as DeleteIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  MoreVert as MoreVertIcon,
  PostAdd as ClaimIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { policyAPI, publicAPI, productAPI, formAPI } from '../services/api'

export default function ClientPolicies() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedPolicy, setSelectedPolicy] = useState(null)
  const [isInitiating, setIsInitiating] = useState(false)
  const [tabValue, setTabValue] = useState(0)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [viewPolicy, setViewPolicy] = useState(null)
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [menuPolicy, setMenuPolicy] = useState(null)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [deletingId, setDeletingId] = useState(null)

  // NEW: Fetch full product hierarchy for the detailed drawer
  const { data: productHierarchy, isLoading: isLoadingHierarchy } = useQuery({
    queryKey: ['product-hierarchy', viewPolicy?.product_id, user?.organization_id],
    queryFn: async () => {
      if (!viewPolicy?.product_id || !user?.organization_id) return null
      
      const orgId = user.organization_id
      const productId = viewPolicy.product_id
      
      // 1. Get templates
      const templatesRes = await productAPI.getProductTemplates(orgId, productId)
      const templates = templatesRes.data.items || []
      
      // 2. Enrich first template (standard)
      const mainTemplate = templates[0]
      if (!mainTemplate) return { templates: [] }
      
      const [tiersRes, formsRes] = await Promise.all([
        productAPI.getPricingTiers(orgId, mainTemplate.id),
        formAPI.getTemplateForms(orgId, mainTemplate.id)
      ])
      
      return {
        templates,
        mainTemplate,
        tiers: tiersRes.data.items || [],
        forms: formsRes.data || []
      }
    },
    enabled: !!viewPolicy?.product_id && detailsOpen
  })

  const handleOpenDetails = (policy) => {
    setViewPolicy(policy)
    setTabValue(0)
    setDetailsOpen(true)
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  const handleMenuOpen = (event, policy) => {
    setMenuAnchor(event.currentTarget)
    setMenuPolicy(policy)
    // Also update viewPolicy if it matches to ensure the modal stays fresh
    if (viewPolicy?.id === policy.id) {
      setViewPolicy(policy)
    }
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setMenuPolicy(null)
  }

  const handlePayNow = async () => {
    if (!menuPolicy) return
    try {
      setIsInitiating(true)
      setSelectedPolicy(menuPolicy)
      const res = await publicAPI.initiatePesapalPayment(menuPolicy.organization_id, menuPolicy.id, { months_paid: 1 })
      window.location.href = res.data.redirect_url
    } catch (err) {
      console.error("Payment failed", err)
      alert("Failed to initiate payment. Please try again.")
    } finally {
      setIsInitiating(false)
      handleMenuClose()
    }
  }

  const handleDeletePolicy = () => {
    if (!menuPolicy) return
    
    Swal.fire({
      title: 'Are you sure?',
      text: "This will permanently remove this policy application. This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#5F6368',
      confirmButtonText: 'Yes, delete it!',
      borderRadius: 15
    }).then((result) => {
      if (result.isConfirmed) {
        setSelectedPolicy(menuPolicy)
        deletePolicyMutation.mutate(menuPolicy.id)
        handleMenuClose()
      }
    })
  }

  const handleViewDetails = () => {
    if (!menuPolicy) return
    handleOpenDetails(menuPolicy)
    handleMenuClose()
  }

  const handleFileClaim = () => {
    if (!menuPolicy) return
    navigate('/client/claims', { state: { policyId: menuPolicy.id, policyNumber: menuPolicy.policy_number } })
    handleMenuClose()
  }

  const deletePolicyMutation = useMutation({
    mutationFn: async (policyId) => {
      await policyAPI.deletePolicy(user.organization_id, policyId)
    },
    onSuccess: (_, policyId) => {
      setDeletingId(policyId)
      // Small delay to allow the animation to finish before query invalidation removes it from DOM
      setTimeout(() => {
        queryClient.invalidateQueries(['my-policies', user?.id])
        setDeletingId(null)
        Swal.fire({
          title: 'Deleted!',
          text: 'Your policy has been removed.',
          icon: 'success',
          confirmButtonColor: '#1A237E',
          timer: 1500,
          showConfirmButton: false
        })
      }, 400)
    },
    onError: (err) => {
      console.error('Failed to delete policy:', err)
      Swal.fire('Error', 'Failed to delete policy. Please try again.', 'error')
    }
  })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-policies', user?.id, page],
    queryFn: async () => {
      if (!user?.organization_id) return { items: [], total: 0 }
      try {
        const res = await policyAPI.getPolicies(user.organization_id, { 
          policy_holder_id: user.id,
          page,
          limit: rowsPerPage
        })
        return {
          items: res.data.items || [],
          total: res.data.total || (res.data.items?.length || 0)
        }
      } catch (err) {
        console.error("Failed to fetch policies:", err)
        throw err
      }
    },
    enabled: !!user?.id && !!user?.organization_id
  })

  // NEW: Universal Label Mapper for legacy or un-enriched data
  const { data: allForms = [] } = useQuery({
    queryKey: ['all-organization-forms', user?.organization_id],
    queryFn: async () => {
      // Fetch all forms for the org to build a global label lookup map
      // This helps if the policy context hasn't been enriched by the frontend during creation
      if (!user?.organization_id) return []
      const res = await publicAPI.getPublicProducts()
      const products = res.data?.items || []
      const allFields = []
      
      // We'll build this map on demand in the detail view instead to avoid massive pre-fetching
      return [] 
    },
    enabled: false // Reserved for future global mapping if needed
  })

  const getLabelForField = (fieldKey, productTemplateId) => {
    // This function can be used to resolve labels from template forms if context is raw
    return fieldKey // Default to key if not found
  }

  const policies = data?.items || []
  const totalCount = data?.total || 0
  const totalPages = Math.ceil(totalCount / rowsPerPage)

  const handlePageChange = (event, newPage) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const hasPolicies = policies.length > 0 || page > 1

  if (isLoading) {
    return (
      <Box sx={{ p: 4 }}>
        <Skeleton width="200px" height={40} sx={{ mb: 4 }} />
        <Grid container spacing={3}>
          {[1, 2, 3].map(i => (
            <Grid item xs={12} key={i}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    )
  }


  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#202124', mb: 0.5 }}>
            My Policies
          </Typography>
          <Typography sx={{ color: '#5F6368', fontSize: '0.95rem' }}>
            Manage and track your active insurance coverage
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            onClick={() => refetch()}
            sx={{ borderRadius: 3, fontWeight: 700, color: '#5F6368', borderColor: '#DADCE0' }}
          >
            Sync Data
          </Button>
          {hasPolicies && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/client/products')}
              sx={{ borderRadius: 3, fontWeight: 700, bgcolor: '#1A237E' }}
            >
              Get New Policy
            </Button>
          )}
        </Stack>
      </Box>

      {!hasPolicies ? (
        <Paper elevation={0} sx={{
          p: 8, textAlign: 'center', borderRadius: 3,
          border: '1px solid #E8EAED', bgcolor: '#fff',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3
        }}>
          <Box sx={{
            width: 80, height: 80, borderRadius: 3,
            bgcolor: '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <PolicyIcon sx={{ fontSize: 40, color: '#9AA0A6' }} />
          </Box>
          <Box sx={{ maxWidth: 450 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#202124', mb: 1.5 }}>
              No active policies found
            </Typography>
            <Typography sx={{ color: '#5F6368', mb: 4, lineHeight: 1.6 }}>
              It looks like you haven't purchased any insurance plans yet. Explore our marketplace to find the perfect coverage for your needs.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<MarketIcon />}
              onClick={() => navigate('/client/products')}
              sx={{
                borderRadius: 3, fontWeight: 700, px: 6, py: 1.5,
                bgcolor: '#1A237E', boxShadow: 'none',
                '&:hover': { bgcolor: '#0d1b6e', boxShadow: 'none' }
              }}
            >
              Go to Marketplace
            </Button>
          </Box>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {policies.map(policy => (
            <Grid item xs={12} key={policy.id}>
              <Collapse in={deletingId !== policy.id} timeout={400}>
                <Zoom in={deletingId !== policy.id} timeout={400}>
                  <Paper elevation={0} sx={{
                    p: 3, borderRadius: 3, border: '1px solid #E8EAED',
                    bgcolor: '#fff', transition: 'all 0.2s',
                    '&:hover': { borderColor: '#1A237E', boxShadow: '0 4px 20px rgba(26,35,126,0.08)' }
                  }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <Stack direction="row" spacing={2.5} alignItems="center">
                      <Box sx={{
                        width: 52, height: 52, borderRadius: 3,
                        bgcolor: '#E8F0FE', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden'
                      }}>
                        {policy.product_info?.image_base64 ? (
                          <img src={policy.product_info.image_base64} alt={policy.product_info.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <PolicyIcon sx={{ color: '#1A237E', fontSize: 24 }} />
                        )}
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#202124' }}>
                          {policy.product_info?.name || policy.product_name || 'Insurance Plan'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.8rem', color: '#9AA0A6', fontFamily: 'monospace' }}>
                          #{policy.policy_number}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={6} md={1.5}>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#9AA0A6', mb: 0.5, textTransform: 'uppercase' }}>
                      Status
                    </Typography>
                    <Chip
                      label={policy.status?.toUpperCase()}
                      size="small"
                      sx={{
                        fontWeight: 800, fontSize: '0.6rem', borderRadius: 2,
                        bgcolor: policy.status === 'active' ? '#E6F4EA' : policy.status === 'cancelled' ? '#FEECEB' : '#FEF3E2',
                        color: policy.status === 'active' ? '#1E8E3E' : policy.status === 'cancelled' ? '#D93025' : '#E37400'
                      }}
                    />
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#9AA0A6', mb: 0.5, textTransform: 'uppercase' }}>
                      Premium
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: '#202124', fontSize: '0.9rem' }}>
                      UGX {Number(policy.premium).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#9AA0A6', mb: 0.5, textTransform: 'uppercase' }}>
                      Purchased
                    </Typography>
                    <Typography sx={{ fontWeight: 600, color: '#202124', fontSize: '0.85rem' }}>
                      {policy.created_at ? new Date(policy.created_at).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={2.5}>
                    <Stack direction="row" spacing={1.5} justifyContent="flex-end" alignItems="center">

                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, policy)}
                        sx={{ 
                          bgcolor: '#F8F9FA',
                          border: '1px solid #E8EAED',
                          '&:hover': { bgcolor: '#E8EAED' }
                        }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Grid>
                </Grid>
                  </Paper>
                </Zoom>
              </Collapse>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 180,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }
        }}
      >
        <MenuItem onClick={handleViewDetails} sx={{ fontWeight: 600 }}>
          View Details
        </MenuItem>

        {menuPolicy?.status === 'active' && (
          <MenuItem onClick={handleFileClaim} sx={{ fontWeight: 600, color: '#1A73E8' }}>
            <ClaimIcon fontSize="small" sx={{ mr: 1 }} />
            File a Claim
          </MenuItem>
        )}
        
        {menuPolicy?.status === 'pending' && (
          <MenuItem 
            onClick={handlePayNow}
            disabled={isInitiating && selectedPolicy?.id === menuPolicy?.id}
            sx={{ fontWeight: 600 }}
          >
            {isInitiating && selectedPolicy?.id === menuPolicy?.id ? (
              <CircularProgress size={16} sx={{ mr: 1 }} />
            ) : null}
            Pay Now
          </MenuItem>
        )}

        {(menuPolicy?.status === 'pending' || menuPolicy?.status === 'cancelled') && (
          <MenuItem 
            onClick={handleDeletePolicy}
            disabled={deletePolicyMutation.isLoading && selectedPolicy?.id === menuPolicy?.id}
            sx={{ fontWeight: 600, color: '#D32F2F' }}
          >
            {deletePolicyMutation.isLoading && selectedPolicy?.id === menuPolicy?.id ? (
              <CircularProgress size={16} sx={{ mr: 1 }} />
            ) : null}
            Delete Policy
          </MenuItem>
        )}
      </Menu>


    {/* Policy Details Drawer */}
    <Drawer
      anchor="right"
      open={detailsOpen}
      onClose={() => setDetailsOpen(false)}
      PaperProps={{
        sx: { width: { xs: '100%', md: 600, lg: 750 }, bgcolor: '#F8F9FA' }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header Section */}
        <Box sx={{ p: 3, bgcolor: '#fff', borderBottom: '1px solid #E8EAED' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#202124', letterSpacing: '-0.02em' }}>
              Policy Management
            </Typography>
            <IconButton onClick={() => setDetailsOpen(false)} size="small" sx={{ bgcolor: '#F8F9FA', '&:hover': { bgcolor: '#E8EAED' } }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Stack direction="row" spacing={3} alignItems="center">
            <Box sx={{ 
              width: 72, height: 72, borderRadius: 4, 
              bgcolor: '#F8F9FA', border: '1px solid #E8EAED',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
            }}>
              {viewPolicy?.product_info?.image_base64 ? (
                <img src={viewPolicy.product_info.image_base64} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <PolicyIcon sx={{ fontSize: 32, color: '#1A237E' }} />
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#202124', mb: 0.5, lineHeight: 1.2 }}>
                {viewPolicy?.product_info?.name || viewPolicy?.product_name || 'Insurance Plan'}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip 
                  label={viewPolicy?.status?.toUpperCase() || 'PENDING'} 
                  size="small"
                  sx={{ 
                    fontWeight: 800, fontSize: '0.6rem', height: 20, borderRadius: 1.5,
                    bgcolor: viewPolicy?.status === 'active' ? '#E6F4EA' : viewPolicy?.status === 'cancelled' ? '#FEECEB' : '#FEF3E2',
                    color: viewPolicy?.status === 'active' ? '#1E8E3E' : viewPolicy?.status === 'cancelled' ? '#D93025' : '#E37400'
                  }}
                />
                <Typography variant="caption" sx={{ color: '#5F6368', fontWeight: 700, fontFamily: 'monospace' }}>
                  #{viewPolicy?.policy_number}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* Tab Navigation */}
        <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #E8EAED' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            sx={{ px: 3 }}
            TabIndicatorProps={{ sx: { height: 3, borderRadius: '3px 3px 0 0', bgcolor: '#1A237E' } }}
          >
            <Tab label="Overview" sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.9rem', py: 2 }} />
            <Tab label="Pricing Tiers" sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.9rem', py: 2 }} />
            <Tab label="Assessment Data" sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.9rem', py: 2 }} />
          </Tabs>
        </Box>

        {/* Scrollable Content Area */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 4 }}>
          {isLoadingHierarchy && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 2 }}>
              <CircularProgress size={40} thickness={4} sx={{ color: '#1A237E' }} />
              <Typography variant="body2" sx={{ color: '#5F6368', fontWeight: 600 }}>Loading product architecture...</Typography>
            </Box>
          )}

          {!isLoadingHierarchy && tabValue === 0 && (
            <Stack spacing={4}>
              {/* Product Identity */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#70757A', mb: 2, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Product Identity & Category
                </Typography>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E8EAED', bgcolor: '#fff' }}>
                  <Typography variant="body2" sx={{ color: '#5F6368', mb: 2 }}>
                    {viewPolicy?.product_info?.description || 'Comprehensive insurance coverage with dynamic benefits.'}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#9AA0A6', display: 'block' }}>Category</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>{viewPolicy?.product_info?.category || 'General'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#9AA0A6', display: 'block' }}>Base Premium</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>UGX {Number(viewPolicy?.product_info?.base_premium || 0).toLocaleString()}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Box>

              {/* Architecture Summary */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#70757A', mb: 2, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Architecture Summary
                </Typography>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E8EAED', bgcolor: '#fff' }}>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: '#5F6368' }}>Total Tiers</Typography>
                      <Chip label={productHierarchy?.tiers?.length || 0} size="small" sx={{ fontWeight: 800, bgcolor: '#F1F3F4' }} />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: '#5F6368' }}>Compliance Forms</Typography>
                      <Chip label={productHierarchy?.forms?.length || 0} size="small" sx={{ fontWeight: 800, bgcolor: '#F1F3F4' }} />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: '#5F6368' }}>Billing Frequency</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1A73E8' }}>{(productHierarchy?.mainTemplate?.pricing_frequency || 'Annual').toUpperCase()}</Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Box>

              {/* My Policy Instance */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#70757A', mb: 2, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>
                  My Policy Instance
                </Typography>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E8EAED', bgcolor: '#E8F0FE' }}>
                  <Grid container spacing={3}>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#1A237E', display: 'block', mb: 0.5, opacity: 0.7 }}>Premium Paid</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 900, color: '#1A237E' }}>UGX {Number(viewPolicy?.premium).toLocaleString()}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#1A237E', display: 'block', mb: 0.5, opacity: 0.7 }}>Effective Date</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1A237E' }}>{viewPolicy?.start_date ? new Date(viewPolicy.start_date).toLocaleDateString() : 'N/A'}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Box>
            </Stack>
          )}

          {!isLoadingHierarchy && tabValue === 1 && (
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#70757A', mb: 3, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>
                Available Coverage Tiers
              </Typography>
              <Stack spacing={2}>
                {(productHierarchy?.tiers || []).map((tier, idx) => {
                  const isMyTier = Number(tier.premium) === Number(viewPolicy?.premium)
                  const tierColors = { Bronze: '#CD7F32', Silver: '#9E9E9E', Gold: '#F9AB00', Platinum: '#607D8B', Diamond: '#1A73E8' }
                  const tc = tierColors[tier.name] || '#1A237E'
                  
                  return (
                    <Paper key={idx} sx={{ 
                      p: 3, borderRadius: 3, border: isMyTier ? `2px solid ${tc}` : '1px solid #E8EAED',
                      bgcolor: isMyTier ? '#fff' : '#FAFAFA',
                      position: 'relative', overflow: 'hidden'
                    }}>
                      {isMyTier && (
                        <Box sx={{ 
                          position: 'absolute', top: 0, right: 0, 
                          bgcolor: tc, color: '#fff', px: 1.5, py: 0.5, 
                          fontSize: '0.65rem', fontWeight: 900, borderRadius: '0 0 0 8px' 
                        }}>
                          MY CURRENT PLAN
                        </Box>
                      )}
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: tc }}>{tier.name}</Typography>
                          <Typography variant="caption" sx={{ color: '#5F6368' }}>{tier.description || 'Standard tier coverage'}</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: '#202124' }}>UGX {Number(tier.premium).toLocaleString()}</Typography>
                          <Typography variant="caption" sx={{ color: '#9AA0A6' }}>Coverage: UGX {Number(tier.coverage_amount).toLocaleString()}</Typography>
                        </Box>
                      </Stack>
                      <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {(tier.benefits || []).filter(Boolean).map((benefit, bi) => (
                          <Chip key={bi} label={benefit} size="small" variant="outlined" sx={{ borderRadius: 1.5, fontSize: '0.7rem', fontWeight: 600, color: tc, borderColor: `${tc}40` }} />
                        ))}
                      </Box>
                    </Paper>
                  )
                })}
              </Stack>
            </Box>
          )}

          {!isLoadingHierarchy && tabValue === 2 && (
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#70757A', mb: 3, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>
                Captured Enrollment Data
              </Typography>
              <Stack spacing={3}>
                {(productHierarchy?.forms || []).map((form, fi) => (
                  <Paper key={fi} sx={{ borderRadius: 3, border: '1px solid #E8EAED', overflow: 'hidden', bgcolor: '#fff' }}>
                    <Box sx={{ px: 3, py: 2, bgcolor: '#F8F9FE', borderBottom: '1px solid #E8EAED', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem' }}>{form.name}</Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: '#5F6368' }}>{form.description || 'Compliance details provided'}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ p: 3 }}>
                      <Grid container spacing={3}>
                        {(form.fields || []).map((field, fli) => {
                          // Try to find value by label or key
                          const savedValue = viewPolicy?.context?.[field.label] || viewPolicy?.context?.[field.field_key]
                          
                          if (field.field_type === 'table') {
                            const tableRows = Array.isArray(savedValue) ? savedValue : []
                            return (
                              <Grid item xs={12} key={fli}>
                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#5F6368', mb: 1.5, textTransform: 'uppercase' }}>
                                  {field.label}
                                </Typography>
                                <Paper elevation={0} sx={{ border: '1px solid #E8EAED', borderRadius: 2, overflow: 'hidden' }}>
                                  <Table size="small">
                                    <TableHead sx={{ bgcolor: '#F8F9FA' }}>
                                      <TableRow>
                                        {(field.columns || []).map((col, ci) => (
                                          <TableCell key={ci} sx={{ fontWeight: 700, fontSize: '0.65rem', py: 1.5 }}>{col.label.toUpperCase()}</TableCell>
                                        ))}
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {tableRows.length > 0 ? tableRows.map((row, ri) => (
                                        <TableRow key={ri}>
                                          {(field.columns || []).map((col, ci) => (
                                            <TableCell key={ci} sx={{ fontSize: '0.8rem', py: 1.5 }}>
                                              {row[col.label] || row[col.key] || row[col.label?.toLowerCase()] || row[col.label?.toLowerCase().replace(/\s+/g, '_')] || '—'}
                                            </TableCell>
                                          ))}
                                        </TableRow>
                                      )) : (
                                        <TableRow>
                                          <TableCell colSpan={100} sx={{ textAlign: 'center', py: 3, color: '#9AA0A6', fontStyle: 'italic' }}>
                                            No data recorded for this section
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </TableBody>
                                  </Table>
                                </Paper>
                              </Grid>
                            )
                          }

                          return (
                            <Grid item xs={12} sm={6} key={fli}>
                              <Box sx={{ p: 2, bgcolor: '#F8F9FA', borderRadius: 3, border: '1px solid #F1F3F4' }}>
                                <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#9AA0A6', mb: 0.8, textTransform: 'uppercase' }}>
                                  {field.label}
                                </Typography>
                                <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: savedValue ? '#202124' : '#DADCE0' }}>
                                  {typeof savedValue === 'boolean' ? (savedValue ? 'Yes' : 'No') : String(savedValue || 'Not provided')}
                                </Typography>
                              </Box>
                            </Grid>
                          )
                        })}
                      </Grid>
                    </Box>
                  </Paper>
                ))}
                {(productHierarchy?.forms || []).length === 0 && (
                  <Box sx={{ py: 10, textAlign: 'center' }}>
                    <HistoryIcon sx={{ fontSize: 64, color: '#DADCE0', mb: 2 }} />
                    <Typography variant="body1" sx={{ color: '#70757A', fontWeight: 600 }}>No assessment data captured</Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          )}
        </Box>

        {/* Footer Actions Section */}
        <Box sx={{ p: 3, bgcolor: '#fff', borderTop: '1px solid #E8EAED', boxShadow: '0 -4px 20px rgba(0,0,0,0.02)' }}>
          <Stack direction="row" spacing={2}>
            {viewPolicy?.status === 'pending' && (
              <Button 
                fullWidth 
                variant="contained" 
                onClick={() => navigate(`/client/products/${viewPolicy.product_id}`)}
                sx={{ borderRadius: 2.5, bgcolor: '#1A237E', fontWeight: 800, py: 1.5, boxShadow: 'none', '&:hover': { bgcolor: '#0D1442', boxShadow: 'none' } }}
              >
                Proceed to Payment
              </Button>
            )}
            <Button 
              fullWidth 
              variant="outlined" 
              onClick={() => setDetailsOpen(false)}
              sx={{ borderRadius: 2.5, fontWeight: 800, py: 1.5, color: '#5F6368', borderColor: '#DADCE0', '&:hover': { borderColor: '#9AA0A6', bgcolor: '#F8F9FA' } }}
            >
              Close Details
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
    </Box>
  )
}
