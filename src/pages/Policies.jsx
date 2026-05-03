import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { policyAPI, promotionAPI, formAPI, productAPI, publicAPI } from '../services/api'
import { formatCurrency } from '../utils/formatters'
import PolicyCertificateGenerator from '../components/PolicyCertificateGenerator'
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
  Tabs,
  Tab,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
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
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Assignment as FormIcon2,
  QuestionAnswer as QAIcon,
  Payment as PaymentIcon,
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
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1.25, py: 0.4, borderRadius: 0, bgcolor: cfg.bg }}>
      <Box sx={{ width: 6, height: 6, borderRadius: 0, bgcolor: cfg.dot }} />
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: cfg.color, lineHeight: 1 }}>{status}</Typography>
    </Box>
  )
}

export default function Policies() {
  const navigate = useNavigate()
  const { id: policyId } = useParams()
  const location = useLocation()
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
  const certRef = React.useRef(null)
  const [selectedPolicyForDocs, setSelectedPolicyForDocs] = useState(null)

  // Policy Details & Q&A State
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState(null)
  const [detailsTab, setDetailsTab] = useState(0)
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

  // Handle preset client from navigation state
  useEffect(() => {
    if (location.state?.presetClient) {
      setNewPolicy(prev => ({ ...prev, policy_holder_id: location.state.presetClient.id }))
      setCreateOpen(true)
      // Clear state after reading so it doesn't reopen on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

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


  const { data: templateForms = [] } = useQuery({
    queryKey: ['template-forms', selectedPolicy?.product_template_id],
    queryFn: async () => {
      if (!selectedPolicy?.product_template_id) return []
      const res = await formAPI.getTemplateForms(user.organization_id, selectedPolicy.product_template_id)
      return res.data || []
    },
    enabled: !!selectedPolicy?.product_template_id && detailsOpen
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
          <Button variant="outlined" startIcon={<DownloadIcon />} sx={{ borderRadius: 0, fontWeight: 600, color: '#5F6368', borderColor: '#DADCE0' }}>
            Export
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
                            width: 28, height: 28, borderRadius: 0, 
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
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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
          sx: { borderRadius: 0, border: '1px solid #000', boxShadow: '4px 4px 0px rgba(0,0,0,0.1)', minWidth: 200 },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => { setAnchorEl(null); setSelectedPolicy(selected); setDetailsOpen(true) }}>
          <ListItemIcon><ViewIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="View Details & Q&A" />
        </MenuItem>
        
        <MenuItem onClick={() => { setAnchorEl(null); setTimeout(() => certRef.current?.generate(), 100) }}>
          <ListItemIcon><DownloadIcon fontSize="small" color="primary" /></ListItemIcon>
          <ListItemText primary="Download Certificate" />
        </MenuItem>

        {selected?.status === 'pending' && (
          <MenuItem onClick={() => {
            setAnchorEl(null);
            publicAPI.initiatePesapalPayment(user.organization_id, selected.id, { amount: selected.premium, months_paid: 1 })
              .then(res => { 
                if(res.data?.redirect_url) window.location.href = res.data.redirect_url 
                else alert('Payment initialization failed: No redirect URL returned.')
              })
              .catch(err => {
                console.error('Payment error:', err);
                alert('Failed to initiate payment. Please check your network or PesaPal configuration.');
              });
          }}>
            <ListItemIcon><PaymentIcon fontSize="small" color="success" /></ListItemIcon>
            <ListItemText primary="Prompt Payment" />
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={() => setAnchorEl(null)} sx={{ color: '#D93025' }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText primary="Cancel Policy" />
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
                <TextField select fullWidth label="Policyholder" value={newPolicy.policy_holder_id} onChange={e => setNewPolicy(n => ({...n, policy_holder_id: e.target.value}))} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0} }}>
                  {(customers?.data || []).map(c => (
                    <MenuItem key={c.id} value={c.id}>{c.full_name} ({c.email})</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField select fullWidth label="Product Template" value={newPolicy.product_template_id} onChange={e => {
                  const t = (templates?.data?.items || []).find(item => item.id === e.target.value);
                  setNewPolicy(n => ({...n, product_template_id: e.target.value, premium: t?.base_premium || ''}));
                }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0} }}>
                  {(templates?.data?.items || []).map(t => (
                    <MenuItem key={t.id} value={t.id}>{t.name} (Code: {t.code || 'N/A'})</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Premium" type="number" value={newPolicy.premium} onChange={e => { setNewPolicy(n => ({...n, premium: e.target.value})); setCouponRes(null); }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0} }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Start Date" type="date" InputLabelProps={{ shrink: true }} value={newPolicy.start_date} onChange={e => setNewPolicy(n => ({...n, start_date: e.target.value}))} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0} }} />
              </Grid>
              
              {/* Coupon Field */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography sx={{ mb: 1.5, fontWeight: 700, fontSize: '0.85rem', color: '#202124' }}>Redeem Promotional Coupon</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField fullWidth size="small" placeholder="Enter coupon code" value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponRes(null); }} disabled={!newPolicy.premium} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0} }} />
                  <Button variant="outlined" onClick={validateCoupon} disabled={!couponCode || !newPolicy.premium || validatingCoupon} sx={{ borderRadius: 0, fontWeight: 700 }}>
                    {validatingCoupon ? <Spinner size={20} /> : 'Apply'}
                  </Button>
                </Box>
                {couponRes && (
                  <Box sx={{ mt: 2, p: 2, borderRadius: 0, bgcolor: couponRes.valid ? '#E6F4EA' : '#FCE8E6', color: couponRes.valid ? '#1E8E3E' : '#D93025', border: `1px solid ${couponRes.valid ? '#34A853' : '#EA4335'}` }}>
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
            <Button fullWidth variant="outlined" onClick={() => setCreateOpen(false)} sx={{ borderRadius: 0, py: 1.25, fontWeight: 600 }}>Cancel</Button>
            <Button fullWidth variant="contained" onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !newPolicy.premium || !newPolicy.policy_holder_id} sx={{ borderRadius: 0, py: 1.25, fontWeight: 700 }}>
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
                <Box sx={{ p: 2.5, borderRadius: 0, bgcolor: '#F1F3F4', border: '1px solid #DADCE0' }}>
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
                        sx={{ height: 22, fontSize: '0.7rem', fontWeight: 800, borderRadius: 0}}
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
                            sx={{ fontSize: '0.65rem', py: 0.25, borderRadius: 0, textTransform: 'none', fontWeight: 600 }}
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
              <Box sx={{ p: 2.5, borderRadius: 0, border: '1px solid #E8EAED', bgcolor: '#FDFDFD' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>1. Download Registration Artifacts</Typography>
                <Typography variant="body2" sx={{ color: '#5F6368', mb: 2.5, lineHeight: 1.5 }}>
                  Download the official product blueprints and registration forms. Sign them manually and scan for upload.
                </Typography>
                <Button variant="outlined" startIcon={<DownloadIcon />} fullWidth sx={{ borderRadius: 0, py: 1, fontWeight: 700 }}>
                  Download All Required Forms (.zip)
                </Button>
              </Box>

              {/* 2. UPLOAD SECTION */}
              <Box sx={{ p: 2.5, borderRadius: 0, border: '1px solid #E8EAED' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>2. Upload Signed & Scanned Proof</Typography>
                <Typography variant="body2" sx={{ color: '#5F6368', mb: 2.5, lineHeight: 1.5 }}>
                  Submit the digital scan of your manual endorsement.
                </Typography>
                <Button variant="contained" component="label" startIcon={<UploadIcon />} fullWidth sx={{ borderRadius: 0, py: 1.25, fontWeight: 700 }}>
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
                <Box sx={{ p: 2.5, borderRadius: 0, bgcolor: '#E8F0FE', border: '1px solid #1A73E8' }}>
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
                    sx={{ borderRadius: 0, py: 1.25, fontWeight: 800, boxShadow: '0 4px 12px rgba(52,168,83,0.2)' }}
                    disabled={approveDocsMutation.isPending}
                  >
                    {approveDocsMutation.isPending ? <Spinner size={24} color="inherit" /> : 'Approve & Unlock Payment'}
                  </Button>
                </Box>
              )}

              {selectedPolicyForDocs?.status === 'docs_approved' && (
                <Alert severity="success" variant="filled" sx={{ borderRadius: 0, fontWeight: 700 }}>
                  Compliance satisfied! Payment gateway active.
                </Alert>
              )}
            </Box>
          </Box>

          {/* Drawer Footer */}
          <Box sx={{ p: 3, bgcolor: '#F8F9FA', borderTop: '1px solid #E8EAED', display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => setDocModalOpen(false)} sx={{ borderRadius: 0, fontWeight: 700, px: 4 }}>Close Panel</Button>
          </Box>
        </Box>
      </Drawer>

      {/* Policy Details Drawer - Tabbed */}
      <Drawer
        anchor="right"
        open={detailsOpen}
        onClose={() => { setDetailsOpen(false); setDetailsTab(0); }}
        PaperProps={{ sx: { width: { xs: '100%', sm: 680 }, border: 'none', boxShadow: '-12px 0 40px rgba(0,0,0,0.12)' } }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#F8F9FE' }}>

          {/* Header */}
          <Box sx={{ background: 'linear-gradient(135deg, #1A237E 0%, #283593 100%)', p: 3, color: '#fff' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', p: 1.5, borderRadius: 0, display: 'flex' }}>
                  <PolicyIcon sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: 0.5 }}>
                    {selectedPolicy?.policy_number}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Typography sx={{ fontSize: '0.78rem', opacity: 0.7 }}>
                      {selectedPolicy?.product_info?.name || 'Insurance Policy'}
                    </Typography>
                    <Box sx={{ width: 4, height: 4, borderRadius: 0, bgcolor: 'rgba(255,255,255,0.5)' }} />
                    <Typography sx={{ fontSize: '0.78rem', opacity: 0.7 }}>
                      {selectedPolicy?.sales_channel?.replace(/_/g, ' ')}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <IconButton onClick={() => { setDetailsOpen(false); setDetailsTab(0); }} sx={{ color: 'rgba(255,255,255,0.7)', mt: -0.5 }}>
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Quick stats row */}
            <Box sx={{ display: 'flex', gap: 3, mt: 3 }}>
              {[
                { label: 'Premium', value: formatCurrency(selectedPolicy?.premium, selectedPolicy?.currency) },
                { label: 'Start', value: selectedPolicy?.start_date || 'N/A' },
                { label: 'End', value: selectedPolicy?.end_date || 'N/A' },
              ].map((s, i) => (
                <Box key={i}>
                  <Typography sx={{ fontSize: '0.68rem', opacity: 0.6, fontWeight: 700, textTransform: 'uppercase', mb: 0.3 }}>{s.label}</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.88rem' }}>{s.value}</Typography>
                </Box>
              ))}
              <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                <StatusBadge status={selectedPolicy?.status ? selectedPolicy.status.charAt(0).toUpperCase() + selectedPolicy.status.slice(1) : 'Unknown'} />
              </Box>
            </Box>
          </Box>

          {/* Tabs */}
          <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #E8EAED' }}>
            <Tabs value={detailsTab} onChange={(_, v) => setDetailsTab(v)} sx={{ '& .MuiTab-root': { fontWeight: 700, fontSize: '0.82rem', minHeight: 48, textTransform: 'none' } }}>
              <Tab icon={<PersonIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Overview" />
              <Tab icon={<FormIcon2 sx={{ fontSize: 16 }} />} iconPosition="start" label={`Forms (${templateForms.length})`} />
              <Tab icon={<QAIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Q&A" />
            </Tabs>
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, overflowY: 'auto' }}>

            {/* TAB 0: OVERVIEW */}
            {detailsTab === 0 && (
              <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>

                {/* Policyholder */}
                {selectedPolicy?.holder_info && (
                  <Box sx={{ bgcolor: '#fff', borderRadius: 0, border: '1px solid #E8EAED', overflow: 'hidden' }}>
                    <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#F8F9FE', borderBottom: '1px solid #E8EAED' }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.78rem', color: '#1A237E', textTransform: 'uppercase', letterSpacing: 0.8 }}>Policyholder</Typography>
                    </Box>
                    <Box sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ width: 52, height: 52, bgcolor: '#E8F0FE', color: '#1A73E8', fontWeight: 800, fontSize: '1.2rem' }}>
                          {selectedPolicy.holder_info.first_name?.[0]?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 800, fontSize: '1rem' }}>
                            {selectedPolicy.holder_info.first_name} {selectedPolicy.holder_info.last_name}
                          </Typography>
                          <Typography sx={{ fontSize: '0.8rem', color: '#5F6368' }}>{selectedPolicy.holder_info.email}</Typography>
                        </Box>
                        <Chip label={selectedPolicy.holder_info.kyc_status?.toUpperCase() || 'N/A'}
                          size="small" color={selectedPolicy.holder_info.kyc_status === 'approved' ? 'success' : 'warning'}
                          sx={{ ml: 'auto', fontWeight: 800, borderRadius: 0, height: 22, fontSize: '0.68rem' }} />
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography sx={{ fontSize: '0.68rem', color: '#9AA0A6', fontWeight: 700, textTransform: 'uppercase', mb: 0.3 }}>NIN</Typography>
                          <Typography sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.88rem' }}>
                            {selectedPolicy.holder_info.kyc_details?.nin || 'Not Provided'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography sx={{ fontSize: '0.68rem', color: '#9AA0A6', fontWeight: 700, textTransform: 'uppercase', mb: 0.3 }}>Phone</Typography>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.88rem' }}>
                            {selectedPolicy.holder_info.phone || 'N/A'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                )}

                {/* Policy Details */}
                <Box sx={{ bgcolor: '#fff', borderRadius: 0, border: '1px solid #E8EAED', overflow: 'hidden' }}>
                  <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#F8F9FE', borderBottom: '1px solid #E8EAED' }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.78rem', color: '#1A237E', textTransform: 'uppercase', letterSpacing: 0.8 }}>Policy Details</Typography>
                  </Box>
                  <Box sx={{ p: 2.5 }}>
                    <Grid container spacing={2}>
                      {[
                        { label: 'Policy Number', value: selectedPolicy?.policy_number, mono: true },
                        { label: 'Sales Channel', value: selectedPolicy?.sales_channel?.replace(/_/g, ' ') },
                        { label: 'Product', value: selectedPolicy?.product_info?.name || 'N/A' },
                        { label: 'Template', value: selectedPolicy?.template_info?.name || 'Standard' },
                        { label: 'Effective From', value: selectedPolicy?.start_date || 'N/A' },
                        { label: 'Termination', value: selectedPolicy?.end_date || 'N/A' },
                      ].map((item, i) => (
                        <Grid item xs={6} key={i}>
                          <Typography sx={{ fontSize: '0.68rem', color: '#9AA0A6', fontWeight: 700, textTransform: 'uppercase', mb: 0.3 }}>{item.label}</Typography>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', fontFamily: item.mono ? 'monospace' : 'inherit' }}>{item.value}</Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Box>

                {/* Payment Progress */}
                <Box sx={{ bgcolor: '#fff', borderRadius: 0, border: '1px solid #E8EAED', overflow: 'hidden' }}>
                  <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#F8F9FE', borderBottom: '1px solid #E8EAED' }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.78rem', color: '#1A237E', textTransform: 'uppercase', letterSpacing: 0.8 }}>Payment Progress</Typography>
                  </Box>
                  <Box sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        {selectedPolicy?.installments_paid || 0} of {selectedPolicy?.total_installments || 1} installments paid
                      </Typography>
                      <Typography sx={{ fontWeight: 800, color: '#1A73E8', fontSize: '0.85rem' }}>
                        {Math.round(((selectedPolicy?.installments_paid || 0) / (selectedPolicy?.total_installments || 1)) * 100)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={((selectedPolicy?.installments_paid || 0) / (selectedPolicy?.total_installments || 1)) * 100}
                      sx={{ height: 8, borderRadius: 0, bgcolor: '#E8EAED', '& .MuiLinearProgress-bar': { borderRadius: 0, bgcolor: '#1A73E8' } }}
                    />
                    {selectedPolicy?.next_payment_date && (
                      <Typography sx={{ fontSize: '0.75rem', color: '#5F6368', mt: 1 }}>
                        Next payment: <b>{new Date(selectedPolicy.next_payment_date).toLocaleDateString('en-GB', { dateStyle: 'long' })}</b>
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            )}

            {/* TAB 1: COMPLIANCE FORMS */}
            {detailsTab === 1 && (
              <Box sx={{ p: 3 }}>
                {templateForms.length === 0 ? (
                  <Alert severity="info" sx={{ borderRadius: 0}}>No compliance forms are linked to this policy's product template.</Alert>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {templateForms.map((form, fi) => (
                      <Accordion key={form.id || fi} defaultExpanded={fi === 0} sx={{ borderRadius: 0, border: '1px solid #E8EAED', boxShadow: 'none', '&:before': { display: 'none' } }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#F8F9FE', borderRadius: 0, px: 2.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                            <FormIcon2 sx={{ fontSize: 18, color: '#1A73E8' }} />
                            <Typography sx={{ fontWeight: 800, fontSize: '0.88rem' }}>{form.name}</Typography>
                            {form.is_required && <Chip label="Required" size="small" color="error" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, borderRadius: 0}} />}
                            <Chip label={`${(form.fields || []).length} fields`} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, borderRadius: 0, ml: 'auto', bgcolor: '#E8F0FE', color: '#1A73E8' }} />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 2.5, bgcolor: '#fff' }}>
                          {form.description && (
                            <Typography sx={{ fontSize: '0.8rem', color: '#5F6368', mb: 2, pb: 2, borderBottom: '1px dashed #E8EAED' }}>{form.description}</Typography>
                          )}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {(form.fields || []).map((field, fli) => {
                              const context = selectedPolicy?.context || {};
                              const fieldValue = context[field.field_key] || context[field.label] || 
                                                context[field.field_key?.toLowerCase()] || context[field.label?.toLowerCase()];
                              
                              if (field.field_type === 'section') return (
                                <Typography key={fli} sx={{ fontWeight: 900, fontSize: '0.78rem', color: '#1A237E', textTransform: 'uppercase', letterSpacing: 0.8, mt: 1, pt: 1, borderTop: '1px solid #E8EAED' }}>{field.label}</Typography>
                              )
                              
                              if (field.field_type === 'table') {
                                const tableData = (Array.isArray(fieldValue) && fieldValue.length > 0) ? fieldValue : (field.prefill_rows || []);
                                return (
                                  <Box key={fli}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', mb: 1, color: '#202124' }}>{field.label}</Typography>
                                    <Box sx={{ overflow: 'auto', borderRadius: 0, border: '1px solid #E8EAED' }}>
                                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                                        <thead>
                                          <tr style={{ background: '#F8F9FE' }}>
                                            {(field.columns || []).map((col, ci) => (
                                              <th key={ci} style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'left', borderBottom: '1px solid #E8EAED', color: '#5F6368' }}>{col.label}</th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {tableData.map((row, ri) => (
                                            <tr key={ri} style={{ borderBottom: '1px solid #F1F3F4' }}>
                                              {(field.columns || []).map((col, ci) => {
                                                const val = row[col.key] || row[col.key?.toLowerCase()] || row[col.label] || <span style={{ color: '#BDC1C6' }}>—</span>;
                                                return <td key={ci} style={{ padding: '8px 12px' }}>{val}</td>;
                                              })}
                                            </tr>
                                          ))}
                                          {tableData.length === 0 && Array.from({ length: field.min_rows || 1 }).map((_, ri) => (
                                            <tr key={ri}>
                                              {(field.columns || []).map((col, ci) => (
                                                <td key={ci} style={{ padding: '8px 12px', color: '#BDC1C6', fontStyle: 'italic' }}>Enter {col.label}...</td>
                                              ))}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </Box>
                                  </Box>
                                );
                              }
                              
                              if (field.field_type === 'checkbox') return (
                                <Box key={fli} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5, borderBottom: '1px solid #F1F3F4' }}>
                                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{field.label}</Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: fieldValue ? '#1E8E3E' : '#5F6368' }}>
                                      {fieldValue ? '☑ YES' : '☐ NO'}
                                    </Typography>
                                    <Chip label={field.is_required ? 'Required' : 'Optional'} size="small" sx={{ height: 18, fontSize: '0.65rem' }} color={field.is_required ? 'warning' : 'default'} />
                                  </Box>
                                </Box>
                              )
                              
                              return (
                                <Box key={fli} sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', py: 1.5, borderBottom: '1px solid #F1F3F4' }}>
                                  <Box>
                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#202124' }}>{field.label}</Typography>
                                    {field.help_text && <Typography sx={{ fontSize: '0.72rem', color: '#9AA0A6', mt: 0.3 }}>{field.help_text}</Typography>}
                                  </Box>
                                  <Box sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: fieldValue ? '#1A237E' : '#BDC1C6' }}>
                                      {fieldValue !== undefined && fieldValue !== null ? String(fieldValue) : 'Not Provided'}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 0.8 }}>
                                      <Chip label={field.field_type} size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#F1F3F4', color: '#5F6368' }} />
                                      {field.is_required && <Chip label="Required" size="small" color="warning" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700 }} />}
                                    </Box>
                                  </Box>
                                </Box>
                              )
                            })}
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {/* TAB 2: Q&A */}
            {detailsTab === 2 && (
              <Box sx={{ p: 3 }}>
                <Box sx={{ mb: 3, p: 2.5, bgcolor: '#fff', borderRadius: 0, border: '1px solid #E8EAED' }}>
                  <TextField
                    fullWidth multiline rows={2}
                    placeholder="Ask clarifying questions about this policy..."
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    disabled={createQuestionMutation.isPending}
                    sx={{ bgcolor: '#F8F9FE', '& .MuiOutlinedInput-root': { borderRadius: 0} }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
                    <Button variant="contained" onClick={() => createQuestionMutation.mutate(newQuestion)}
                      disabled={!newQuestion.trim() || createQuestionMutation.isPending}
                      startIcon={createQuestionMutation.isPending ? <Spinner size={16} color="inherit" /> : <SendIcon />}
                      sx={{ borderRadius: 0, px: 3, fontWeight: 700 }}>
                      Post Question
                    </Button>
                  </Box>
                </Box>

                {questionsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><Spinner size={32} /></Box>
                ) : (
                  <List sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, p: 0 }}>
                    {(questions || []).length === 0 && (
                      <Alert severity="info" variant="outlined" sx={{ borderRadius: 0, borderStyle: 'dashed' }}>
                        No expert discussions found for this policy yet.
                      </Alert>
                    )}
                    {(questions || []).map((q) => (
                      <Box key={q.id} sx={{ bgcolor: '#fff', borderRadius: 0, border: '1px solid #E8EAED', p: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                          <Avatar sx={{ width: 30, height: 30, bgcolor: '#E8F0FE', color: '#1A73E8', fontWeight: 800, fontSize: '0.78rem' }}>
                            {q.user_name?.charAt(0) || 'U'}
                          </Avatar>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{q.user_name || 'System User'}</Typography>
                          <Typography sx={{ fontSize: '0.72rem', color: '#9AA0A6', ml: 'auto' }}>{new Date(q.created_at).toLocaleDateString()}</Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.85rem', color: '#202124', lineHeight: 1.5, mb: 1.5, pl: 5 }}>{q.question}</Typography>

                        {q.answer && (
                          <Box sx={{ ml: 5, p: 2, bgcolor: '#E6F4EA', borderRadius: 0, borderLeft: '4px solid #34A853' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
                              <Avatar sx={{ width: 22, height: 22, bgcolor: '#1A73E8', color: 'white', fontSize: '0.65rem' }}>
                                {q.answered_by_name?.charAt(0) || 'A'}
                              </Avatar>
                              <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#137333' }}>
                                {q.answered_by_name} <Typography component="span" sx={{ fontSize: '0.68rem', fontWeight: 400 }}>({q.answered_by_role})</Typography>
                              </Typography>
                            </Box>
                            <Typography sx={{ fontSize: '0.83rem', color: '#137333', lineHeight: 1.5 }}>{q.answer}</Typography>
                          </Box>
                        )}

                        {!q.answer && (user?.role === 'organization_admin' || user?.role === 'underwriter' || user?.role === 'agent') && (
                          <Box sx={{ ml: 5, mt: 1.5 }}>
                            <TextField fullWidth multiline rows={2} size="small"
                              placeholder="Type official response..."
                              value={answerInputs[q.id] || ''}
                              onChange={(e) => setAnswerInputs(prev => ({ ...prev, [q.id]: e.target.value }))}
                              disabled={answerQuestionMutation.isPending}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0} }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                              <Button size="small" variant="contained"
                                onClick={() => answerQuestionMutation.mutate({ questionId: q.id, answer: answerInputs[q.id] })}
                                disabled={!answerInputs[q.id]?.trim() || answerQuestionMutation.isPending}
                                sx={{ borderRadius: 0, fontWeight: 700 }}>
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
            )}
          </Box>

          {/* Footer */}
          <Box sx={{ p: 2.5, borderTop: '1px solid #E8EAED', bgcolor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {(selectedPolicy?.status === 'pending' || selectedPolicy?.status === 'documentation_review') && (
              <Button variant="outlined" color="primary" startIcon={<DocsIcon />}
                onClick={() => { setDetailsOpen(false); handleOpenDocGate(selectedPolicy); }}
                sx={{ borderRadius: 0, fontWeight: 700 }}>
                Manage Documents
              </Button>
            )}
            <Box sx={{ ml: 'auto' }}>
              <Button variant="outlined" onClick={() => { setDetailsOpen(false); setDetailsTab(0); }} sx={{ borderRadius: 0, fontWeight: 700, px: 4 }}>
                Close
              </Button>
            </Box>
          </Box>
        </Box>
      </Drawer>

      <PolicyCertificateGenerator ref={certRef} policy={selected} user={user} />
    </Box>
  )
}