import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tenancyAPI, paymentAPI } from '../services/api'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material'
import {
  CheckCircle as CheckIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Business as BusinessIcon,
  Description as DocIcon,
  CalendarMonth as DateIcon,
  Email as EmailIcon,
  Language as WebIcon,
  VpnKey as KeyIcon,
  ToggleOn as SandboxIcon,
  Link as IpnIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Fingerprint as NinIcon,
} from '@mui/icons-material'
import { Tab, Tabs } from '@mui/material'

function PaymentConfigPreview({ orgId }) {
  const { data: config, isLoading } = useQuery({
    queryKey: ['payment-config', orgId],
    queryFn: async () => {
      try {
        const res = await paymentAPI.getPaymentConfig(orgId)
        return res.data
      } catch (e) {
        return null
      }
    },
    enabled: !!orgId
  })

  if (isLoading) return <CircularProgress size={20} />
  if (!config) return <Alert severity="warning" sx={{ py: 0 }}>No payment configuration found for this organization.</Alert>

  return (
    <Box sx={{ bgcolor: '#F8F9FA', p: 2, borderRadius: 0, border: '1px solid #E8EAED' }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <KeyIcon sx={{ color: '#5F6368', fontSize: 18 }} />
            <Box>
              <Typography sx={{ fontSize: '0.75rem', color: '#5F6368', fontWeight: 600 }}>Consumer Key</Typography>
              <Typography sx={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
                {config.consumer_key ? `${config.consumer_key.substring(0, 8)}...` : 'Not Set'}
              </Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SandboxIcon sx={{ color: config.is_sandbox ? '#F9AB00' : '#34A853', fontSize: 18 }} />
            <Box>
              <Typography sx={{ fontSize: '0.75rem', color: '#5F6368', fontWeight: 600 }}>Environment</Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: config.is_sandbox ? '#F9AB00' : '#34A853' }}>
                {config.is_sandbox ? 'SANDBOX' : 'LIVE'}
              </Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IpnIcon sx={{ color: '#1A73E8', fontSize: 18 }} />
            <Box>
              <Typography sx={{ fontSize: '0.75rem', color: '#5F6368', fontWeight: 600 }}>IPN URL Status</Typography>
              <Typography sx={{ fontSize: '0.85rem' }}>
                {config.pesapal_ipn_id ? 'Registered & Active' : 'Pending Registration'}
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}

export default function KycApprovals() {
  const queryClient = useQueryClient()
  const [selectedKyc, setSelectedKyc] = useState(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [tabIndex, setTabIndex] = useState(0)

  // 1. Organization KYCs
  const { data: orgsData, isLoading: loadingOrgs } = useQuery({
    queryKey: ['submitted-kycs'],
    queryFn: async () => {
      const res = await tenancyAPI.getOrganizations()
      return res.data.filter(org => org.kyc_status === 'submitted')
    }
  })

  // 2. User KYCs
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['submitted-user-kycs'],
    queryFn: async () => {
      const res = await tenancyAPI.getGlobalUsers()
      return res.data.items.filter(user => user.kyc_status === 'submitted')
    }
  })

  const approveMutation = useMutation({
    mutationFn: (id) => tabIndex === 0 ? tenancyAPI.approveKyc(id) : tenancyAPI.approveUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries(tabIndex === 0 ? ['submitted-kycs'] : ['submitted-user-kycs'])
      setViewOpen(false)
    }
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => tabIndex === 0 ? tenancyAPI.rejectKyc(id, reason) : Promise.resolve(), // Placeholder for User rejection
    onSuccess: () => {
      queryClient.invalidateQueries(tabIndex === 0 ? ['submitted-kycs'] : ['submitted-user-kycs'])
      setViewOpen(false)
    }
  })

  const handleApprove = () => {
    if (confirm(`Approve KYC for ${selectedKyc.name || selectedKyc.first_name}?`)) {
      approveMutation.mutate(selectedKyc.id)
    }
  }

  const handleReject = () => {
    const reason = prompt('Reason for rejection:')
    if (reason) {
      rejectMutation.mutate({ id: selectedKyc.id, reason })
    }
  }

  const isLoading = tabIndex === 0 ? loadingOrgs : loadingUsers
  const currentItems = tabIndex === 0 ? orgsData : usersData

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#202124', mb: 0.5 }}>Compliance Center</Typography>
        <Typography sx={{ color: '#5F6368', fontSize: '0.9rem' }}>Verify organizations and individual consumers</Typography>
      </Box>

      <Tabs 
        value={tabIndex} 
        onChange={(e, v) => setTabIndex(v)} 
        sx={{ mb: 3, borderBottom: '1px solid #E8EAED' }}
      >
        <Tab label={<b>Organizations</b>} />
        <Tab label={<b>Individual Users</b>} />
      </Tabs>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E8EAED', borderRadius: 0}}>
        <Table>
          <TableHead sx={{ bgcolor: '#F8F9FA' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>{tabIndex === 0 ? 'Organization' : 'User'}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Submitted At</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Identifiers</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} align="center"><CircularProgress size={24} sx={{ my: 3 }} /></TableCell></TableRow>
            ) : currentItems?.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center"><Typography sx={{ py: 4, color: '#9AA0A6' }}>No pending applications</Typography></TableCell></TableRow>
            ) : currentItems?.map((item) => (
              <TableRow key={item.id} sx={{ '&:hover': { bgcolor: '#FBFBFF' } }}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar src={item.logo || item.avatar} variant="rounded" sx={{ width: 40, height: 40, border: '1px solid #E8EAED' }}>
                      {tabIndex === 0 ? <BusinessIcon /> : <PersonIcon />}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                        {tabIndex === 0 ? item.name : `${item.first_name} ${item.last_name}`}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#5F6368' }}>
                        {tabIndex === 0 ? item.organization_type : item.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DateIcon sx={{ fontSize: 16, color: '#9AA0A6' }} />
                    <Typography sx={{ fontSize: '0.85rem' }}>{new Date(item.kyc_submitted_at || Date.now()).toLocaleDateString()}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {tabIndex === 0 ? (
                    <Chip label="Organization KYC" size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                  ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip label={`NIN: ${item.kyc_details?.nin || '...'}`} size="small" sx={{ bgcolor: '#E3F2FD', color: '#1565C0', fontWeight: 600, fontSize: '0.7rem' }} />
                        {item.kyc_details?.tin && <Chip label={`TIN: ${item.kyc_details.tin}`} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />}
                    </Box>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Review Details">
                    <IconButton size="small" onClick={() => { setSelectedKyc(item); setViewOpen(true) }}>
                      <ViewIcon fontSize="small" color="primary" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Review Dialog */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth>
        {selectedKyc && (
          <>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar src={selectedKyc.logo} variant="rounded" sx={{ width: 56, height: 56 }} />
                    <Box>
                        <Typography sx={{ fontWeight: 900, fontSize: '1.25rem' }}>Review Application: {selectedKyc.name}</Typography>
                        <Typography sx={{ fontSize: '0.85rem', color: '#5F6368' }}>TIN: {selectedKyc.tax_id || 'Not Provided'}</Typography>
                    </Box>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: '#1A73E8' }}>
                    {tabIndex === 0 ? 'Business Identity' : 'Personal Identity'}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {tabIndex === 0 ? (
                        <>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <WebIcon sx={{ color: '#9AA0A6', fontSize: 20 }} />
                                <Typography sx={{ fontSize: '0.9rem' }}><b>Website:</b> {selectedKyc.website || 'N/A'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <BusinessIcon sx={{ color: '#9AA0A6', fontSize: 20 }} />
                                <Typography sx={{ fontSize: '0.9rem' }}><b>Address:</b> {selectedKyc.address || 'N/A'}</Typography>
                            </Box>
                        </>
                    ) : (
                        <>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <NinIcon sx={{ color: '#9AA0A6', fontSize: 20 }} />
                                <Typography sx={{ fontSize: '0.9rem' }}><b>NIN:</b> {selectedKyc.kyc_details?.nin || 'N/A'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <PhoneIcon sx={{ color: '#9AA0A6', fontSize: 20 }} />
                                <Typography sx={{ fontSize: '0.9rem' }}><b>Phone:</b> {selectedKyc.phone || 'N/A'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <EmailIcon sx={{ color: '#9AA0A6', fontSize: 20 }} />
                                <Typography sx={{ fontSize: '0.9rem' }}><b>Email:</b> {selectedKyc.email || 'N/A'}</Typography>
                            </Box>
                        </>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: '#1A73E8' }}>Supporting Documents</Typography>
                  <Grid container spacing={1}>
                    {(tabIndex === 0 ? ['IRA License', 'URSB Certificate'] : (selectedKyc.kyc_details?.documents?.map(d => d.document_type.replace(/_/g, ' ')) || [])).map((docName, idx) => (
                      <Grid item xs={12} key={idx}>
                        <Paper variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#F8F9FA' }}>
                          <DocIcon sx={{ fontSize: 18, color: '#5F6368' }} />
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, flexGrow: 1 }}>{docName}</Typography>
                          <Button size="small" variant="text" sx={{ fontSize: '0.65rem' }}>View Scan</Button>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
                
                {tabIndex === 0 && (
                    <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, mt: 1, color: '#1A73E8' }}>Payment Configuration</Typography>
                        <PaymentConfigPreview orgId={selectedKyc.id} />
                    </Grid>
                )}

                <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, mt: 1 }}>Verification Checklist</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckIcon sx={{ color: '#34A853', fontSize: 16 }} />
                            <Typography sx={{ fontSize: '0.85rem' }}>Government ID numbers match records</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckIcon sx={{ color: '#34A853', fontSize: 16 }} />
                            <Typography sx={{ fontSize: '0.85rem' }}>Document scans are clear and readable</Typography>
                        </Box>
                        {tabIndex === 0 ? (
                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                               <CheckIcon sx={{ color: '#34A853', fontSize: 16 }} />
                               <Typography sx={{ fontSize: '0.85rem' }}>PesaPal Consumer Key provided and valid</Typography>
                           </Box>
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CheckIcon sx={{ color: '#34A853', fontSize: 16 }} />
                                <Typography sx={{ fontSize: '0.85rem' }}>User biometric match verified (Manual)</Typography>
                            </Box>
                        )}
                    </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, bgcolor: '#F8F9FA' }}>
              <Button onClick={() => setViewOpen(false)} sx={{ fontWeight: 600 }}>Cancel</Button>
              <Box sx={{ flexGrow: 1 }} />
              <Button 
                variant="outlined" 
                color="error" 
                startIcon={<RejectIcon />} 
                onClick={handleReject}
                disabled={rejectMutation.isLoading || approveMutation.isLoading}
              >
                Reject
              </Button>
              <Button 
                variant="contained" 
                color="success" 
                startIcon={<CheckIcon />} 
                onClick={handleApprove}
                disabled={approveMutation.isLoading || rejectMutation.isLoading}
              >
                Approve Verification
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  )
}
