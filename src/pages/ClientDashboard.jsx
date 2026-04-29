import React, { useState } from 'react'
import {
  Box, Grid, Typography, Paper, Button, Avatar, Stack, Chip,
  CircularProgress, Divider, LinearProgress, Skeleton
} from '@mui/material'
import {
  Security as ShieldIcon,
  ArrowForward as ArrowIcon,
  Add as AddIcon,
  CheckCircle as ActiveIcon,
  Warning as PendingIcon,
  DirectionsCar as MotorIcon,
  Favorite as HealthIcon,
  BusinessCenter as BusinessIcon,
  Home as HomeIcon,
  TravelExplore as TravelIcon,
  Savings as LifeIcon,
  Verified as VerifiedIcon,
  Assignment as PolicyIcon,
  AccountBalanceWallet as WalletIcon,
  HelpOutline as HelpIcon,
  KeyboardArrowRight as ChevronIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { publicAPI, tenancyAPI, policyAPI } from '../services/api'

const CATEGORY_MAP = {
  motor:    { Icon: MotorIcon,   bg: 'linear-gradient(135deg,#1565C0,#1976D2)', label: 'Motor' },
  health:   { Icon: HealthIcon,  bg: 'linear-gradient(135deg,#AD1457,#C2185B)', label: 'Health' },
  life:     { Icon: LifeIcon,    bg: 'linear-gradient(135deg,#6A1B9A,#7B1FA2)', label: 'Life' },
  business: { Icon: BusinessIcon,bg: 'linear-gradient(135deg,#2E7D32,#388E3C)', label: 'Business' },
  property: { Icon: HomeIcon,    bg: 'linear-gradient(135deg,#E65100,#F57C00)', label: 'Property' },
  travel:   { Icon: TravelIcon,  bg: 'linear-gradient(135deg,#006064,#00796B)', label: 'Travel' },
  other:    { Icon: ShieldIcon,  bg: 'linear-gradient(135deg,#37474F,#546E7A)', label: 'General' },
}

function StatCard({ icon: Icon, label, value, sub, color, loading }) {
  return (
    <Paper elevation={0} sx={{
      p: 3, borderRadius: 0,
      border: '1px solid #E8EAED', bgcolor: '#fff',
      transition: 'box-shadow 0.2s',
      '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }
    }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#70757A', mb: 1, letterSpacing: 0.4 }}>
            {label.toUpperCase()}
          </Typography>
          {loading ? <Skeleton width={100} height={36} /> : (
            <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: '#202124', lineHeight: 1.2 }}>
              {value}
            </Typography>
          )}
          {sub && (
            <Typography sx={{ fontSize: '0.75rem', color: '#70757A', mt: 0.5 }}>{sub}</Typography>
          )}
        </Box>
        <Box sx={{
          width: 44, height: 44, borderRadius: 0,
          background: color, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
      </Stack>
    </Paper>
  )
}

function PolicyCard({ policy, onPay }) {
  const isActive = policy.status === 'active'
  return (
    <Paper elevation={0} sx={{
      p: 2.5, borderRadius: 0, border: '1px solid #E8EAED', bgcolor: '#fff',
      transition: 'all 0.2s', '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.07)', borderColor: '#DADCE0' }
    }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{
          width: 44, height: 44, borderRadius: 0,
          background: isActive ? 'linear-gradient(135deg,#1A73E8,#0D47A1)' : 'linear-gradient(135deg,#616161,#424242)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <PolicyIcon sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#202124', noWrap: true }}>
            {policy.product_name || 'Insurance Policy'}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
            <Typography sx={{ fontSize: '0.75rem', color: '#70757A' }}>
              #{policy.policy_number}
            </Typography>
            <Box sx={{ width: 3, height: 3, borderRadius: 0, bgcolor: '#DADCE0' }} />
            <Chip
              label={policy.status?.toUpperCase()}
              size="small"
              sx={{
                height: 18, fontSize: '0.6rem', fontWeight: 700,
                bgcolor: isActive ? '#E8F5E9' : '#FFF3E0',
                color: isActive ? '#2E7D32' : '#E65100'
              }}
            />
          </Stack>
        </Box>
        <Stack alignItems="flex-end" spacing={0.5}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#202124' }}>
            UGX {Number(policy.premium || 0).toLocaleString()}
          </Typography>
          {isActive && (
            <Button size="small" variant="outlined" onClick={() => onPay(policy)}
              sx={{ borderRadius: 0, textTransform: 'none', fontSize: '0.7rem', fontWeight: 600, px: 1.5, py: 0.5, borderColor: '#DADCE0', color: '#1A73E8', '&:hover': { borderColor: '#1A73E8', bgcolor: '#F8F9FA' } }}>
              Pay Now
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  )
}

function CategoryCard({ category }) {
  const navigate = useNavigate()
  const cfg = CATEGORY_MAP[category.toLowerCase()] || CATEGORY_MAP.other
  return (
    <Box
      onClick={() => navigate(`/client/products?category=${category}`)}
      sx={{
        minWidth: 110, height: 110, borderRadius: 0,
        background: cfg.bg, cursor: 'pointer', flexShrink: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 1,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 28px rgba(0,0,0,0.18)' }
      }}
    >
      <cfg.Icon sx={{ color: '#fff', fontSize: 28 }} />
      <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.78rem' }}>{cfg.label}</Typography>
    </Box>
  )
}

export default function ClientDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: allProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ['public-products'],
    queryFn: async () => {
      const res = await publicAPI.getPublicProducts()
      return res.data?.items || res.data || []
    }
  })

  const { data: activePolicies = [], isLoading: policiesLoading } = useQuery({
    queryKey: ['user-policies', user?.id],
    queryFn: async () => {
      const ctx = await tenancyAPI.getUserContext().catch(() => null)
      if (ctx?.data?.organizations?.length > 0) {
        const orgId = ctx.data.organizations[0].id
        const res = await policyAPI.getMyPolicies(orgId).catch(() => ({ data: [] }))
        return res.data?.items || res.data || []
      }
      return []
    },
    enabled: !!user
  })

  const loading = productsLoading || policiesLoading
  const categories = [...new Set(allProducts.map(p => (p.category || 'other').toLowerCase()))]
  const kycVerified = user?.kyc_status === 'verified' || user?.kyc_status === 'approved'
  const totalCovered = activePolicies.filter(p => p.status === 'active').reduce((s, p) => s + (p.sum_insured || 0), 0)
  const activeCount = activePolicies.filter(p => p.status === 'active').length

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <Box>
      {/* Hero */}
      <Paper elevation={0} sx={{
        p: { xs: 3, md: 4 }, borderRadius: 0, mb: 4,
        background: 'linear-gradient(135deg, #0D1117 0%, #1A237E 100%)',
        position: 'relative', overflow: 'hidden'
      }}>
        <Box sx={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: 0, bgcolor: 'rgba(255,255,255,0.03)' }} />
        <Box sx={{ position: 'absolute', bottom: -60, right: 80, width: 160, height: 160, borderRadius: 0, bgcolor: 'rgba(26,115,232,0.1)' }} />
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={3}>
          <Box>
            <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500, mb: 0.5 }}>
              {greeting()},
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
              {user?.first_name || 'Welcome back'} 👋
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {kycVerified
                ? <Chip icon={<VerifiedIcon sx={{ fontSize: '14px !important', color: '#4CAF50 !important' }} />} label="Identity Verified" size="small" sx={{ bgcolor: 'rgba(76,175,80,0.15)', color: '#81C784', fontWeight: 600, fontSize: '0.72rem' }} />
                : <Chip icon={<PendingIcon sx={{ fontSize: '14px !important', color: '#FFA726 !important' }} />} label="Complete Verification" size="small" onClick={() => navigate('/client/kyc')} sx={{ bgcolor: 'rgba(255,167,38,0.15)', color: '#FFA726', fontWeight: 600, fontSize: '0.72rem', cursor: 'pointer' }} />
              }
            </Stack>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/client/products')}
            sx={{
              borderRadius: 0, px: 3, py: 1.5,
              bgcolor: '#1A73E8', fontWeight: 600, textTransform: 'none',
              boxShadow: '0 4px 14px rgba(26,115,232,0.4)',
              '&:hover': { bgcolor: '#1765CC' }
            }}
          >
            Get a Quote
          </Button>
        </Stack>
      </Paper>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatCard icon={PolicyIcon} label="Active Policies" value={activeCount} sub="Currently protected" color="linear-gradient(135deg,#1A73E8,#0D47A1)" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard icon={WalletIcon} label="Total Covered" value={totalCovered > 0 ? `UGX ${(totalCovered / 1e6).toFixed(1)}M` : '—'} sub="Sum insured" color="linear-gradient(135deg,#2E7D32,#388E3C)" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard icon={ShieldIcon} label="Products Available" value={allProducts.length} sub="In the marketplace" color="linear-gradient(135deg,#6A1B9A,#7B1FA2)" loading={loading} />
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Left: My Policies */}
        <Grid item xs={12} lg={7}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 0, border: '1px solid #E8EAED', bgcolor: '#fff' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#202124' }}>My Policies</Typography>
              <Button size="small" endIcon={<ChevronIcon />} onClick={() => navigate('/client/policies')}
                sx={{ textTransform: 'none', color: '#1A73E8', fontWeight: 600, fontSize: '0.8rem' }}>
                View all
              </Button>
            </Stack>

            {loading ? (
              <Stack spacing={2}>
                {[1,2].map(i => <Skeleton key={i} variant="rounded" height={76} sx={{ borderRadius: 0}} />)}
              </Stack>
            ) : activePolicies.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <ShieldIcon sx={{ fontSize: 48, color: '#DADCE0', mb: 2 }} />
                <Typography sx={{ fontWeight: 600, color: '#70757A', mb: 1 }}>No policies yet</Typography>
                <Typography variant="caption" sx={{ color: '#9AA0A6', display: 'block', mb: 3 }}>
                  Explore our marketplace to get covered today.
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/client/products')}
                  sx={{ borderRadius: 0, textTransform: 'none', fontWeight: 600, bgcolor: '#1A73E8' }}>
                  Browse Products
                </Button>
              </Box>
            ) : (
              <Stack spacing={2}>
                {activePolicies.slice(0, 4).map(policy => (
                  <PolicyCard key={policy.id} policy={policy} onPay={() => navigate(`/client/policies`)} />
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Right: Quick actions + Categories */}
        <Grid item xs={12} lg={5}>
          <Stack spacing={3}>
            {/* Quick Actions */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 0, border: '1px solid #E8EAED', bgcolor: '#fff' }}>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#202124', mb: 2.5 }}>Quick Actions</Typography>
              <Stack spacing={1.5}>
                {[
                  { label: 'Get a new quote', sub: 'Explore & compare products', icon: AddIcon, color: '#E8F0FE', iconColor: '#1A73E8', action: () => navigate('/client/products') },
                  { label: 'Submit a claim', sub: 'File & track your claims', icon: PolicyIcon, color: '#E8F5E9', iconColor: '#2E7D32', action: () => navigate('/client/claims') },
                  { label: 'Verify identity', sub: 'Complete your KYC', icon: VerifiedIcon, color: kycVerified ? '#E8F5E9' : '#FFF3E0', iconColor: kycVerified ? '#2E7D32' : '#E65100', action: () => navigate('/client/kyc') },
                  { label: 'Get support', sub: 'Talk to an advisor', icon: HelpIcon, color: '#F3E5F5', iconColor: '#7B1FA2', action: () => navigate('/client/support') },
                ].map(item => (
                  <Box key={item.label} onClick={item.action} sx={{
                    display: 'flex', alignItems: 'center', gap: 2, p: 1.5,
                    borderRadius: 0, cursor: 'pointer',
                    '&:hover': { bgcolor: '#F8F9FA' }, transition: '0.15s'
                  }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 0, bgcolor: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <item.icon sx={{ fontSize: 18, color: item.iconColor }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#202124' }}>{item.label}</Typography>
                      <Typography sx={{ fontSize: '0.73rem', color: '#70757A' }}>{item.sub}</Typography>
                    </Box>
                    <ChevronIcon sx={{ color: '#DADCE0', fontSize: 18 }} />
                  </Box>
                ))}
              </Stack>
            </Paper>

            {/* Insurance Categories */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 0, border: '1px solid #E8EAED', bgcolor: '#fff' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#202124' }}>Browse by Category</Typography>
              </Stack>
              <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
                {categories.length === 0
                  ? [1,2,3].map(i => <Skeleton key={i} variant="rounded" width={110} height={110} sx={{ borderRadius: 0, flexShrink: 0 }} />)
                  : categories.map(cat => <CategoryCard key={cat} category={cat} />)
                }
              </Box>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )
}
