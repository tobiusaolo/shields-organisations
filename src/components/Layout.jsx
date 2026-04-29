import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Box,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  TextField,
  InputAdornment,
  Tooltip,
  Chip,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Collapse,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  Assignment as AssignmentIcon,
  Payments as PaymentsIcon,
  Logout as LogoutIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountCircleIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Circle as CircleIcon,
  Verified as VerifiedIcon,
  HelpOutline as HelpIcon,
  ChevronRight as ChevronRightIcon,
  LocalOffer as PromotionIcon,
  Inventory as ProductIcon,
  Person as PersonIcon,
} from '@mui/icons-material'

const drawerWidth = 264

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin', icon: <DashboardIcon /> },
  { label: 'Policies', path: '/admin/policies', icon: <DescriptionIcon />, roles: ['admin', 'organization_admin', 'agent', 'broker', 'senior_agent', 'underwriter', 'read_only', 'claims_officer'] },
  { label: 'Claims', path: '/admin/claims', icon: <AssignmentIcon />, roles: ['admin', 'organization_admin', 'claims_officer', 'underwriter', 'broker', 'read_only'] },
  { label: 'Commissions', path: '/admin/commissions', icon: <PaymentsIcon />, roles: ['admin', 'organization_admin', 'agent', 'broker', 'senior_agent', 'team_lead'] },
  { label: 'Products', path: '/admin/products', icon: <ProductIcon />, roles: ['admin', 'organization_admin', 'underwriter'] },
  { label: 'Policy Ledger', path: '/admin/ledger', icon: <PaymentsIcon />, roles: ['admin', 'organization_admin'] },
  { label: 'Clients', path: '/admin/clients', icon: <PersonIcon />, roles: ['admin', 'organization_admin', 'agent', 'broker', 'senior_agent', 'underwriter'] },
]

const SECONDARY_NAV = [
  { label: 'Team', path: '/admin/team', icon: <AccountCircleIcon />, roles: ['admin', 'organization_admin', 'platform_admin'] },
  { label: 'KYC Verification', path: '/admin/kyc', icon: <SecurityIcon />, roles: ['admin', 'organization_admin', 'platform_admin'] },
  { label: 'Promotions', path: '/admin/promotions', icon: <PromotionIcon />, roles: ['admin', 'organization_admin', 'platform_admin'] },
  { label: 'Settings', path: '/admin/settings', icon: <SettingsIcon />, roles: ['admin', 'organization_admin', 'platform_admin'] },
]

function NotificationDot({ color = '#EA4335' }) {
  return (
    <Box sx={{
      width: 8, height: 8, borderRadius: 0,
      bgcolor: color, display: 'inline-block', flexShrink: 0,
    }} />
  )
}

