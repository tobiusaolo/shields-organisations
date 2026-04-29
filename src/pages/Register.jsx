import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Container, Typography, TextField, Button, Alert,
  Checkbox, FormControlLabel, IconButton, InputAdornment,
  CircularProgress, Grid, MenuItem, Select, FormControl,
  Stack, Link
} from '@mui/material'
import { API_BASE_URL, tenancyAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Visibility, VisibilityOff, Shield as ShieldIcon, CheckCircle as CheckIcon } from '@mui/icons-material'

const STEPS = ['Your Organization', 'Contact Info', 'Admin Account', 'Review & Submit']
const STEP_DESCS = ['Tell us about your organization.', 'How should we reach you?', 'Set up the administrator account.', 'Review and confirm your details.']
const sx0 = { '& .MuiOutlinedInput-root': { borderRadius: 0, bgcolor: '#fff' } }

export default function Register() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showCPw, setShowCPw] = useState(false)
  const [agree, setAgree] = useState(false)
  const [form, setForm] = useState({
    orgName: '', orgType: 'insurance', registrationNumber: '', taxId: '',
    businessAddress: '', city: '', country: 'Uganda', website: '',
    contactEmail: '', contactPhone: '', contactPerson: '', contactPosition: '',
    adminEmail: '', adminPassword: '', adminConfirmPassword: '',
    adminFirstName: '', adminLastName: '', adminPhone: '',
  })
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const next = () => {
    setError('')
    if (activeStep === 0 && (!form.orgName || !form.registrationNumber || !form.businessAddress)) return setError('Please fill in all required fields.')
    if (activeStep === 1 && (!form.contactEmail || !form.contactPhone || !form.contactPerson)) return setError('Please fill in all required fields.')
    if (activeStep === 2) {
      if (!form.adminEmail || !form.adminPassword || !form.adminFirstName || !form.adminLastName) return setError('Please fill in all required fields.')
      if (form.adminPassword !== form.adminConfirmPassword) return setError('Passwords do not match.')
      if (form.adminPassword.length < 8) return setError('Password must be at least 8 characters.')
    }
    setActiveStep(p => p + 1)
  }

  const submit = async () => {
    if (!agree) return setError('Please agree to the terms and conditions.')
    setLoading(true)
    try {
      await tenancyAPI.registerOrganization({
        name: form.orgName, type: form.orgType, tax_id: form.taxId,
        contact_phone: form.contactPhone, business_address: form.businessAddress, website: form.website || '',
        admin: { email: form.adminEmail, password: form.adminPassword, first_name: form.adminFirstName, last_name: form.adminLastName, phone: form.adminPhone, role: 'organization_admin' }
      })
      
      // Auto-login after registration
      await login(form.adminEmail, form.adminPassword)
      
      navigate('/admin')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const Field = ({ label, isFullWidth, ...props }) => (
    <Grid item xs={12} sm={6} {...(isFullWidth ? { xs: 12, sm: 12 } : {})}>
      <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, display: 'block', color: '#202124' }}>{label}</Typography>
      <TextField fullWidth sx={sx0} {...props} />
    </Grid>
  )

  const steps_content = [
    <Grid container spacing={2.5} key="s0">
      <Field label="Organization name *" name="orgName" value={form.orgName} onChange={set} placeholder="Acme Insurance Ltd" />
      <Grid item xs={12} sm={6}>
        <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, display: 'block', color: '#202124' }}>Organization type *</Typography>
        <Select fullWidth name="orgType" value={form.orgType} onChange={set} sx={{ borderRadius: 0, bgcolor: '#fff' }}>
          {[['insurance','Insurance Company'],['broker','Insurance Broker'],['agency','Insurance Agency'],['mga','Managing General Agent'],['reinsurance','Reinsurance Company']].map(([v,l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
        </Select>
      </Grid>
      <Field label="Registration number *" name="registrationNumber" value={form.registrationNumber} onChange={set} placeholder="IRA-2024-0001" />
      <Field label="Tax ID (TIN)" name="taxId" value={form.taxId} onChange={set} placeholder="1003456789" />
      <Field label="Business address *" name="businessAddress" value={form.businessAddress} onChange={set} placeholder="Plot 10, Nakasero Road, Kampala" isFullWidth />
      <Field label="City" name="city" value={form.city} onChange={set} placeholder="Kampala" />
      <Field label="Website" name="website" value={form.website} onChange={set} placeholder="https://yourcompany.com" />
    </Grid>,

    <Grid container spacing={2.5} key="s1">
      <Field label="Contact person *" name="contactPerson" value={form.contactPerson} onChange={set} placeholder="Jane Smith" />
      <Field label="Position / Role" name="contactPosition" value={form.contactPosition} onChange={set} placeholder="CEO, Operations Manager" />
      <Field label="Contact email *" name="contactEmail" type="email" value={form.contactEmail} onChange={set} placeholder="contact@company.com" />
      <Field label="Phone number *" name="contactPhone" value={form.contactPhone} onChange={set} placeholder="+256 700 000000" />
    </Grid>,

    <Grid container spacing={2.5} key="s2">
      <Field label="First name *" name="adminFirstName" value={form.adminFirstName} onChange={set} placeholder="Jane" />
      <Field label="Last name *" name="adminLastName" value={form.adminLastName} onChange={set} placeholder="Smith" />
      <Field label="Admin email *" name="adminEmail" type="email" value={form.adminEmail} onChange={set} placeholder="admin@company.com" isFullWidth />
      <Grid item xs={12} sm={6}>
        <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, display: 'block', color: '#202124' }}>Password *</Typography>
        <TextField fullWidth sx={sx0} name="adminPassword" type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters" value={form.adminPassword} onChange={set}
          InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPw(!showPw)}>{showPw ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, display: 'block', color: '#202124' }}>Confirm password *</Typography>
        <TextField fullWidth sx={sx0} name="adminConfirmPassword" type={showCPw ? 'text' : 'password'} placeholder="Repeat password" value={form.adminConfirmPassword} onChange={set}
          InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowCPw(!showCPw)}>{showCPw ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }} />
      </Grid>
    </Grid>,

    <Stack spacing={3} key="s3">
      {[
        { label: 'Organization', items: [{ k: 'Name', v: form.orgName }, { k: 'Type', v: form.orgType }, { k: 'Reg. No.', v: form.registrationNumber }, { k: 'Address', v: form.businessAddress }] },
        { label: 'Contact', items: [{ k: 'Person', v: form.contactPerson }, { k: 'Email', v: form.contactEmail }, { k: 'Phone', v: form.contactPhone }] },
        { label: 'Administrator', items: [{ k: 'Name', v: `${form.adminFirstName} ${form.adminLastName}` }, { k: 'Email', v: form.adminEmail }] },
      ].map(s => (
        <Box key={s.label} sx={{ p: 3, bgcolor: '#F8F9FA', borderRadius: 0, border: '1px solid #E8EAED' }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#1A237E', mb: 1.5, display: 'block' }}>{s.label.toUpperCase()}</Typography>
          <Grid container spacing={1}>
            {s.items.map(({ k, v }) => (
              <Grid item xs={12} sm={6} key={k}>
                <Typography variant="caption" sx={{ color: '#5F6368' }}>{k}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{v || '—'}</Typography>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
      <FormControlLabel
        control={<Checkbox checked={agree} onChange={e => setAgree(e.target.checked)} sx={{ color: '#1A237E' }} />}
        label={<Typography variant="body2">I agree to the <Link href="#" sx={{ color: '#1A237E' }}>Terms of Service</Link> and <Link href="#" sx={{ color: '#1A237E' }}>Privacy Policy</Link></Typography>}
      />
    </Stack>
  ]

  const btnSx = { px: 5, py: 1.5, borderRadius: 0, bgcolor: '#1A237E', fontWeight: 700, boxShadow: 'none', '&:hover': { bgcolor: '#0d1b6e', boxShadow: 'none' } }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8F9FA', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 4, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#fff', borderBottom: '1px solid #E8EAED' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <Box sx={{ width: 32, height: 32, bgcolor: '#1A237E', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 0}}>
            <ShieldIcon sx={{ color: '#fff', fontSize: 18 }} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#1A237E' }}>SHIELDS</Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#5F6368' }}>
          Already registered?{' '}<Link onClick={() => navigate('/admin/login')} sx={{ fontWeight: 700, color: '#1A237E', cursor: 'pointer' }}>Sign in</Link>
        </Typography>
      </Box>

      <Container maxWidth="md" sx={{ py: 6 }}>
        <Box sx={{ mb: 5 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#202124', mb: 0.5 }}>Register your organization</Typography>
          <Typography sx={{ color: '#5F6368' }}>Step {activeStep + 1} of {STEPS.length} — {STEP_DESCS[activeStep]}</Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.75, mb: 2 }}>
          {STEPS.map((_, i) => <Box key={i} sx={{ height: 4, flex: 1, borderRadius: 0, bgcolor: i <= activeStep ? '#1A237E' : '#E8EAED', transition: 'background-color 0.3s' }} />)}
        </Box>
        <Stack direction="row" sx={{ mb: 5 }}>
          {STEPS.map((label, i) => (
            <Box key={i} sx={{ flex: 1, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: i === activeStep ? 800 : 500, color: i === activeStep ? '#1A237E' : i < activeStep ? '#202124' : '#9AA0A6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                {i < activeStep && <CheckIcon sx={{ fontSize: 13 }} />}{label}
              </Typography>
            </Box>
          ))}
        </Stack>

        <Box sx={{ bgcolor: '#fff', border: '1px solid #E8EAED', borderRadius: 0, p: { xs: 3, sm: 5 } }}>
          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 0}} onClose={() => setError('')}>{error}</Alert>}
          {steps_content[activeStep]}
        </Box>

        <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
          <Button onClick={() => setActiveStep(p => p - 1)} disabled={activeStep === 0} sx={{ fontWeight: 700, color: '#5F6368', px: 3, borderRadius: 0}}>← Back</Button>
          {activeStep < STEPS.length - 1
            ? <Button variant="contained" onClick={next} sx={btnSx}>Continue →</Button>
            : <Button variant="contained" onClick={submit} disabled={loading || !agree} sx={btnSx}>{loading ? <CircularProgress size={20} color="inherit" /> : 'Complete Registration'}</Button>
          }
        </Stack>
      </Container>
    </Box>
  )
}
