import React, { useState } from 'react'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Drawer, TextField, Chip, Avatar, Skeleton,
  IconButton, Tooltip, Alert, InputAdornment, Grid,
  Tabs, Tab, Divider
} from '@mui/material'
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
  LocationOn as AddressIcon
} from '@mui/icons-material'
import { Menu, MenuItem } from '@mui/material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { tenancyAPI } from '../services/api'
import { useNavigate } from 'react-router-dom'

export default function Clients() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [tabValue, setTabValue] = useState(0)
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

  // Action Menu State
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)

  const handleMenuOpen = (event, client) => {
    setAnchorEl(event.currentTarget)
    setSelectedClient(client)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
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
    queryKey: ['my-clients', user?.id],
    queryFn: async () => {
      const res = await tenancyAPI.getMyClients()
      return res.data.items || []
    },
    enabled: !!user?.id
  })

  const registerClientMutation = useMutation({
    mutationFn: async (newData) => {
      const { kyc_data, ...clientData } = newData
      return await tenancyAPI.registerClient(clientData, kyc_data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-clients', user?.id])
      setSuccess(`Client ${form.first_name} registered successfully! They can now login with the initial password.`)
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
        national_id_front: null,
        national_id_back: null,
        drivers_permit_front: null,
        drivers_permit_back: null,
        passport_bio: null
      })
      setTabValue(0)
      setError('')
      setTimeout(() => setSuccess(''), 5000)
    },
    onError: (err) => {
      setError(err.response?.data?.detail || 'Failed to register client.')
    }
  })

  const handleRegister = async () => {
    setError('')
    if (!form.email || !form.first_name || !form.last_name || !form.phone) {
      setError('Please fill out all required fields.')
      return
    }
    if (tabValue === 1 && (!form.nin || !form.address)) {
      setError('Please fill out required KYC fields (NIN and Address).')
      return
    }
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
              ) : filteredClients.map((c) => (
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
                    <Typography sx={{ fontSize: '0.82rem', color: '#5F6368' }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Tooltip title="Buy Policy">
                            <IconButton size="small" color="primary" onClick={() => navigate('/policies', { state: { presetClient: c } })}>
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

          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
            <Tab label="Basic Info" />
            <Tab label="KYC Details" />
          </Tabs>

          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {tabValue === 0 && (
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
                    disabled
                    value={form.password}
                    helperText="Client will be required to change this upon first login."
                  />
                </Grid>
              </Grid>
            )}

            {tabValue === 1 && (
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
                          <Box>
                            <DocIcon sx={{ fontSize: 32, color: '#16A34A' }} />
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
                          <Box>
                            <DocIcon sx={{ fontSize: 32, color: '#16A34A' }} />
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
                          <Box>
                            <DocIcon sx={{ fontSize: 32, color: '#16A34A' }} />
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
                          <Box>
                            <DocIcon sx={{ fontSize: 32, color: '#16A34A' }} />
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
                      <Box>
                        <DocIcon sx={{ fontSize: 32, color: '#16A34A' }} />
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

          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #E8EAED', display: 'flex', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={() => setOpen(false)} sx={{ fontWeight: 600, color: '#5F6368' }}>Cancel</Button>
              {tabValue === 1 && (
                <Button onClick={() => setTabValue(0)} sx={{ fontWeight: 600, color: '#5F6368' }}>Back</Button>
              )}
            </Box>
            <Button
              variant="contained"
              onClick={() => tabValue === 0 ? setTabValue(1) : handleRegister()}
              disabled={registerClientMutation.isLoading}
              sx={{ borderRadius: 0, fontWeight: 700, px: 4 }}
            >
              {tabValue === 0 ? 'Next: KYC Details' : (registerClientMutation.isLoading ? 'Registering...' : 'Register Client')}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{ sx: { borderRadius: 0, minWidth: 200, mt: 1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #E8EAED' } }}
      >
        <MenuItem onClick={handleMenuClose} sx={{ py: 1.2, gap: 1.5, fontSize: '0.85rem' }}>
          <ResetIcon sx={{ fontSize: 18, color: '#5F6368' }} /> Reset Password
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ py: 1.2, gap: 1.5, fontSize: '0.85rem' }}>
          <HistoryIcon sx={{ fontSize: 18, color: '#5F6368' }} /> view Activity Log
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ py: 1.2, gap: 1.5, fontSize: '0.85rem' }}>
          <InviteIcon sx={{ fontSize: 18, color: '#5F6368' }} /> Resend Invitation
        </MenuItem>
      </Menu>
    </Box>
  )
}
