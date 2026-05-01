import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { claimAPI, formAPI, policyAPI } from '../services/api'
import { formatCurrency } from '../utils/formatters'
import {
  Box, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, 
  Button, TextField, InputAdornment, Pagination, 
  MenuItem, IconButton, Menu, Skeleton, Chip, 
  Tooltip, Divider, Grid, Card, CardContent, 
  Avatar, CircularProgress as Spinner, Alert, 
  Drawer, Stack, Tab, Tabs, FormControl, Select,
  TableContainer as MuiTableContainer,
  Table as MuiTable,
  TableHead as MuiTableHead,
  TableBody as MuiTableBody
} from '@mui/material'
import {
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as ClaimIcon,
  CheckCircle as ApprovedIcon,
  Schedule as PendingIcon,
  FindInPage as ReviewIcon,
  Cancel as RejectedIcon,
  Payment as PayoutIcon,
  AccountBalance as BankIcon,
  PhoneAndroid as MobileIcon,
  Send as SendIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Description as DocIcon,
  MonetizationOn as CommIcon,
  ContentPaste as FormIcon,
  FilterList as FilterIcon
} from '@mui/icons-material'

const STATUS_CONFIG = {
  reported: { color: '#E37400', bg: '#FEF3E2', dot: '#F9AB00', label: 'Reported' },
  under_review: { color: '#1A73E8', bg: '#E8F0FE', dot: '#4A90F7', label: 'Under Review' },
  documents_pending: { color: '#F9AB00', bg: '#FEF7E0', dot: '#F9AB00', label: 'Docs Pending' },
  assessed: { color: '#7B61FF', bg: '#F3EDFF', dot: '#7B61FF', label: 'Assessed' },
  approved: { color: '#1E8E3E', bg: '#E6F4EA', dot: '#34A853', label: 'Approved' },
  paid: { color: '#1E8E3E', bg: '#E6F4EA', dot: '#34A853', label: 'Paid' },
  rejected: { color: '#D93025', bg: '#FCE8E6', dot: '#EA4335', label: 'Rejected' },
  closed: { color: '#5F6368', bg: '#F1F3F4', dot: '#9AA0A6', label: 'Closed' }
}

