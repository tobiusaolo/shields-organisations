import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { policyAPI, claimAPI, commissionAPI, tenancyAPI } from '../services/api'
import { formatCurrencyShort } from '../utils/formatters'
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Chip,
  Button,
  Select,
  MenuItem,
  FormControl,
  Skeleton,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  Avatar,
  Fade,
} from '@mui/material'
import {
  Description as PolicyIcon,
  Assignment as ClaimIcon,
  Payments as CommissionIcon,
  People as UserIcon,
  Shield as ShieldIcon,
  Add as AddIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Verified as VerifiedIcon,
  NavigateNext as NavNextIcon,
} from '@mui/icons-material'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

const PIE_COLORS = ['#1A73E8', '#34A853', '#F9AB00', '#EA4335']

const CHART_DATA = [
  { month: 'Jan', policies: 12, claims: 5, revenue: 350 },
  { month: 'Feb', policies: 18, claims: 8, revenue: 520 },
  { month: 'Mar', policies: 24, claims: 12, revenue: 680 },
  { month: 'Apr', policies: 32, claims: 15, revenue: 890 },
  { month: 'May', policies: 28, claims: 10, revenue: 750 },
  { month: 'Jun', policies: 42, claims: 18, revenue: 1200 },
  { month: 'Jul', policies: 38, claims: 14, revenue: 1050 },
]

const PIE_DATA = [
  { name: 'Life Insurance', value: 35 },
  { name: 'Health Insurance', value: 28 },
  { name: 'Motor Insurance', value: 22 },
  { name: 'Others', value: 15 },
]

function StatusBadge({ status }) {
  const cfg = {
    Active: { color: '#1E8E3E', bg: '#E6F4EA', dot: '#34A853', label: 'Active' },
    Pending: { color: '#E37400', bg: '#FEF3E2', dot: '#F9AB00', label: 'Pending' },
    Expired: { color: '#D93025', bg: '#FCE8E6', dot: '#EA4335', label: 'Expired' },
    Approved: { color: '#1E8E3E', bg: '#E6F4EA', dot: '#34A853', label: 'Approved' },
    Rejected: { color: '#D93025', bg: '#FCE8E6', dot: '#EA4335', label: 'Rejected' },
    'Under Review': { color: '#1A73E8', bg: '#E8F0FE', dot: '#4A90F7', label: 'Under Review' },
  }[status] || { color: '#5F6368', bg: '#F1F3F4', dot: '#9AA0A6', label: status }

  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.6,
      px: 1.25, py: 0.4,
      borderRadius: 6, bgcolor: cfg.bg,
    }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: cfg.dot }} />
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: cfg.color, lineHeight: 1 }}>
        {cfg.label}
      </Typography>
    </Box>
  )
}

function KPICard({ title, icon: Icon, color, bg, trend, trendVal, trendLabel, value, format, loading }) {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        border: '1px solid #E8EAED',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon sx={{ fontSize: 22, color }} />
          </Box>
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 0.4,
            px: 1, py: 0.35,
            bgcolor: trend === 'up' ? '#E6F4EA' : '#FCE8E6',
            borderRadius: 6,
          }}>
            {trend === 'up'
              ? <ArrowUpIcon sx={{ fontSize: 12, color: '#1E8E3E' }} />
              : <ArrowDownIcon sx={{ fontSize: 12, color: '#D93025' }} />
            }
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: trend === 'up' ? '#1E8E3E' : '#D93025' }}>
              {trendVal}
            </Typography>
          </Box>
        </Box>
        {loading ? (
          <>
            <Skeleton width="60%" height={36} />
            <Skeleton width="80%" height={18} sx={{ mt: 0.5 }} />
          </>
        ) : (
          <>
            <Typography sx={{ fontWeight: 800, fontSize: '1.8rem', color: '#202124', lineHeight: 1.1, mb: 0.25 }}>
              {format(value)}
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#5F6368', fontWeight: 500 }}>
              {title}
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#9AA0A6', mt: 0.25 }}>
              {trendVal} {trendLabel}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  )
}

