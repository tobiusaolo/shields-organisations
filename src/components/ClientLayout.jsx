import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Typography, Stack, Avatar, Tooltip, Chip,
  IconButton, Drawer, useMediaQuery, useTheme, Divider
} from '@mui/material'
import {
  Home as HomeIcon,
  Storefront as MarketIcon,
  Description as PolicyIcon,
  Assignment as ClaimIcon,
  Shield as ShieldIcon,
  Person as ProfileIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Notifications as NotifIcon,
  CheckCircle as CheckIcon,
  HourglassTop as PendingIcon,
  SupportAgent as SupportIcon,
} from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'

const DRAWER_WIDTH = 272

const NAV_ITEMS = [
  { label: 'Marketplace',  icon: MarketIcon, path: '/client/products' },
  { label: 'My Policies',  icon: PolicyIcon, path: '/client/policies' },
  { label: 'Claims',       icon: ClaimIcon,  path: '/client/claims' },
  { label: 'Verification', icon: ShieldIcon, path: '/client/kyc', badge: true },
  { label: 'Support',      icon: SupportIcon,path: '/client/support' },
  { label: 'My Account',   icon: HomeIcon,   path: '/client' },
]

function SidebarContent({ onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const handleNav = (path) => {
    navigate(path)
    onClose?.()
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const isActive = (path) =>
    path === '/client' ? location.pathname === '/client' : location.pathname.startsWith(path)

  const kycVerified = user?.kyc_status === 'verified' || user?.kyc_status === 'approved'

  return (
    <Box sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(180deg, #0D1117 0%, #161B22 50%, #0D1117 100%)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Brand */}
      <Box sx={{ px: 3, pt: 3.5, pb: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{
            width: 38, height: 38, borderRadius: 0,
            background: 'linear-gradient(135deg, #1A73E8, #0D47A1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(26,115,232,0.4)'
          }}>
            <ShieldIcon sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#E8EAED', letterSpacing: '-0.3px' }}>
              Shields
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
              Insurance Portal
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 2 }} />

      {/* Nav */}
      <Box sx={{ flex: 1, px: 2, py: 2.5, overflowY: 'auto' }}>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 1.2, px: 1.5, mb: 1.5 }}>
          MENU
        </Typography>
        <Stack spacing={0.5}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path)
            const showBadge = item.badge && !kycVerified
            return (
              <Box
                key={item.path}
                onClick={() => handleNav(item.path)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  px: 1.5, py: 1.2, borderRadius: 0, cursor: 'pointer',
                  bgcolor: active ? 'rgba(26,115,232,0.18)' : 'transparent',
                  border: active ? '1px solid rgba(26,115,232,0.3)' : '1px solid transparent',
                  transition: 'all 0.18s ease',
                  '&:hover': {
                    bgcolor: active ? 'rgba(26,115,232,0.22)' : 'rgba(255,255,255,0.05)',
                  }
                }}
              >
                <Box sx={{
                  width: 32, height: 32, borderRadius: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  bgcolor: active ? 'rgba(26,115,232,0.25)' : 'rgba(255,255,255,0.06)',
                }}>
                  <item.icon sx={{ fontSize: 17, color: active ? '#4DA3FF' : 'rgba(255,255,255,0.45)' }} />
                </Box>
                <Typography sx={{
                  fontSize: '0.85rem', fontWeight: active ? 600 : 500,
                  color: active ? '#E8EAED' : 'rgba(255,255,255,0.5)',
                  flex: 1, letterSpacing: '-0.1px'
                }}>
                  {item.label}
                </Typography>
                {showBadge && (
                  <Box sx={{
                    px: 1, py: 0.25, borderRadius: 0,
                    bgcolor: user?.kyc_status === 'submitted' ? 'rgba(255,167,38,0.2)' : 'rgba(244,67,54,0.2)',
                    border: `1px solid ${user?.kyc_status === 'submitted' ? 'rgba(255,167,38,0.4)' : 'rgba(244,67,54,0.4)'}`
                  }}>
                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: user?.kyc_status === 'submitted' ? '#FFA726' : '#EF5350' }}>
                      {user?.kyc_status === 'submitted' ? 'PENDING' : 'REQUIRED'}
                    </Typography>
                  </Box>
                )}
              </Box>
            )
          })}
        </Stack>
      </Box>

      {/* Bottom Profile Card */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Box sx={{
          p: 1.5, borderRadius: 0,
          bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)'
        }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #1A73E8, #0D47A1)',
              fontSize: '0.9rem', fontWeight: 700
            }}>
              {(user?.first_name || 'U')[0].toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.82rem', color: '#E8EAED', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.first_name} {user?.last_name}
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                {kycVerified
                  ? <CheckIcon sx={{ fontSize: 11, color: '#4CAF50' }} />
                  : <PendingIcon sx={{ fontSize: 11, color: '#FFA726' }} />
                }
                <Typography sx={{ fontSize: '0.65rem', color: kycVerified ? '#4CAF50' : '#FFA726', fontWeight: 600 }}>
                  {kycVerified ? 'Verified' : 'Unverified'}
                </Typography>
              </Stack>
            </Box>
            <Tooltip title="Sign Out">
              <IconButton
                size="small"
                onClick={handleLogout}
                sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: '#EF5350', bgcolor: 'rgba(244,67,54,0.1)' } }}
              >
                <LogoutIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}