export default function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileAnchor, setProfileAnchor] = useState(null)
  const [notifAnchor, setNotifAnchor] = useState(null)
  const [searchValue, setSearchValue] = useState('')
  const [logoutLoading, setLogoutLoading] = useState(false)

  const notifications = [
    { id: 1, text: 'KYC verification pending review', time: '5 min ago', unread: true, type: 'warning' },
    { id: 2, text: 'Policy POL-2024-012 approved', time: '1 hour ago', unread: true, type: 'success' },
    { id: 3, text: 'Premium payment received successfully', time: '2 hours ago', unread: false, type: 'info' },
    { id: 4, text: 'Commission payout processed', time: '1 day ago', unread: false, type: 'success' },
  ]

  const unreadCount = notifications.filter(n => n.unread).length

  const handleLogout = async () => {
    setLogoutLoading(true)
    try {
      await logout()
      navigate('/')
    } finally {
      setLogoutLoading(false)
    }
  }

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const notifColor = (type) => {
    if (type === 'warning') return '#E37400'
    if (type === 'success') return '#1E8E3E'
    return '#1A73E8'
  }

  const userInitials = user
    ? `${(user.first_name || user.email || 'U')[0].toUpperCase()}`
    : 'U'

  const DrawerContent = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#FFFFFF' }}>
      {/* Brand */}
      <Box sx={{
        px: 3, py: 2.5,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #E8EAED',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: 0,
            bgcolor: user?.logo ? 'transparent' : '#000', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: user?.logo ? 'none' : '0 2px 8px rgba(0,0,0,0.2)',
            overflow: 'hidden',
          }}>
            {user?.logo ? (
              <img src={user.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <svg viewBox="0 0 24 24" fill="white" style={{ width: 20, height: 20 }}>
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
            )}
          </Box>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography sx={{ 
                fontWeight: 700, fontSize: '0.92rem', color: '#202124', 
                lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap', maxWidth: user?.kyc_status === 'verified' ? 120 : 150 
              }}>
                {user?.organization_name || 'SHIELDS'}
              </Typography>
              {user?.kyc_status === 'verified' && (
                <Tooltip title="Verified Organization">
                  <VerifiedIcon sx={{ fontSize: 16, color: '#1A73E8' }} />
                </Tooltip>
              )}
            </Box>
            <Typography sx={{ fontSize: '0.7rem', color: '#5F6368', lineHeight: 1, textTransform: 'capitalize' }}>
              {user?.organization_type || 'Insurance Operations'}
            </Typography>
          </Box>
        </Box>
        {isMobile && (
          <IconButton size="small" onClick={() => setMobileOpen(false)} sx={{ color: '#5F6368' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Main Nav */}
      <Box sx={{ px: 1, pt: 2, flexGrow: 1 }}>
        <Typography sx={{
          px: 1.5, pb: 0.5, fontSize: '0.68rem', fontWeight: 700,
          letterSpacing: '0.08em', color: '#9AA0A6', textTransform: 'uppercase',
        }}>
          Main Menu
        </Typography>
        <List disablePadding>
          {NAV_ITEMS.filter(n => !n.roles || n.roles.includes(user?.role)).map((item) => {
            const active = isActive(item.path)
            return (
              <ListItemButton
                key={item.path}
                selected={active}
                onClick={() => { navigate(item.path); setMobileOpen(false) }}
                sx={{
                  mb: 0.5,
                  '& .MuiListItemIcon-root': {
                    color: active ? 'primary.main' : '#5F6368',
                    minWidth: 40,
                    '& svg': { fontSize: 20 },
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: active ? 700 : 500,
                    color: active ? '#1A237E' : '#202124',
                  }}
                />
                {active && <ChevronRightIcon sx={{ fontSize: 16, color: '#1A237E', opacity: 0.6 }} />}
              </ListItemButton>
            )
          })}
        </List>

        <Divider sx={{ my: 2 }} />

        <Typography sx={{
          px: 1.5, pb: 0.5, fontSize: '0.68rem', fontWeight: 700,
          letterSpacing: '0.08em', color: '#9AA0A6', textTransform: 'uppercase',
        }}>
          Administration
        </Typography>
        <List disablePadding>
          {SECONDARY_NAV.filter(n => !n.roles || n.roles.includes(user?.role)).map((item) => {
            const active = isActive(item.path)
            return (
              <ListItemButton
                key={item.path}
                selected={active}
                onClick={() => { navigate(item.path); setMobileOpen(false) }}
                sx={{
                  mb: 0.5,
                  '& .MuiListItemIcon-root': {
                    color: active ? 'primary.main' : '#5F6368',
                    minWidth: 40,
                    '& svg': { fontSize: 20 },
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: active ? 600 : 500,
                    color: active ? 'primary.main' : '#202124',
                  }}
                />
              </ListItemButton>
            )
          })}
        </List>
      </Box>

      {/* User Profile Footer */}
      <Box sx={{
        px: 2, py: 2,
        borderTop: '1px solid #E8EAED',
        display: 'flex', alignItems: 'center', gap: 1.5,
        cursor: 'pointer',
        '&:hover': { bgcolor: '#F8F9FE' },
        borderRadius: 0,
        transition: 'background 0.2s',
      }}
        onClick={(e) => setProfileAnchor(e.currentTarget)}
      >
        <Avatar variant="square" sx={{ width: 36, height: 36, bgcolor: '#000', borderRadius: 0, fontSize: '0.9rem', fontWeight: 700 }}>
          {userInitials}
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#202124', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : (user?.email || 'User')}
          </Typography>
          <Typography sx={{ fontSize: '0.7rem', color: '#5F6368', lineHeight: 1, textTransform: 'capitalize' }}>
            {(user?.role || 'Organization Admin').replace('_', ' ')}
          </Typography>
        </Box>
        <ExpandMoreIcon sx={{ fontSize: 16, color: '#9AA0A6', flexShrink: 0 }} />
      </Box>
    </Box>
  )

  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/admin') return 'Dashboard'
    if (path.startsWith('/admin/policies')) return 'Policies'
    if (path.startsWith('/admin/claims')) return 'Claims'
    if (path.startsWith('/admin/commissions')) return 'Commissions'
    if (path.startsWith('/admin/kyc')) return 'KYC Verification'
    if (path.startsWith('/admin/settings')) return 'Settings'
    if (path.startsWith('/admin/profile')) return 'Profile'
    if (path.startsWith('/admin/ledger')) return 'Policy Ledger'
    return 'SHIELDS'
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: 0 }}>
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          <DrawerContent />
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              top: 0,
              height: '100vh',
              position: 'fixed',
            },
          }}
          open
        >
          <DrawerContent />
        </Drawer>
      </Box>

      {/* Main content area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top App Bar */}
        <Box
          component="header"
          sx={{
            position: 'sticky', top: 0, zIndex: 1100,
            bgcolor: 'rgba(248,249,254,0.95)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid #E8EAED',
            px: { xs: 2, sm: 3 }, py: 1.5,
            display: 'flex', alignItems: 'center', gap: 2,
          }}
        >
          {/* Mobile menu toggle */}
          <IconButton
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: 'none' }, color: '#5F6368' }}
          >
            <MenuIcon />
          </IconButton>

          {/* Page title */}
          <Typography sx={{
            fontWeight: 600,
            fontSize: { xs: '1rem', sm: '1.1rem' },
            color: '#202124',
            mr: 2,
            display: { xs: 'none', sm: 'block' },
          }}>
            {getPageTitle()}
          </Typography>

          {/* Search */}
          <Box sx={{ flexGrow: 1, maxWidth: 480, display: { xs: 'none', lg: 'block' } }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search policies, claims, customers…"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#9AA0A6', fontSize: 18 }} />
                  </InputAdornment>
                ),
                sx: {
                  bgcolor: '#FFFFFF',
                  fontSize: '0.875rem',
                  '& fieldset': { borderColor: '#E8EAED' },
                  '&:hover fieldset': { borderColor: '#DADCE0' },
                },
              }}
            />
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {/* Help */}
            <Tooltip title="Help & Documentation">
              <IconButton sx={{ color: '#5F6368', width: 40, height: 40 }}>
                <HelpIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton
                onClick={(e) => setNotifAnchor(e.currentTarget)}
                sx={{ color: '#5F6368', width: 40, height: 40, position: 'relative' }}
              >
                <Badge
                  badgeContent={unreadCount}
                  color="error"
                  sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', minWidth: 16, height: 16, fontWeight: 700 } }}
                >
                  {unreadCount > 0 ? <NotificationsIcon fontSize="small" /> : <NotificationsNoneIcon fontSize="small" />}
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Avatar */}
            <Tooltip title="Account menu">
              <IconButton
                onClick={(e) => setProfileAnchor(e.currentTarget)}
                sx={{ ml: 0.5, p: 0.5 }}
              >
                <Avatar variant="square" sx={{
                  width: 34, height: 34, bgcolor: '#000', borderRadius: 0,
                  fontSize: '0.8rem', fontWeight: 700,
                  border: Boolean(profileAnchor) ? '2px solid #1A237E' : '2px solid transparent',
                  transition: 'border 0.2s',
                }}>
                  {userInitials}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notifAnchor}
          open={Boolean(notifAnchor)}
          onClose={() => setNotifAnchor(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              width: 360, mt: 1,
              borderRadius: 0, border: '1px solid #000',
              boxShadow: '0px 8px 32px rgba(0,0,0,0.12)',
              overflow: 'hidden',
            },
          }}
        >
          <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E8EAED' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#202124' }}>Notifications</Typography>
            {unreadCount > 0 && (
              <Chip label={`${unreadCount} new`} size="small" color="primary" sx={{ height: 22, fontSize: '0.7rem' }} />
            )}
          </Box>
          {notifications.map((n, i) => (
            <Box key={n.id}>
              <Box sx={{
                px: 2.5, py: 1.5, display: 'flex', gap: 1.5, alignItems: 'flex-start',
                bgcolor: n.unread ? 'rgba(26,115,232,0.04)' : 'transparent',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(26,115,232,0.06)' },
                transition: 'background 0.15s',
              }}>
                <Box sx={{ mt: 0.5, flexShrink: 0 }}>
                  <NotificationDot color={notifColor(n.type)} />
                </Box>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: n.unread ? 600 : 400, color: '#202124', lineHeight: 1.4 }}>
                    {n.text}
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: '#9AA0A6', mt: 0.25 }}>{n.time}</Typography>
                </Box>
              </Box>
              {i < notifications.length - 1 && <Divider sx={{ mx: 2.5 }} />}
            </Box>
          ))}
          <Box sx={{ p: 1.5, borderTop: '1px solid #E8EAED', textAlign: 'center' }}>
            <Box
              sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'primary.main', cursor: 'pointer', py: 0.5, '&:hover': { textDecoration: 'underline' } }}
              onClick={() => setNotifAnchor(null)}
            >
              View all notifications
            </Box>
          </Box>
        </Menu>

        {/* Profile Menu */}
        <Menu
          anchorEl={profileAnchor}
          open={Boolean(profileAnchor)}
          onClose={() => setProfileAnchor(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              width: 240, mt: 1,
              borderRadius: 0, border: '1px solid #000',
              boxShadow: '0px 8px 32px rgba(0,0,0,0.12)',
            },
          }}
        >
          {/* User info header */}
          <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #E8EAED' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Avatar variant="square" sx={{ width: 40, height: 40, bgcolor: '#000', borderRadius: 0, fontWeight: 700 }}>{userInitials}</Avatar>
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#202124', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>
                  {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : (user?.email || 'User')}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#5F6368', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>
                  {user?.email || ''}
                </Typography>
              </Box>
            </Box>
            <Chip
              icon={<VerifiedIcon sx={{ fontSize: '12px !important' }} />}
              label={(user?.role || 'Admin').replace('_', ' ').toUpperCase()}
              size="small"
              sx={{ bgcolor: '#E8F0FE', color: '#1A73E8', fontWeight: 600, height: 22, fontSize: '0.65rem' }}
            />
          </Box>
          <MenuItem
            onClick={() => { setProfileAnchor(null); navigate('/profile') }}
            sx={{ py: 1.5, px: 2.5, gap: 1.5, fontSize: '0.85rem', color: '#202124' }}
          >
            <AccountCircleIcon sx={{ fontSize: 18, color: '#5F6368' }} /> My Profile
          </MenuItem>
          <MenuItem
            onClick={() => { setProfileAnchor(null); navigate('/settings') }}
            sx={{ py: 1.5, px: 2.5, gap: 1.5, fontSize: '0.85rem', color: '#202124' }}
          >
            <SettingsIcon sx={{ fontSize: 18, color: '#5F6368' }} /> Settings
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={handleLogout}
            disabled={logoutLoading}
            sx={{ py: 1.5, px: 2.5, gap: 1.5, fontSize: '0.85rem', color: '#D93025' }}
          >
            {logoutLoading
              ? <CircularProgress size={16} />
              : <LogoutIcon sx={{ fontSize: 18 }} />
            }
            Sign out
          </MenuItem>
        </Menu>

        {/* Page Content */}
        <Box
          component="main"
          id="main-content"
          role="main"
          sx={{
            flexGrow: 1,
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 2.5, sm: 3 },
            maxWidth: '100%',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  )
}
