import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { claimAPI } from '../services/api'
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  InputAdornment,
  Pagination,
  MenuItem,
  IconButton,
  Menu,
  Skeleton,
  Chip,
  Tooltip,
  Divider,
  Grid,
  Card,
  CardContent,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  FormControl,
  CircularProgress as Spinner,
  Alert,
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
} from '@mui/icons-material'

// Deleted CLAIMS mock payload

const STATUS_CONFIG = {
  reported: { color: '#E37400', bg: '#FEF3E2', dot: '#F9AB00', icon: PendingIcon, label: 'Reported' },
  under_review: { color: '#1A73E8', bg: '#E8F0FE', dot: '#4A90F7', icon: ReviewIcon, label: 'Under Review' },
  documents_pending: { color: '#F9AB00', bg: '#FEF7E0', dot: '#F9AB00', icon: PendingIcon, label: 'Docs Pending' },
  assessed: { color: '#7B61FF', bg: '#F3EDFF', dot: '#7B61FF', icon: ReviewIcon, label: 'Assessed' },
  approved: { color: '#1E8E3E', bg: '#E6F4EA', dot: '#34A853', icon: ApprovedIcon, label: 'Approved' },
  paid: { color: '#1E8E3E', bg: '#E6F4EA', dot: '#34A853', icon: ApprovedIcon, label: 'Paid' },
  rejected: { color: '#D93025', bg: '#FCE8E6', dot: '#EA4335', icon: RejectedIcon, label: 'Rejected' },
  closed: { color: '#5F6368', bg: '#F1F3F4', dot: '#9AA0A6', icon: ApprovedIcon, label: 'Closed' }
}

const PAYOUT_STATUS_CONFIG = {
  pending: { color: '#E37400', bg: '#FEF3E2', dot: '#F9AB00', label: 'Pending' },
  processing: { color: '#1A73E8', bg: '#E8F0FE', dot: '#4285F4', label: 'Processing' },
  completed: { color: '#1E8E3E', bg: '#E6F4EA', dot: '#34A853', label: 'Completed' },
  failed: { color: '#D93025', bg: '#FCE8E6', dot: '#EA4335', label: 'Failed' }
}

const SUMMARY_CARDS = [
  { label: 'Reported', key: 'reported', icon: PendingIcon },
  { label: 'Under Review', key: 'under_review', icon: ReviewIcon },
  { label: 'Approved', key: 'approved', icon: ApprovedIcon },
  { label: 'Paid', key: 'paid', icon: ApprovedIcon },
]

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { color: '#5F6368', bg: '#F1F3F4', dot: '#9AA0A6', label: status }
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1.25, py: 0.4, borderRadius: 6, bgcolor: cfg.bg }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: cfg.dot }} />
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: cfg.color, lineHeight: 1 }}>{cfg.label}</Typography>
    </Box>
  )
}

function PayoutStatusBadge({ status }) {
  if (!status) return <Typography sx={{ fontSize: '0.75rem', color: '#9AA0A6' }}>Not Set</Typography>
  const cfg = PAYOUT_STATUS_CONFIG[status] || { color: '#5F6368', bg: '#F1F3F4', dot: '#9AA0A6', label: status }
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.3, borderRadius: 4, bgcolor: cfg.bg }}>
      <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: cfg.dot }} />
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: cfg.color, lineHeight: 1 }}>{cfg.label}</Typography>
    </Box>
  )
}

