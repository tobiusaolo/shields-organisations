import React, { useState } from 'react'
import {
  Box, Typography, Paper, Button, Stack, Grid,
  CircularProgress, LinearProgress, Skeleton, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Divider, Drawer,
  Table, TableBody, TableCell, TableHead, TableRow,
  Menu, MenuItem, TextField, MenuItem as SelectItem,
  FormControl, InputLabel, Select, RadioGroup,
  FormControlLabel, Radio, Fade, Zoom, Collapse, Avatar
} from '@mui/material'
import {
  Assignment as ClaimIcon,
  AddCircleOutline as AddIcon,
  DeleteOutline as DeleteIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  History as HistoryIcon,
  AttachFile as FileIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  LocalHospital as AccidentIcon,
  Description as DescriptionIcon,
  Smartphone as MobileMoneyIcon,
  AccountBalance as BankIcon,
  Event as EventIcon,
  Timer as TimerIcon,
  Policy as PolicyIcon,
  Category as CategoryIcon,
  VerifiedUser as ProductIcon
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { claimAPI, publicAPI, policyAPI } from '../services/api'
import Swal from 'sweetalert2'

// Native date formatter helper
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', { 
    month: 'short', 
    day: '2-digit', 
    year: 'numeric' 
  })
}

// Calculate days between two dates
const getDaysBetween = (d1, d2) => {
  const date1 = new Date(d1)
  const date2 = new Date(d2)
  const diffTime = Math.abs(date2 - date1)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

const CLAIM_STATUS_CONFIG = {
  reported: { color: '#FF9800', label: 'Reported', bgcolor: '#FFF7E6' },
  under_review: { color: '#2196F3', label: 'Reviewing', bgcolor: '#E3F2FD' },
  documents_pending: { color: '#9C27B0', label: 'Docs Needed', bgcolor: '#F3E5F5' },
  assessed: { color: '#673AB7', label: 'Assessed', bgcolor: '#EDE7F6' },
  approved: { color: '#4CAF50', label: 'Approved', bgcolor: '#E8F5E9' },
  paid: { color: '#2E7D32', label: 'Paid', bgcolor: '#E8F5E9' },
  closed: { color: '#757575', label: 'Closed', bgcolor: '#F5F5F5' },
  rejected: { color: '#F44336', label: 'Rejected', bgcolor: '#FFEBEE' },
  cancelled: { color: '#D32F2F', label: 'Cancelled', bgcolor: '#FFEBEE' },
}

const getStatusStyle = (status) => {
  const config = CLAIM_STATUS_CONFIG[status?.toLowerCase()] || CLAIM_STATUS_CONFIG.reported
  return config
}

export default function ClientClaims() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  const [formOpen, setFormOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [selectedClaim, setSelectedClaim] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    policy_id: location.state?.policyId || '',
    claim_type: 'accident',
    incident_date: new Date().toISOString().split('T')[0],
    description: '',
    estimated_amount: '',
    payout_method: 'mobile_money',
    payout_phone_number: '',
    payout_bank_name: '',
    payout_account_name: '',
    payout_account_number: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Auto-open form if redirected from policy with policyId
  React.useEffect(() => {
    if (location.state?.policyId) {
      setFormOpen(true)
    }
  }, [location.state])

  // Queries
  const { data: claims = [], isLoading } = useQuery({
    queryKey: ['client-claims', user?.organization_id],
    queryFn: async () => {
      const response = await claimAPI.getClaims(user.organization_id)
      return response.data.items || []
    },
    enabled: !!user?.organization_id
  })

  const { data: policies = [] } = useQuery({
    queryKey: ['active-policies', user?.organization_id],
    queryFn: async () => {
      const response = await policyAPI.getPolicies(user.organization_id, { status: 'active' })
      return response.data.items || []
    },
    enabled: !!user?.organization_id
  })

  // Mutations
  const submitClaimMutation = useMutation({
    mutationFn: (data) => publicAPI.submitClaim(data),
    onSuccess: () => {
      Swal.fire('Success', 'Claim submitted successfully. A claims officer will review it shortly.', 'success')
      setFormOpen(false)
      queryClient.invalidateQueries(['client-claims'])
      resetForm()
    },
    onError: (err) => {
      const errorDetail = err.response?.data?.detail
      const errorMessage = typeof errorDetail === 'object' 
        ? JSON.stringify(errorDetail) 
        : (errorDetail || 'Failed to submit claim')
      Swal.fire('Error', errorMessage, 'error')
    }
  })

  const deleteClaimMutation = useMutation({
    mutationFn: (claimId) => claimAPI.deleteClaim(user.organization_id, claimId),
    onSuccess: () => {
      Swal.fire('Cancelled', 'Your claim has been cancelled.', 'success')
      queryClient.invalidateQueries(['client-claims'])
    }
  })

  const resetForm = () => {
    setFormData({
      policy_id: location.state?.policyId || '',
      claim_type: 'accident',
      incident_date: new Date().toISOString().split('T')[0],
      description: '',
      estimated_amount: '',
      payout_method: 'mobile_money',
      payout_phone_number: '',
      payout_bank_name: '',
      payout_account_name: '',
      payout_account_number: '',
    })
  }

  const handleMenuOpen = (event, claim) => {
    setMenuAnchor(event.currentTarget)
    setSelectedClaim(claim)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
  }

  const handleDeleteClaim = () => {
    handleMenuClose()
    Swal.fire({
      title: 'Cancel Claim?',
      text: "Are you sure you want to cancel this claim? This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#D32F2F',
      confirmButtonText: 'Yes, cancel it'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteClaimMutation.mutate(selectedClaim.id)
      }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Clean data: remove empty strings for Decimal fields to avoid 422 errors
    const submissionData = { ...formData }
    if (!submissionData.estimated_amount || submissionData.estimated_amount === '') {
      delete submissionData.estimated_amount
    }
    submitClaimMutation.mutate(submissionData)
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress color="primary" />
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header Section */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#1A2027', letterSpacing: '-0.5px' }}>Claims Management</Typography>
          <Typography variant="body1" sx={{ color: '#5F6368', mt: 0.5 }}>Report incidents and track your claim settlements</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setFormOpen(true)}
          sx={{ 
            borderRadius: 2.5, px: 3, py: 1.2, bgcolor: '#1A73E8', fontWeight: 700,
            boxShadow: '0 4px 12px rgba(26, 115, 232, 0.25)',
            '&:hover': { bgcolor: '#1765CC', boxShadow: '0 6px 16px rgba(26, 115, 232, 0.35)' }
          }}
        >
          Report New Incident
        </Button>
      </Stack>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E8EAED', bgcolor: '#fff' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: '#E3F2FD' }}>
                <ClaimIcon sx={{ color: '#1A73E8' }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#5F6368', fontWeight: 700, textTransform: 'uppercase' }}>Total Claims</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>{claims.length}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E8EAED', bgcolor: '#fff' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: '#E8F5E9' }}>
                <CheckCircleIcon sx={{ color: '#4CAF50' }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#5F6368', fontWeight: 700, textTransform: 'uppercase' }}>Paid/Approved</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>{claims.filter(c => ['paid', 'approved'].includes(c.status)).length}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E8EAED', bgcolor: '#fff' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: '#FFF3E0' }}>
                <HistoryIcon sx={{ color: '#FF9800' }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#5F6368', fontWeight: 700, textTransform: 'uppercase' }}>Under Review</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>{claims.filter(c => c.status === 'under_review').length}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Claims List */}
      <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #E8EAED', overflow: 'hidden', bgcolor: '#fff' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F8F9FA' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: '#5F6368', fontSize: '0.75rem', textTransform: 'uppercase' }}>Claim ID</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#5F6368', fontSize: '0.75rem', textTransform: 'uppercase' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#5F6368', fontSize: '0.75rem', textTransform: 'uppercase' }}>Incident Date</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#5F6368', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {claims.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <Typography variant="body1" sx={{ color: '#70757A' }}>No claims reported yet.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              claims.map((claim) => (
                <TableRow 
                  key={claim.id} 
                  hover 
                  sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
                  onClick={() => {
                    setSelectedClaim(claim)
                    setDetailsOpen(true)
                  }}
                >
                  <TableCell>
                    <Typography sx={{ fontWeight: 700, color: '#1A2027' }}>#{claim.id.split('-')[0].toUpperCase()}</Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AccidentIcon sx={{ fontSize: 18, color: '#5F6368' }} />
                      <Typography sx={{ fontWeight: 600, textTransform: 'capitalize' }}>{claim.claim_type}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ color: '#5F6368' }}>{formatDate(claim.incident_date)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusStyle(claim.status).label} 
                      size="small"
                      sx={{ 
                        fontWeight: 700, 
                        bgcolor: getStatusStyle(claim.status).bgcolor, 
                        color: getStatusStyle(claim.status).color,
                        borderRadius: 1.5
                      }} 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={(e) => {
                      e.stopPropagation()
                      setMenuAnchor(e.currentTarget)
                      setSelectedClaim(claim)
                    }}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Claim Details Drawer */}
      <ClaimDetailsDrawer 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)} 
        claim={selectedClaim} 
        onDelete={handleDeleteClaim}
      />

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          setMenuAnchor(null)
          setDetailsOpen(true)
        }}>
          <HistoryIcon sx={{ mr: 1, fontSize: 18 }} /> View Details
        </MenuItem>
        {selectedClaim?.status === 'reported' && (
          <MenuItem onClick={() => {
            setMenuAnchor(null)
            handleDeleteClaim()
          }} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1, fontSize: 18 }} /> Delete Report
          </MenuItem>
        )}
      </Menu>

      {/* File Claim Dialog */}
      <Dialog 
        open={formOpen} 
        onClose={() => setFormOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle component="div" sx={{ fontWeight: 800, fontSize: '1.5rem', pb: 0.5, position: 'relative' }}>
          Report an Incident
          {location.state?.policyNumber && (
            <Typography variant="subtitle1" sx={{ color: '#1A73E8', fontWeight: 700 }}>
              Policy: {location.state.policyNumber}
            </Typography>
          )}
          {submitClaimMutation.isPending && (
            <LinearProgress 
              sx={{ 
                position: 'absolute', 
                bottom: 0, 
                left: 0, 
                right: 0, 
                height: 4,
                borderBottomLeftRadius: 4,
                borderBottomRightRadius: 4
              }} 
            />
          )}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#5F6368', fontWeight: 700 }}>INCIDENT INFORMATION</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Claim Type"
                      name="claim_type"
                      select
                      required
                      value={formData.claim_type}
                      onChange={handleChange}
                    >
                      <SelectItem value="death">Death</SelectItem>
                      <SelectItem value="disability">Disability</SelectItem>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="accident">Accident</SelectItem>
                      <SelectItem value="theft">Theft</SelectItem>
                      <SelectItem value="damage">Damage</SelectItem>
                      <SelectItem value="third_party_liability">Third Party Liability</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Incident Date"
                      name="incident_date"
                      type="date"
                      required
                      InputLabelProps={{ shrink: true }}
                      value={formData.incident_date}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Detailed Description"
                      name="description"
                      multiline
                      rows={4}
                      required
                      placeholder="Please describe exactly what happened..."
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ mb: 2, mt: 1, color: '#5F6368', fontWeight: 700 }}>PAYOUT PREFERENCE</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Payout Method"
                      name="payout_method"
                      select
                      required
                      value={formData.payout_method}
                      onChange={handleChange}
                    >
                      <SelectItem value="mobile_money">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <MobileMoneyIcon sx={{ fontSize: 18 }} />
                          <span>Mobile Money</span>
                        </Stack>
                      </SelectItem>
                      <SelectItem value="bank_transfer">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <BankIcon sx={{ fontSize: 18 }} />
                          <span>Bank Transfer</span>
                        </Stack>
                      </SelectItem>
                    </TextField>
                  </Grid>

                  {formData.payout_method === 'mobile_money' ? (
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Phone Number for Payout"
                        name="payout_phone_number"
                        placeholder="e.g. 0770000000"
                        required
                        value={formData.payout_phone_number}
                        onChange={handleChange}
                      />
                    </Grid>
                  ) : (
                    <>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Bank Name"
                          name="payout_bank_name"
                          required
                          value={formData.payout_bank_name}
                          onChange={handleChange}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Account Name"
                          name="payout_account_name"
                          required
                          value={formData.payout_account_name}
                          onChange={handleChange}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Account Number"
                          name="payout_account_number"
                          required
                          value={formData.payout_account_number}
                          onChange={handleChange}
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setFormOpen(false)} sx={{ fontWeight: 700, color: '#5F6368' }}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={submitClaimMutation.isPending}
              sx={{ 
                borderRadius: 2, 
                px: 4, 
                py: 1, 
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(26, 115, 232, 0.3)'
              }}
            >
              {submitClaimMutation.isPending ? 'Submitting...' : 'Submit Claim'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
}

function ClaimDetailsDrawer({ open, onClose, claim, onDelete }) {
  const [tabValue, setTabValue] = useState(0)

  const { data: policy, isLoading: loadingPolicy } = useQuery({
    queryKey: ['policy-details', claim?.policy_id],
    queryFn: () => publicAPI.getClientPolicyDetails(claim.policy_id),
    enabled: !!claim?.policy_id && open
  })

  const { data: payments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ['policy-payments', claim?.policy_id],
    queryFn: () => paymentAPI.getPolicyPayments(claim.organization_id, claim.policy_id),
    enabled: !!claim?.policy_id && !!claim?.organization_id && open && tabValue === 2
  })

  if (!claim) return null

  // Calculations with robustness
  const getSafeDays = (d1, d2) => {
    if (!d1 || !d2) return 0
    const days = getDaysBetween(d1, d2)
    return isNaN(days) ? 0 : days
  }

  const policyAgeAtIncident = getSafeDays(policy?.start_date, claim.incident_date)
  const claimAge = getSafeDays(claim.created_at, new Date())

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 500 }, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 3, bgcolor: '#F8F9FA', borderBottom: '1px solid #E8EAED' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Chip 
              label={getStatusStyle(claim.status).label} 
              size="small"
              sx={{ fontWeight: 800, bgcolor: getStatusStyle(claim.status).bgcolor, color: getStatusStyle(claim.status).color }}
            />
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5 }}>
            Claim Details
          </Typography>
          <Typography variant="body2" sx={{ color: '#5F6368', fontWeight: 600 }}>
            ID: #{claim.id.toUpperCase()}
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Select
            value={tabValue}
            onChange={(e) => setTabValue(e.target.value)}
            sx={{ 
              display: { xs: 'flex', sm: 'none' }, 
              my: 2,
              '& .MuiSelect-select': { fontWeight: 700 }
            }}
          >
            <SelectItem value={0}>Overview</SelectItem>
            <SelectItem value={1}>Forms</SelectItem>
            <SelectItem value={2}>Payments</SelectItem>
          </Select>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Stack direction="row" spacing={4}>
              <Button 
                onClick={() => setTabValue(0)}
                sx={{ 
                  py: 2, px: 1, borderRadius: 0,
                  borderBottom: tabValue === 0 ? '3px solid #1A73E8' : '3px solid transparent',
                  color: tabValue === 0 ? '#1A73E8' : '#5F6368',
                  fontWeight: 800,
                  '&:hover': { bgcolor: 'transparent' }
                }}
              >
                Overview
              </Button>
              <Button 
                onClick={() => setTabValue(1)}
                sx={{ 
                  py: 2, px: 1, borderRadius: 0,
                  borderBottom: tabValue === 1 ? '3px solid #1A73E8' : '3px solid transparent',
                  color: tabValue === 1 ? '#1A73E8' : '#5F6368',
                  fontWeight: 800,
                  '&:hover': { bgcolor: 'transparent' }
                }}
              >
                Forms
              </Button>
              <Button 
                onClick={() => setTabValue(2)}
                sx={{ 
                  py: 2, px: 1, borderRadius: 0,
                  borderBottom: tabValue === 2 ? '3px solid #1A73E8' : '3px solid transparent',
                  color: tabValue === 2 ? '#1A73E8' : '#5F6368',
                  fontWeight: 800,
                  '&:hover': { bgcolor: 'transparent' }
                }}
              >
                Payments
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* Tab Content */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
          {tabValue === 0 && (
            <Fade in={tabValue === 0}>
              <Box>
                {/* Time Metrics */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 2, textAlign: 'center', borderRadius: 4, bgcolor: '#F8F9FA', border: '1px solid #E8EAED' }}>
                      <TimerIcon sx={{ color: '#1A73E8', mb: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>{policyAgeAtIncident} Days</Typography>
                      <Typography variant="caption" sx={{ color: '#5F6368', fontWeight: 700 }}>Policy Age at Incident</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 2, textAlign: 'center', borderRadius: 4, bgcolor: '#F8F9FA', border: '1px solid #E8EAED' }}>
                      <HistoryIcon sx={{ color: '#34A853', mb: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>{claimAge} Days</Typography>
                      <Typography variant="caption" sx={{ color: '#5F6368', fontWeight: 700 }}>Claim Life to Today</Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Product Section */}
                <Box sx={{ mb: 4 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <ProductIcon sx={{ color: '#1A73E8', fontSize: 20 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Product Overview</Typography>
                  </Stack>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 4, border: '1px solid #E8EAED' }}>
                    {loadingPolicy ? (
                      <Stack spacing={1}>
                        <Skeleton variant="text" width="80%" height={32} />
                        <Skeleton variant="text" width="40%" />
                      </Stack>
                    ) : (
                      <>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#1A73E8' }}>{policy?.product_name || 'Premium Insurance'}</Typography>
                        <Typography variant="body2" sx={{ color: '#5F6368', fontWeight: 600, mb: 2 }}>Policy: {policy?.policy_number || 'N/A'}</Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="caption" sx={{ color: '#5F6368', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Coverage Amount</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 800 }}>{Number(policy?.coverage_amount || 0).toLocaleString()} UGX</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" sx={{ color: '#5F6368', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Annual Premium</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 800 }}>{Number(policy?.premium || 0).toLocaleString()} UGX</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" sx={{ color: '#5F6368', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Start Date</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 800 }}>{formatDate(policy?.start_date)}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" sx={{ color: '#5F6368', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Paid Until</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 800, color: '#34A853' }}>{formatDate(policy?.paid_until)}</Typography>
                          </Grid>
                        </Grid>
                      </>
                    )}
                  </Paper>
                </Box>

                {/* Incident Section */}
                <Box sx={{ mb: 4 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <EventIcon sx={{ color: '#EA4335', fontSize: 20 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Incident Summary</Typography>
                  </Stack>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 4, border: '1px solid #E8EAED', bgcolor: '#FFFBFB' }}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#D32F2F', fontWeight: 800, textTransform: 'uppercase' }}>Incident Type & Date</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 800, textTransform: 'capitalize' }}>
                          {claim.claim_type} — {formatDate(claim.incident_date)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#5F6368', fontWeight: 700, textTransform: 'uppercase' }}>Incident Description</Typography>
                        <Typography variant="body2" sx={{ color: '#3C4043', lineHeight: 1.7, fontWeight: 500 }}>
                          {claim.description}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Box>

                {/* Payout Section */}
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <BankIcon sx={{ color: '#FBBC04', fontSize: 20 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Payout Information</Typography>
                  </Stack>
                  <Paper elevation={0} sx={{ p: 2, borderRadius: 4, bgcolor: '#F8F9FA', border: '1px solid #E8EAED' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ width: 48, height: 48, bgcolor: claim.payout_method === 'mobile_money' ? '#FFEBEE' : '#E3F2FD', color: claim.payout_method === 'mobile_money' ? '#D32F2F' : '#1A73E8' }}>
                        {claim.payout_method === 'mobile_money' ? <MobileMoneyIcon /> : <BankIcon />}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 800 }}>
                          {claim.payout_method === 'mobile_money' ? 'Mobile Money' : 'Bank Transfer'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#5F6368', fontWeight: 600 }}>
                          {claim.payout_method === 'mobile_money' ? claim.payout_phone_number : `${claim.payout_bank_name} - ${claim.payout_account_number}`}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Box>
              </Box>
            </Fade>
          )}

          {tabValue === 1 && (
            <Fade in={tabValue === 1}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Policy Application Forms</Typography>
                <Typography variant="body2" sx={{ color: '#5F6368', mb: 3 }}>The original templates and data submitted during the policy application.</Typography>
                
                {!policy?.context || Object.keys(policy.context).length === 0 ? (
                  <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 4, bgcolor: '#F8F9FA' }}>
                    <FileIcon sx={{ fontSize: 48, color: '#DADCE0', mb: 2 }} />
                    <Typography variant="body1" sx={{ color: '#5F6368', fontWeight: 600 }}>
                      No application forms found for this policy.
                    </Typography>
                  </Paper>
                ) : (
                  <Stack spacing={2}>
                    {Object.entries(policy.context).map(([key, value]) => (
                      <Paper key={key} variant="outlined" sx={{ p: 2, borderRadius: 3, border: '1px solid #E8EAED' }}>
                        <Typography variant="caption" sx={{ color: '#5F6368', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                          {key.replace(/_/g, ' ')}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 800, color: '#1A2027', mt: 0.5 }}>
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>
            </Fade>
          )}

          {tabValue === 2 && (
            <Fade in={tabValue === 2}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Payment History</Typography>
                <Typography variant="body2" sx={{ color: '#5F6368', mb: 3 }}>Tracking all premiums paid towards this policy.</Typography>
                
                {loadingPayments ? (
                  <Stack spacing={2}>
                    <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 3 }} />
                    <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 3 }} />
                  </Stack>
                ) : payments.length === 0 ? (
                  <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 4, bgcolor: '#F8F9FA' }}>
                    <Typography variant="body1" sx={{ color: '#5F6368', fontWeight: 600 }}>No payment records found.</Typography>
                  </Paper>
                ) : (
                  <Stack spacing={1.5}>
                    {payments.map((p, idx) => (
                      <Paper key={idx} elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #E8EAED' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>Installment {p.installment_number || idx + 1}</Typography>
                            <Typography variant="caption" sx={{ color: '#5F6368' }}>{formatDate(p.payment_date)}</Typography>
                          </Box>
                          <Typography variant="body1" sx={{ fontWeight: 900, color: '#34A853' }}>
                            {Number(p.amount).toLocaleString()} {p.currency}
                          </Typography>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>
            </Fade>
          )}
        </Box>

        {/* Footer Actions */}
        <Box sx={{ p: 3, borderTop: '1px solid #E8EAED', bgcolor: '#fff' }}>
          <Stack direction="row" spacing={2}>
            <Button 
              fullWidth 
              variant="outlined" 
              onClick={onClose}
              sx={{ borderRadius: 2.5, fontWeight: 700, py: 1.2, color: '#5F6368', borderColor: '#DADCE0' }}
            >
              Close
            </Button>
            {claim.status === 'reported' && (
              <Button 
                fullWidth 
                variant="contained" 
                color="error"
                onClick={() => {
                  onClose()
                  onDelete()
                }}
                sx={{ borderRadius: 2.5, fontWeight: 700, py: 1.2, bgcolor: '#D32F2F' }}
              >
                Cancel Claim
              </Button>
            )}
          </Stack>
        </Box>
      </Box>
    </Drawer>
  )
}
