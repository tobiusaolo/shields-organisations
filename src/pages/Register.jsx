import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Divider,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Chip,
} from '@mui/material'
import { API_BASE_URL } from '../services/api'
import {
  Visibility,
  VisibilityOff,
  Business as BusinessIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Description as DescriptionIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
} from '@mui/icons-material'

const steps = ['Organization Info', 'Contact Details', 'Admin Account', 'Review']

export default function Register() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)

  const [formData, setFormData] = useState({
    // Organization Info
    orgName: '',
    orgType: 'insurance',
    registrationNumber: '',
    taxId: '',
    businessAddress: '',
    city: '',
    country: 'Uganda',
    website: '',
    
    // Contact Details
    contactEmail: '',
    contactPhone: '',
    contactPerson: '',
    contactPosition: '',
    
    // Admin Account
    adminEmail: '',
    adminPassword: '',
    adminConfirmPassword: '',
    adminFirstName: '',
    adminLastName: '',
    adminPhone: '',
  })

  const handleNext = () => {
    setError('')
    
    // Validation for current step
    if (activeStep === 0) {
      if (!formData.orgName || !formData.registrationNumber || !formData.businessAddress) {
        setError('Please fill in all required fields')
        return
      }
    } else if (activeStep === 1) {
      if (!formData.contactEmail || !formData.contactPhone || !formData.contactPerson) {
        setError('Please fill in all required fields')
        return
      }
    } else if (activeStep === 2) {
      if (!formData.adminEmail || !formData.adminPassword || !formData.adminFirstName || !formData.adminLastName) {
        setError('Please fill in all required fields')
        return
      }
      if (formData.adminPassword !== formData.adminConfirmPassword) {
        setError('Passwords do not match')
        return
      }
      if (formData.adminPassword.length < 8) {
        setError('Password must be at least 8 characters')
        return
      }
    }
    
    setActiveStep((prevActiveStep) => prevActiveStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const handleSubmit = async () => {
    setError('')
    
    if (!agreeTerms) {
      setError('Please agree to the terms and conditions')
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/tenancy/organizations/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.orgName,
          type: formData.orgType,
          tax_id: formData.taxId,
          contact_phone: formData.contactPhone,
          business_address: formData.businessAddress,
          website: formData.website || '',
          admin: {
            email: formData.adminEmail,
            password: formData.adminPassword,
            first_name: formData.adminFirstName,
            last_name: formData.adminLastName,
            phone: formData.adminPhone,
            role: 'organization_admin'
          }
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        navigate('/login', { state: { message: 'Registration successful! Please login to continue.' } })
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Registration failed. Please try again.')
      }
    } catch (err) {
      setError('Registration failed. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <BusinessIcon sx={{ mr: 2, color: '#667eea', fontSize: 36 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#333' }}>Organization Information</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Organization Name"
                name="orgName"
                value={formData.orgName}
                onChange={handleInputChange}
                placeholder="Enter your organization name"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Organization Type</InputLabel>
                <Select
                  name="orgType"
                  value={formData.orgType}
                  onChange={handleInputChange}
                  label="Organization Type"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="insurance">Insurance Company</MenuItem>
                  <MenuItem value="broker">Insurance Broker</MenuItem>
                  <MenuItem value="agency">Insurance Agency</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Registration Number"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleInputChange}
                placeholder="Business registration number"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tax ID"
                name="taxId"
                value={formData.taxId}
                onChange={handleInputChange}
                placeholder="Tax identification number"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Business Address"
                name="businessAddress"
                value={formData.businessAddress}
                onChange={handleInputChange}
                placeholder="Street address"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="City"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Website (Optional)"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://example.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                placeholder="Country"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
          </Grid>
        )
      
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <EmailIcon sx={{ mr: 2, color: '#667eea', fontSize: 36 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#333' }}>Contact Details</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Contact Email"
                name="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={handleInputChange}
                placeholder="organization@example.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Contact Phone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                placeholder="+256 700 000 000"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Contact Person"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                placeholder="Full name"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Position"
                name="contactPosition"
                value={formData.contactPosition}
                onChange={handleInputChange}
                placeholder="Job title"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
          </Grid>
        )
      
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <PersonIcon sx={{ mr: 2, color: '#667eea', fontSize: 36 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#333' }}>Admin Account</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="First Name"
                name="adminFirstName"
                value={formData.adminFirstName}
                onChange={handleInputChange}
                placeholder="John"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Last Name"
                name="adminLastName"
                value={formData.adminLastName}
                onChange={handleInputChange}
                placeholder="Doe"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Email"
                name="adminEmail"
                type="email"
                value={formData.adminEmail}
                onChange={handleInputChange}
                placeholder="admin@example.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                name="adminPhone"
                value={formData.adminPhone}
                onChange={handleInputChange}
                placeholder="+256 700 000 000"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Password"
                name="adminPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.adminPassword}
                onChange={handleInputChange}
                placeholder="At least 8 characters"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Confirm Password"
                name="adminConfirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.adminConfirmPassword}
                onChange={handleInputChange}
                placeholder="Re-enter password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
          </Grid>
        )
      
      case 3:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 4, fontWeight: 700, color: '#333' }}>Review Your Information</Typography>
            
            <Card sx={{ mb: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BusinessIcon sx={{ mr: 2, color: '#667eea', fontSize: 28 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Organization</Typography>
                </Box>
                <Typography variant="body2" sx={{ mb: 1 }}><strong>Name:</strong> {formData.orgName}</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}><strong>Type:</strong> {formData.orgType}</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}><strong>Registration:</strong> {formData.registrationNumber}</Typography>
                <Typography variant="body2"><strong>Address:</strong> {formData.businessAddress}, {formData.city}, {formData.country}</Typography>
              </CardContent>
            </Card>
            
            <Card sx={{ mb: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EmailIcon sx={{ mr: 2, color: '#667eea', fontSize: 28 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Contact</Typography>
                </Box>
                <Typography variant="body2" sx={{ mb: 1 }}><strong>Email:</strong> {formData.contactEmail}</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}><strong>Phone:</strong> {formData.contactPhone}</Typography>
                <Typography variant="body2"><strong>Contact Person:</strong> {formData.contactPerson} ({formData.contactPosition})</Typography>
              </CardContent>
            </Card>
            
            <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonIcon sx={{ mr: 2, color: '#667eea', fontSize: 28 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Admin Account</Typography>
                </Box>
                <Typography variant="body2" sx={{ mb: 1 }}><strong>Name:</strong> {formData.adminFirstName} {formData.adminLastName}</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}><strong>Email:</strong> {formData.adminEmail}</Typography>
                <Typography variant="body2"><strong>Phone:</strong> {formData.adminPhone}</Typography>
              </CardContent>
            </Card>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  color="primary"
                  sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
                />
              }
              label="I agree to the Terms of Service and Privacy Policy"
              sx={{ mb: 2 }}
            />
          </Box>
        )
      
      default:
        return 'Unknown step'
    }
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 4
    }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          {/* Left Side - Branding */}
          <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ color: 'white', textAlign: 'left', pl: 4 }}>
              <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
                Register Your Organization
              </Typography>
              <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
                Join the Insurance Platform today
              </Typography>
              
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <BusinessIcon sx={{ mr: 2, fontSize: 32 }} />
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    Multi-step registration process
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <SecurityIcon sx={{ mr: 2, fontSize: 32 }} />
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    Secure and verified registration
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AssignmentTurnedInIcon sx={{ mr: 2, fontSize: 32 }} />
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    Instant access upon approval
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 6 }}>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Organization types supported:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                  <Chip label="Insurance Company" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                  <Chip label="Insurance Broker" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                  <Chip label="Insurance Agency" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Right Side - Registration Form */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={24} 
              sx={{ 
                p: 4, 
                borderRadius: 4,
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)'
              }}
            >
              {/* Header */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box sx={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  mb: 2,
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)'
                }}>
                  <svg viewBox="0 0 24 24" fill="white" style={{ width: 48, height: 48 }}>
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </Box>
                <Typography component="h1" variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#667eea' }}>
                  Organization Registration
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Complete all steps to register your organization
                </Typography>
              </Box>
              
              {error && <Alert severity="error" sx={{ mb: 3 }}>{typeof error === 'string' ? error : error.detail || 'An error occurred'}</Alert>}
              
              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              
              <Box sx={{ mt: 2 }}>
                {getStepContent(activeStep)}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    sx={{ borderRadius: 2 }}
                  >
                    Back
                  </Button>
                  
                  {activeStep === steps.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={loading}
                      sx={{ 
                        borderRadius: 2, 
                        py: 1.5, 
                        px: 4,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5568d3 0%, #6a3e8a 100%)',
                        }
                      }}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : 'Complete Registration'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      sx={{ 
                        borderRadius: 2, 
                        py: 1.5, 
                        px: 4,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5568d3 0%, #6a3e8a 100%)',
                        }
                      }}
                    >
                      Next
                    </Button>
                  )}
                </Box>
              </Box>
              
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <Button
                    variant="text"
                    onClick={() => navigate('/login')}
                    sx={{ 
                      fontWeight: 600, 
                      color: '#667eea',
                      textTransform: 'none',
                      p: 0,
                      minWidth: 'auto'
                    }}
                  >
                    Sign in
                  </Button>
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
