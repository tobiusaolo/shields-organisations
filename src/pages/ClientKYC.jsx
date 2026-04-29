import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { tenancyAPI } from '../services/api'
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  Avatar,
  Fade,
  Divider,
  Stack,
  Chip,
} from '@mui/material'
import { stepConnectorClasses } from '@mui/material/StepConnector'
import { styled } from '@mui/material/styles'
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Description as DocIcon,
  Shield as ShieldIcon,
  Verified as VerifiedIcon,
  ArrowForward as NextIcon,
  ArrowBack as BackIcon,
  PhotoCamera as PhotoIcon,
  LocationOn as LocationIcon,
  CreditCard as CardIcon,
} from '@mui/icons-material'

const steps = [
  { label: 'Basic Info', icon: LocationIcon, desc: 'Identity & Address' },
  { label: 'Documents', icon: DocIcon, desc: 'Verification files' },
  { label: 'Review', icon: VerifiedIcon, desc: 'Confirm submission' },
]

const ColorConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 22 },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: { backgroundImage: 'linear-gradient(90deg, #1A237E, #3F51B5)' },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: { backgroundImage: 'linear-gradient(90deg, #1A237E, #4CAF50)' },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3, border: 0,
    backgroundColor: '#E8EAED',
    borderRadius: 0,
  },
}))

