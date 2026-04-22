import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { policyAPI, promotionAPI } from '../services/api'
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
  Select,
  FormControl,
  IconButton,
  Menu,
  Skeleton,
  Chip,
  Tooltip,
  Avatar,
  Divider,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress as Spinner,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
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
  FilterList as FilterIcon,
  Description as PolicyIcon,
  ContentCopy as CopyIcon,
  OpenInNew as OpenIcon,
  Security as SecurityIcon,
  FileUpload as UploadIcon,
  Inventory as DocsIcon,
  VerifiedUser as VerifiedIcon,
  Fingerprint as NinIcon,
  Send as SendIcon,
} from '@mui/icons-material'

// Deleted POLICIES mock test payload

const STATUS_CONFIG = {
  Active: { color: '#1E8E3E', bg: '#E6F4EA', dot: '#34A853' },
  Pending: { color: '#1A73E8', bg: '#E8F0FE', dot: '#4285F4' },
  Documentation_review: { color: '#E37400', bg: '#FEF3E2', dot: '#F9AB00' },
  Docs_approved: { color: '#1E8E3E', bg: '#E6F4EA', dot: '#34A853' },
  Expired: { color: '#D93025', bg: '#FCE8E6', dot: '#EA4335' },
}

const AVATAR_COLORS = ['#1A73E8', '#1E8E3E', '#E37400', '#7B61FF', '#D93025']

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { color: '#5F6368', bg: '#F1F3F4', dot: '#9AA0A6' }
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1.25, py: 0.4, borderRadius: 6, bgcolor: cfg.bg }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: cfg.dot }} />
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: cfg.color, lineHeight: 1 }}>{status}</Typography>
    </Box>
  )
}

