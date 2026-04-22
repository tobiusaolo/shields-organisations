import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { policyAPI, promotionAPI } from '../services/api'
import { formatCurrency } from '../utils/formatters'
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
  Alert,
  Drawer,
  CircularProgress as Spinner,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
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
  Close as CloseIcon,
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
        start_date: newPolicy.start_date || new Date().toISOString().split('T')[0],
        end_date: new Date(new Date(newPolicy.start_date || new Date()).setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        status: 'pending',
        sales_channel: 'agent_assisted',
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
      setNewPolicy({ policy_holder_id: '', product_template_id: '', premium: '', start_date: new Date().toISOString().split('T')[0] })
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

  const { data: customers } = useQuery({
    queryKey: ['customers', user?.organization_id],
    queryFn: () => policyAPI.getOrganizationCustomerAccounts(user.organization_id),
    enabled: !!user?.organization_id && createOpen
  })

  const { data: products } = useQuery({
    queryKey: ['products-list', user?.organization_id],
    queryFn: () => productAPI.getProducts(user.organization_id),
    enabled: !!user?.organization_id && createOpen
  })

  const { data: templates } = useQuery({
    queryKey: ['templates-list', user?.organization_id],
    queryFn: () => productAPI.getProductTemplates(user.organization_id),
    enabled: !!user?.organization_id && createOpen
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
      const res = await policyAPI.getPolicies(user.organization_id, params)
      return res.data
    },
    enabled: !!user?.organization_id
  })

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
                          <Box>
                            <Typography sx={{ fontSize: '0.82rem', color: '#202124', fontWeight: 700 }}>
                              {p.product_info?.name || p.product_template_id}
                            </Typography>
                            <Typography sx={{ fontSize: '0.65rem', color: '#5F6368', fontWeight: 600, display: 'block' }}>
                              Template: {p.template_info?.name || 'Standard'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#202124' }}>
                          {formatCurrency(p.premium, p.currency)}
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

      {/* New Policy Drawer */}
      <Drawer 
        anchor="right" 
        open={createOpen} 
        onClose={() => setCreateOpen(false)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 500 }, border: 'none', boxShadow: '-8px 0 32px rgba(0,0,0,0.1)' }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Drawer Header */}
          <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E8EAED' }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Issue New Policy</Typography>
            <IconButton onClick={() => setCreateOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Drawer Content */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField select fullWidth label="Policyholder" value={newPolicy.policy_holder_id} onChange={e => setNewPolicy(n => ({...n, policy_holder_id: e.target.value}))} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
                  {(customers?.data || []).map(c => (
                    <MenuItem key={c.id} value={c.id}>{c.full_name} ({c.email})</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField select fullWidth label="Product Template" value={newPolicy.product_template_id} onChange={e => {
                  const t = (templates?.data?.items || []).find(item => item.id === e.target.value);
                  setNewPolicy(n => ({...n, product_template_id: e.target.value, premium: t?.base_premium || ''}));
                }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
                  {(templates?.data?.items || []).map(t => (
                    <MenuItem key={t.id} value={t.id}>{t.name} (Code: {t.code || 'N/A'})</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Premium" type="number" value={newPolicy.premium} onChange={e => { setNewPolicy(n => ({...n, premium: e.target.value})); setCouponRes(null); }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Start Date" type="date" InputLabelProps={{ shrink: true }} value={newPolicy.start_date} onChange={e => setNewPolicy(n => ({...n, start_date: e.target.value}))} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              </Grid>
              
              {/* Coupon Field */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography sx={{ mb: 1.5, fontWeight: 700, fontSize: '0.85rem', color: '#202124' }}>Redeem Promotional Coupon</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField fullWidth size="small" placeholder="Enter coupon code" value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponRes(null); }} disabled={!newPolicy.premium} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  <Button variant="outlined" onClick={validateCoupon} disabled={!couponCode || !newPolicy.premium || validatingCoupon} sx={{ borderRadius: 2, fontWeight: 700 }}>
                    {validatingCoupon ? <Spinner size={20} /> : 'Apply'}
                  </Button>
                </Box>
                {couponRes && (
                  <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: couponRes.valid ? '#E6F4EA' : '#FCE8E6', color: couponRes.valid ? '#1E8E3E' : '#D93025', border: `1px solid ${couponRes.valid ? '#34A853' : '#EA4335'}` }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.85rem' }}>{couponRes.message}</Typography>
                    {couponRes.valid && (
                      <Typography sx={{ fontSize: '0.8rem', mt: 0.5, color: '#5F6368', fontWeight: 500 }}>
                        Discount: {formatCurrency(couponRes.discount_amount, newPolicy.currency)} | Final Premium: <b>{formatCurrency(couponRes.final_premium, newPolicy.currency)}</b>
                      </Typography>
                    )}
                  </Box>
                )}
              </Grid>
            </Grid>
          </Box>

          {/* Drawer Footer */}
          <Box sx={{ p: 3, borderTop: '1px solid #E8EAED', display: 'flex', gap: 2 }}>
            <Button fullWidth variant="outlined" onClick={() => setCreateOpen(false)} sx={{ borderRadius: 2, py: 1.25, fontWeight: 600 }}>Cancel</Button>
            <Button fullWidth variant="contained" onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !newPolicy.premium || !newPolicy.policy_holder_id} sx={{ borderRadius: 2, py: 1.25, fontWeight: 700 }}>
              {createMutation.isPending ? <Spinner size={20} color="inherit" /> : 'Issue Policy'}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* DOCUMENT COMPLIANCE DRAWER */}
      <Drawer
        anchor="right"
        open={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 500 }, border: 'none', boxShadow: '-8px 0 32px rgba(0,0,0,0.1)' }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Drawer Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#F8F9FA', p: 3, borderBottom: '1px solid #E8EAED' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SecurityIcon color="primary" />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Document Compliance Gate</Typography>
                <Typography variant="body2" sx={{ color: '#5F6368' }}>{selectedPolicyForDocs?.policy_number}</Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setDocModalOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Drawer Content */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              
              {/* 0. PLATFORM VERIFIED IDENTITY */}
              {selectedPolicyForDocs?.holder_info && (
                <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: '#F1F3F4', border: '1px solid #DADCE0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <VerifiedIcon sx={{ color: '#34A853', fontSize: 20 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#202124' }}>
                      Platform-Verified Consumer Identity
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Typography sx={{ fontSize: '0.65rem', color: '#5F6368', fontWeight: 700, textTransform: 'uppercase', mb: 0.5 }}>Full Name</Typography>
                      <Typography sx={{ fontSize: '1rem', fontWeight: 800 }}>
                        {selectedPolicyForDocs.holder_info.first_name} {selectedPolicyForDocs.holder_info.last_name}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography sx={{ fontSize: '0.65rem', color: '#5F6368', fontWeight: 700, textTransform: 'uppercase', mb: 0.5 }}>KYC Status</Typography>
                      <Chip 
                        label={selectedPolicyForDocs.holder_info.kyc_status?.toUpperCase()} 
                        size="small" 
                        color={selectedPolicyForDocs.holder_info.kyc_status === 'approved' ? 'success' : 'warning'}
                        sx={{ height: 22, fontSize: '0.7rem', fontWeight: 800, borderRadius: 1.5 }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <NinIcon sx={{ fontSize: 13, color: '#5F6368' }} />
                        <Typography sx={{ fontSize: '0.65rem', color: '#5F6368', fontWeight: 700, textTransform: 'uppercase' }}>National ID / NIN</Typography>
                      </Box>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'monospace' }}>
                        {selectedPolicyForDocs.holder_info.kyc_details?.nin || 'Not Provided'}
                      </Typography>
                    </Grid>
                  </Grid>

                  {selectedPolicyForDocs.holder_info.kyc_details?.documents && (
                    <Box sx={{ mt: 3 }}>
                      <Typography sx={{ fontSize: '0.65rem', color: '#5F6368', fontWeight: 700, textTransform: 'uppercase', mb: 1.5 }}>Identity Artifacts</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {selectedPolicyForDocs.holder_info.kyc_details.documents.map((doc, idx) => (
                          <Button 
                            key={idx}
                            size="small" 
                            variant="outlined" 
                            sx={{ fontSize: '0.65rem', py: 0.25, borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
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
              <Box sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E8EAED', bgcolor: '#FDFDFD' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>1. Download Registration Artifacts</Typography>
                <Typography variant="body2" sx={{ color: '#5F6368', mb: 2.5, lineHeight: 1.5 }}>
                  Download the official product blueprints and registration forms. Sign them manually and scan for upload.
                </Typography>
                <Button variant="outlined" startIcon={<DownloadIcon />} fullWidth sx={{ borderRadius: 2, py: 1, fontWeight: 700 }}>
                  Download All Required Forms (.zip)
                </Button>
              </Box>

              {/* 2. UPLOAD SECTION */}
              <Box sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E8EAED' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>2. Upload Signed & Scanned Proof</Typography>
                <Typography variant="body2" sx={{ color: '#5F6368', mb: 2.5, lineHeight: 1.5 }}>
                  Submit the digital scan of your manual endorsement.
                </Typography>
                <Button variant="contained" component="label" startIcon={<UploadIcon />} fullWidth sx={{ borderRadius: 2, py: 1.25, fontWeight: 700 }}>
                  {uploadMutation.isPending ? <Spinner size={20} color="inherit" /> : 'Upload Signed PDF'}
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

              {/* 3. STAFF APPROVAL SECTION */}
              {(selectedPolicyForDocs?.status === 'documentation_review' || selectedPolicyForDocs?.status === 'pending') && (
                <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: '#E8F0FE', border: '1px solid #1A73E8' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#1A73E8', mb: 1.5 }}>
                    3. Underwriter Final Review
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#5F6368', mb: 3, lineHeight: 1.5 }}>
                    Verify that the scanned forms match the platform consumer identity. Approval instantly unlocks the payment gateway.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="success" 
                    fullWidth 
                    onClick={() => approveDocsMutation.mutate(selectedPolicyForDocs.id)}
                    sx={{ borderRadius: 2, py: 1.25, fontWeight: 800, boxShadow: '0 4px 12px rgba(52,168,83,0.2)' }}
                    disabled={approveDocsMutation.isPending}
                  >
                    {approveDocsMutation.isPending ? <Spinner size={24} color="inherit" /> : 'Approve & Unlock Payment'}
                  </Button>
                </Box>
              )}

              {selectedPolicyForDocs?.status === 'docs_approved' && (
                <Alert severity="success" variant="filled" sx={{ borderRadius: 3, fontWeight: 700 }}>
                  Compliance satisfied! Payment gateway active.
                </Alert>
              )}
            </Box>
          </Box>

          {/* Drawer Footer */}
          <Box sx={{ p: 3, bgcolor: '#F8F9FA', borderTop: '1px solid #E8EAED', display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => setDocModalOpen(false)} sx={{ borderRadius: 2, fontWeight: 700, px: 4 }}>Close Panel</Button>
          </Box>
        </Box>
      </Drawer>

      {/* Policy Details & Q&A Drawer */}
      <Drawer
        anchor="right"
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 600 }, border: 'none', boxShadow: '-8px 0 32px rgba(0,0,0,0.1)' }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Drawer Header */}
          <Box sx={{ bgcolor: '#F8F9FA', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E8EAED' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ bgcolor: '#1A73E8', color: 'white', p: 1, borderRadius: 1.5, display: 'flex' }}>
                <PolicyIcon />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{selectedPolicy?.policy_number}</Typography>
                <Typography variant="body2" sx={{ color: '#5F6368' }}>Policy Details & Expert Q&A</Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setDetailsOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Drawer Content */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
            <Box sx={{ mb: 4, p: 2, borderRadius: 3, border: '1px solid #E8EAED', bgcolor: '#FDFDFD' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: '#202124', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Policy Snapshot</Typography>
              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#9AA0A6', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>Current Status</Typography>
                  <StatusBadge status={selectedPolicy?.status ? selectedPolicy.status.charAt(0).toUpperCase() + selectedPolicy.status.slice(1) : 'Unknown'} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#9AA0A6', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>Total Premium</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 900, color: '#1E8E3E' }}>{formatCurrency(selectedPolicy?.premium, selectedPolicy?.currency)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#9AA0A6', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>Effective From</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedPolicy?.start_date || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#9AA0A6', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>Termination Date</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedPolicy?.end_date || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                  <Typography variant="caption" sx={{ color: '#9AA0A6', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 1 }}>Product Engineering</Typography>
                  <Box sx={{ p: 1.5, bgcolor: '#F1F3F4', borderRadius: 2 }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, mb: 0.5 }}>{selectedPolicy?.product_info?.name}</Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#5F6368' }}>
                      <b>Template:</b> {selectedPolicy?.template_info?.name || 'Not Defined'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#5F6368' }}>
                      <b>Calc Model:</b> {selectedPolicy?.template_info?.calculation_template || 'Dynamic Pricing'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 4 }} />

            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ViewIcon sx={{ color: '#1A73E8' }} />
              Policy Support & Discussion
            </Typography>

            <Box sx={{ mb: 4, p: 2, bgcolor: '#F8F9FA', borderRadius: 3, border: '1px solid #E8EAED' }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder="Ask clarifying questions regarding this specific policy holder or coverage..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                disabled={createQuestionMutation.isPending}
                sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
                <Button
                  variant="contained"
                  onClick={() => createQuestionMutation.mutate(newQuestion)}
                  disabled={!newQuestion.trim() || createQuestionMutation.isPending}
                  startIcon={createQuestionMutation.isPending ? <Spinner size={16} color="inherit" /> : <SendIcon />}
                  sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}
                >
                  Post Question
                </Button>
              </Box>
            </Box>

            {questionsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <Spinner size={32} />
              </Box>
            ) : (
              <List sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {(questions || []).length === 0 && (
                  <Alert severity="info" variant="outlined" sx={{ borderRadius: 3, borderStyle: 'dashed' }}>
                    No expert discussions found for this policy ledger yet.
                  </Alert>
                )}
                {questions?.map((q) => (
                  <Box key={q.id}>
                    <ListItem disablePadding sx={{ alignItems: 'flex-start' }}>
                      <ListItemIcon sx={{ minWidth: 44 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#E8F0FE', color: '#1A73E8', fontWeight: 800, fontSize: '0.8rem' }}>
                          {q.user_name?.charAt(0) || 'U'}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>{q.user_name || 'System User'}</Typography>
                            <Typography variant="caption" sx={{ color: '#9AA0A6' }}>{new Date(q.created_at).toLocaleDateString()}</Typography>
                          </Box>
                        }
                        secondary={<Typography variant="body2" sx={{ color: '#202124', lineHeight: 1.5 }}>{q.question}</Typography>}
                      />
                    </ListItem>

                    {q.answer && (
                      <Box sx={{ ml: 5.5, mt: 2, p: 2, bgcolor: '#E6F4EA', borderRadius: 2, borderLeft: '4px solid #34A853' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, bgcolor: '#1A73E8', color: 'white', fontSize: '0.7rem' }}>
                            {q.answered_by_name?.charAt(0) || 'A'}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 900, color: '#137333' }}>
                            {q.answered_by_name} <Typography component="span" sx={{ fontSize: '0.7rem', fontWeight: 400 }}>({q.answered_by_role})</Typography>
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#137333', lineHeight: 1.5 }}>{q.answer}</Typography>
                      </Box>
                    )}

                    {!q.answer && (user?.role === 'organization_admin' || user?.role === 'underwriter' || user?.role === 'agent') && (
                      <Box sx={{ ml: 5.5, mt: 2 }}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          size="small"
                          placeholder="Type official response..."
                          value={answerInputs[q.id] || ''}
                          onChange={(e) => setAnswerInputs(prev => ({ ...prev, [q.id]: e.target.value }))}
                          disabled={answerQuestionMutation.isPending}
                          sx={{ bgcolor: '#F8F9FA', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => answerQuestionMutation.mutate({ questionId: q.id, answer: answerInputs[q.id] })}
                            disabled={!answerInputs[q.id]?.trim() || answerQuestionMutation.isPending}
                            sx={{ borderRadius: 1.5, fontWeight: 700 }}
                          >
                            {answerQuestionMutation.isPending ? 'Saving...' : 'Submit Answer'}
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Box>
                ))}
              </List>
            )}
          </Box>

          {/* Drawer Footer */}
          <Box sx={{ p: 3, borderTop: '1px solid #E8EAED', bgcolor: '#F8F9FA', display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => setDetailsOpen(false)} sx={{ borderRadius: 2, fontWeight: 700, px: 4 }}>Close Ledger View</Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  )
}
