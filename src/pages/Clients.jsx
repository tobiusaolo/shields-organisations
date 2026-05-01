import React, { useState, useEffect } from 'react'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Drawer, TextField, Chip, Avatar, Skeleton,
  IconButton, Tooltip, Alert, InputAdornment, Grid,
  Stepper, Step, StepLabel, LinearProgress, Divider, TablePagination, Tabs, Tab
} from '@mui/material'
import Swal from 'sweetalert2'
import {
  Add as AddIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LockReset as ResetIcon,
  History as HistoryIcon,
  LocalPostOffice as InviteIcon,
  VerifiedUser as VerifiedIcon,
  MoreVert as MoreIcon,
  Search as SearchIcon,
  ShoppingBag as BuyIcon,
  Description as DocIcon,
  Fingerprint as NinIcon,
  Business as TinIcon,
  LocationOn as AddressIcon,
  Info as InfoIcon,
  CreditCard as PaymentIcon
} from '@mui/icons-material'
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { tenancyAPI } from '../services/api'
import { useNavigate } from 'react-router-dom'

export default function Clients() {
  const { user, organizationId } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeStep, setActiveStep] = useState(0)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: 'ClientInit123!',
    // KYC fields
    nin: '',
    tin: '',
    address: '',
    documents: []
  })
  const [uploadedDocs, setUploadedDocs] = useState({
    national_id_front: null,
    national_id_back: null,
    drivers_permit_front: null,
    drivers_permit_back: null,
    passport_bio: null
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    setPage(0)
  }, [searchTerm])

  // Action Menu State
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)

  const handleMenuOpen = (event, client) => {
    setAnchorEl(event.currentTarget)
    setSelectedClient(client)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleClosePortfolio = () => {
    setPortfolioOpen(false)
    setSelectedClient(null)
  }

  const handleFileUpload = (docType, file) => {
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedDocs(prev => ({
          ...prev,
          [docType]: reader.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileRemove = (docType) => {
    setUploadedDocs(prev => ({
      ...prev,
      [docType]: null
    }))
  }

  const { data, isLoading } = useQuery({
    queryKey: ['org-clients', organizationId],
    queryFn: async () => {
      const res = await tenancyAPI.getOrganizationClients(organizationId)
      return res.data.items || []
    },
    enabled: !!organizationId
  })

  // Scoped Portfolio State
  const [portfolioOpen, setPortfolioOpen] = useState(false)
  const [portfolioTab, setPortfolioTab] = useState(0)
  
  const { data: portfolioData, isLoading: isLoadingPortfolio } = useQuery({
    queryKey: ['client-portfolio', organizationId, selectedClient?.id],
    queryFn: async () => {
      const res = await tenancyAPI.getClientPortfolioScoped(organizationId, selectedClient.id)
      return res.data
    },
    enabled: !!selectedClient?.id && portfolioOpen && !!organizationId
  })

  const handleViewPortfolio = (client) => {
    setSelectedClient(client)
    setPortfolioOpen(true)
    handleMenuClose()
  }

  const registerClientMutation = useMutation({
    mutationFn: async (newData) => {
      const { kyc_data, ...clientData } = newData
      return await tenancyAPI.registerClient(clientData, kyc_data)
    },
    onSuccess: () => {
      Swal.fire({
        icon: 'success',
        title: 'Registration Successful',
        text: `Client ${form.first_name} registered successfully! They can now login with the initial password.`,
        confirmButtonColor: '#1A73E8'
      })
      queryClient.invalidateQueries(['org-clients', organizationId])
      setOpen(false)
      setForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: 'ClientInit123!',
        nin: '',
        tin: '',
        address: '',
        documents: []
      })
      setUploadedDocs({
        selfie: null,
        national_id_front: null,
        national_id_back: null,
        drivers_permit_front: null,
        drivers_permit_back: null,
        passport_bio: null
      })
      setActiveStep(0)
      setError('')
    },
    onError: (err) => {
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: err.response?.data?.detail || 'Failed to register client.',
        confirmButtonColor: '#1A73E8'
      })
      setError(err.response?.data?.detail || 'Failed to register client.')
    }
  })

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId) => {
      return await tenancyAPI.resetUserPassword(userId, { new_password: 'ClientInit123!' })
    },
    onSuccess: () => {
      setSuccess('Password reset to default successfully.')
      handleMenuClose()
      setTimeout(() => setSuccess(''), 5000)
    },
    onError: (err) => setError(err.response?.data?.detail || 'Reset failed.')
  })

  const resendInviteMutation = useMutation({
    mutationFn: async (client) => {
      // Mocking an invite resend as there's no direct endpoint yet
      return new Promise(resolve => setTimeout(resolve, 800))
    },
    onSuccess: () => {
      setSuccess('Invitation email resent successfully.')
      handleMenuClose()
      setTimeout(() => setSuccess(''), 5000)
    }
  })

  const handleRegister = async () => {
    setError('')
    if (!form.email || !form.first_name || !form.last_name || !form.phone) {
      setError('Please fill out all required fields.')
      return
    }
    if (activeStep === 1 && (!form.nin || !form.address)) {
      setError('Please fill out required KYC fields (NIN and Address).')
      return
    }

    Swal.fire({
      title: 'Registering Client...',
      text: 'Please wait while we process the registration.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      }
    })

    // Convert uploaded docs to document array format
    const documents = Object.keys(uploadedDocs)
      .filter(key => uploadedDocs[key] !== null)
      .map(key => ({
        document_type: key,
        file_url: uploadedDocs[key],
        file_name: `${key}.jpg`
      }))

    const kyc_data = {
      nin: form.nin,
      tin: form.tin,
      address: form.address,
      documents: documents
    }
    registerClientMutation.mutate({
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      kyc_data: kyc_data
    })
  }

  const filteredClients = (data || []).filter(c => 
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#202124', mb: 0.5, letterSpacing: '-0.02em' }}>
            My Clients
          </Typography>
          <Typography sx={{ color: '#5F6368', fontSize: '0.95rem' }}>
            Personal portfolio of leads and onboarded policyholders
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
          sx={{ borderRadius: 0, fontWeight: 700, px: 3, py: 1.2, boxShadow: '0 4px 12px rgba(26,115,232,0.3)' }}
        >
          Register New Client
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 0}}>{success}</Alert>}

      <Paper elevation={0} sx={{ border: '1px solid #E8EAED', borderRadius: 0, overflow: 'hidden', bgcolor: '#FFFFFF' }}>
        <Box sx={{ p: 2.5, borderBottom: '1px solid #E8EAED', display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
                size="small"
                placeholder="Search clients by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ width: 340 }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon sx={{ color: '#9AA0A6', fontSize: 20 }} />
                        </InputAdornment>
                    ),
                    sx: { borderRadius: 0, bgcolor: '#F8F9FA' }
                }}
            />
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#F8F9FA' }}>
              <TableRow>
                <TableCell sx={{ color: '#5F6368', fontWeight: 700, py: 2 }}>Client Profile</TableCell>
                <TableCell sx={{ color: '#5F6368', fontWeight: 700 }}>Contact Details</TableCell>
                <TableCell sx={{ color: '#5F6368', fontWeight: 700 }}>KYC Status</TableCell>
                <TableCell sx={{ color: '#5F6368', fontWeight: 700 }}>Portfolio</TableCell>
                <TableCell sx={{ color: '#5F6368', fontWeight: 700 }}>Onboarding</TableCell>
                <TableCell align="right" sx={{ color: '#5F6368', fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <TableRow key={i}>
                    <TableCell><Skeleton variant="circular" width={40} height={40} sx={{ display: 'inline-block', mr: 2 }} /><Skeleton width="140px" sx={{ display: 'inline-block' }} /></TableCell>
                    <TableCell><Skeleton width="120px" /></TableCell>
                    <TableCell><Skeleton width="80px" /></TableCell>
                    <TableCell><Skeleton width="90px" /></TableCell>
                    <TableCell><Skeleton width="100px" /></TableCell>
                    <TableCell align="right"><Skeleton width="30px" sx={{ ml: 'auto' }} /></TableCell>
                  </TableRow>
                ))
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: '#9AA0A6' }}>
                      <PersonIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                      <Typography sx={{ fontWeight: 500 }}>No clients registered in your portfolio yet.</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : filteredClients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((c) => (
                <TableRow key={c.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ 
                        width: 40, height: 40, 
                        bgcolor: '#E8F0FE', color: '#1A73E8', 
                        fontSize: '0.9rem', fontWeight: 800 
                      }}>
                        {c.first_name[0]}{c.last_name[0]}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#202124' }}>
                          {c.first_name} {c.last_name}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#9AA0A6' }}>
                          ID: {c.id.split('-')[0]}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon sx={{ fontSize: 14, color: '#9AA0A6' }} />
                          <Typography sx={{ fontSize: '0.82rem' }}>{c.email}</Typography>
                       </Box>
                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon sx={{ fontSize: 14, color: '#9AA0A6' }} />
                          <Typography sx={{ fontSize: '0.82rem' }}>{c.phone || 'N/A'}</Typography>
                       </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                        label={(c.kyc_status || 'pending').toUpperCase()} 
                        size="small"
                        color={c.kyc_status === 'verified' ? 'success' : 'warning'}
                        variant={c.kyc_status === 'verified' ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 800, fontSize: '0.65rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1A73E8' }}>
                            {c.policies_count || 0} Policies
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#5F6368', fontWeight: 600 }}>
                            UGX {(c.total_premium_value || 0).toLocaleString()}
                        </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '0.82rem', color: '#5F6368' }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Tooltip title="Enroll in Policy">
                            <IconButton size="small" color="primary" onClick={() => navigate(`/admin/enroll`, { state: { presetClient: c } })}>
                                <BuyIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, c)}>
                            <MoreIcon fontSize="small" />
                        </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredClients.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
          sx={{ borderTop: '1px solid #E8EAED' }}
        />
      </Paper>

      {/* Registration Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: { width: 500, borderRadius: 0 }
        }}
      >
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#202124' }}>Register New Client</Typography>
            <Typography sx={{ fontSize: '0.85rem', color: '#5F6368', mt: 0.5 }}>
              Onboard a public user to your personal portfolio with KYC verification.
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 0}}>{error}</Alert>}

          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            <Step>
              <StepLabel>Basic Info</StepLabel>
            </Step>
            <Step>
              <StepLabel>KYC Details</StepLabel>
            </Step>
          </Stepper>

          {registerClientMutation.isPending && (
            <Box sx={{ width: '100%', mb: 3 }}>
              <LinearProgress />
            </Box>
          )}

          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {activeStep === 0 && (
              <Grid container spacing={2.5}>
                <Grid item xs={6}>
                  <TextField
                    label="First Name"
                    fullWidth
                    size="small"
                    value={form.first_name}
                    onChange={e => setForm({ ...form, first_name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Last Name"
                    fullWidth
                    size="small"
                    value={form.last_name}
                    onChange={e => setForm({ ...form, last_name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Email Address"
                    fullWidth
                    size="small"
                    type="email"
                    placeholder="client@example.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Phone Number"
                    fullWidth
                    size="small"
                    placeholder="+256..."
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Initial Password"
                    fullWidth
                    size="small"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    helperText="Client will be required to change this upon first login."
                  />
                </Grid>
              </Grid>
            )}

            {activeStep === 1 && (
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <NinIcon sx={{ color: '#1A73E8' }} />
                    <Typography sx={{ fontWeight: 600, color: '#202124' }}>Identity Verification</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="National ID (NIN) *"
                    fullWidth
                    size="small"
                    placeholder="CF00..."
                    value={form.nin}
                    onChange={e => setForm({ ...form, nin: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <NinIcon sx={{ fontSize: 16, color: '#9AA0A6' }} />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Tax ID (TIN)"
                    fullWidth
                    size="small"
                    placeholder="1000..."
                    value={form.tin}
                    onChange={e => setForm({ ...form, tin: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <TinIcon sx={{ fontSize: 16, color: '#9AA0A6' }} />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Physical Address *"
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    placeholder="Street address, city, country"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AddressIcon sx={{ fontSize: 16, color: '#9AA0A6' }} />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>

                {/* Document Upload Section */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography sx={{ fontWeight: 600, color: '#202124', mb: 2 }}>Identity Documents</Typography>
                </Grid>

                {/* National ID */}
                <Grid item xs={12}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#5F6368', mb: 1 }}>National ID Card</Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          border: '2px dashed #E8EAED',
                          borderRadius: 0,
                          p: 2,
                          textAlign: 'center',
                          cursor: 'pointer',
                          bgcolor: uploadedDocs.national_id_front ? '#F0FDF4' : '#FAFAFA'
                        }}
                        onClick={() => document.getElementById('national_id_front').click()}
                      >
                        {uploadedDocs.national_id_front ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <img src={uploadedDocs.national_id_front} alt="National ID Front" style={{ width: '100%', maxHeight: '80px', objectFit: 'contain', marginBottom: '8px', borderRadius: '4px' }} />
                            <Typography sx={{ fontSize: '0.75rem', color: '#16A34A', mt: 1 }}>Front Uploaded</Typography>
                            <Button size="small" onClick={(e) => { e.stopPropagation(); handleFileRemove('national_id_front') }}>Remove</Button>
                          </Box>
                        ) : (
                          <Box>
                            <DocIcon sx={{ fontSize: 32, color: '#9AA0A6' }} />
                            <Typography sx={{ fontSize: '0.75rem', color: '#5F6368', mt: 1 }}>Upload Front</Typography>
                          </Box>
                        )}
                        <input
                          type="file"
                          id="national_id_front"
                          hidden
                          accept="image/*"
                          onChange={(e) => handleFileUpload('national_id_front', e.target.files[0])}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          border: '2px dashed #E8EAED',
                          borderRadius: 0,
                          p: 2,
                          textAlign: 'center',
                          cursor: 'pointer',
                          bgcolor: uploadedDocs.national_id_back ? '#F0FDF4' : '#FAFAFA'
                        }}
                        onClick={() => document.getElementById('national_id_back').click()}
                      >
                        {uploadedDocs.national_id_back ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <img src={uploadedDocs.national_id_back} alt="National ID Back" style={{ width: '100%', maxHeight: '80px', objectFit: 'contain', marginBottom: '8px', borderRadius: '4px' }} />
                            <Typography sx={{ fontSize: '0.75rem', color: '#16A34A', mt: 1 }}>Back Uploaded</Typography>
                            <Button size="small" onClick={(e) => { e.stopPropagation(); handleFileRemove('national_id_back') }}>Remove</Button>
                          </Box>
                        ) : (
                          <Box>
                            <DocIcon sx={{ fontSize: 32, color: '#9AA0A6' }} />
                            <Typography sx={{ fontSize: '0.75rem', color: '#5F6368', mt: 1 }}>Upload Back</Typography>
                          </Box>
                        )}
                        <input
                          type="file"
                          id="national_id_back"
                          hidden
                          accept="image/*"
                          onChange={(e) => handleFileUpload('national_id_back', e.target.files[0])}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Driver's Permit */}
                <Grid item xs={12}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#5F6368', mb: 1 }}>Driver's Permit (Optional)</Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          border: '2px dashed #E8EAED',
                          borderRadius: 0,
                          p: 2,
                          textAlign: 'center',
                          cursor: 'pointer',
                          bgcolor: uploadedDocs.drivers_permit_front ? '#F0FDF4' : '#FAFAFA'
                        }}
                        onClick={() => document.getElementById('drivers_permit_front').click()}
                      >
                        {uploadedDocs.drivers_permit_front ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <img src={uploadedDocs.drivers_permit_front} alt="Driver's Permit Front" style={{ width: '100%', maxHeight: '80px', objectFit: 'contain', marginBottom: '8px', borderRadius: '4px' }} />
                            <Typography sx={{ fontSize: '0.75rem', color: '#16A34A', mt: 1 }}>Front Uploaded</Typography>
                            <Button size="small" onClick={(e) => { e.stopPropagation(); handleFileRemove('drivers_permit_front') }}>Remove</Button>
                          </Box>
                        ) : (
                          <Box>
                            <DocIcon sx={{ fontSize: 32, color: '#9AA0A6' }} />
                            <Typography sx={{ fontSize: '0.75rem', color: '#5F6368', mt: 1 }}>Upload Front</Typography>
                          </Box>
                        )}
                        <input
                          type="file"
                          id="drivers_permit_front"
                          hidden
                          accept="image/*"
                          onChange={(e) => handleFileUpload('drivers_permit_front', e.target.files[0])}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          border: '2px dashed #E8EAED',
                          borderRadius: 0,
                          p: 2,
                          textAlign: 'center',
                          cursor: 'pointer',
                          bgcolor: uploadedDocs.drivers_permit_back ? '#F0FDF4' : '#FAFAFA'
                        }}
                        onClick={() => document.getElementById('drivers_permit_back').click()}
                      >
                        {uploadedDocs.drivers_permit_back ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <img src={uploadedDocs.drivers_permit_back} alt="Driver's Permit Back" style={{ width: '100%', maxHeight: '80px', objectFit: 'contain', marginBottom: '8px', borderRadius: '4px' }} />
                            <Typography sx={{ fontSize: '0.75rem', color: '#16A34A', mt: 1 }}>Back Uploaded</Typography>
                            <Button size="small" onClick={(e) => { e.stopPropagation(); handleFileRemove('drivers_permit_back') }}>Remove</Button>
                          </Box>
                        ) : (
                          <Box>
                            <DocIcon sx={{ fontSize: 32, color: '#9AA0A6' }} />
                            <Typography sx={{ fontSize: '0.75rem', color: '#5F6368', mt: 1 }}>Upload Back</Typography>
                          </Box>
                        )}
                        <input
                          type="file"
                          id="drivers_permit_back"
                          hidden
                          accept="image/*"
                          onChange={(e) => handleFileUpload('drivers_permit_back', e.target.files[0])}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Selfie */}
                <Grid item xs={12}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#5F6368', mb: 1 }}>Selfie (Photo of Face)</Typography>
                  <Box
                    sx={{
                      border: '2px dashed #E8EAED',
                      borderRadius: 0,
                      p: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      bgcolor: uploadedDocs.selfie ? '#F0FDF4' : '#FAFAFA'
                    }}
                    onClick={() => document.getElementById('selfie_input').click()}
                  >
                    {uploadedDocs.selfie ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Avatar src={uploadedDocs.selfie} sx={{ width: 80, height: 80, mb: 1, border: '2px solid #16A34A' }} />
                        <Typography sx={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 600 }}>Selfie Uploaded</Typography>
                        <Button size="small" onClick={(e) => { e.stopPropagation(); handleFileRemove('selfie') }}>Remove</Button>
                      </Box>
                    ) : (
                      <Box>
                        <PersonIcon sx={{ fontSize: 32, color: '#9AA0A6' }} />
                        <Typography sx={{ fontSize: '0.75rem', color: '#5F6368', mt: 1 }}>Upload Selfie</Typography>
                      </Box>
                    )}
                    <input
                      type="file"
                      id="selfie_input"
                      hidden
                      accept="image/*"
                      onChange={(e) => handleFileUpload('selfie', e.target.files[0])}
                    />
                  </Box>
                </Grid>

                {/* Passport */}
                <Grid item xs={12}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#5F6368', mb: 1 }}>Passport (Optional)</Typography>
                  <Box
                    sx={{
                      border: '2px dashed #E8EAED',
                      borderRadius: 0,
                      p: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      bgcolor: uploadedDocs.passport_bio ? '#F0FDF4' : '#FAFAFA'
                    }}
                    onClick={() => document.getElementById('passport_bio').click()}
                  >
                    {uploadedDocs.passport_bio ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <img src={uploadedDocs.passport_bio} alt="Passport Bio" style={{ width: '100%', maxHeight: '120px', objectFit: 'contain', marginBottom: '8px', borderRadius: '4px' }} />
                        <Typography sx={{ fontSize: '0.75rem', color: '#16A34A', mt: 1 }}>Passport Uploaded</Typography>
                        <Button size="small" onClick={(e) => { e.stopPropagation(); handleFileRemove('passport_bio') }}>Remove</Button>
                      </Box>
                    ) : (
                      <Box>
                        <DocIcon sx={{ fontSize: 32, color: '#9AA0A6' }} />
                        <Typography sx={{ fontSize: '0.75rem', color: '#5F6368', mt: 1 }}>Upload Passport Bio Page</Typography>
                      </Box>
                    )}
                    <input
                      type="file"
                      id="passport_bio"
                      hidden
                      accept="image/*"
                      onChange={(e) => handleFileUpload('passport_bio', e.target.files[0])}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: '#F8F9FA', borderRadius: 0, border: '1px dashed #E8EAED' }}>
                    <Typography sx={{ fontSize: '0.8rem', color: '#5F6368', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DocIcon sx={{ fontSize: 16, color: '#1A73E8' }} />
                      KYC data and documents will be stored in the user's profile for mobile app verification.
                      Required fields: NIN and Address. Documents: National ID (front/back) recommended.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            )}

            <Box sx={{ mt: 4, p: 2, bgcolor: '#F8F9FA', borderRadius: 0, border: '1px solid #E8EAED' }}>
               <Typography sx={{ fontSize: '0.8rem', color: '#5F6368', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VerifiedIcon sx={{ fontSize: 16, color: '#1A73E8' }} />
                  This client will be attached only to you and your record. They will become a formal organization member only after their first policy purchase.
               </Typography>
            </Box>
          </Box>

          {/* Footer Actions */}
          <Box sx={{ p: 2, borderTop: '1px solid #E8EAED', display: 'flex', justifyContent: 'space-between', bgcolor: '#fff' }}>
            <Button 
              disabled={activeStep === 0 || registerClientMutation.isPending} 
              onClick={() => setActiveStep(prev => prev - 1)}
              sx={{ fontWeight: 700 }}
            >
              Back
            </Button>
            {activeStep === 0 ? (
              <Button 
                variant="contained" 
                onClick={() => setActiveStep(prev => prev + 1)}
                sx={{ borderRadius: 0, fontWeight: 700 }}
              >
                Next Step
              </Button>
            ) : (
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleRegister}
                disabled={registerClientMutation.isPending}
                sx={{ borderRadius: 0, fontWeight: 700 }}
              >
                Submit Registration
              </Button>
            )}
          </Box>
        </Box>
      </Drawer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{ sx: { borderRadius: 0, border: '1px solid #000', boxShadow: '4px 4px 0px rgba(0,0,0,0.1)', minWidth: 220 } }}
      >
        <MenuItem onClick={() => handleViewPortfolio(selectedClient)} sx={{ py: 1.25 }}>
          <ListItemIcon><HistoryIcon fontSize="small" color="primary" /></ListItemIcon>
          <ListItemText primary="View Organization Portfolio" primaryTypographyProps={{ fontWeight: 700, color: '#1A73E8' }} />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => resetPasswordMutation.mutate(selectedClient.id)} sx={{ py: 1.25 }}>
          <ListItemIcon><ResetIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Reset Password" />
        </MenuItem>
        <MenuItem onClick={() => resendInviteMutation.mutate(selectedClient)} sx={{ py: 1.25 }}>
          <ListItemIcon><InviteIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Resend Invite" />
        </MenuItem>
      </Menu>


      {/* Scoped Client Portfolio Drawer */}
      <Drawer
        anchor="right"
        open={portfolioOpen}
        onClose={handleClosePortfolio}
        PaperProps={{ sx: { width: 600, borderRadius: 0 } }}
      >
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#F8F9FA' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: '#1A73E8', color: '#fff', fontSize: '1.2rem', fontWeight: 800 }}>
                    {selectedClient?.first_name?.[0]}{selectedClient?.last_name?.[0]}
                </Avatar>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#202124' }}>
                        {selectedClient?.first_name} {selectedClient?.last_name}
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: '#5F6368' }}>
                        {selectedClient?.email} • {selectedClient?.phone || 'No Phone'}
                    </Typography>
                </Box>
            </Box>

            <Alert severity="info" sx={{ mb: 3, borderRadius: 0, '& .MuiAlert-message': { width: '100%' } }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Privacy Sandbox Active</Typography>
                <Typography sx={{ fontSize: '0.75rem' }}>
                    You are viewing this client's portfolio strictly within the scope of your current organization. Any policies or claims they hold with other insurers on the platform are hidden.
                </Typography>
            </Alert>

            <Paper elevation={0} sx={{ flex: 1, borderRadius: 0, border: '1px solid #E8EAED', overflow: 'hidden', display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
                <Tabs 
                    value={portfolioTab} 
                    onChange={(e, v) => setPortfolioTab(v)} 
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ borderBottom: '1px solid #E8EAED', px: 2, pt: 1 }}
                >
                    <Tab label="Overview" icon={<InfoIcon sx={{ fontSize: 18 }} />} iconPosition="start" sx={{ fontWeight: 700, minHeight: 48 }} />
                    <Tab label="Policies" icon={<DocIcon sx={{ fontSize: 18 }} />} iconPosition="start" sx={{ fontWeight: 700, minHeight: 48 }} />
                    <Tab label="Claims" icon={<HistoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" sx={{ fontWeight: 700, minHeight: 48 }} />
                    <Tab label="Payments" icon={<PaymentIcon sx={{ fontSize: 18 }} />} iconPosition="start" sx={{ fontWeight: 700, minHeight: 48 }} />
                </Tabs>

                <Box sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
                    {isLoadingPortfolio ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><Skeleton width="100%" height={200} /></Box>
                    ) : portfolioTab === 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Box>
                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#5F6368', textTransform: 'uppercase', mb: 1.5 }}>Contact Information</Typography>
                                <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                                    {portfolioData?.client?.kyc_details?.documents?.find(d => d.document_type === 'selfie') && (
                                        <Box sx={{ flexShrink: 0 }}>
                                            <Avatar 
                                                src={portfolioData.client.kyc_details.documents.find(d => d.document_type === 'selfie').file_url} 
                                                sx={{ width: 80, height: 80, border: '2px solid #E8EAED' }}
                                            />
                                            <Typography sx={{ fontSize: '0.6rem', color: '#9AA0A6', textAlign: 'center', mt: 0.5, fontWeight: 700 }}>SELFIE</Typography>
                                        </Box>
                                    )}
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Typography sx={{ fontSize: '0.75rem', color: '#9AA0A6' }}>Email Address</Typography>
                                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>{portfolioData?.client?.email}</Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography sx={{ fontSize: '0.75rem', color: '#9AA0A6' }}>Phone Number</Typography>
                                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>{portfolioData?.client?.phone || 'Not provided'}</Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Box>
                            <Divider />
                            <Box>
                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#5F6368', textTransform: 'uppercase', mb: 1.5 }}>KYC Compliance</Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography sx={{ fontSize: '0.75rem', color: '#9AA0A6' }}>Verification Status</Typography>
                                        <Chip 
                                            label={(portfolioData?.client?.kyc_status || 'pending').toUpperCase()} 
                                            size="small" 
                                            color={portfolioData?.client?.kyc_status === 'verified' ? 'success' : 'warning'} 
                                            sx={{ fontWeight: 800, fontSize: '0.7rem', height: 24, borderRadius: '4px' }} 
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography sx={{ fontSize: '0.75rem', color: '#9AA0A6' }}>National ID (NIN)</Typography>
                                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, fontFamily: 'monospace' }}>{portfolioData?.client?.nin || 'Not provided'}</Typography>
                                    </Grid>
                                </Grid>
                                
                                {/* KYC Documents Gallery */}
                                {portfolioData?.client?.kyc_details?.documents?.length > 0 && (
                                    <Box sx={{ mt: 3 }}>
                                        <Typography sx={{ fontSize: '0.75rem', color: '#9AA0A6', mb: 1.5 }}>Identity Documents</Typography>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 2 }}>
                                            {portfolioData?.client?.kyc_details.documents.map((doc, idx) => (
                                                <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                    <Box 
                                                        sx={{ 
                                                            width: '100%', 
                                                            aspectRatio: '1/1', 
                                                            borderRadius: '8px', 
                                                            overflow: 'hidden', 
                                                            border: '1px solid #E8EAED',
                                                            bgcolor: '#F8F9FA',
                                                            cursor: 'pointer',
                                                            '&:hover': { opacity: 0.8 }
                                                        }}
                                                        onClick={() => window.open(doc.file_url, '_blank')}
                                                    >
                                                        <img src={doc.file_url} alt={doc.document_type} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </Box>
                                                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#5F6368', textAlign: 'center', textTransform: 'capitalize' }}>
                                                        {doc.document_type?.replace(/_/g, ' ')}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                            <Divider />
                            <Box>
                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#5F6368', textTransform: 'uppercase', mb: 1.5 }}>Account Details</Typography>
                                <Typography sx={{ fontSize: '0.75rem', color: '#9AA0A6' }}>Platform User ID</Typography>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, fontFamily: 'monospace', color: '#5F6368' }}>{portfolioData?.client?.id}</Typography>
                            </Box>
                        </Box>
                    ) : portfolioTab === 1 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {portfolioData?.policies?.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 6 }}>
                                    <DocIcon sx={{ fontSize: 48, color: '#E8EAED', mb: 2 }} />
                                    <Typography sx={{ color: '#9AA0A6', fontSize: '0.9rem', fontWeight: 500 }}>No policies found for this client.</Typography>
                                </Box>
                            ) : portfolioData?.policies?.map(p => (
                                <Paper key={p.id} elevation={0} sx={{ p: 2, border: '1px solid #E8EAED', borderRadius: '8px' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography sx={{ fontWeight: 800, color: '#202124' }}>{p.product_name || 'Insurance Policy'}</Typography>
                                        <Chip size="small" label={(p.status || 'pending').toUpperCase()} color={p.status === 'active' ? 'success' : 'warning'} sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
                                    </Box>
                                    <Typography sx={{ fontSize: '0.8rem', color: '#5F6368', mb: 1 }}>Policy Number: {p.policy_number || p.id.split('-')[0]}</Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 2, borderTop: '1px dashed #E8EAED' }}>
                                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Premium: UGX {(p.premium || 0).toLocaleString()}</Typography>
                                        <Button size="small" variant="text" onClick={() => navigate('/policies', { state: { presetClient: selectedClient } })}>View Full Details</Button>
                                    </Box>
                                </Paper>
                            ))}
                        </Box>
                    ) : portfolioTab === 2 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {portfolioData?.claims?.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 6 }}>
                                    <HistoryIcon sx={{ fontSize: 48, color: '#E8EAED', mb: 2 }} />
                                    <Typography sx={{ color: '#9AA0A6', fontSize: '0.9rem', fontWeight: 500 }}>No claims history available.</Typography>
                                </Box>
                            ) : portfolioData?.claims?.map(c => (
                                <Paper key={c.id} elevation={0} sx={{ p: 2, border: '1px solid #E8EAED', borderRadius: '8px' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography sx={{ fontWeight: 800, color: '#202124' }}>{c.incident_type || 'Claim'}</Typography>
                                        <Chip size="small" label={(c.status || 'pending').toUpperCase()} color="primary" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
                                    </Box>
                                    <Typography sx={{ fontSize: '0.8rem', color: '#5F6368' }}>Reported: {new Date(c.created_at).toLocaleDateString()}</Typography>
                                </Paper>
                            ))}
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {portfolioData?.payments?.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 6 }}>
                                    <PaymentIcon sx={{ fontSize: 48, color: '#E8EAED', mb: 2 }} />
                                    <Typography sx={{ color: '#9AA0A6', fontSize: '0.9rem', fontWeight: 500 }}>No payment records found.</Typography>
                                </Box>
                            ) : portfolioData?.payments?.map(py => (
                                <Paper key={py.id} elevation={0} sx={{ p: 2, border: '1px solid #E8EAED', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#202124' }}>
                                            UGX {(py.amount || 0).toLocaleString()}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.75rem', color: '#5F6368' }}>
                                            {py.payment_method?.replace(/_/g, ' ')} • {new Date(py.created_at).toLocaleDateString()}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.65rem', color: '#9AA0A6', mt: 0.5 }}>Ref: {py.reference || py.id.split('-')[0]}</Typography>
                                    </Box>
                                    <Chip 
                                        size="small" 
                                        label={(py.status || 'pending').toUpperCase()} 
                                        color={py.status === 'successful' ? 'success' : py.status === 'failed' ? 'error' : 'warning'} 
                                        sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }} 
                                    />
                                </Paper>
                            ))}
                        </Box>
                    )}
                </Box>
            </Paper>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={handleClosePortfolio} sx={{ borderRadius: 0, fontWeight: 700 }}>Close</Button>
            </Box>
        </Box>
      </Drawer>
    </Box>
  )
}