const CustomTooltipRevenue = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <Box sx={{ bgcolor: '#202124', color: '#fff', px: 2, py: 1.5, borderRadius: 2, boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
      <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', mb: 0.5 }}>{label}</Typography>
      {payload.map((p) => (
        <Typography key={p.dataKey} sx={{ fontSize: '0.75rem', color: p.color }}>
          {p.name}: {p.dataKey === 'revenue' ? formatCurrencyShort(p.value * 1000) : p.value}
        </Typography>
      ))}
    </Box>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [dateRange, setDateRange] = useState('30d')

  const { data: policiesData, isLoading: policiesLoading } = useQuery({
    queryKey: ['policies', user?.organization_id, dateRange],
    queryFn: async () => {
      const res = await policyAPI.getPolicies(user?.organization_id, { limit: 5 })
      return res.data
    },
    enabled: !!user?.organization_id
  })

  const { data: claimsData, isLoading: claimsLoading } = useQuery({
    queryKey: ['claims', user?.organization_id, dateRange],
    queryFn: async () => {
      const res = await claimAPI.getClaims(user?.organization_id, { limit: 5 })
      return res.data
    },
    enabled: !!user?.organization_id
  })

  const { data: memData } = useQuery({
    queryKey: ['members', user?.id],
    queryFn: async () => {
      const res = await tenancyAPI.getMemberships(user?.id)
      return res.data
    },
    enabled: !!user?.id
  })
  
  const myMemId = memData?.items?.find((m) => m.organization_id === user?.organization_id)?.id

  const { data: ledgerData, isLoading: ledgerLoading } = useQuery({
    queryKey: ['ledger', user?.organization_id, myMemId, dateRange],
    queryFn: async () => {
      const res = await commissionAPI.getLedger(user?.organization_id, myMemId)
      return res.data
    },
    enabled: !!user?.organization_id && !!myMemId
  })

  const isManagement = ['admin', 'organization_admin', 'platform_admin'].includes(user?.role)

  const { data: unverifiedPolicies } = useQuery({
    queryKey: ['policies', user?.organization_id, 'documentation_review'],
    queryFn: async () => {
      const res = await policyAPI.getPolicies(user?.organization_id, { status: 'documentation_review', limit: 1 })
      return res.data
    },
    enabled: !!user?.organization_id && isManagement
  })

  const { data: pendingPolicies } = useQuery({
    queryKey: ['pending-policies', user?.organization_id],
    queryFn: async () => {
      const res = await tenancyAPI.getOrganizationPendingPolicies(user?.organization_id)
      return res.data
    },
    enabled: !!user?.organization_id && isManagement
  })

  const loading = policiesLoading || claimsLoading || ledgerLoading

  const KPI_CARDS = [
    {
      key: 'activePolicies', title: isManagement ? 'Total Policies' : 'My Policies', icon: PolicyIcon, color: '#1A73E8', bg: '#E8F0FE', trend: 'up', trendVal: `+${policiesData?.total || 0}`, trendLabel: 'recorded',
      value: policiesData?.total || 0, format: (v) => v.toLocaleString(),
      visible: true
    },
    {
      key: 'pendingClaims', title: isManagement ? 'Claims Filed' : 'My Claims', icon: ClaimIcon, color: '#E37400', bg: '#FEF3E2', trend: 'down', trendVal: `+${claimsData?.total || 0}`, trendLabel: 'filed',
      value: claimsData?.total || 0, format: (v) => v.toLocaleString(),
      visible: true
    },
    {
      key: 'pendingPayments', title: 'Pending Payments', icon: ShieldIcon, color: '#F9AB00', bg: '#FEF3E2', trend: 'up', trendVal: `${pendingPolicies?.length || 0}`, trendLabel: 'awaiting payment',
      value: pendingPolicies?.length || 0, format: (v) => v.toLocaleString(),
      visible: isManagement
    },
    {
      key: 'approvals', title: 'Needs Approval', icon: ShieldIcon, color: '#D93025', bg: '#FCE8E6', trend: 'up', trendVal: `${unverifiedPolicies?.total || 0}`, trendLabel: 'pending',
      value: unverifiedPolicies?.total || 0, format: (v) => v.toLocaleString(),
      visible: isManagement
    },
    {
      key: 'commissions', title: 'Earnings', icon: CommissionIcon, color: '#1E8E3E', bg: '#E6F4EA', trend: 'up', trendVal: '+', trendLabel: 'earned',
      value: ledgerData?.items?.filter(l => l.entry_type === 'earned').reduce((s, l) => s + Number(l.amount), 0) || 0,
      format: (v) => formatCurrencyShort(v),
      visible: true
    },
    {
      key: 'teamMembers', title: 'Team Size', icon: UserIcon, color: '#7B61FF', bg: '#F0EDFF', trend: 'up', trendVal: '+1', trendLabel: 'since join',
      value: memData?.items?.length || 1, format: (v) => v.toLocaleString(),
      visible: isManagement
    },
  ].filter(c => c.visible)

  const recentPolicies = policiesData?.items || []
  const recentClaims = claimsData?.items || []

  return (
    <Box>
      {/* Branded Welcome Header */}
      <Box sx={{ mb: 5 }}>
        <Grid container alignItems="center" spacing={3}>
            <Grid item>
                <Avatar 
                    src={user?.logo} 
                    variant="rounded" 
                    sx={{ width: 64, height: 64, bgcolor: '#FFFFFF', border: '1px solid #E8EAED', borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }} 
                >
                    <VerifiedIcon sx={{ color: '#E8EAED', fontSize: 32 }} />
                </Avatar>
            </Grid>
            <Grid item xs>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#202124', letterSpacing: '-0.02em', mb: 0.5 }}>
                    Welcome back, {user?.first_name || 'Partner'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography sx={{ fontSize: '0.95rem', color: '#5F6368', fontWeight: 500 }}>
                        {user?.organization_name || 'System Platform'}
                    </Typography>
                    {user?.kyc_status === 'verified' && (
                        <Chip 
                            icon={<VerifiedIcon sx={{ fontSize: '14px !important' }} />} 
                            label="Verified Partner" 
                            size="small" 
                            sx={{ bgcolor: '#E8F0FE', color: '#1A73E8', fontWeight: 700, height: 24, fontSize: '0.7rem' }} 
                        />
                    )}
                </Box>
            </Grid>
            <Grid item>
                <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                    <Typography sx={{ fontWeight: 700, color: '#202124', fontSize: '1.25rem' }}>
                        {new Date().toLocaleDateString('en-UG', { month: 'short', day: 'numeric' })}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: '#9AA0A6', fontWeight: 500 }}>
                        {new Date().toLocaleDateString('en-UG', { weekday: 'long' })}
                    </Typography>
                </Box>
            </Grid>
        </Grid>
      </Box>

      {/* Date Range & Quick Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4, gap: 1.5 }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              sx={{ bgcolor: '#fff', fontSize: '0.85rem', borderRadius: 3, border: '1px solid #E8EAED' }}
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/policies')}
            sx={{ borderRadius: 3, fontWeight: 700, px: 3, boxShadow: '0 4px 12px rgba(26,115,232,0.2)' }}
          >
            New Policy
          </Button>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {KPI_CARDS.map((card) => {
          const { key, ...cardProps } = card
          return (
            <Grid item xs={12} sm={6} xl={KPI_CARDS.length === 3 ? 4 : 3} key={key}>
              <KPICard {...cardProps} loading={loading} />
            </Grid>
          )
        })}
      </Grid>

      {/* Analytics Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={isManagement ? 8 : 12}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 5, border: '1px solid #E8EAED' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#202124' }}>
                  Business Trajectory
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', color: '#5F6368' }}>
                  Growth trend of policies and revenue
                </Typography>
              </Box>
            </Box>
            {loading ? (
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 4 }} />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={CHART_DATA} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1A73E8" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1A73E8" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#F1F3F4" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9AA0A6', fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 12, fill: '#9AA0A6', fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <RTooltip content={<CustomTooltipRevenue />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#1A73E8" strokeWidth={3} fill="url(#colorRevenue)" dot={{ r: 4, fill: '#1A73E8', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {isManagement && (
            <Grid item xs={12} lg={4}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 5, border: '1px solid #E8EAED', height: '100%' }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#202124', mb: 0.5 }}>
                Portfolio Mix
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', color: '#5F6368', mb: 4 }}>
                Distribution by category
                </Typography>
                {loading ? (
                <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
                ) : (
                <>
                    <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                        <Pie
                        data={PIE_DATA}
                        cx="50%" cy="50%"
                        innerRadius={65} outerRadius={95}
                        paddingAngle={5}
                        dataKey="value"
                        >
                        {PIE_DATA.map((_, index) => (
                            <Cell key={index} fill={PIE_COLORS[index]} />
                        ))}
                        </Pie>
                        <RTooltip formatter={(v) => `${v}%`} />
                    </PieChart>
                    </ResponsiveContainer>
                    <Box sx={{ mt: 3 }}>
                    {PIE_DATA.map((item, i) => (
                        <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: 3, bgcolor: PIE_COLORS[i] }} />
                            <Typography sx={{ fontSize: '0.85rem', color: '#5F6368', fontWeight: 500 }}>{item.name}</Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#202124' }}>{item.value}%</Typography>
                        </Box>
                    ))}
                    </Box>
                </>
                )}
            </Paper>
            </Grid>
        )}
      </Grid>

      {/* Tables Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={6}>
          <Paper elevation={0} sx={{ borderRadius: 5, border: '1px solid #E8EAED', overflow: 'hidden' }}>
            <Box sx={{ px: 4, py: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F3F4' }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#202124' }}>Recent Policies</Typography>
              <Button size="small" onClick={() => navigate('/policies')} sx={{ fontWeight: 700 }}>View All</Button>
            </Box>
            <Box>
              {loading
                ? [1, 2, 3].map((i) => <Box key={i} sx={{ p: 4 }}><Skeleton height={24} /></Box>)
                : recentPolicies.map((p, i) => (
                    <Box key={p.id} sx={{ px: 4, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < recentPolicies.length - 1 ? '1px solid #F1F3F4' : 'none' }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 700 }}>{p.policy_number}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#5F6368' }}>{p.product_template_id}</Typography>
                      </Box>
                      <StatusBadge status={p.status ? p.status.charAt(0).toUpperCase() + p.status.slice(1) : ''} />
                    </Box>
                  ))
              }
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={6}>
          <Paper elevation={0} sx={{ borderRadius: 5, border: '1px solid #E8EAED', overflow: 'hidden' }}>
            <Box sx={{ px: 4, py: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F3F4' }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#202124' }}>Recent Claims</Typography>
              <Button size="small" onClick={() => navigate('/claims')} sx={{ fontWeight: 700 }}>View All</Button>
            </Box>
            <Box>
              {loading
                ? [1, 2, 3].map((i) => <Box key={i} sx={{ p: 4 }}><Skeleton height={24} /></Box>)
                : recentClaims.map((c, i) => (
                    <Box key={c.id} sx={{ px: 4, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < recentClaims.length - 1 ? '1px solid #F1F3F4' : 'none' }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 700 }}>{c.id.split('-')[0].toUpperCase()}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#5F6368' }}>{c.claim_type?.replace('_', ' ')}</Typography>
                      </Box>
                      <StatusBadge status={c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1) : ''} />
                    </Box>
                  ))
              }
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Mandatory KYC Banner for unverified orgs */}
      {user?.kyc_status !== 'verified' && (
        <Fade in={true} timeout={1000}>
            <Paper elevation={0} sx={{
                p: 4, borderRadius: 5,
                background: user?.kyc_status === 'submitted' 
                    ? 'linear-gradient(135deg, #FFF8E1 0%, #FFFDE7 100%)' 
                    : 'linear-gradient(135deg, #FCE8E6 0%, #FEF7F6 100%)',
                border: user?.kyc_status === 'submitted' ? '1px solid #FFE082' : '1px solid #F8B4AF',
                display: 'flex', alignItems: 'center', gap: 3,
            }}>
                <Box sx={{ 
                    width: 56, height: 56, borderRadius: 3, 
                    bgcolor: user?.kyc_status === 'submitted' ? '#F9AB00' : '#D93025', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                }}>
                    <ShieldIcon sx={{ color: '#fff', fontSize: 28 }} />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#202124', mb: 0.5 }}>
                        {user?.kyc_status === 'submitted' ? 'Verification in Progress' : 'Action Required: KYC Verification'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.9rem', color: '#5F6368' }}>
                        {user?.kyc_status === 'submitted' 
                            ? 'Our compliance team is reviewing your documents. You will receive an email once verified.' 
                            : 'Complete your Know Your Customer (KYC) filing to unlock full issuance and claims processing capabilities.'}
                    </Typography>
                </Box>
                <Button 
                    variant="contained" 
                    onClick={() => navigate('/kyc')}
                    sx={{ 
                        borderRadius: 3, fontWeight: 700, px: 4, 
                        bgcolor: user?.kyc_status === 'submitted' ? '#F9AB00' : '#D93025',
                        '&:hover': { bgcolor: user?.kyc_status === 'submitted' ? '#E37400' : '#C5221F' }
                    }}
                >
                    {user?.kyc_status === 'submitted' ? 'View Status' : 'Start Verification'}
                </Button>
            </Paper>
        </Fade>
      )}
    </Box>
  )
}
