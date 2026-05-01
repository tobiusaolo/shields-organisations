import React, { useState, useEffect } from 'react'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, Chip, Avatar, Skeleton,
  IconButton, Tooltip, InputAdornment, Menu, MenuItem, ListItemIcon, ListItemText,
  TablePagination, Drawer, Grid, Divider, Stack, Alert, Stepper, Step, StepLabel, LinearProgress
} from '@mui/material'
import Swal from 'sweetalert2'
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  MoreVert as MoreIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Description as DocIcon,
  Fingerprint as NinIcon,
  LocationOn as AddressIcon,
  Add as AddIcon,
  VerifiedUser as VerifiedIcon
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { tenancyAPI } from '../services/api'

export default function MyEnrolledClients() {
  const { organizationId } = useAuth()
  const queryClient = useQueryClient()

  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    setPage(0)
  }, [searchTerm])

  // Action Menu State
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)

  // Drawer State
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [viewClient, setViewClient] = useState(null)
  
  // Registration State
  const [open, setOpen] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', password: 'ClientInit123!',
    nin: '', tin: '', address: '', documents: []
  })
  const [uploadedDocs, setUploadedDocs] = useState({
    national_id_front: null, national_id_back: null, drivers_permit_front: null,
    drivers_permit_back: null, selfie: null, passport_bio: null
  })
  const [error, setError] = useState('')

  const handleMenuOpen = (event, client) => {
    setAnchorEl(event.currentTarget)
    setSelectedClient(client)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['my-enrolled-clients'],
    queryFn: async () => {
      const res = await tenancyAPI.getMyClients()
      return res.data.items || []
    }
  })

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await tenancyAPI.updateClient(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-enrolled-clients'])
      Swal.fire('Updated!', 'Client details have been updated.', 'success')
    },
    onError: (err) => {
      Swal.fire('Error', err.response?.data?.detail || 'Failed to update client', 'error')
    }
  })

  const deleteClientMutation = useMutation({
    mutationFn: async (id) => {
      return await tenancyAPI.deleteClient(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-enrolled-clients'])
      Swal.fire('Deleted!', 'Client has been removed from your network.', 'success')
    },
    onError: (err) => {
      Swal.fire('Error', err.response?.data?.detail || 'Failed to delete client', 'error')
    }
  })

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
      queryClient.invalidateQueries(['my-enrolled-clients'])
      setOpen(false)
      setForm({
        first_name: '', last_name: '', email: '', phone: '', password: 'ClientInit123!',
        nin: '', tin: '', address: '', documents: []
      })
      setUploadedDocs({
        selfie: null, national_id_front: null, national_id_back: null,
        drivers_permit_front: null, drivers_permit_back: null, passport_bio: null
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

  const handleFileUpload = (docType, file) => {
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedDocs(prev => ({ ...prev, [docType]: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileRemove = (docType) => {
    setUploadedDocs(prev => ({ ...prev, [docType]: null }))
  }

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
      didOpen: () => { Swal.showLoading() }
    })

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

  const handleEdit = () => {
    handleMenuClose()
    Swal.fire({
      title: 'Edit Client Details',
      html: `
        <input id="swal-fname" class="swal2-input" placeholder="First Name" value="${selectedClient.first_name}">
        <input id="swal-lname" class="swal2-input" placeholder="Last Name" value="${selectedClient.last_name}">
        <input id="swal-phone" class="swal2-input" placeholder="Phone" value="${selectedClient.phone || ''}">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Save Changes',
      preConfirm: () => {
        return {
          first_name: document.getElementById('swal-fname').value,
          last_name: document.getElementById('swal-lname').value,
          phone: document.getElementById('swal-phone').value
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        updateClientMutation.mutate({ id: selectedClient.id, data: result.value })
      }
    })
  }

  const handleViewDetails = () => {
    setViewClient(selectedClient)
    setDetailsOpen(true)
    handleMenuClose()
  }

  const handleDelete = () => {
    handleMenuClose()
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this! This removes the client completely.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteClientMutation.mutate(selectedClient.id)
      }
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
            My Network
          </Typography>
          <Typography sx={{ color: '#5F6368', fontSize: '0.95rem' }}>
            Clients that you have personally registered and onboarded.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => setOpen(true)}
            sx={{ borderRadius: 0, fontWeight: 700, px: 3, py: 1.2, boxShadow: 'none' }}
          >
            Register New Client
          </Button>
        </Box>
      </Box>

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
                <TableCell sx={{ color: '#5F6368', fontWeight: 700 }}>Onboarding Date</TableCell>
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
                    <TableCell><Skeleton width="100px" /></TableCell>
                    <TableCell align="right"><Skeleton width="30px" sx={{ ml: 'auto' }} /></TableCell>
                  </TableRow>
                ))
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: '#9AA0A6' }}>
                      <PersonIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                      <Typography sx={{ fontWeight: 500 }}>No clients registered in your personal network yet.</Typography>
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
                        color={c.kyc_status === 'verified' || c.kyc_status === 'approved' ? 'success' : 'warning'}
                        variant={c.kyc_status === 'verified' || c.kyc_status === 'approved' ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 800, fontSize: '0.65rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '0.85rem', color: '#5F6368', fontWeight: 600 }}>
                        {new Date(c.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Manage Client">
                      <IconButton onClick={(e) => handleMenuOpen(e, c)} size="small">
                        <MoreIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
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

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{ sx: { borderRadius: 0, border: '1px solid #000', boxShadow: '4px 4px 0px rgba(0,0,0,0.1)', minWidth: 180 } }}
      >
        <MenuItem onClick={handleViewDetails} sx={{ py: 1.25 }}>
          <ListItemIcon><ViewIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="View Details" primaryTypographyProps={{ fontWeight: 700 }} />
        </MenuItem>
        <MenuItem onClick={handleEdit} sx={{ py: 1.25 }}>
          <ListItemIcon><EditIcon fontSize="small" color="primary" /></ListItemIcon>
          <ListItemText primary="Edit Details" primaryTypographyProps={{ fontWeight: 700, color: '#1A73E8' }} />
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ py: 1.25 }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText primary="Delete Client" primaryTypographyProps={{ fontWeight: 700, color: '#DC2626' }} />
        </MenuItem>
      </Menu>

      {/* Client Details Drawer */}
      <Drawer
        anchor="right"
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        PaperProps={{
          sx: { width: { xs: '100%', md: 600, lg: 650 }, bgcolor: '#F8F9FA', borderRadius: 0 }
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ p: 3, bgcolor: '#fff', borderBottom: '1px solid #E8EAED' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#202124', letterSpacing: '-0.02em' }}>
                Client Details
              </Typography>
              <IconButton onClick={() => setDetailsOpen(false)} size="small" sx={{ bgcolor: '#F8F9FA', '&:hover': { bgcolor: '#E8EAED' } }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>

            <Stack direction="row" spacing={3} alignItems="center">
              <Avatar sx={{ 
                width: 72, height: 72, borderRadius: 4, 
                bgcolor: '#E8F0FE', color: '#1A73E8', fontSize: '1.8rem', fontWeight: 800
              }}>
                {viewClient?.first_name?.[0]}{viewClient?.last_name?.[0]}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#202124', mb: 0.5 }}>
                  {viewClient?.first_name} {viewClient?.last_name}
                </Typography>
                <Typography sx={{ color: '#5F6368', fontSize: '0.85rem' }}>
                  {viewClient?.email} • {viewClient?.phone || 'No phone'}
                </Typography>
                <Chip 
                    label={(viewClient?.kyc_status || 'pending').toUpperCase()} 
                    size="small"
                    color={viewClient?.kyc_status === 'verified' || viewClient?.kyc_status === 'approved' ? 'success' : 'warning'}
                    variant="outlined"
                    sx={{ fontWeight: 800, fontSize: '0.65rem', mt: 1, borderRadius: 1 }}
                />
              </Box>
            </Stack>
          </Box>

          {/* Body */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 4 }}>
            <Stack spacing={4}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#70757A', mb: 2, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Contact Information
                </Typography>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E8EAED', bgcolor: '#fff' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <EmailIcon sx={{ color: '#9AA0A6', fontSize: 20 }} />
                        <Box>
                          <Typography variant="caption" sx={{ color: '#9AA0A6', display: 'block' }}>Email Address</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{viewClient?.email}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <PhoneIcon sx={{ color: '#9AA0A6', fontSize: 20 }} />
                        <Box>
                          <Typography variant="caption" sx={{ color: '#9AA0A6', display: 'block' }}>Phone Number</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{viewClient?.phone || 'N/A'}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <AddressIcon sx={{ color: '#9AA0A6', fontSize: 20 }} />
                        <Box>
                          <Typography variant="caption" sx={{ color: '#9AA0A6', display: 'block' }}>Physical Address</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{viewClient?.kyc_details?.address || 'N/A'}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#70757A', mb: 2, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Identity Data
                </Typography>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E8EAED', bgcolor: '#fff' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <NinIcon sx={{ color: '#9AA0A6', fontSize: 20 }} />
                        <Box>
                          <Typography variant="caption" sx={{ color: '#9AA0A6', display: 'block' }}>National ID (NIN)</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{viewClient?.kyc_details?.nin || 'N/A'}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <DocIcon sx={{ color: '#9AA0A6', fontSize: 20 }} />
                        <Box>
                          <Typography variant="caption" sx={{ color: '#9AA0A6', display: 'block' }}>Tax ID (TIN)</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{viewClient?.kyc_details?.tin || 'N/A'}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#70757A', mb: 2, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>
                  KYC Documents
                </Typography>
                {viewClient?.kyc_details?.documents?.length > 0 ? (
                  <Grid container spacing={2}>
                    {viewClient.kyc_details.documents.map((doc, idx) => (
                      <Grid item xs={6} key={idx}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #E8EAED', textAlign: 'center' }}>
                          {doc.file_url ? (
                            <img src={doc.file_url} alt={doc.document_type} style={{ width: '100%', maxHeight: '100px', objectFit: 'contain', borderRadius: '4px', marginBottom: '8px' }} />
                          ) : (
                            <DocIcon sx={{ fontSize: 40, color: '#DADCE0', mb: 1 }} />
                          )}
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#5F6368', textTransform: 'capitalize' }}>
                            {doc.document_type.replace(/_/g, ' ')}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E8EAED', bgcolor: '#F8F9FA', textAlign: 'center' }}>
                    <DocIcon sx={{ fontSize: 32, color: '#DADCE0', mb: 1 }} />
                    <Typography sx={{ fontSize: '0.85rem', color: '#5F6368' }}>No documents uploaded during registration</Typography>
                  </Paper>
                )}
              </Box>

            </Stack>
          </Box>
          
          <Box sx={{ p: 3, bgcolor: '#fff', borderTop: '1px solid #E8EAED' }}>
            <Button 
              fullWidth 
              variant="contained" 
              onClick={() => setDetailsOpen(false)}
              sx={{ borderRadius: 0, fontWeight: 700, py: 1.5, bgcolor: '#1A73E8', boxShadow: 'none' }}
            >
              Close
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Register Client Drawer */}
      <Drawer anchor="right" open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { width: 600, borderRadius: 0 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#fff' }}>
          <Box sx={{ p: 3, borderBottom: '1px solid #E8EAED', bgcolor: '#F8F9FA' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#202124' }}>Register New Client</Typography>
              <IconButton onClick={() => setOpen(false)} size="small"><CloseIcon /></IconButton>
            </Box>
            <Stepper activeStep={activeStep} alternativeLabel>
              <Step><StepLabel>Basic Info</StepLabel></Step>
              <Step><StepLabel>KYC & Documents</StepLabel></Step>
            </Stepper>
            {registerClientMutation.isPending && <LinearProgress sx={{ mt: 2 }} />}
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', p: 4 }}>
            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 0 }}>{error}</Alert>}

            {activeStep === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField label="First Name" required fullWidth value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Last Name" required fullWidth value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Email Address" type="email" required fullWidth value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Phone Number" required fullWidth value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </Grid>
              </Grid>
            )}

            {activeStep === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField label="National ID (NIN)" required fullWidth value={form.nin} onChange={(e) => setForm({ ...form, nin: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Tax ID (TIN)" fullWidth value={form.tin} onChange={(e) => setForm({ ...form, tin: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Physical Address" required fullWidth multiline rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </Grid>

                {/* National ID */}
                <Grid item xs={12}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#5F6368', mb: 1 }}>National ID Card</Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Box
                        sx={{ border: '2px dashed #E8EAED', p: 2, textAlign: 'center', cursor: 'pointer', bgcolor: uploadedDocs.national_id_front ? '#F0FDF4' : '#FAFAFA' }}
                        onClick={() => document.getElementById('national_id_front').click()}
                      >
                        {uploadedDocs.national_id_front ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <img src={uploadedDocs.national_id_front} alt="Front" style={{ width: '100%', maxHeight: '80px', objectFit: 'contain', marginBottom: '8px' }} />
                            <Typography sx={{ fontSize: '0.75rem', color: '#16A34A', mt: 1 }}>Front Uploaded</Typography>
                            <Button size="small" onClick={(e) => { e.stopPropagation(); handleFileRemove('national_id_front') }}>Remove</Button>
                          </Box>
                        ) : (
                          <Box><DocIcon sx={{ fontSize: 32, color: '#9AA0A6' }} /><Typography sx={{ fontSize: '0.75rem', color: '#5F6368', mt: 1 }}>Upload Front</Typography></Box>
                        )}
                        <input type="file" id="national_id_front" hidden accept="image/*" onChange={(e) => handleFileUpload('national_id_front', e.target.files[0])} />
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box
                        sx={{ border: '2px dashed #E8EAED', p: 2, textAlign: 'center', cursor: 'pointer', bgcolor: uploadedDocs.national_id_back ? '#F0FDF4' : '#FAFAFA' }}
                        onClick={() => document.getElementById('national_id_back').click()}
                      >
                        {uploadedDocs.national_id_back ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <img src={uploadedDocs.national_id_back} alt="Back" style={{ width: '100%', maxHeight: '80px', objectFit: 'contain', marginBottom: '8px' }} />
                            <Typography sx={{ fontSize: '0.75rem', color: '#16A34A', mt: 1 }}>Back Uploaded</Typography>
                            <Button size="small" onClick={(e) => { e.stopPropagation(); handleFileRemove('national_id_back') }}>Remove</Button>
                          </Box>
                        ) : (
                          <Box><DocIcon sx={{ fontSize: 32, color: '#9AA0A6' }} /><Typography sx={{ fontSize: '0.75rem', color: '#5F6368', mt: 1 }}>Upload Back</Typography></Box>
                        )}
                        <input type="file" id="national_id_back" hidden accept="image/*" onChange={(e) => handleFileUpload('national_id_back', e.target.files[0])} />
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Selfie */}
                <Grid item xs={12}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#5F6368', mb: 1 }}>Selfie (Photo of Face)</Typography>
                  <Box
                    sx={{ border: '2px dashed #E8EAED', p: 2, textAlign: 'center', cursor: 'pointer', bgcolor: uploadedDocs.selfie ? '#F0FDF4' : '#FAFAFA' }}
                    onClick={() => document.getElementById('selfie_input').click()}
                  >
                    {uploadedDocs.selfie ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Avatar src={uploadedDocs.selfie} sx={{ width: 80, height: 80, mb: 1, border: '2px solid #16A34A' }} />
                        <Typography sx={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 600 }}>Selfie Uploaded</Typography>
                        <Button size="small" onClick={(e) => { e.stopPropagation(); handleFileRemove('selfie') }}>Remove</Button>
                      </Box>
                    ) : (
                      <Box><PersonIcon sx={{ fontSize: 32, color: '#9AA0A6' }} /><Typography sx={{ fontSize: '0.75rem', color: '#5F6368', mt: 1 }}>Upload Selfie</Typography></Box>
                    )}
                    <input type="file" id="selfie_input" hidden accept="image/*" onChange={(e) => handleFileUpload('selfie', e.target.files[0])} />
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

          <Box sx={{ p: 2, borderTop: '1px solid #E8EAED', display: 'flex', justifyContent: 'space-between', bgcolor: '#fff' }}>
            <Button disabled={activeStep === 0 || registerClientMutation.isPending} onClick={() => setActiveStep(prev => prev - 1)} sx={{ fontWeight: 700 }}>Back</Button>
            {activeStep === 0 ? (
              <Button variant="contained" onClick={() => setActiveStep(prev => prev + 1)} sx={{ borderRadius: 0, fontWeight: 700 }}>Next Step</Button>
            ) : (
              <Button variant="contained" color="primary" onClick={handleRegister} disabled={registerClientMutation.isPending} sx={{ borderRadius: 0, fontWeight: 700 }}>Submit Registration</Button>
            )}
          </Box>
        </Box>
      </Drawer>
    </Box>
  )
}