export default function ClientLayout() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Derive breadcrumb title from path
  const pageTitle = (() => {
    const p = location.pathname
    if (p === '/client') return 'Dashboard'
    if (p.includes('products')) return 'Marketplace'
    if (p.includes('policies')) return 'My Policies'
    if (p.includes('claims')) return 'Claims Center'
    if (p.includes('kyc')) return 'Identity Verification'
    if (p.includes('support')) return 'Help & Support'
    if (p.includes('profile')) return 'My Profile'
    return 'Client Portal'
  })()

  return (
    <Box sx={{ display: 'flex', bgcolor: '#F4F6F8', minHeight: '100vh' }}>
      {/* Permanent sidebar on desktop */}
      {!isMobile && (
        <Box sx={{ width: DRAWER_WIDTH, flexShrink: 0 }}>
          <Box sx={{
            width: DRAWER_WIDTH, position: 'fixed', top: 0, left: 0, bottom: 0,
            zIndex: 1200
          }}>
            <SidebarContent />
          </Box>
        </Box>
      )}

      {/* Temporary drawer on mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none' }
        }}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </Drawer>

      {/* Main content area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Slim top bar */}
        <Box sx={{
          position: 'sticky', top: 0, zIndex: 1100,
          bgcolor: 'rgba(244,246,248,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          px: { xs: 2, md: 4 }, py: 1.5,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {isMobile && (
              <IconButton size="small" onClick={() => setMobileOpen(true)} sx={{ color: '#202124' }}>
                <MenuIcon />
              </IconButton>
            )}
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#202124', lineHeight: 1.2 }}>
                {pageTitle}
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#70757A', fontWeight: 500 }}>
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Notifications">
              <IconButton size="small" sx={{ color: '#5F6368', bgcolor: '#fff', border: '1px solid #E8EAED', '&:hover': { bgcolor: '#F8F9FA' } }}>
                <NotifIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="My Profile">
              <IconButton size="small" onClick={() => navigate('/client/profile')} sx={{ p: 0 }}>
                <Avatar sx={{ width: 32, height: 32, background: 'linear-gradient(135deg, #1A73E8, #0D47A1)', fontSize: '0.8rem', fontWeight: 700 }}>
                  {(useAuth().user?.first_name || 'U')[0].toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* Page Content */}
        <Box sx={{ flex: 1, p: { xs: 2, md: 4 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
