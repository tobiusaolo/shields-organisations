import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { commissionAPI, tenancyAPI } from '../services/api'
import { formatCurrency, formatCurrencyShort } from '../utils/formatters'
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
  Chip,
  Skeleton,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Avatar,
  Divider,
  Pagination,
} from '@mui/material'
import {
  Payments as PaymentsIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as WalletIcon,
  Schedule as ScheduleIcon,
  CheckCircle as PaidIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Cell,
} from 'recharts'

// Deleted LEDGER mock payload

const CHART_DATA = [
  { month: 'Aug', amount: 42000 },
  { month: 'Sep', amount: 56000 },
  { month: 'Oct', amount: 48000 },
  { month: 'Nov', amount: 72000 },
  { month: 'Dec', amount: 65000 },
  { month: 'Jan', amount: 87000 },
]

const STATUS_CFG = {
  accrued: { label: 'Accrued', color: '#E37400', bg: '#FEF3E2', dot: '#F9AB00' },
  confirmed: { label: 'Confirmed', color: '#1A73E8', bg: '#E8F0FE', dot: '#1A73E8' },
  paid: { label: 'Paid', color: '#1E8E3E', bg: '#E6F4EA', dot: '#34A853' },
}

const TYPE_CFG = {
  earned: { color: '#1A73E8', bg: '#E8F0FE' },
  bonus: { color: '#7B61FF', bg: '#F0EDFF' },
  clawback: { color: '#D93025', bg: '#FCE8E6' },
  adjustment: { color: '#E37400', bg: '#FEF3E2' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || { label: status, color: '#5F6368', bg: '#F1F3F4', dot: '#9AA0A6' }
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1.25, py: 0.4, borderRadius: 0, bgcolor: cfg.bg }}>
      <Box sx={{ width: 6, height: 6, borderRadius: 0, bgcolor: cfg.dot }} />
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: cfg.color, lineHeight: 1 }}>{cfg.label}</Typography>
    </Box>
  )
}