export default function Policies() {
  const navigate = useNavigate()
  const { id: policyId } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const rowsPerPage = 10
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [anchorEl, setAnchorEl] = useState(null)
  const [selected, setSelected] = useState(null)

  // Create Policy Modal state
  const [createOpen, setCreateOpen] = useState(false)
  const [newPolicy, setNewPolicy] = useState({
    policy_holder_id: '', product_template_id: '', premium: '', start_date: ''
  })
  const [couponCode, setCouponCode] = useState('')
  const [couponRes, setCouponRes] = useState(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)

  // Document Review State
  const [docModalOpen, setDocModalOpen] = useState(false)
  const [selectedPolicyForDocs, setSelectedPolicyForDocs] = useState(null)

  // Policy Details & Q&A State
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState(null)
  const [newQuestion, setNewQuestion] = useState('')
  const [answerInputs, setAnswerInputs] = useState({})
  const [uploadLoading, setUploadLoading] = useState(false)

  const validateCoupon = async () => {
    if (!couponCode || !newPolicy.premium) return
    setValidatingCoupon(true)
    try {
      const { data } = await promotionAPI.validateCoupon(couponCode, user.organization_id, parseFloat(newPolicy.premium))
      setCouponRes(data)
    } catch {
      setCouponRes({ valid: false, message: 'Validation failed.' })
    } finally {
      setValidatingCoupon(false)
    }
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        policy_holder_id: newPolicy.policy_holder_id,
        product_template_id: newPolicy.product_template_id,
        premium: parseFloat(newPolicy.premium),
        start_date: newPolicy.start_date,
        end_date: '2025-01-01', // mock
        status: 'pending',
        sales_channel: 'direct',
      }
      const pData = (await policyAPI.createPolicy(user.organization_id, payload)).data
      
      // If coupon used, redeem it
      if (couponRes && couponRes.valid && couponRes.coupon) {
        await promotionAPI.redeemCoupon(couponRes.coupon.id, couponCode, pData.id)
      }
      return pData
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['policies'])
      setCreateOpen(false)
      setNewPolicy({ policy_holder_id: '', product_template_id: '', premium: '', start_date: '' })
      setCouponCode('')
      setCouponRes(null)
    }
  })

  // Document Actions
  const uploadMutation = useMutation({
    mutationFn: async ({ policyId, files }) => {
      const res = await policyAPI.uploadSignedDocuments(user.organization_id, policyId, files)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['policies'])
      setDocModalOpen(false)
    }
  })

  const approveDocsMutation = useMutation({
    mutationFn: async (policyId) => {
      const res = await policyAPI.approvePolicyDocumentation(user.organization_id, policyId)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['policies'])
      setDocModalOpen(false)
    }
  })

  const handleOpenDocGate = (policy) => {
    setSelectedPolicyForDocs(policy)
    setDocModalOpen(true)
  }

  const { data: policies, isLoading } = useQuery({
    queryKey: ['policies', user.organization_id, statusFilter, search],
    queryFn: async () => {
      const res = await policyAPI.getPolicies(user.organization_id, { status: statusFilter, search })
      return res.data.items
    },
  })

  // Handle policy ID from URL to open details dialog
  useEffect(() => {
    if (policyId && policies) {
      const policy = policies.find(p => p.id === policyId)
      if (policy) {
        setSelectedPolicy(policy)
        setDetailsOpen(true)
      }
    }
  }, [policyId, policies])

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['policy-questions', selectedPolicy?.id],
    queryFn: async () => {
      const res = await policyAPI.getPolicyQuestions(selectedPolicy.id)
      return res.data
    },
    enabled: !!selectedPolicy?.id && detailsOpen,
  })

  const createQuestionMutation = useMutation({
    mutationFn: async (question) => {
      return await policyAPI.createPolicyQuestion(selectedPolicy.id, { question })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['policy-questions', selectedPolicy?.id])
      setNewQuestion('')
    },
  })

  const answerQuestionMutation = useMutation({
    mutationFn: async ({ questionId, answer }) => {
      return await policyAPI.answerPolicyQuestion(selectedPolicy.id, questionId, {
        answer,
        answered_by_name: user?.first_name + ' ' + user?.last_name,
        answered_by_role: user?.role
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['policy-questions', selectedPolicy?.id])
      setAnswerInputs({})
    },
  })

  const { data, isLoading: loading } = useQuery({
    queryKey: ['policies', user?.organization_id, page, statusFilter, search],
    queryFn: async () => {
      const params = {
        skip: (page - 1) * rowsPerPage,
        limit: rowsPerPage,
      }
      if (statusFilter !== 'all') {
        if (statusFilter === 'Awaiting Approval') params.status = 'documentation_review'
        else params.status = statusFilter.toLowerCase()
      }
      // Note: Search filters would normally go here if supported by FastAPI endpoint
      const res = await policyAPI.getPolicies(user.organization_id, params)
      return res.data
    },
    enabled: !!user?.organization_id
  })

  // Since actual Policies have real backend schema mappings:
  const paginated = data?.items || []
  const totalItems = data?.total || 0

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#202124', mb: 0.5 }}>Policies</Typography>
          <Typography sx={{ color: '#5F6368', fontSize: '0.9rem' }}>
            {totalItems} total record{totalItems !== 1 ? 's' : ''} found
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<DownloadIcon />} sx={{ borderRadius: 2.5, fontWeight: 600, color: '#5F6368', borderColor: '#DADCE0' }}>
            Export
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)} sx={{ borderRadius: 2.5, fontWeight: 700 }}>
            New Policy
          </Button>
        </Box>
      </Box>

      {/* Summary Chips */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        {['all', 'Active', 'Awaiting Approval', 'Pending', 'Expired'].map((s) => {
          const isSelected = statusFilter === s
          return (
            <Chip
              key={s}
              label={s === 'all' ? 'All Policies' : s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              sx={{
                fontWeight: 600,
                fontSize: '0.8rem',
                height: 32,
                cursor: 'pointer',
                bgcolor: isSelected ? 'primary.main' : '#FFFFFF',
                color: isSelected ? '#FFFFFF' : '#5F6368',
                border: `1.5px solid ${isSelected ? 'primary.main' : '#DADCE0'}`,
                '&:hover': { bgcolor: isSelected ? 'primary.dark' : 'rgba(26,115,232,0.06)' },
                transition: 'all 0.15s',
              }}
            />
          )
        })}
      </Box>

      {/* Search & Filter Bar */}
      <Paper elevation={1} sx={{ p: 2, mb: 2.5, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search by policy no., holder or product…"
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
          sx={{ minWidth: 280, flexGrow: 1, maxWidth: 400 }}
        />
        <Box sx={{ flexGrow: 1 }} />
        <Typography sx={{ fontSize: '0.8rem', color: '#9AA0A6', display: { xs: 'none', sm: 'block' } }}>
          {paginated.length} result{paginated.length !== 1 ? 's' : ''} shown
        </Typography>
      </Paper>

      {/* Table */}
      <Paper elevation={1} sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Policy Number</TableCell>
                <TableCell>Policyholder</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Product</TableCell>
                <TableCell>Premium</TableCell>
                <TableCell>Status</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Installments</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Next Payment</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Start Date</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Channel</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? [1, 2, 3, 4, 5].map((i) => (
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
                        <Box sx={{ color: '#9AA0A6' }}>
                          <PolicyIcon sx={{ fontSize: 48, mb: 1.5, opacity: 0.4 }} />
                          <Typography sx={{ fontWeight: 600, color: '#5F6368' }}>No policies found</Typography>
                          <Typography sx={{ fontSize: '0.82rem', color: '#9AA0A6', mt: 0.5 }}>
                            Try adjusting your search or filters
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                  : paginated.map((p, idx) => (
                    <TableRow key={p.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#202124', fontFamily: 'monospace' }}>
                            {p.policy_number}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar 
                            sx={{
                              width: 32, height: 32,
                              fontSize: '0.72rem', fontWeight: 700,
                              bgcolor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
                            }}
                          >
                            {p.holder_info ? p.holder_info.first_name[0].toUpperCase() : (p.policy_holder_id || 'U')[0].toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#202124' }}>
                              {p.holder_info ? `${p.holder_info.first_name} ${p.holder_info.last_name}` : p.policy_holder_id}
                            </Typography>
                            {p.holder_info && (
                              <Typography sx={{ fontSize: '0.65rem', color: '#5F6368', display: 'block' }}>{p.holder_info.email}</Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ 
                            width: 28, height: 28, borderRadius: 1, 
                            bgcolor: '#F1F3F4', overflow: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid #E8EAED'
                          }}>
                            {p.product_info?.image_base64 ? (
                              <img src={p.product_info.image_base64} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <PolicyIcon sx={{ fontSize: 16, color: '#BDC1C6' }} />
                            )}
                          </Box>
                          <Typography sx={{ fontSize: '0.82rem', color: '#5F6368', fontWeight: 600 }}>
                            {p.product_info?.name || p.product_template_id}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#202124' }}>
                          UGX {Number(p.premium).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={p.status ? p.status.charAt(0).toUpperCase() + p.status.slice(1) : ''} />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#202124' }}>
                              {p.installments_paid || 0}
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#9AA0A6' }}>
                              /
                            </Typography>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#5F6368' }}>
                              {p.total_installments || 1}
                            </Typography>
                          </Box>
                          <Box sx={{ width: 60, height: 6, bgcolor: '#E8EAED', borderRadius: 3, overflow: 'hidden' }}>
                            <Box 
                              sx={{ 
                                width: `${((p.installments_paid || 0) / (p.total_installments || 1)) * 100}%`, 
                                height: '100%', 
                                bgcolor: ((p.installments_paid || 0) / (p.total_installments || 1)) >= 1 ? '#34A853' : '#1A73E8' 
                              }} 
                            />
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        {p.next_payment_date ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: p.status === 'active' ? '#1A73E8' : '#5F6368' }}>
                              {new Date(p.next_payment_date).toLocaleDateString('en-GB')}
                            </Typography>
                            {p.status === 'active' && (
                              <Typography sx={{ fontSize: '0.7rem', color: '#9AA0A6' }}>
                                ({new Date(p.next_payment_date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })})
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography sx={{ fontSize: '0.8rem', color: '#9AA0A6' }}>N/A</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                        <Typography sx={{ fontSize: '0.8rem', color: '#5F6368' }}>{p.start_date}</Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                        <Chip
                          label={p.sales_channel ? p.sales_channel.replace('_', ' ') : ''}
                          size="small"
                          sx={{
                            height: 22, fontSize: '0.7rem', fontWeight: 600, textTransform: 'capitalize',
                            bgcolor: p.sales_channel?.includes('agent') ? '#E8F0FE' : '#F0EDFF',
                            color: p.sales_channel?.includes('agent') ? '#1A73E8' : '#7B61FF',
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => { setSelectedPolicy(p); setDetailsOpen(true); }}>
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        
                          {(p.status === 'pending' || p.status === 'documentation_review') && (
                            <Tooltip title="Manage Documents">
                              <IconButton size="small" color="primary" onClick={() => handleOpenDocGate(p)}>
                                <DocsIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          <Tooltip title="Policy Actions">
                            <IconButton
                              size="small"
                              sx={{ color: '#5F6368' }}
                              onClick={(e) => { setAnchorEl(e.currentTarget); setSelected(p) }}
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

        {/* Pagination */}
        {!loading && totalItems > 0 && (
          <Box sx={{
            px: 3, py: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderTop: '1px solid #F1F3F4',
          }}>
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

      {/* Context Menu */}
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
        <MenuItem onClick={() => { setAnchorEl(null); setSelectedPolicy(selected); setDetailsOpen(true) }} sx={{ py: 1.25, px: 2, gap: 1.5, fontSize: '0.85rem' }}>
          <ViewIcon sx={{ fontSize: 18, color: '#5F6368' }} /> View Details & Q&A
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)} sx={{ py: 1.25, px: 2, gap: 1.5, fontSize: '0.85rem' }}>
          <EditIcon sx={{ fontSize: 18, color: '#5F6368' }} /> Edit Policy
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)} sx={{ py: 1.25, px: 2, gap: 1.5, fontSize: '0.85rem' }}>
          <DownloadIcon sx={{ fontSize: 18, color: '#5F6368' }} /> Download PDF
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)} sx={{ py: 1.25, px: 2, gap: 1.5, fontSize: '0.85rem' }}>
          <CopyIcon sx={{ fontSize: 18, color: '#5F6368' }} /> Copy Policy No.
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setAnchorEl(null)} sx={{ py: 1.25, px: 2, gap: 1.5, fontSize: '0.85rem', color: '#D93025' }}>
          <DeleteIcon sx={{ fontSize: 18 }} /> Cancel Policy
        </MenuItem>
      </Menu>

      {/* New Policy Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800, pt: 3 }}>Issue New Policy</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Policyholder ID" value={newPolicy.policy_holder_id} onChange={e => setNewPolicy(n => ({...n, policy_holder_id: e.target.value}))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Product ID" value={newPolicy.product_template_id} onChange={e => setNewPolicy(n => ({...n, product_template_id: e.target.value}))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Premium (UGX)" type="number" value={newPolicy.premium} onChange={e => { setNewPolicy(n => ({...n, premium: e.target.value})); setCouponRes(null); }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Start Date" type="date" InputLabelProps={{ shrink: true }} value={newPolicy.start_date} onChange={e => setNewPolicy(n => ({...n, start_date: e.target.value}))} />
            </Grid>
            
            {/* Coupon Field */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography sx={{ mb: 1, fontWeight: 600, fontSize: '0.85rem' }}>Got a Promo Code?</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField fullWidth size="small" placeholder="Enter coupon code" value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponRes(null); }} disabled={!newPolicy.premium} />
                <Button variant="outlined" onClick={validateCoupon} disabled={!couponCode || !newPolicy.premium || validatingCoupon}>
                  {validatingCoupon ? <Spinner size={20} /> : 'Apply'}
                </Button>
              </Box>
              {couponRes && (
                <Box sx={{ mt: 1, p: 1.5, borderRadius: 2, bgcolor: couponRes.valid ? '#E6F4EA' : '#FCE8E6', color: couponRes.valid ? '#1E8E3E' : '#D93025' }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{couponRes.message}</Typography>
                  {couponRes.valid && (
                    <Typography sx={{ fontSize: '0.8rem', mt: 0.5, color: '#5F6368' }}>
                      Discount: UGX {couponRes.discount_amount} | Final Premium: <b>UGX {couponRes.final_premium}</b>
                    </Typography>
                  )}
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !newPolicy.premium || !newPolicy.policy_holder_id}>
            {createMutation.isPending ? <Spinner size={20} color="inherit" /> : 'Issue Policy'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DOCUMENT COMPLIANCE MODAL */}
      <Dialog open={docModalOpen} onClose={() => setDocModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#F8F9FA' }}>
          <SecurityIcon color="primary" />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Document Compliance Gate</Typography>
            <Typography variant="body2" sx={{ color: '#5F6368' }}>{selectedPolicyForDocs?.policy_number}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* 0. PLATFORM VERIFIED IDENTITY (Enriched from global users collection) */}
            {selectedPolicyForDocs?.holder_info && (
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#F1F3F4', border: '1px solid #DADCE0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <VerifiedIcon sx={{ color: '#34A853', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#202124' }}>
                    Platform-Verified Consumer Identity
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: '0.7rem', color: '#5F6368', fontWeight: 600, textTransform: 'uppercase' }}>Full Name</Typography>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 700 }}>
                      {selectedPolicyForDocs.holder_info.first_name} {selectedPolicyForDocs.holder_info.last_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: '0.7rem', color: '#5F6368', fontWeight: 600, textTransform: 'uppercase' }}>KYC Status</Typography>
                    <Chip 
                      label={selectedPolicyForDocs.holder_info.kyc_status?.toUpperCase()} 
                      size="small" 
                      color={selectedPolicyForDocs.holder_info.kyc_status === 'approved' ? 'success' : 'warning'}
                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <NinIcon sx={{ fontSize: 14, color: '#5F6368' }} />
                      <Typography sx={{ fontSize: '0.7rem', color: '#5F6368', fontWeight: 600, textTransform: 'uppercase' }}>NIN</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
                      {selectedPolicyForDocs.holder_info.kyc_details?.nin || 'Not Provided'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: '0.7rem', color: '#5F6368', fontWeight: 600, textTransform: 'uppercase' }}>TIN</Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
                      {selectedPolicyForDocs.holder_info.kyc_details?.tin || 'Not Provided'}
                    </Typography>
                  </Grid>
                </Grid>

                {selectedPolicyForDocs.holder_info.kyc_details?.documents && (
                  <Box sx={{ mt: 2 }}>
                    <Typography sx={{ fontSize: '0.7rem', color: '#5F6368', fontWeight: 600, textTransform: 'uppercase', mb: 1 }}>Verified Identity Documents</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedPolicyForDocs.holder_info.kyc_details.documents.map((doc, idx) => (
                        <Button 
                          key={idx}
                          size="small" 
                          variant="outlined" 
                          sx={{ fontSize: '0.65rem', py: 0, height: 24, borderRadius: 1 }}
                        >
                          View {doc.document_type?.replace(/_/g, ' ')}
                        </Button>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
            
            {/* 1. DOWNLOAD SECTION */}
            <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #E8EAED', bgcolor: '#FDFDFD' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>1. Download Registration Artifacts</Typography>
              <Typography variant="body2" sx={{ color: '#5F6368', mb: 2 }}>
                Download these static forms, sign them by hand, and scan them back in.
              </Typography>
              <Button variant="outlined" startIcon={<DownloadIcon />} fullWidth sx={{ borderRadius: 2 }}>
                Download All Required Forms (.zip)
              </Button>
            </Box>

            {/* 2. UPLOAD SECTION */}
            <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #E8EAED' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>2. Upload Signed & Scanned Proof</Typography>
              <Typography variant="body2" sx={{ color: '#5F6368', mb: 2 }}>
                Upload the scanned PDF of your hand-signed registration forms.
              </Typography>
              <Button variant="contained" component="label" startIcon={<UploadIcon />} fullWidth sx={{ borderRadius: 2 }}>
                Upload Signed Documents
                <input type="file" hidden accept="application/pdf" onChange={(e) => {
                  const file = e.target.files[0]
                  if(file) {
                    const reader = new FileReader();
                    reader.onload = (re) => {
                      uploadMutation.mutate({ 
                        policyId: selectedPolicyForDocs.id, 
                        files: [{ name: file.name, file_content: re.target.result }] 
                      })
                    }
                    reader.readAsDataURL(file)
                  }
                }} />
              </Button>
            </Box>

            {/* 3. STAFF APPROVAL SECTION (Only visible to Org Staff) */}
            {(selectedPolicyForDocs?.status === 'documentation_review' || selectedPolicyForDocs?.status === 'pending') && (
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#E8F0FE', border: '1px solid #1A73E8' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1A73E8', mb: 1 }}>
                  3. Internal Verification & Final Approval
                </Typography>
                <Typography variant="body2" sx={{ color: '#5F6368', mb: 2 }}>
                  By clicking approve, you confirm that the consumer identity has been verified against platform documentation and that all signed forms are correct.
                </Typography>
                <Button 
                  variant="contained" 
                  color="success" 
                  fullWidth 
                  onClick={() => approveDocsMutation.mutate(selectedPolicyForDocs.id)}
                  sx={{ borderRadius: 2, fontWeight: 700 }}
                  disabled={approveDocsMutation.isPending}
                >
                  {approveDocsMutation.isPending ? <Spinner size={24} color="inherit" /> : 'Approve Documents & Unlock Payment'}
                </Button>
              </Box>
            )}

            {selectedPolicyForDocs?.status === 'docs_approved' && (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                Documents verified! The client can now proceed to premium payment.
              </Alert>
            )}
            
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#F8F9FA' }}>
          <Button onClick={() => setDocModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Policy Details & Q&A Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ bgcolor: '#F8F9FA', p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: '#1A73E8', color: 'white', p: 1, borderRadius: 1.5, display: 'flex' }}>
              <PolicyIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>{selectedPolicy?.policy_number}</Typography>
              <Typography variant="body2" sx={{ color: '#5F6368' }}>Policy Details & Q&A</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Policy Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" sx={{ color: '#9AA0A6', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Status</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>{selectedPolicy?.status}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" sx={{ color: '#9AA0A6', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Premium</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>UGX {selectedPolicy?.premium || 0}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" sx={{ color: '#9AA0A6', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Start Date</Typography>
                <Typography variant="body1">{selectedPolicy?.start_date || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" sx={{ color: '#9AA0A6', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>End Date</Typography>
                <Typography variant="body1">{selectedPolicy?.end_date || 'N/A'}</Typography>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ViewIcon sx={{ color: '#1A73E8' }} />
            Questions & Answers
          </Typography>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Ask a question about this policy..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              disabled={createQuestionMutation.isLoading}
            />
            <Button
              variant="contained"
              onClick={() => createQuestionMutation.mutate(newQuestion)}
              disabled={!newQuestion.trim() || createQuestionMutation.isLoading}
              endIcon={<SendIcon />}
              sx={{ mt: 1, borderRadius: 2 }}
            >
              {createQuestionMutation.isLoading ? 'Submitting...' : 'Ask Question'}
            </Button>
          </Box>

          {questionsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <Spinner />
            </Box>
          ) : (
            <List>
              {questions?.map((q) => (
                <React.Fragment key={q.id}>
                  <ListItem sx={{ bgcolor: '#F8F9FA', borderRadius: 2, mb: 1 }}>
                    <ListItemIcon>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#E8F0FE' }}>
                        {q.user_name?.charAt(0) || 'U'}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{q.user_name || 'User'}</Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>{q.question}</Typography>
                        </Box>
                      }
                      secondary={`Asked on ${new Date(q.created_at).toLocaleDateString()}`}
                    />
                  </ListItem>

                  {q.answer && (
                    <ListItem sx={{ bgcolor: '#E6F4EA', borderRadius: 2, mb: 1, ml: 4 }}>
                      <ListItemIcon>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#1A73E8', color: 'white' }}>
                          {q.answered_by_name?.charAt(0) || 'A'}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#137333' }}>
                              {q.answered_by_name} ({q.answered_by_role})
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 0.5 }}>{q.answer}</Typography>
                          </Box>
                        }
                        secondary={`Answered on ${new Date(q.answered_at).toLocaleDateString()}`}
                      />
                    </ListItem>
                  )}

                  {!q.answer && (user?.role === 'organization_admin' || user?.role === 'underwriter' || user?.role === 'agent') && (
                    <Box sx={{ ml: 4, mb: 2, mt: 1 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="Type your answer..."
                        value={answerInputs[q.id] || ''}
                        onChange={(e) => setAnswerInputs(prev => ({ ...prev, [q.id]: e.target.value }))}
                        disabled={answerQuestionMutation.isLoading}
                        size="small"
                      />
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => answerQuestionMutation.mutate({ questionId: q.id, answer: answerInputs[q.id] })}
                        disabled={!answerInputs[q.id]?.trim() || answerQuestionMutation.isLoading}
                        sx={{ mt: 1, borderRadius: 2 }}
                      >
                        {answerQuestionMutation.isLoading ? 'Submitting...' : 'Submit Answer'}
                      </Button>
                    </Box>
                  )}
                </React.Fragment>
              ))}
            </List>
          )}

          {!questionsLoading && questions?.length === 0 && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              No questions yet. Be the first to ask!
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#F8F9FA' }}>
          <Button onClick={() => setDetailsOpen(false)} sx={{ fontWeight: 600 }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
