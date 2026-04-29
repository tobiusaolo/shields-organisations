import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Grid, 
  Stack, 
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Link
} from '@mui/material'
import {
  Shield as ShieldIcon,
  Visibility,
  VisibilityOff,
  CheckCircle as CheckIcon
} from '@mui/icons-material'
import { tenancyAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

const BENEFITS = [
  'Instant digital insurance certificates',
  'File and track claims in minutes',
  'Compare hundreds of plans side-by-side',
]

export default function ClientRegister() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, refreshContext } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState(1) // 1 = personal info, 2 = password

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleContinue = (e) => {
    e.preventDefault()
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('Please fill in all fields to continue.')
      return
    }
    setError('')
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!formData.password || formData.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      await tenancyAPI.registerUser({
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
      })
      
      // Auto-login after registration
      await login(formData.email, formData.password)
      
      setLoading(false)
      const redirectTo = location.state?.redirectTo || '/client'
      navigate(redirectTo)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8F9FA', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <Box sx={{ px: 4, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#fff', borderBottom: '1px solid #E8EAED' }}>
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <Box sx={{ width: 32, height: 32, bgcolor: '#1A237E', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 0}}>
            <ShieldIcon sx={{ color: '#fff', fontSize: 18 }} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#1A237E' }}>SHIELDS</Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#5F6368' }}>
          Already have an account?{' '}
          <Link onClick={() => navigate('/client/login')} sx={{ fontWeight: 700, color: '#1A237E', cursor: 'pointer' }}>
            Sign in
          </Link>
        </Typography>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6, px: 2 }}>
        <Box sx={{ width: '100%', maxWidth: 960, display: 'flex', gap: 8, alignItems: 'flex-start' }}>

          {/* Left — Form */}
          <Box sx={{ flex: 1 }}>
            {/* Step Indicator */}
            <Stack direction="row" spacing={1} sx={{ mb: 5 }}>
              <Box sx={{ height: 4, flex: 1, bgcolor: '#1A237E', borderRadius: 0}} />
              <Box sx={{ height: 4, flex: 1, bgcolor: step >= 2 ? '#1A237E' : '#E8EAED', borderRadius: 0}} />
            </Stack>

            {step === 1 ? (
              <Box component="form" onSubmit={handleContinue}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#202124', letterSpacing: -0.5 }}>
                  Create your account
                </Typography>
                <Typography sx={{ color: '#5F6368', mb: 5, fontSize: '1.05rem' }}>
                  Get protected in minutes. No paperwork required.
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 0}} onClose={() => setError('')}>{error}</Alert>}

                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#202124', mb: 0.75, display: 'block' }}>First name</Typography>
                    <TextField
                      fullWidth name="firstName" placeholder="John"
                      value={formData.firstName} onChange={handleChange}
                      InputProps={{ sx: { borderRadius: 0, bgcolor: '#fff' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#202124', mb: 0.75, display: 'block' }}>Last name</Typography>
                    <TextField
                      fullWidth name="lastName" placeholder="Doe"
                      value={formData.lastName} onChange={handleChange}
                      InputProps={{ sx: { borderRadius: 0, bgcolor: '#fff' } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#202124', mb: 0.75, display: 'block' }}>Email address *</Typography>
                    <TextField
                      fullWidth name="email" type="email" placeholder="john@example.com"
                      value={formData.email} onChange={handleChange}
                      InputProps={{ sx: { borderRadius: 0, bgcolor: '#fff' } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#202124', mb: 0.75, display: 'block' }}>Phone Number</Typography>
                    <TextField
                      fullWidth name="phone" placeholder="+256 700 000 000"
                      value={formData.phone} onChange={handleChange}
                      InputProps={{ sx: { borderRadius: 0, bgcolor: '#fff' } }}
                    />
                  </Grid>
                </Grid>

                <Button
                  type="submit" fullWidth variant="contained" size="large"
                  sx={{ mt: 4, py: 1.75, borderRadius: 0, bgcolor: '#1A237E', fontWeight: 700, fontSize: '1rem', boxShadow: 'none', '&:hover': { bgcolor: '#0d1b6e', boxShadow: 'none' } }}
                >
                  Continue
                </Button>

                <Typography variant="caption" sx={{ color: '#9AA0A6', mt: 3, display: 'block', textAlign: 'center' }}>
                  By continuing, you agree to our Terms of Service and Privacy Policy.
                </Typography>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleSubmit}>
                <Button onClick={() => setStep(1)} sx={{ mb: 3, color: '#5F6368', fontWeight: 600, pl: 0 }}>← Back</Button>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#202124', letterSpacing: -0.5 }}>
                  Set your password
                </Typography>
                <Typography sx={{ color: '#5F6368', mb: 5, fontSize: '1.05rem' }}>
                  Creating account for <strong>{formData.email}</strong>
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 0}} onClose={() => setError('')}>{error}</Alert>}

                <Typography variant="caption" sx={{ fontWeight: 700, color: '#202124', mb: 0.75, display: 'block' }}>Password</Typography>
                <TextField
                  fullWidth name="password" type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={formData.password} onChange={handleChange}
                  InputProps={{
                    sx: { borderRadius: 0, bgcolor: '#fff' },
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />

                <Button
                  type="submit" fullWidth variant="contained" size="large" disabled={loading}
                  sx={{ mt: 4, py: 1.75, borderRadius: 0, bgcolor: '#1A237E', fontWeight: 700, fontSize: '1rem', boxShadow: 'none', '&:hover': { bgcolor: '#0d1b6e', boxShadow: 'none' } }}
                >
                  {loading ? <CircularProgress size={22} color="inherit" /> : 'Create account'}
                </Button>
              </Box>
            )}
          </Box>

          {/* Right — Social Proof (hidden on mobile) */}
          <Box sx={{ width: 340, display: { xs: 'none', lg: 'block' }, pt: 2 }}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 0, border: '1px solid #E8EAED', bgcolor: '#fff' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: '#202124' }}>
                Why SHIELDS?
              </Typography>
              <Typography variant="body2" sx={{ color: '#5F6368', mb: 3, lineHeight: 1.7 }}>
                Join thousands of individuals and businesses across Uganda who trust SHIELDS for their insurance needs.
              </Typography>
              <Stack spacing={2.5}>
                {BENEFITS.map((b) => (
                  <Stack key={b} direction="row" spacing={1.5} alignItems="flex-start">
                    <CheckIcon sx={{ color: '#1A237E', fontSize: 20, mt: 0.2 }} />
                    <Typography variant="body2" sx={{ color: '#202124', fontWeight: 500, lineHeight: 1.6 }}>{b}</Typography>
                  </Stack>
                ))}
              </Stack>
              <Divider sx={{ my: 3 }} />
              <Box sx={{ p: 2.5, bgcolor: '#F8F9FA', borderRadius: 0}}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#202124', mb: 0.5 }}>🔒 Your data is safe</Typography>
                <Typography variant="caption" sx={{ color: '#5F6368', lineHeight: 1.6 }}>
                  All data is encrypted and stored securely. We never sell your information.
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