function ColorStepIcon({ active, completed, icon, step }) {
  const Icon = steps[step - 1]?.icon || ShieldIcon
  return (
    <Box sx={{
      width: 48, height: 48,
      borderRadius: 0,
      bgcolor: completed ? '#2E7D32' : active ? '#1A237E' : '#F8F9FA',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: active ? '0 0 0 4px rgba(26,35,126,0.15)' : 'none',
      transition: 'all 0.3s',
      border: active || completed ? 'none' : '2px solid #E8EAED',
    }}>
      {completed
        ? <CheckIcon sx={{ fontSize: 24, color: '#fff' }} />
        : <Icon sx={{ fontSize: 22, color: active ? '#fff' : '#9AA0A6' }} />
      }
    </Box>
  )
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
      <Box sx={{ width: 48, height: 48, borderRadius: 0, bgcolor: '#E8EAF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon sx={{ fontSize: 24, color: '#1A237E' }} />
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#1A237E', lineHeight: 1.2 }}>{title}</Typography>
        <Typography sx={{ fontSize: '0.85rem', color: '#5F6368', mt: 0.5 }}>{subtitle}</Typography>
      </Box>
    </Box>
  )
}

export default function ClientKYC() {
  const { user, refreshContext } = useAuth()
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSubmittedLocal, setIsSubmittedLocal] = useState(false)
  
  const [form, setForm] = useState({
    nin: '',
    tin: '',
    address: '',
    documents: [], // List of {document_type: str, content: str, file_name: str}
  })

  // Mandatory documents for individuals
  const MANDATORY_DOCS = [
    { type: 'national_id_front', label: 'National ID (Front)', desc: 'Clear photo of the front side' },
    { type: 'national_id_back', label: 'National ID (Back)', desc: 'Clear photo of the back side' },
    { type: 'selfie', label: 'Selfie with ID', desc: 'Hold your ID next to your face' },
  ]

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const compressImage = (base64Str, maxWidth = 800, maxHeight = 800) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.src = base64Str
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.7)) // 0.7 quality is plenty for KYC
      }
    })
  }

  const handleFileUpload = (type, label) => async (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File is too large. Please select an image under 5MB.')
        return
      }

      const reader = new FileReader()
      reader.onloadend = async () => {
        let content = reader.result
        
        // Compress if it's an image
        if (file.type.startsWith('image/')) {
          content = await compressImage(content)
        }

        setForm(f => {
          const otherDocs = f.documents.filter(d => d.document_type !== type)
          return {
            ...f,
            documents: [...otherDocs, { 
              document_type: type, 
              content: content, 
              file_name: file.name,
              label: label,
              preview: content // Store for preview
            }]
          }
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleNext = () => {
    setError('')
    if (activeStep === 0 && (!form.nin || !form.address)) {
      setError('National ID Number (NIN) and Residential Address are required.')
      return
    }
    if (activeStep === 1) {
      const uploadedTypes = form.documents.map(d => d.document_type)
      const missing = MANDATORY_DOCS.filter(d => !uploadedTypes.includes(d.type))
      if (missing.length > 0) {
        setError(`Please upload: ${missing.map(m => m.label).join(', ')}`)
        return
      }
    }
    setActiveStep(s => s + 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      // Structure payload for backend
      const payload = {
        nin: form.nin,
        tin: form.tin,
        address: form.address,
        documents: form.documents.map(({ document_type, content, file_name }) => ({
          document_type,
          content,
          file_name
        }))
      }

      await tenancyAPI.submitUserKyc(payload)

      await Swal.fire({
        icon: 'success',
        title: 'KYC Submitted!',
        text: 'Your identification documents have been received and are pending review.',
        confirmButtonColor: '#1A237E'
      })

      setIsSubmittedLocal(true)
      await refreshContext()
      navigate('/client/profile')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit KYC. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  if (user?.kyc_status === 'verified' || user?.kyc_status === 'approved') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Box sx={{ textAlign: 'center', maxWidth: 480 }}>
          <Box sx={{ width: 80, height: 80, borderRadius: 0, bgcolor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
            <VerifiedIcon sx={{ fontSize: 40, color: '#2E7D32' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Verification Complete</Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>Your identity has been verified. You now have full access to SHIELDS features.</Typography>
          <Button variant="contained" onClick={() => navigate('/client')} sx={{ borderRadius: 0, bgcolor: '#1A237E' }}>Go to Dashboard</Button>
        </Box>
      </Box>
    )
  }

  if (user?.kyc_status === 'submitted' || isSubmittedLocal) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Box sx={{ textAlign: 'center', maxWidth: 480 }}>
          <Box sx={{ width: 80, height: 80, borderRadius: 0, bgcolor: '#E8EAF6', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
            <ShieldIcon sx={{ fontSize: 40, color: '#1A237E' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Review in Progress</Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>We are currently reviewing your documents. This typically takes less than 24 hours.</Typography>
          <Button variant="outlined" onClick={() => navigate('/client/profile')} sx={{ borderRadius: 0, color: '#1A237E', borderColor: '#1A237E' }}>View Profile</Button>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, color: '#1A237E', mb: 1 }}>Account Verification</Typography>
        <Typography sx={{ color: '#5F6368' }}>Complete your KYC to unlock all features and start protecting what matters.</Typography>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #E8EAED', borderRadius: 0, overflow: 'hidden' }}>
        <Box sx={{ p: 4, bgcolor: '#F8F9FA', borderBottom: '1px solid #E8EAED' }}>
          <Stepper activeStep={activeStep} alternativeLabel connector={<ColorConnector />}>
            {steps.map((step, i) => (
              <Step key={step.label}>
                <StepLabel StepIconComponent={(props) => <ColorStepIcon {...props} step={i + 1} />}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', mt: 1, color: activeStep === i ? '#1A237E' : '#9AA0A6' }}>{step.label}</Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Box sx={{ p: 6 }}>
          {error && <Alert severity="error" sx={{ mb: 4, borderRadius: 0}}>{error}</Alert>}

          {activeStep === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <SectionHeader icon={LocationIcon} title="Personal Identification" subtitle="Please provide your official ID and address details" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="National ID Number (NIN) *" value={form.nin} onChange={(e) => update('nin', e.target.value)} placeholder="CM1234567890" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="TIN Number (Optional)" value={form.tin} onChange={(e) => update('tin', e.target.value)} placeholder="1000123456" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={3} label="Residential Address *" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Plot 123, Kampala Road, Kampala, Uganda" />
              </Grid>
            </Grid>
          )}

          {activeStep === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <SectionHeader icon={DocIcon} title="Identity Documents" subtitle="Upload clear photos of your identification" />
              </Grid>
              {MANDATORY_DOCS.map((doc) => {
                const uploaded = form.documents.find(d => d.document_type === doc.type)
                return (
                  <Grid item xs={12} key={doc.type}>
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid #E8EAED', borderRadius: 0, display: 'flex', alignItems: 'center', gap: 3, bgcolor: uploaded ? '#F1F8E9' : '#fff' }}>
                      <Avatar sx={{ bgcolor: uploaded ? '#4CAF50' : '#E8EAF6', color: uploaded ? '#fff' : '#1A237E' }}>
                        {uploaded ? <CheckIcon /> : <DocIcon />}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{doc.label}</Typography>
                        <Typography sx={{ fontSize: '0.8rem', color: '#5F6368' }}>{uploaded ? `Uploaded: ${uploaded.file_name}` : doc.desc}</Typography>
                        {uploaded?.preview && (
                          <Box sx={{ mt: 1, position: 'relative', width: 80, height: 60, borderRadius: 0, overflow: 'hidden', border: '1px solid #E8EAED' }}>
                            <img src={uploaded.preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </Box>
                        )}
                      </Box>
                      <Button variant="outlined" component="label" size="small" sx={{ borderRadius: 0, textTransform: 'none', fontWeight: 600 }}>
                        {uploaded ? 'Change' : 'Upload'}
                        <input type="file" hidden accept="image/*,.pdf" onChange={handleFileUpload(doc.type, doc.label)} />
                      </Button>
                    </Paper>
                  </Grid>
                )
              })}
            </Grid>
          )}

          {activeStep === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <SectionHeader icon={VerifiedIcon} title="Review Submission" subtitle="Double check your details before sending" />
              </Grid>
              <Grid item xs={12}>
                <Card elevation={0} sx={{ bgcolor: '#F8F9FA', borderRadius: 0, p: 3 }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#9AA0A6', fontWeight: 700, textTransform: 'uppercase' }}>NIN Number</Typography>
                      <Typography sx={{ fontWeight: 600 }}>{form.nin}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#9AA0A6', fontWeight: 700, textTransform: 'uppercase' }}>Residential Address</Typography>
                      <Typography sx={{ fontWeight: 600 }}>{form.address}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#9AA0A6', fontWeight: 700, textTransform: 'uppercase' }}>Documents Uploaded</Typography>
                      <Grid container spacing={1} sx={{ mt: 1 }}>
                        {form.documents.map(d => (
                          <Grid item xs={4} key={d.document_type}>
                            <Box sx={{ position: 'relative', pt: '75%', borderRadius: 0, overflow: 'hidden', border: '1px solid #E8EAED' }}>
                              <img src={d.preview} alt={d.label} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                            </Box>
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, mt: 0.5, textAlign: 'center' }}>{d.label}</Typography>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ borderRadius: 0}}>
                  By submitting, you confirm that all provided information is accurate and documents are authentic.
                </Alert>
              </Grid>
            </Grid>
          )}
        </Box>

        <Box sx={{ p: 4, bgcolor: '#F8F9FA', borderTop: '1px solid #E8EAED', display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={() => setActiveStep(s => s - 1)} disabled={activeStep === 0 || loading} startIcon={<BackIcon />}>Back</Button>
          {activeStep === steps.length - 1 ? (
            <Button variant="contained" onClick={handleSubmit} disabled={loading} sx={{ borderRadius: 0, bgcolor: '#1A237E', px: 4, py: 1.2 }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Finalize & Submit'}
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext} endIcon={<NextIcon />} sx={{ borderRadius: 0, bgcolor: '#1A237E', px: 4, py: 1.2 }}>
              Continue
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  )
}
