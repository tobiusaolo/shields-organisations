import React, { useState } from 'react'
import {
  Box, Grid, Typography, Paper, Button, Avatar, Stack, Chip,
  CircularProgress, Divider, LinearProgress, Skeleton
} from '@mui/material'
import {
  Storefront as MarketIcon,
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
  Assignment as ClaimIcon,
  AccountBalanceWallet as WalletIcon,
  HelpOutline as HelpIcon,
  SupportAgent as SupportIcon,
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
      const res = await publicAPI.getMyPolicies().catch(() => ({ data: [] }))
      return res.data?.items || res.data || []
    },
    enabled: !!user
  })

  const { data: claims = [], isLoading: claimsLoading } = useQuery({
    queryKey: ['user-claims', user?.id],
    queryFn: async () => {
      const res = await publicAPI.getMyClaims().catch(() => ({ data: [] }))
      return res.data?.items || res.data || []
    },
    enabled: !!user
  })

  const loading = productsLoading || policiesLoading || claimsLoading
  const categories = [...new Set(allProducts.map(p => (p.category || 'other').toLowerCase()))]
  const kycVerified = user?.kyc_status === 'verified' || user?.kyc_status === 'approved'
  
  // FIX: use coverage_amount instead of sum_insured
  const totalCovered = activePolicies.filter(p => p.status === 'active').reduce((s, p) => s + (Number(p.coverage_amount) || 0), 0)
  const activeCount = activePolicies.filter(p => p.status === 'active').length
  const pendingClaims = claims.filter(c => c.status === 'reported' || c.status === 'under_review').length

  // Find next upcoming payment
  const upcomingPayment = activePolicies
    .filter(p => p.status === 'active' && p.next_payment_date)
    .sort((a, b) => new Date(a.next_payment_date) - new Date(b.next_payment_date))[0]

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
        p: { xs: 3, md: 5 }, borderRadius: 0, mb: 4,
        background: 'linear-gradient(135deg, #090B10 0%, #1A237E 100%)',
        position: 'relative', overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Box sx={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,115,232,0.15) 0%, transparent 70%)' }} />
        <Box sx={{ position: 'absolute', bottom: -50, left: -50, width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(77,163,255,0.1) 0%, transparent 70%)' }} />
        
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={4}>
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, mb: 1, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              {greeting()},
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#fff', mb: 1.5, letterSpacing: '-1px' }}>
              {user?.first_name || 'Member'} <Box component="span" sx={{ color: '#4DA3FF' }}>Portal</Box>
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              {kycVerified ? (
                <Chip 
                  icon={<VerifiedIcon sx={{ fontSize: '16px !important', color: '#4CAF50 !important' }} />} 
                  label="Trust Score: High (Verified)" 
                  sx={{ bgcolor: 'rgba(76,175,80,0.1)', color: '#81C784', fontWeight: 800, border: '1px solid rgba(76,175,80,0.3)', px: 1 }} 
                />
              ) : (
                <Chip 
                  icon={<PendingIcon sx={{ fontSize: '16px !important', color: '#FFA726 !important' }} />} 
                  label="Incomplete Profile" 
                  onClick={() => navigate('/client/kyc')}
                  sx={{ bgcolor: 'rgba(255,167,38,0.1)', color: '#FFA726', fontWeight: 800, border: '1px solid rgba(255,167,38,0.3)', px: 1, cursor: 'pointer' }} 
                />
              )}
            </Stack>
          </Box>

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/client/products')}
              sx={{
                borderRadius: 0, px: 4, py: 2,
                bgcolor: '#fff', color: '#0D1117', fontWeight: 800, textTransform: 'none',
                boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
                '&:hover': { bgcolor: '#F8F9FA', transform: 'translateY(-2px)' },
                transition: 'all 0.2s'
              }}
            >
              Protect Something New
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Stats Dashboard */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={PolicyIcon} label="Active Protection" value={activeCount} sub="Live insurance policies" color="linear-gradient(135deg, #1A73E8, #0D47A1)" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={WalletIcon} label="Security Value" value={totalCovered > 0 ? `UGX ${(totalCovered / 1e6).toFixed(1)}M` : '—'} sub="Aggregate sum insured" color="linear-gradient(135deg, #2E7D32, #1B5E20)" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={ClaimIcon} label="Pending Claims" value={pendingClaims} sub="Under processing" color="linear-gradient(135deg, #D32F2F, #B71C1C)" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={MarketIcon} label="Market Offers" value={allProducts.length} sub="New opportunities" color="linear-gradient(135deg, #7B1FA2, #4A148C)" loading={loading} />
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Main Content Area */}
        <Grid item xs={12} lg={8}>
          {/* Upcoming Payment Alert */}
          {upcomingPayment && (
            <Paper elevation={0} sx={{ 
              p: 3, mb: 4, borderRadius: 0, 
              background: 'rgba(255, 243, 224, 0.4)', 
              border: '1px solid #FFE0B2',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: '#FFF3E0', color: '#E65100' }}>
                  <WalletIcon />
                </Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#BF360C' }}>Upcoming Payment Due</Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: '#70757A' }}>
                    {upcomingPayment.product_name} • Due on {new Date(upcomingPayment.next_payment_date).toLocaleDateString()}
                  </Typography>
                </Box>
              </Stack>
              <Button 
                variant="contained" 
                size="small" 
                onClick={() => navigate('/client/policies')}
                sx={{ bgcolor: '#E65100', '&:hover': { bgcolor: '#BF360C' }, borderRadius: 0, fontWeight: 700 }}
              >
                Pay UGX {Number(upcomingPayment.installment_amount || upcomingPayment.premium).toLocaleString()}
              </Button>
            </Paper>
          )}

          <Paper elevation={0} sx={{ p: 4, borderRadius: 0, border: '1px solid #E8EAED', bgcolor: '#fff' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
              <Box>
                <Typography sx={{ fontWeight: 900, fontSize: '1.25rem', color: '#202124', letterSpacing: '-0.5px' }}>My Active Portfolio</Typography>
                <Typography sx={{ fontSize: '0.8rem', color: '#70757A' }}>Manage your ongoing insurance coverages</Typography>
              </Box>
              <Button size="small" endIcon={<ChevronIcon />} onClick={() => navigate('/client/policies')}
                sx={{ textTransform: 'none', color: '#1A73E8', fontWeight: 700 }}>
                Manage All
              </Button>
            </Stack>

            {loading ? (
              <Stack spacing={2}>
                {[1,2,3].map(i => <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: 0 }} />)}
              </Stack>
            ) : activePolicies.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#F8F9FA', border: '1px dashed #DADCE0' }}>
                <ShieldIcon sx={{ fontSize: 64, color: '#DADCE0', mb: 2 }} />
                <Typography sx={{ fontWeight: 800, color: '#202124', mb: 1 }}>Your portfolio is empty</Typography>
                <Typography sx={{ color: '#70757A', mb: 4, maxWidth: 300, mx: 'auto' }}>
                  Protect your future by exploring our curated insurance products.
                </Typography>
                <Button variant="contained" onClick={() => navigate('/client/products')}
                  sx={{ borderRadius: 0, px: 4, bgcolor: '#1A73E8', fontWeight: 800 }}>
                  Start Shopping
                </Button>
              </Box>
            ) : (
              <Stack spacing={2.5}>
                {activePolicies.slice(0, 5).map(policy => (
                  <PolicyCard key={policy.id} policy={policy} onPay={() => navigate(`/client/policies`)} />
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Sidebar Actions */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Quick Actions Panel */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 0, border: '1px solid #E8EAED', bgcolor: '#fff' }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#202124', mb: 3, borderLeft: '4px solid #1A73E8', pl: 2 }}>Command Center</Typography>
              <Stack spacing={2}>
                {[
                  { label: 'File a Claim', sub: 'Report an incident now', icon: ClaimIcon, color: '#FEEFC3', iconColor: '#F29900', action: () => navigate('/client/claims') },
                  { label: 'Explore Market', sub: 'New products for you', icon: MarketIcon, color: '#E8F0FE', iconColor: '#1A73E8', action: () => navigate('/client/products') },
                  { label: 'Security Check', sub: 'Verify your identity', icon: ShieldIcon, color: kycVerified ? '#E6F4EA' : '#FCE8E6', iconColor: kycVerified ? '#1E8E3E' : '#D93025', action: () => navigate('/client/kyc') },
                  { label: 'Get Help', sub: 'Contact 24/7 support', icon: SupportIcon, color: '#F3E5F5', iconColor: '#9C27B0', action: () => navigate('/client/support') },
                ].map(item => (
                  <Box key={item.label} onClick={item.action} sx={{
                    display: 'flex', alignItems: 'center', gap: 2.5, p: 2,
                    borderRadius: 0, cursor: 'pointer', border: '1px solid transparent',
                    '&:hover': { bgcolor: '#F8F9FA', borderColor: '#E8EAED', transform: 'translateX(4px)' }, transition: 'all 0.2s'
                  }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: 0, bgcolor: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <item.icon sx={{ fontSize: 20, color: item.iconColor }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: '#202124' }}>{item.label}</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#70757A' }}>{item.sub}</Typography>
                    </Box>
                    <ChevronIcon sx={{ color: '#DADCE0', fontSize: 20 }} />
                  </Box>
                ))}
              </Stack>
            </Paper>

            {/* Marketplace Highlights */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 0, border: '1px solid #E8EAED', bgcolor: '#fff', position: 'relative', overflow: 'hidden' }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#202124', mb: 3 }}>Top Categories</Typography>
              <Grid container spacing={1.5}>
                {categories.slice(0, 4).map(cat => (
                  <Grid item xs={6} key={cat}>
                    <CategoryCard category={cat} />
                  </Grid>
                ))}
              </Grid>
              <Button fullWidth endIcon={<ArrowIcon />} onClick={() => navigate('/client/products')} sx={{ mt: 3, textTransform: 'none', fontWeight: 700, color: '#1A73E8' }}>
                Browse All Categories
              </Button>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )
}