export default function Commissions() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const rowsPerPage = 6

  // First fetch the user's membership to get their membership ID
  const { data: membershipsData } = useQuery({
    queryKey: ['memberships', user?.id],
    queryFn: async () => {
      const res = await tenancyAPI.getMemberships(user?.id)
      return res.data
    },
    enabled: !!user?.id
  })

  // Identify the membership belonging to the current organization
  const myMembershipId = membershipsData?.items?.find((m) => m.organization_id === user?.organization_id)?.id

  const { data: ledgerRes, isLoading: ledgerLoading } = useQuery({
    queryKey: ['ledger', user?.organization_id, myMembershipId, page],
    queryFn: () => commissionAPI.getLedger(user.organization_id, myMembershipId, {
      skip: (page - 1) * rowsPerPage,
      limit: rowsPerPage
    }),
    enabled: !!user?.organization_id && !!myMembershipId
  })

  const { data: totalsRes, isLoading: totalsLoading } = useQuery({
    queryKey: ['ledger-totals', user?.organization_id, myMembershipId],
    queryFn: () => commissionAPI.getLedgerTotals(user.organization_id, myMembershipId),
    enabled: !!user?.organization_id && !!myMembershipId
  })

  const loading = ledgerLoading || totalsLoading
  const ledger = ledgerRes?.data?.items || []
  const totalItems = ledgerRes?.data?.total || 0
  const totals = totalsRes?.data || {}

  const totalEarned = totals.total_earned || 0
  const pending = totals.accrued || 0
  const paid = totals.paid || 0
  const clawbacks = totals.clawbacks || 0

  const paginated = ledger

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#202124', mb: 0.5 }}>Commissions</Typography>
          <Typography sx={{ color: '#5F6368', fontSize: '0.9rem' }}>Agent commission ledger and payout tracking</Typography>
        </Box>
        <Button variant="outlined" startIcon={<AddIcon />} sx={{ borderRadius: 0, fontWeight: 700 }}>
          Request Payout
        </Button>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {[
          { label: 'Total Earned', value: totalEarned, icon: TrendingUpIcon, color: '#1A73E8', bg: '#E8F0FE' },
          { label: 'Pending Payout', value: pending, icon: ScheduleIcon, color: '#E37400', bg: '#FEF3E2' },
          { label: 'Total Paid', value: paid, icon: PaidIcon, color: '#1E8E3E', bg: '#E6F4EA' },
          { label: 'Clawbacks', value: clawbacks, icon: WalletIcon, color: '#D93025', bg: '#FCE8E6' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Grid item xs={6} md={3} key={label}>
            <Card elevation={0} sx={{
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.10)' },
            }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 0, bgcolor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
                  <Icon sx={{ fontSize: 20, color }} />
                </Box>
                {loading
                  ? <Skeleton width="70%" height={28} />
                  : <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: '#202124' }}>
                      {formatCurrencyShort(value, user?.currency)}
                    </Typography>
                }
                <Typography sx={{ fontSize: '0.78rem', color: '#5F6368', mt: 0.25 }}>{label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* Bar Chart */}
        <Grid item xs={12} md={7}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#202124', mb: 0.5 }}>Monthly Earnings</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#5F6368', mb: 2.5 }}>Last 6 months commission trend</Typography>
            {loading
              ? <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 0}} />
              : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={CHART_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#F1F3F4" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9AA0A6' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#9AA0A6' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}K`} />
                    <RTooltip formatter={(v) => [formatCurrency(v, user?.currency), 'Commission']} contentStyle={{ borderRadius: 0, border: '1px solid #E8EAED', fontSize: '0.8rem' }} />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                      {CHART_DATA.map((_, i) => (
                        <Cell key={i} fill={i === CHART_DATA.length - 1 ? '#1A73E8' : '#C5D4F5'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </Paper>
        </Grid>

        {/* Payout Progress */}
        <Grid item xs={12} md={5}>
          <Paper elevation={1} sx={{ p: 3, height: '100%' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#202124', mb: 0.5 }}>Payout Progress</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#5F6368', mb: 3 }}>January 2024 statement</Typography>
            {loading
              ? <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 0}} />
              : (
                <>
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ fontSize: '0.82rem', color: '#5F6368' }}>Payout progress</Typography>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#202124' }}>
                        {Math.round((paid / (paid + pending)) * 100)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(paid / (paid + pending)) * 100}
                      sx={{ bgcolor: '#E8F0FE', '& .MuiLinearProgress-bar': { bgcolor: '#1A73E8' } }}
                    />
                  </Box>
                  {[
                    { label: 'Total earned this month', value: formatCurrency(totalEarned, user?.currency), color: '#202124' },
                    { label: 'Already paid', value: formatCurrency(paid, user?.currency), color: '#1E8E3E' },
                    { label: 'Pending approval', value: formatCurrency(pending, user?.currency), color: '#E37400' },
                    { label: 'Clawbacks applied', value: `- ${formatCurrency(clawbacks, user?.currency)}`, color: '#D93025' },
                  ].map(({ label, value, color }) => (
                    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography sx={{ fontSize: '0.8rem', color: '#5F6368' }}>{label}</Typography>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color }}>{value}</Typography>
                    </Box>
                  ))}
                  <Divider sx={{ my: 1.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#202124' }}>Net payable</Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#1A73E8' }}>
                      {formatCurrency(totalEarned - clawbacks, user?.currency)}
                    </Typography>
                  </Box>
                </>
              )
            }
          </Paper>
        </Grid>
      </Grid>

      {/* Ledger Table */}
      <Paper elevation={1} sx={{ overflow: 'hidden' }}>
        <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #E8EAED', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 700, color: '#202124' }}>Commission Ledger</Typography>
          <Chip label="Jan 2024" size="small" sx={{ bgcolor: '#E8F0FE', color: '#1A73E8', fontWeight: 600, fontSize: '0.75rem' }} />
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Policy</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Product</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Type</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? [1, 2, 3, 4].map((i) => (
                    <TableRow key={i}>
                      {[1, 2, 3, 4, 5].map((j) => <TableCell key={j}><Skeleton height={20} /></TableCell>)}
                    </TableRow>
                  ))
                  : paginated.map((l) => (
                    <TableRow key={l.id} hover>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.82rem', color: '#5F6368' }}>
                          {l.created_at ? new Date(l.created_at).toISOString().split('T')[0] : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#202124' }}>
                          {l.policy_number || 'Standalone'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: '#9AA0A6', fontFamily: 'monospace' }}>
                          {l.policy_id.split('-')[0]}...
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Typography sx={{ fontSize: '0.82rem', color: '#5F6368' }}>
                          {l.product_name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Chip
                          label={l.entry_type ? l.entry_type.replace('_', ' ') : ''}
                          size="small"
                          sx={{
                            height: 22, fontSize: '0.7rem', fontWeight: 600, textTransform: 'capitalize',
                            bgcolor: TYPE_CFG[l.entry_type]?.bg || '#F1F3F4',
                            color: TYPE_CFG[l.entry_type]?.color || '#5F6368',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: Number(l.amount) < 0 ? '#D93025' : '#1E8E3E' }}>
                        {Number(l.amount) < 0 ? '−' : '+'}{formatCurrency(Math.abs(Number(l.amount)), l.currency)}
                      </TableCell>
                      <TableCell><StatusBadge status={l.status} /></TableCell>
                    </TableRow>
                  ))
              }
            </TableBody>
          </Table>
        </TableContainer>
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
      </Paper>
    </Box>
  )
}
