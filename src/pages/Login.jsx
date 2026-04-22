import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  CircularProgress,
  Chip,
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  Shield as ShieldIcon,
  Lock as LockIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'

const FEATURES = [
  { icon: '🏢', label: 'Multi-tenant architecture' },
  { icon: '⚡', label: 'Real-time policy management' },
  { icon: '🔒', label: 'Enterprise-grade security' },
  { icon: '📊', label: 'Advanced analytics & reporting' },
]

const ROLES = ['Platform Admin', 'Org Admin', 'Underwriter', 'Agent', 'Claims Officer']

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      bgcolor: '#F8F9FE',
    }}>
      {/* Left Panel — Branding */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'center',
        width: '42%',
        flexShrink: 0,
        background: 'linear-gradient(145deg, #0D47A1 0%, #1A73E8 50%, #4A90F7 100%)',
        px: 6, py: 8,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decoration */}
        <Box sx={{
          position: 'absolute', top: -60, right: -60,
          width: 300, height: 300,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.12)',
        }} />
        <Box sx={{
          position: 'absolute', bottom: -80, left: -40,
          width: 400, height: 400,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.08)',
        }} />
        <Box sx={{
          position: 'absolute', top: '40%', right: -20,
          width: 200, height: 200,
          borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.05)',
        }} />

        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 6 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: 2.5,
            bgcolor: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.25)',
          }}>
            <ShieldIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: 'white', lineHeight: 1.2 }}>
              SRTS Platform
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em' }}>
              INSURANCE OPERATIONS
            </Typography>
          </Box>
        </Box>

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '2.4rem', color: 'white', lineHeight: 1.15, mb: 2 }}>
            Insurance<br />Management<br />Made Simple
          </Typography>
          <Typography sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.8)', mb: 5, lineHeight: 1.6, maxWidth: 360 }}>
            The industry-standard operations platform for East African insurers, brokers, and MGAs.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 6 }}>
            {FEATURES.map((f) => (
              <Box key={f.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{
                  width: 36, height: 36,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', flexShrink: 0,
                }}>
                  {f.icon}
                </Box>
                <Typography sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                  {f.label}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box>
            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', mb: 1.5, letterSpacing: '0.04em' }}>
              ROLE-BASED ACCESS
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {ROLES.map((r) => (
                <Chip
                  key={r} label={r} size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: '0.72rem', fontWeight: 500,
                    border: '1px solid rgba(255,255,255,0.2)',
                    height: 26,
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Right Panel — Login Form */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 3, sm: 6, lg: 10 },
        py: 6,
      }}>
        {/* Mobile logo */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 4 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: 2,
            bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldIcon sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#202124' }}>
            SRTS Platform
          </Typography>
        </Box>

        <Box sx={{ width: '100%', maxWidth: 420 }}>
          {/* Heading */}
          <Box sx={{ mb: 4 }}>
            <Typography component="h1" sx={{ fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2rem' }, color: '#202124', mb: 0.75 }}>
              Welcome back
            </Typography>
            <Typography sx={{ color: '#5F6368', fontSize: '0.95rem' }}>
              Sign in to your organization account
            </Typography>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3, borderRadius: 2.5, fontSize: '0.85rem' }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleLogin} noValidate>
            {/* Email */}
            <Box sx={{ mb: 2.5 }}>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#202124', mb: 0.75 }}>
                Email address
              </Typography>
              <TextField
                fullWidth
                size="medium"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#FFFFFF',
                    fontSize: '0.9rem',
                    '&.Mui-focused fieldset': { borderWidth: 2 },
                  },
                }}
              />
            </Box>

            {/* Password */}
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#202124' }}>
                  Password
                </Typography>
                <Typography
                  component="span"
                  onClick={() => {}}
                  sx={{ fontSize: '0.8rem', color: 'primary.main', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                >
                  Forgot password?
                </Typography>
              </Box>
              <TextField
                fullWidth
                size="medium"
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        sx={{ color: '#9AA0A6' }}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#FFFFFF',
                    fontSize: '0.9rem',
                    '&.Mui-focused fieldset': { borderWidth: 2 },
                  },
                }}
              />
            </Box>

            {/* Remember me */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  size="small"
                  sx={{ '&.Mui-checked': { color: 'primary.main' } }}
                />
              }
              label={
                <Typography sx={{ fontSize: '0.83rem', color: '#5F6368' }}>
                  Keep me signed in
                </Typography>
              }
              sx={{ mt: 0.5, mb: 3 }}
            />

            {/* Submit */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              endIcon={!loading && <ArrowForwardIcon />}
              sx={{
                py: 1.5,
                fontSize: '0.95rem',
                fontWeight: 700,
                borderRadius: 2.5,
                background: 'linear-gradient(135deg, #1A73E8 0%, #1557B0 100%)',
                boxShadow: '0 4px 16px rgba(26,115,232,0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1557B0 0%, #0D47A1 100%)',
                  boxShadow: '0 6px 20px rgba(26,115,232,0.45)',
                },
                '&:disabled': { opacity: 0.7 },
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>

          {/* Register link */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.85rem', color: '#5F6368' }}>
              Don&apos;t have an account?{' '}
              <Typography
                component="span"
                onClick={() => navigate('/register')}
                sx={{
                  fontWeight: 700, color: 'primary.main', cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Register your organization
              </Typography>
            </Typography>
          </Box>

          {/* Security note */}
          <Box sx={{
            mt: 5, display: 'flex', alignItems: 'center', gap: 1,
            justifyContent: 'center',
          }}>
            <LockIcon sx={{ fontSize: 13, color: '#9AA0A6' }} />
            <Typography sx={{ fontSize: '0.72rem', color: '#9AA0A6' }}>
              Secured by 256-bit encryption · IRA compliant
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