export default function Claims() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const rowsPerPage = 10
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [anchorEl, setAnchorEl] = useState(null)
  const [selected, setSelected] = useState(null)
  const [payoutModalOpen, setPayoutModalOpen] = useState(false)
  const [selectedClaimForPayout, setSelectedClaimForPayout] = useState(null)
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [payoutForm, setPayoutForm] = useState({
    payout_method: 'mobile_money',
    payout_phone_number: '',
    payout_bank_name: '',
    payout_account_name: '',
    payout_account_number: '',
  })

  const handleOpenPayoutModal = (claim) => {
    setSelectedClaimForPayout(claim)
    setPayoutForm({
      payout_method: claim.payout_method || 'mobile_money',
      payout_phone_number: claim.payout_phone_number || '',
      payout_bank_name: claim.payout_bank_name || '',
      payout_account_name: claim.payout_account_name || '',
      payout_account_number: claim.payout_account_number || '',
    })
    setPayoutModalOpen(true)
  }

  const handleClosePayoutModal = () => {
    setPayoutModalOpen(false)
    setSelectedClaimForPayout(null)
    setPayoutLoading(false)
  }

  const handleProcessPayout = async () => {
    if (!selectedClaimForPayout) return
    setPayoutLoading(true)
    try {
      // Call API to process payout
      // await claimAPI.processPayout(user.organization_id, selectedClaimForPayout.id, payoutForm)
      console.log('Processing payout for claim:', selectedClaimForPayout.id, payoutForm)
      handleClosePayoutModal()
    } catch (error) {
      console.error('Error processing payout:', error)
    } finally {
      setPayoutLoading(false)
    }
  }

  const { data, isLoading: loading } = useQuery({
    queryKey: ['claims', user?.organization_id, page, statusFilter, search],
    queryFn: async () => {
      const params = {
        skip: (page - 1) * rowsPerPage,
        limit: rowsPerPage,
      }
      if (statusFilter !== 'all') params.status = statusFilter
      const res = await claimAPI.getClaims(user.organization_id, params)
      return res.data
    },
    enabled: !!user?.organization_id
  })

  const paginated = data?.items || []
  const totalItems = data?.total || 0
  const claimsLength = paginated.length

  const countByStatus = (s) => paginated.filter(c => c.status === s).length

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#202124', mb: 0.5 }}>Claims</Typography>
          <Typography sx={{ color: '#5F6368', fontSize: '0.9rem' }}>
            Manage and track insurance claim lifecycles
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 2.5, fontWeight: 700 }}>
          File New Claim
        </Button>
      </Box>

      {/* Status Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3.5 }}>
        {SUMMARY_CARDS.map(({ label, key, icon: Icon }) => {
          const cfg = STATUS_CONFIG[key]
          const count = countByStatus(key)
          return (
            <Grid item xs={6} sm={3} key={key}>
              <Card
                elevation={0}
                onClick={() => { setStatusFilter(key === statusFilter ? 'all' : key); setPage(1) }}
                sx={{
                  cursor: 'pointer',
                  border: `1.5px solid ${statusFilter === key ? cfg.color : '#E8EAED'}`,
                  bgcolor: statusFilter === key ? cfg.bg : '#FFFFFF',
                  transition: 'all 0.15s',
                  '&:hover': { borderColor: cfg.color, bgcolor: cfg.bg },
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Icon sx={{ fontSize: 18, color: cfg.color }} />
                    <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: cfg.color }}>{count}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: cfg.color }}>{label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {/* Search */}
      <Paper elevation={1} sx={{ p: 2, mb: 2.5, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search claims…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#9AA0A6', fontSize: 18 }} />
              </InputAdornment>
            ),
            sx: { fontSize: '0.875rem' },
          }}
          sx={{ minWidth: 260, flexGrow: 1, maxWidth: 400 }}
        />
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          sx={{ borderRadius: 2.5, fontWeight: 600, color: '#5F6368', borderColor: '#DADCE0' }}
        >
          Export
        </Button>
        {statusFilter !== 'all' && (
          <Chip
            label={`Filter: ${statusFilter}`}
            onDelete={() => setStatusFilter('all')}
            size="small"
            sx={{
              bgcolor: STATUS_CONFIG[statusFilter]?.bg,
              color: STATUS_CONFIG[statusFilter]?.color,
              fontWeight: 600,
            }}
          />
        )}
      </Paper>

      {/* Table */}
      <Paper elevation={1} sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Claim ID</TableCell>
                <TableCell>Policy / Claimant</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Type</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Payout Method</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Payout Status</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Reported</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Days Open</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? [1, 2, 3, 4].map((i) => (
                    <TableRow key={i}>
                      {[1, 2, 3, 4, 5].map((j) => (
                        <TableCell key={j}><Skeleton height={20} /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : paginated.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                        <ClaimIcon sx={{ fontSize: 48, color: '#E8EAED', display: 'block', mx: 'auto', mb: 1.5 }} />
                        <Typography sx={{ fontWeight: 600, color: '#5F6368' }}>No claims found</Typography>
                        <Typography sx={{ fontSize: '0.82rem', color: '#9AA0A6', mt: 0.5 }}>Try adjusting your search or filters</Typography>
                      </TableCell>
                    </TableRow>
                  )
                  : paginated.map((c) => (
                    <TableRow key={c.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: 'rgba(26,115,232,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ClaimIcon sx={{ fontSize: 14, color: '#1A73E8' }} />
                          </Box>
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#202124', fontFamily: 'monospace' }}>
                            {c.id.split('-')[0].toUpperCase()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#E8F0FE', color: '#1A73E8' }}>
                            {(c.reported_by_membership_id || 'U')[0].toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#202124' }}>
                              {c.reported_by_membership_id}
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#9AA0A6' }}>{c.policy_id}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Chip
                          label={c.claim_type ? c.claim_type.replace('_', ' ') : ''}
                          size="small"
                          sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, bgcolor: '#F1F3F4', color: '#5F6368', textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#202124' }}>
                          UGX {Number(c.estimated_amount).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        {c.payout_method ? (
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {c.payout_method === 'mobile_money' ? (
                                <MobileIcon sx={{ fontSize: 16, color: '#1A73E8' }} />
                              ) : (
                                <BankIcon sx={{ fontSize: 16, color: '#1E8E3E' }} />
                              )}
                              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#202124' }}>
                                {c.payout_method === 'mobile_money' ? 'Mobile' : 'Bank'}
                              </Typography>
                            </Box>
                            <Typography sx={{ fontSize: '0.7rem', color: '#5F6368', mt: 0.5 }}>
                              {c.payout_method === 'mobile_money' ? c.payout_phone_number : `${c.payout_bank_name} - ${c.payout_account_number}`}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography sx={{ fontSize: '0.75rem', color: '#9AA0A6' }}>-</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <PayoutStatusBadge status={c.payout_status} />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                        <Typography sx={{ fontSize: '0.8rem', color: '#5F6368' }}>{c.incident_date}</Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                        <Chip
                          label={`${Math.max(0, Math.floor((new Date() - new Date(c.incident_date)) / (1000 * 60 * 60 * 24)))}d`}
                          size="small"
                          sx={{
                            height: 22, fontSize: '0.7rem', fontWeight: 700,
                            bgcolor: '#FEF3E2',
                            color: '#E37400',
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Tooltip title="View details">
                            <IconButton size="small" sx={{ color: '#5F6368', '&:hover': { color: 'primary.main' } }}>
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {(c.status === 'approved' || c.status === 'assessed') && (
                            <Tooltip title="Process Payout">
                              <IconButton
                                size="small"
                                sx={{ color: '#1A73E8', '&:hover': { color: '#1765CC' } }}
                                onClick={() => handleOpenPayoutModal(c)}
                              >
                                <SendIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="More actions">
                            <IconButton
                              size="small"
                              sx={{ color: '#5F6368' }}
                              onClick={(e) => { setAnchorEl(e.currentTarget); setSelected(c) }}
                            >
                              <MoreIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
              }
            </TableBody>
          </Table>
        </TableContainer>

        {!loading && totalItems > 0 && (
          <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F3F4' }}>
            <Typography sx={{ fontSize: '0.8rem', color: '#9AA0A6' }}>
              Showing {((page - 1) * rowsPerPage) + 1}–{Math.min(page * rowsPerPage, totalItems)} of {totalItems}
            </Typography>
            <Pagination
              count={Math.ceil(totalItems / rowsPerPage)}
              page={page}
              onChange={(_, v) => setPage(v)}
              color="primary"
              size="small"
              shape="rounded"
            />
          </Box>
        )}
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: { borderRadius: 2.5, border: '1px solid #E8EAED', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 180 },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => setAnchorEl(null)} sx={{ py: 1.25, px: 2, gap: 1.5, fontSize: '0.85rem' }}>
          <ViewIcon sx={{ fontSize: 18, color: '#5F6368' }} /> View Claim
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)} sx={{ py: 1.25, px: 2, gap: 1.5, fontSize: '0.85rem' }}>
          <EditIcon sx={{ fontSize: 18, color: '#5F6368' }} /> Update Status
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)} sx={{ py: 1.25, px: 2, gap: 1.5, fontSize: '0.85rem' }}>
          <DownloadIcon sx={{ fontSize: 18, color: '#5F6368' }} /> Download Report
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setAnchorEl(null)} sx={{ py: 1.25, px: 2, gap: 1.5, fontSize: '0.85rem', color: '#D93025' }}>
          <DeleteIcon sx={{ fontSize: 18 }} /> Close Claim
        </MenuItem>
      </Menu>

      {/* Payout Processing Modal */}
      <Dialog open={payoutModalOpen} onClose={handleClosePayoutModal} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PayoutIcon sx={{ color: '#1A73E8' }} />
          <Typography sx={{ fontWeight: 700 }}>Process Claim Payout</Typography>
        </DialogTitle>
        <DialogContent>
          {selectedClaimForPayout && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                Processing payout for Claim <strong>{selectedClaimForPayout.id.split('-')[0].toUpperCase()}</strong> with estimated amount <strong>UGX {Number(selectedClaimForPayout.estimated_amount).toLocaleString()}</strong>
              </Alert>

              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 1, color: '#202124' }}>Payout Method</Typography>
                    <Select
                      value={payoutForm.payout_method}
                      onChange={(e) => setPayoutForm(f => ({ ...f, payout_method: e.target.value }))}
                      size="small"
                    >
                      <MenuItem value="mobile_money">Mobile Money (MTN, Airtel)</MenuItem>
                      <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {payoutForm.payout_method === 'mobile_money' ? (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      placeholder="e.g., 256700123456"
                      value={payoutForm.payout_phone_number}
                      onChange={(e) => setPayoutForm(f => ({ ...f, payout_phone_number: e.target.value }))}
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MobileIcon sx={{ fontSize: 18, color: '#5F6368' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                ) : (
                  <>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Bank Name"
                        placeholder="e.g., Stanbic Bank"
                        value={payoutForm.payout_bank_name}
                        onChange={(e) => setPayoutForm(f => ({ ...f, payout_bank_name: e.target.value }))}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Account Name"
                        placeholder="As it appears on bank records"
                        value={payoutForm.payout_account_name}
                        onChange={(e) => setPayoutForm(f => ({ ...f, payout_account_name: e.target.value }))}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Account Number"
                        placeholder="e.g., 9030001234567"
                        value={payoutForm.payout_account_number}
                        onChange={(e) => setPayoutForm(f => ({ ...f, payout_account_number: e.target.value }))}
                        size="small"
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClosePayoutModal} sx={{ borderRadius: 2.5, fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handleProcessPayout}
            variant="contained"
            disabled={payoutLoading}
            startIcon={payoutLoading ? <Spinner size={16} /> : <SendIcon />}
            sx={{ borderRadius: 2.5, fontWeight: 700 }}
          >
            {payoutLoading ? 'Processing...' : 'Process Payout'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