export default function Claims() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const organizationId = user?.organization_id

  const [page, setPage] = useState(1)
  const rowsPerPage = 10
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Menu & Drawer State
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedClaim, setSelectedClaim] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  
  // Payout State
  const [payoutModalOpen, setPayoutModalOpen] = useState(false)
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [payoutForm, setPayoutForm] = useState({
    payout_method: 'mobile_money',
    payout_phone_number: '',
    payout_bank_name: '',
    payout_account_name: '',
    payout_account_number: '',
  })

  // Form Data State
  const [claimForms, setClaimForms] = useState([])
  const [formsLoading, setFormsLoading] = useState(false)

  const { data, isLoading: loading } = useQuery({
    queryKey: ['claims', organizationId, page, statusFilter, search],
    queryFn: async () => {
      const params = {
        skip: (page - 1) * rowsPerPage,
        limit: rowsPerPage,
      }
      if (statusFilter !== 'all') params.status = statusFilter
      const res = await claimAPI.getClaims(organizationId, params)
      return res.data
    },
    enabled: !!organizationId
  })

  useEffect(() => {
    if (selectedClaim && drawerOpen) {
      fetchClaimForms()
    }
  }, [selectedClaim, drawerOpen])

  const fetchClaimForms = async () => {
    if (!selectedClaim?.product_template_id) return
    setFormsLoading(true)
    try {
      // Assuming claims also use product templates or specific claim forms
      const res = await formAPI.getTemplateForms(organizationId, selectedClaim.product_template_id)
      setClaimForms(res.data || [])
    } catch (err) {
      console.error("Error fetching claim forms:", err)
      setClaimForms([])
    } finally {
      setFormsLoading(false)
    }
  }

  const paginated = data?.items || []
  const totalItems = data?.total || 0

  const handleOpenDrawer = (claim) => {
    setSelectedClaim(claim)
    setDrawerOpen(true)
    setActiveTab(0)
    setAnchorEl(null)
  }

  const handleOpenPayout = () => {
    setPayoutForm({
      payout_method: selectedClaim.payout_method || 'mobile_money',
      payout_phone_number: selectedClaim.payout_phone_number || '',
      payout_bank_name: selectedClaim.payout_bank_name || '',
      payout_account_name: selectedClaim.payout_account_name || '',
      payout_account_number: selectedClaim.payout_account_number || '',
    })
    setPayoutModalOpen(true)
    setAnchorEl(null)
  }

  const renderValue = (val) => {
    if (!val) return 'Not provided';
    if (Array.isArray(val)) {
      if (val.length === 0) return 'No entries';
      const keys = Object.keys(val[0] || {});
      return (
        <MuiTableContainer component={Paper} elevation={0} sx={{ border: '1px solid #F1F3F4', mt: 1, borderRadius: 1 }}>
          <MuiTable size="small">
            <MuiTableHead sx={{ bgcolor: '#F8F9FA' }}>
              <TableRow>
                {keys.map(k => <TableCell key={k} sx={{ py: 0.5, fontSize: '0.65rem', fontWeight: 800, color: '#70757A' }}>{k.toUpperCase()}</TableCell>)}
              </TableRow>
            </MuiTableHead>
            <MuiTableBody>
              {val.map((row, i) => (
                <TableRow key={i}>
                  {keys.map(k => <TableCell key={k} sx={{ py: 0.5, fontSize: '0.7rem' }}>{String(row[k] || '-')}</TableCell>)}
                </TableRow>
              ))}
            </MuiTableBody>
          </MuiTable>
        </MuiTableContainer>
      );
    }
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#F8F9FE', minHeight: '100vh' }}>
      {/* Header Section */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#1A237E', mb: 0.5 }}>Claim Ledger</Typography>
          <Typography variant="body2" sx={{ color: '#546E7A', fontWeight: 500 }}>
            Modern administrative oversight of organizational claims and payout distribution.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<DownloadIcon />} sx={{ borderRadius: 0, fontWeight: 700, borderColor: '#E0E0E0', color: '#546E7A' }}>
            Export Report
          </Button>
          <Button variant="contained" startIcon={<PayoutIcon />} sx={{ borderRadius: 0, bgcolor: '#1A237E', fontWeight: 700, px: 3 }}>
            Reconciliation
          </Button>
        </Stack>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Total Claims', value: totalItems, color: '#1A237E', icon: <ClaimIcon /> },
          { label: 'Pending Review', value: paginated.filter(c => c.status === 'reported').length, color: '#E37400', icon: <PendingIcon /> },
          { label: 'Approved Claims', value: paginated.filter(c => c.status === 'approved').length, color: '#2E7D32', icon: <ApprovedIcon /> },
          { label: 'Total Payouts (UGX)', value: paginated.reduce((acc, c) => acc + (parseFloat(c.estimated_amount) || 0), 0).toLocaleString(), color: '#1A237E', icon: <CommIcon />, isCurrency: true },
        ].map((item, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ borderRadius: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #E3F2FD' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#90A4AE', textTransform: 'uppercase' }}>{item.label}</Typography>
                  <Box sx={{ color: item.color, opacity: 0.8 }}>{item.icon}</Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#263238' }}>{item.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Table Controls */}
      <Card sx={{ borderRadius: 0, mb: 3, boxShadow: 'none', border: '1px solid #E8EAED' }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField 
            placeholder="Search by claim ID, claimant or policy..." 
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, bgcolor: '#fff' } }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#90A4AE' }} /></InputAdornment>
            }}
          />
          <IconButton sx={{ bgcolor: '#F5F5F5', borderRadius: 0 }}>
            <FilterIcon />
          </IconButton>
        </Box>
      </Card>

      {/* Claims Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 0, boxShadow: '0 4px 25px rgba(0,0,0,0.06)', border: '1px solid #E8EAED' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F8F9FA' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: '#546E7A' }}>CLAIM ID</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#546E7A' }}>CLAIMANT / POLICY</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#546E7A' }}>CLAIM TYPE</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#546E7A' }}>AMOUNT (UGX)</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#546E7A' }}>STATUS</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#546E7A' }}>PAYOUT STATUS</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#546E7A' }} align="right">ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              [1,2,3,4,5].map(i => (
                <TableRow key={i}><TableCell colSpan={7}><Skeleton height={40} /></TableCell></TableRow>
              ))
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 10 }}>
                  <Typography sx={{ color: '#90A4AE', fontWeight: 600 }}>No claims found.</Typography>
                </TableCell>
              </TableRow>
            ) : paginated.map((claim) => {
              const status = STATUS_CONFIG[claim.status] || { label: claim.status, color: '#546E7A', bg: '#F5F5F5' }
              return (
                <TableRow key={claim.id} hover>
                  <TableCell sx={{ fontWeight: 700, color: '#1A73E8', fontFamily: 'monospace' }}>
                    {claim.id.split('-')[0].toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{claim.claimant_name || claim.reported_by_membership_id}</Typography>
                    <Typography variant="caption" sx={{ color: '#90A4AE' }}>{claim.policy_id}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={claim.claim_type?.replace(/_/g, ' ')} size="small" sx={{ fontWeight: 700, borderRadius: 0, textTransform: 'uppercase', fontSize: '0.65rem' }} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{parseFloat(claim.estimated_amount || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, borderRadius: '4px', bgcolor: status.bg }}>
                      <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: status.color }}>{status.label.toUpperCase()}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={claim.payout_status || 'Pending'} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={(e) => { setAnchorEl(e.currentTarget); setSelectedClaim(claim) }}>
                      <MoreIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { borderRadius: 0, border: '1px solid #E8EAED', width: 200 } }}
      >
        <MenuItem onClick={() => handleOpenDrawer(selectedClaim)} sx={{ fontWeight: 600, fontSize: '0.85rem', gap: 2 }}>
          <ViewIcon fontSize="small" color="primary" /> View Claim
        </MenuItem>
        <MenuItem onClick={handleOpenPayout} sx={{ fontWeight: 600, fontSize: '0.85rem', gap: 2 }}>
          <PayoutIcon fontSize="small" color="success" /> Process Payout
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setAnchorEl(null)} sx={{ fontWeight: 600, fontSize: '0.85rem', gap: 2, color: 'error.main' }}>
          <DeleteIcon fontSize="small" /> Close Claim
        </MenuItem>
      </Menu>

      {/* Claim Detail Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 700 }, borderRadius: 0 } }}
      >
        {selectedClaim && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 3, bgcolor: '#1A237E', color: '#fff' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 700, textTransform: 'uppercase' }}>Claim Master Record</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900 }}>{selectedClaim.id.split('-')[0].toUpperCase()}</Typography>
                </Box>
                <Chip 
                  label={selectedClaim.status.toUpperCase()} 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 800, borderRadius: '4px' }} 
                />
              </Box>
              <Stack direction="row" spacing={3}>
                <Box>
                  <Typography sx={{ fontSize: '0.7rem', opacity: 0.7 }}>Claim Amount</Typography>
                  <Typography sx={{ fontWeight: 800 }}>UGX {parseFloat(selectedClaim.estimated_amount || 0).toLocaleString()}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.7rem', opacity: 0.7 }}>Incident Date</Typography>
                  <Typography sx={{ fontWeight: 800 }}>{selectedClaim.incident_date}</Typography>
                </Box>
              </Stack>
            </Box>

            <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ borderBottom: '1px solid #E8EAED', px: 2 }}>
              <Tab label="Overview" icon={<DocIcon sx={{ fontSize: 18 }} />} iconPosition="start" sx={{ fontWeight: 700 }} />
              <Tab label="Claimant" icon={<PersonIcon sx={{ fontSize: 18 }} />} iconPosition="start" sx={{ fontWeight: 700 }} />
              <Tab label="Form Data" icon={<FormIcon sx={{ fontSize: 18 }} />} iconPosition="start" sx={{ fontWeight: 700 }} />
              <Tab label="Payout" icon={<BankIcon sx={{ fontSize: 18 }} />} iconPosition="start" sx={{ fontWeight: 700 }} />
            </Tabs>

            <Box sx={{ p: 3, flex: 1, overflowY: 'auto', bgcolor: '#F8F9FA' }}>
              {activeTab === 0 && (
                <Stack spacing={3}>
                  <Card elevation={0} sx={{ border: '1px solid #E8EAED', borderRadius: 0 }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: '#546E7A' }}>Claim Information</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#90A4AE' }}>Claim Type</Typography>
                          <Typography sx={{ fontWeight: 600 }}>{selectedClaim.claim_type?.replace(/_/g, ' ')}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#90A4AE' }}>Policy Reference</Typography>
                          <Typography sx={{ fontWeight: 600 }}>{selectedClaim.policy_id}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="caption" sx={{ color: '#90A4AE' }}>Incident Description</Typography>
                          <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>{selectedClaim.description || 'No description provided.'}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Stack>
              )}

              {activeTab === 1 && (
                <Stack spacing={3}>
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 1, bgcolor: '#1A237E' }}>
                      <PersonIcon sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{selectedClaim.claimant_name}</Typography>
                    <Typography variant="body2" sx={{ color: '#546E7A' }}>{selectedClaim.claimant_email}</Typography>
                  </Box>
                  <Divider />
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="caption" sx={{ color: '#90A4AE', fontWeight: 700 }}>MEMBERSHIP ID</Typography>
                      <Typography sx={{ fontWeight: 600 }}>{selectedClaim.reported_by_membership_id}</Typography>
                    </Grid>
                  </Grid>
                  <Alert severity="info" sx={{ borderRadius: 0 }}>
                    KYC documentation for this claimant is attached to the parent policy record.
                  </Alert>
                </Stack>
              )}

              {activeTab === 2 && (
                <Stack spacing={3}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#546E7A' }}>Claim Assessment Data</Typography>
                    {formsLoading && <Spinner size={20} />}
                  </Box>

                  {claimForms.length > 0 ? (
                    claimForms.map((form) => (
                      <Card key={form.id} elevation={0} sx={{ border: '1px solid #E8EAED', borderRadius: 0, overflow: 'hidden' }}>
                        <Box sx={{ p: 2, bgcolor: '#F8F9FA', borderBottom: '1px solid #E8EAED' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1A237E' }}>{form.name}</Typography>
                        </Box>
                        <Box>
                          {form.fields.map((field) => {
                            const value = selectedClaim.context?.[field.label] || selectedClaim.context?.[field.field_key];
                            if (field.field_type === 'section') {
                              return (
                                <Box key={field.id} sx={{ p: 2, bgcolor: '#F1F3F4', borderBottom: '1px solid #E8EAED' }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#1A237E', textTransform: 'uppercase' }}>{field.label}</Typography>
                                </Box>
                              );
                            }
                            return (
                              <Box key={field.id} sx={{ p: 2, borderBottom: '1px solid #F5F5F5' }}>
                                <Typography variant="caption" sx={{ color: '#90A4AE', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>{field.label}</Typography>
                                <Box sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{renderValue(value)}</Box>
                              </Box>
                            );
                          })}
                        </Box>
                      </Card>
                    ))
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#fff', border: '1px dashed #E8EAED' }}>
                      <FormIcon sx={{ fontSize: 48, color: '#E0E0E0', mb: 2 }} />
                      <Typography variant="body2" sx={{ color: '#90A4AE', fontWeight: 600 }}>No detailed assessment data available.</Typography>
                    </Box>
                  )}
                </Stack>
              )}

              {activeTab === 3 && (
                <Stack spacing={3}>
                   <Card elevation={0} sx={{ border: '1px solid #E8EAED', bgcolor: '#E8F5E9', borderRadius: 0 }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: '#2E7D32' }}>Payout Information</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#546E7A' }}>Method</Typography>
                          <Typography sx={{ fontWeight: 700 }}>{selectedClaim.payout_method?.replace(/_/g, ' ') || 'Not Set'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#546E7A' }}>Status</Typography>
                          <Typography sx={{ fontWeight: 700, color: '#2E7D32' }}>{selectedClaim.payout_status || 'Pending'}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="caption" sx={{ color: '#546E7A' }}>Account / Phone</Typography>
                          <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                            {selectedClaim.payout_method === 'mobile_money' ? selectedClaim.payout_phone_number : selectedClaim.payout_account_number || 'N/A'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Stack>
              )}
            </Box>

            <Box sx={{ p: 2, borderTop: '1px solid #E8EAED', display: 'flex', gap: 2 }}>
              <Button fullWidth variant="outlined" sx={{ borderRadius: 0, fontWeight: 700 }}>Reject Claim</Button>
              <Button fullWidth variant="contained" onClick={handleOpenPayout} sx={{ borderRadius: 0, bgcolor: '#1A237E', fontWeight: 700 }}>Approve & Pay</Button>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Payout Modal */}
      <Drawer
        anchor="right"
        open={payoutModalOpen}
        onClose={() => setPayoutModalOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 500 }, borderRadius: 0 } }}
      >
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>Process Payout</Typography>
          <Typography variant="body2" sx={{ color: '#546E7A', mb: 4 }}>Configure the disbursement details for this claim.</Typography>
          
          <Stack spacing={3} sx={{ flex: 1 }}>
            <FormControl fullWidth>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, mb: 1, color: '#1A237E' }}>Payout Method</Typography>
              <Select
                value={payoutForm.payout_method}
                onChange={(e) => setPayoutForm(f => ({ ...f, payout_method: e.target.value }))}
                size="small"
                sx={{ borderRadius: 0 }}
              >
                <MenuItem value="mobile_money">Mobile Money</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
              </Select>
            </FormControl>

            {payoutForm.payout_method === 'mobile_money' ? (
              <TextField
                fullWidth
                label="Phone Number"
                value={payoutForm.payout_phone_number}
                onChange={(e) => setPayoutForm(f => ({ ...f, payout_phone_number: e.target.value }))}
                InputProps={{ sx: { borderRadius: 0 } }}
              />
            ) : (
              <>
                <TextField label="Bank Name" fullWidth InputProps={{ sx: { borderRadius: 0 } }} />
                <TextField label="Account Number" fullWidth InputProps={{ sx: { borderRadius: 0 } }} />
              </>
            )}
          </Stack>

          <Box sx={{ pt: 3, borderTop: '1px solid #E8EAED', display: 'flex', gap: 2 }}>
            <Button fullWidth variant="outlined" onClick={() => setPayoutModalOpen(false)} sx={{ borderRadius: 0, fontWeight: 700 }}>Cancel</Button>
            <Button fullWidth variant="contained" sx={{ borderRadius: 0, bgcolor: '#1A237E', fontWeight: 700 }}>Confirm Payout</Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  )
}
