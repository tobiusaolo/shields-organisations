import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { tenancyAPI, kycAPI, paymentAPI } from '../services/api'
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
  Chip,
  IconButton,
  Avatar,
  Fade,
  Divider,
} from '@mui/material'
import { stepConnectorClasses } from '@mui/material/StepConnector'
import { styled } from '@mui/material/styles'
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Description as DocIcon,
  Business as BusinessIcon,
  Shield as ShieldIcon,
  Verified as VerifiedIcon,
  ArrowForward as NextIcon,
  ArrowBack as BackIcon,
  PhotoCamera as PhotoIcon,
  Payment as PaymentIcon,
  AccountBalance as BankIcon,
  PhoneAndroid as MobileIcon,
  CreditCard as CardIcon,
} from '@mui/icons-material'

const steps = [
  { label: 'Business Profile', icon: BusinessIcon, desc: 'Identity & Branding' },
  { label: 'Documentation', icon: DocIcon, desc: 'Compliance files' },
  { label: 'Payment Config', icon: PaymentIcon, desc: 'PesaPal Setup' },
  { label: 'Review', icon: VerifiedIcon, desc: 'Confirm submission' },
]

const ColorConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 22 },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: { backgroundImage: 'linear-gradient(90deg, #1A73E8, #4A90F7)' },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: { backgroundImage: 'linear-gradient(90deg, #1A73E8, #34A853)' },
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
      bgcolor: completed ? '#1E8E3E' : active ? '#1A73E8' : '#F8F9FA',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: active ? '0 0 0 4px rgba(26,115,232,0.15)' : 'none',
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
      <Box sx={{ width: 48, height: 48, borderRadius: 0, bgcolor: '#E8F0FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon sx={{ fontSize: 24, color: '#1A73E8' }} />
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#202124', lineHeight: 1.2 }}>{title}</Typography>
        <Typography sx={{ fontSize: '0.85rem', color: '#5F6368', mt: 0.5 }}>{subtitle}</Typography>
      </Box>
    </Box>
  )
}

export default function KYC() {
  const { user, refreshContext } = useAuth()
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSubmittedLocal, setIsSubmittedLocal] = useState(false)
  
  const [form, setForm] = useState({
    registration_name: '',
    tax_id: '',
    website: '',
    address: '',
    contact_phone: '',
    contact_email: '',
    logo: null, // Base64
    documents: [], // List of {name: str, content: str}
    // Payment Configuration
    payment_config: {
      consumer_key: '',
      consumer_secret: '',
      is_sandbox: true,
      accepts_mobile_money: true,
      accepts_bank_transfer: false,
      accepts_card: false,
      organization_bank_name: '',
      organization_account_name: '',
      organization_account_number: '',
    }
  })

  // Pre-fill from user context if available
  useEffect(() => {
    let active = true

    const fetchHistory = async () => {
       console.log('User data for prefill:', user)
       
       // Prefill from registration data
       if (user?.organization_name) {
         setForm(f => ({ ...f, registration_name: user.organization_name }))
         console.log('Prefilled registration_name:', user.organization_name)
       }
       if (user?.organization_tax_id) {
         setForm(f => ({ ...f, tax_id: user.organization_tax_id }))
         console.log('Prefilled tax_id:', user.organization_tax_id)
       }
       if (user?.organization_contact_phone) {
        setForm(f => ({ ...f, contact_phone: user.organization_contact_phone }))
        console.log('Prefilled contact_phone:', user.organization_contact_phone)
      } else {
        console.log('organization_contact_phone not found in user data')
      }
      if (user?.organization_email || user?.email) {
        setForm(f => ({ ...f, contact_email: user.organization_email || user?.email }))
        console.log('Prefilled contact_email:', user.organization_email || user?.email)
      } else {
        console.log('organization_email not found in user data')
      }
      if (user?.organization_address) {
         setForm(f => ({ ...f, address: user.organization_address }))
         console.log('Prefilled address:', user.organization_address)
       } else {
         console.log('organization_address not found in user data')
       }
       if (user?.organization_website) {
         setForm(f => ({ ...f, website: user.organization_website }))
         console.log('Prefilled website:', user.organization_website)
       }

       // If KYC was rejected, retrieve historical submitted documents
       if (user?.organization_id && user.kyc_status === 'rejected') {
          try {
             const res = await kycAPI.getOrganizationKycDocuments(user.organization_id)
             if (active && res.data?.items) {
                const historicDocs = res.data.items.map(doc => ({
                   name: doc.file_name,
                   content: doc.file_url
                }))
                setForm(f => ({ ...f, documents: historicDocs }))
             }
          } catch(e) {
             console.error('Failed to rehydrate historic documents', e)
          }
       }
    }
    fetchHistory()
    return () => { active = false }
  }, [user])

  // Poll for status updates if KYC is 'submitted'
  useEffect(() => {
    let intervalId;
    if (user?.kyc_status === 'submitted') {
      intervalId = setInterval(() => {
        refreshContext();
      }, 5000); // Poll every 5 seconds
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user?.kyc_status, refreshContext]);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => update('logo', reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setForm(f => ({
          ...f,
          documents: [...f.documents, { name: file.name, content: reader.result }]
        }))
      }
      reader.readAsDataURL(file)
    })
  }

  const handleNext = () => {
    setError('')
    if (activeStep === 0 && (!form.registration_name || !form.tax_id || !form.logo || !form.address || !form.contact_phone || !form.contact_email)) {
      setError('Official name, Tax ID, Company Logo, Registered Address, Contact Phone, and Contact Email are required.')
      return
    }
    if (activeStep === 1 && form.documents.length === 0) {
      setError('Please upload at least one verification document.')
      return
    }
    if (activeStep === 2) {
      // Validate payment configuration
      const pc = form.payment_config
      if (!pc.consumer_key || !pc.consumer_secret) {
        setError('PesaPal Consumer Key and Consumer Secret are required for payment processing.')
        return
      }
      // At least one payment method must be enabled
      if (!pc.accepts_mobile_money && !pc.accepts_bank_transfer && !pc.accepts_card) {
        setError('Please enable at least one payment method (Mobile Money, Bank Transfer, or Card).')
        return
      }
      // If bank transfer is enabled, bank details are required
      if (pc.accepts_bank_transfer) {
        if (!pc.organization_bank_name || !pc.organization_account_name || !pc.organization_account_number) {
          setError('Bank details (Bank Name, Account Name, Account Number) are required when enabling bank transfers.')
          return
        }
      }
    }
    setActiveStep(s => s + 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const orgId = user?.organization_id || user?.default_organization_id
      if (!orgId) throw new Error('Organization context not found.')
      
      // First, save the payment configuration
      if (form.payment_config.consumer_key && form.payment_config.consumer_secret) {
        await paymentAPI.createPaymentConfig(orgId, {
          organization_id: orgId,
          consumer_key: form.payment_config.consumer_key,
          consumer_secret: form.payment_config.consumer_secret,
          is_sandbox: form.payment_config.is_sandbox,
          accepts_mobile_money: form.payment_config.accepts_mobile_money,
          accepts_bank_transfer: form.payment_config.accepts_bank_transfer,
          accepts_card: form.payment_config.accepts_card,
          organization_bank_name: form.payment_config.organization_bank_name,
          organization_account_name: form.payment_config.organization_account_name,
          organization_account_number: form.payment_config.organization_account_number,
        })
      }
      
      // Then submit KYC (Stripping payment_config to avoid backend validation error)
      const { payment_config, ...kycPayload } = form
      await tenancyAPI.submitKyc(orgId, kycPayload)

      await Swal.fire({
        icon: 'success',
        title: 'Submission Successful!',
        text: 'Your KYC details have been successfully submitted for review. They are now pending verification.',
        confirmButtonColor: '#1A73E8'
      })

      setIsSubmittedLocal(true)
      await refreshContext() // Update user state to 'submitted'
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit KYC. Please check your data.')
    } finally {
      setLoading(false)
    }
  }

  // --- Rendering States ---

  if (user?.kyc_status === 'verified') {
    return (
      <Fade in={true} timeout={800}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <Box sx={{ textAlign: 'center', maxWidth: 480 }}>
            <Box sx={{
                width: 100, height: 100, borderRadius: 0, bgcolor: '#E6F4EA',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 4,
                boxShadow: '0 8px 24px rgba(30,142,62,0.15)',
            }}>
                <VerifiedIcon sx={{ fontSize: 56, color: '#1E8E3E' }} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: '2rem', color: '#202124', mb: 2 }}>
              Account Verified
            </Typography>
            <Typography sx={{ color: '#5F6368', fontSize: '1rem', mb: 4, lineHeight: 1.6 }}>
              Congratulations! <b>{user.organization_name}</b> has been fully verified. You now have unrestricted access to all platform features, including policy issuance and claim management.
            </Typography>
            <Button 
                variant="contained" 
                onClick={() => navigate('/')}
                sx={{ borderRadius: 0, px: 6, py: 1.5, fontWeight: 700 }}
            >
              Go to Dashboard
            </Button>
          </Box>
        </Box>
      </Fade>
    )
  }

  if (user?.kyc_status === 'submitted' || isSubmittedLocal) {
    return (
      <Fade in={true} timeout={800}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <Box sx={{ textAlign: 'center', maxWidth: 520 }}>
            <Box sx={{
              width: 120, height: 120, borderRadius: 0, bgcolor: '#FFF8E1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 4,
              animation: 'pulse 2s ease-in-out infinite',
              boxShadow: '0 8px 32px rgba(255,193,7,0.15)',
            }}>
              <ShieldIcon sx={{ fontSize: 64, color: '#F57C00' }} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.85rem', color: '#202124', mb: 2 }}>
              Verification in Progress
            </Typography>
            <Typography sx={{ color: '#5F6368', fontSize: '1rem', mb: 4, lineHeight: 1.6 }}>
              We've received your KYC documents. Our compliance team is currently reviewing your business information and company logo. This process typically takes **24-48 hours**.
            </Typography>
            <Box sx={{ p: 3, bgcolor: '#F8F9FA', borderRadius: 0, border: '1px solid #E8EAED', display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
                <CircularProgress size={18} />
                <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#202124' }}>
                  Awaiting Super Admin Approval
                </Typography>
            </Box>
          </Box>
        </Box>
      </Fade>
    )
  }

  // --- Wizard Content ---

  const stepContent = [
    // Step 0: Profile & Logo
    <Grid container spacing={4} key="profile">
      <Grid item xs={12}>
        <SectionHeader icon={BusinessIcon} title="Organization Profile" subtitle="Set your official identity and company branding" />
      </Grid>
      <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#202124', mb: 2 }}>Company Logo *</Typography>
        <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <Avatar 
                src={form.logo} 
                sx={{ 
                    width: 140, height: 140, 
                    borderRadius: 0, 
                    bgcolor: '#F8F9FA', 
                    border: '2px dashed #DADCE0',
                    fontSize: '2rem'
                }}
            >
                {!form.logo && <BusinessIcon sx={{ color: '#DADCE0', fontSize: 40 }} />}
            </Avatar>
            <IconButton
                component="label"
                sx={{
                    position: 'absolute', bottom: -12, right: -12,
                    bgcolor: '#1A73E8', color: '#fff',
                    '&:hover': { bgcolor: '#1765CC' },
                    boxShadow: '0 4px 12px rgba(26,115,232,0.4)',
                }}
            >
                <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                <PhotoIcon fontSize="small" />
            </IconButton>
        </Box>
        <Typography sx={{ fontSize: '0.75rem', color: '#9AA0A6', mt: 3 }}>
            JPG or PNG max 2MB.<br/>This logo will appear in your navbar.
        </Typography>
      </Grid>
      <Grid item xs={12} md={8}>
        <Grid container spacing={2.5}>
            <Grid item xs={12}>
                <TextField 
                    fullWidth label="Official Registration Name *" 
                    value={form.registration_name} onChange={(e) => update('registration_name', e.target.value)} 
                    placeholder="As it appears on your Incorporation Certificate"
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Tax Identification Number (TIN) *" value={form.tax_id} onChange={(e) => update('tax_id', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Company Website (Optional)" value={form.website} onChange={(e) => update('website', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Contact Phone *" value={form.contact_phone} onChange={(e) => update('contact_phone', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Contact Email *" type="email" value={form.contact_email} onChange={(e) => update('contact_email', e.target.value)} />
            </Grid>
            <Grid item xs={12}>
                <TextField fullWidth multiline rows={2} label="Registered Business Address *" value={form.address} onChange={(e) => update('address', e.target.value)} />
            </Grid>
        </Grid>
      </Grid>
    </Grid>,

    // Step 1: Documents
    <Grid container spacing={3} key="docs">
      <Grid item xs={12}>
        <SectionHeader icon={DocIcon} title="Documentation" subtitle="Upload certified copies of your registration documents" />
      </Grid>
      <Grid item xs={12}>
        <Box sx={{
          border: '2px dashed #DADCE0',
          borderRadius: 0, p: 6,
          textAlign: 'center', cursor: 'pointer',
          bgcolor: '#FAFBFF', transition: 'all 0.2s',
          '&:hover': { borderColor: '#1A73E8', bgcolor: '#F0F4FF' },
        }}>
          <input type="file" multiple hidden id="doc-up" accept=".pdf,image/*" onChange={handleDocumentUpload} />
          <label htmlFor="doc-up" style={{ cursor: 'pointer' }}>
            <UploadIcon sx={{ fontSize: 44, color: '#1A73E8', mb: 2 }} />
            <Typography sx={{ fontWeight: 700, color: '#202124', mb: 1 }}>Click to upload compliance documents</Typography>
            <Typography sx={{ fontSize: '0.82rem', color: '#9AA0A6' }}>Certificate of Incorporation, Trading License, or Tax Certificates (PDF/JPG)</Typography>
          </label>
        </Box>
      </Grid>
      {form.documents.map((doc, i) => (
        <Grid item xs={12} key={i}>
            <Paper elevation={0} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #E8EAED', borderRadius: 0}}>
                <DocIcon sx={{ color: '#1A73E8' }} />
                <Typography sx={{ flexGrow: 1, fontWeight: 600, fontSize: '0.85rem' }}>{doc.name}</Typography>
                <IconButton size="small" onClick={() => update('documents', form.documents.filter((_, j) => j !== i))}>
                    <DeleteIcon fontSize="small" color="error" />
                </IconButton>
            </Paper>
        </Grid>
      ))}
    </Grid>,

    // Step 2: Payment Configuration
    <Grid container spacing={3} key="payment">
      <Grid item xs={12}>
        <SectionHeader icon={PaymentIcon} title="Payment Configuration" subtitle="Set up PesaPal integration for processing payments" />
      </Grid>
      <Grid item xs={12}>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: 600 }}>Why do I need this?</Typography>
          <Typography variant="body2">Payment configuration allows your organization to receive premium payments and process claim payouts. You can get your PesaPal credentials from the <a href="https://pesapal.com/merchant-dashboard" target="_blank" rel="noopener noreferrer">PesaPal Merchant Dashboard</a>.</Typography>
        </Alert>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField 
          fullWidth 
          label="PesaPal Consumer Key *" 
          value={form.payment_config.consumer_key} 
          onChange={(e) => setForm(f => ({ ...f, payment_config: { ...f.payment_config, consumer_key: e.target.value } }))}
          placeholder="Enter your PesaPal Consumer Key"
          helperText="Found in your PesaPal Merchant Dashboard"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField 
          fullWidth 
          type="password"
          label="PesaPal Consumer Secret *" 
          value={form.payment_config.consumer_secret} 
          onChange={(e) => setForm(f => ({ ...f, payment_config: { ...f.payment_config, consumer_secret: e.target.value } }))}
          placeholder="Enter your PesaPal Consumer Secret"
          helperText="Keep this secure - never share it"
        />
      </Grid>
      <Grid item xs={12}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', mb: 2, color: '#202124' }}>Payment Methods to Accept</Typography>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card 
          elevation={0} 
          onClick={() => setForm(f => ({ ...f, payment_config: { ...f.payment_config, accepts_mobile_money: !f.payment_config.accepts_mobile_money } }))}
          sx={{ 
            p: 2, 
            cursor: 'pointer', 
            border: form.payment_config.accepts_mobile_money ? '2px solid #1A73E8' : '1px solid #E8EAED',
            bgcolor: form.payment_config.accepts_mobile_money ? '#E8F0FE' : '#fff',
            borderRadius: 0}}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <MobileIcon sx={{ color: form.payment_config.accepts_mobile_money ? '#1A73E8' : '#5F6368', fontSize: 32 }} />
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Mobile Money</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#5F6368' }}>MTN, Airtel</Typography>
            </Box>
          </Box>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card 
          elevation={0} 
          onClick={() => setForm(f => ({ ...f, payment_config: { ...f.payment_config, accepts_bank_transfer: !f.payment_config.accepts_bank_transfer } }))}
          sx={{ 
            p: 2, 
            cursor: 'pointer', 
            border: form.payment_config.accepts_bank_transfer ? '2px solid #1A73E8' : '1px solid #E8EAED',
            bgcolor: form.payment_config.accepts_bank_transfer ? '#E8F0FE' : '#fff',
            borderRadius: 0}}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <BankIcon sx={{ color: form.payment_config.accepts_bank_transfer ? '#1A73E8' : '#5F6368', fontSize: 32 }} />
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Bank Transfer</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#5F6368' }}>For payouts</Typography>
            </Box>
          </Box>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card 
          elevation={0} 
          onClick={() => setForm(f => ({ ...f, payment_config: { ...f.payment_config, accepts_card: !f.payment_config.accepts_card } }))}
          sx={{ 
            p: 2, 
            cursor: 'pointer', 
            border: form.payment_config.accepts_card ? '2px solid #1A73E8' : '1px solid #E8EAED',
            bgcolor: form.payment_config.accepts_card ? '#E8F0FE' : '#fff',
            borderRadius: 0}}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CardIcon sx={{ color: form.payment_config.accepts_card ? '#1A73E8' : '#5F6368', fontSize: 32 }} />
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Card Payments</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#5F6368' }}>Visa, Mastercard</Typography>
            </Box>
          </Box>
        </Card>
      </Grid>
      {form.payment_config.accepts_bank_transfer && (
        <>
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', mb: 2, color: '#202124' }}>
              <BankIcon sx={{ fontSize: 20, verticalAlign: 'middle', mr: 1 }} />
              Organization Bank Details (for receiving payouts)
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField 
              fullWidth 
              label="Bank Name" 
              value={form.payment_config.organization_bank_name} 
              onChange={(e) => setForm(f => ({ ...f, payment_config: { ...f.payment_config, organization_bank_name: e.target.value } }))}
              placeholder="e.g., Stanbic Bank"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField 
              fullWidth 
              label="Account Name" 
              value={form.payment_config.organization_account_name} 
              onChange={(e) => setForm(f => ({ ...f, payment_config: { ...f.payment_config, organization_account_name: e.target.value } }))}
              placeholder="As it appears on bank records"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField 
              fullWidth 
              label="Account Number" 
              value={form.payment_config.organization_account_number} 
              onChange={(e) => setForm(f => ({ ...f, payment_config: { ...f.payment_config, organization_account_number: e.target.value } }))}
              placeholder="e.g., 9030001234567"
            />
          </Grid>
        </>
      )}
      <Grid item xs={12}>
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2"><b>Sandbox Mode:</b> We recommend testing with PesaPal's sandbox environment first. Toggle this off when ready for production.</Typography>
        </Alert>
      </Grid>
    </Grid>,

    // Step 3: Review
    <Grid container spacing={3} key="review">
        <Grid item xs={12}>
            <SectionHeader icon={VerifiedIcon} title="Final Review" subtitle="Ensure all details are correct before sending for approval" />
        </Grid>
        <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ bgcolor: '#F8F9FA', borderRadius: 0, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', mb: 2.5, color: '#1A73E8' }}>Profile Summary</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Avatar src={form.logo} variant="rounded" sx={{ width: 64, height: 64, borderRadius: 0}} />
                        <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>{form.registration_name}</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#5F6368' }}>TIN: {form.tax_id}</Typography>
                        </Box>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Typography sx={{ fontSize: '0.8rem' }}><b>Phone:</b> {form.contact_phone}</Typography>
                        <Typography sx={{ fontSize: '0.8rem' }}><b>Email:</b> {form.contact_email}</Typography>
                        <Typography sx={{ fontSize: '0.8rem' }}><b>Website:</b> {form.website || 'N/A'}</Typography>
                        <Typography sx={{ fontSize: '0.8rem' }}><b>Address:</b> {form.address}</Typography>
                    </Box>
                </CardContent>
            </Card>
        </Grid>
        <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ bgcolor: '#F8F9FA', borderRadius: 0, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', mb: 2.5, color: '#1A73E8' }}>Documents ({form.documents.length})</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {form.documents.map((d, i) => (
                            <Typography key={i} sx={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CheckIcon sx={{ fontSize: 16, color: '#34A853' }} /> {d.name}
                            </Typography>
                        ))}
                    </Box>
                </CardContent>
            </Card>
        </Grid>
        <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ bgcolor: '#F8F9FA', borderRadius: 0, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', mb: 2.5, color: '#1A73E8' }}>Payment Setup</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Typography sx={{ fontSize: '0.8rem' }}><b>PesaPal Key:</b> {form.payment_config.consumer_key ? '✓ Configured' : '✗ Missing'}</Typography>
                        <Typography sx={{ fontSize: '0.8rem' }}><b>Methods:</b></Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {form.payment_config.accepts_mobile_money && <Chip size="small" icon={<MobileIcon />} label="Mobile Money" sx={{ bgcolor: '#E8F0FE' }} />}
                          {form.payment_config.accepts_bank_transfer && <Chip size="small" icon={<BankIcon />} label="Bank Transfer" sx={{ bgcolor: '#E8F0FE' }} />}
                          {form.payment_config.accepts_card && <Chip size="small" icon={<CardIcon />} label="Card" sx={{ bgcolor: '#E8F0FE' }} />}
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Grid>
    </Grid>
  ]

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', py: 2 }}>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 900, color: '#202124', mb: 1, letterSpacing: '-0.02em' }}>
            Verification Center
        </Typography>
        <Typography sx={{ color: '#5F6368', fontSize: '1rem' }}>
            Follow these steps to unlock full access to the insurance platform
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #E8EAED', borderRadius: 0, overflow: 'hidden', mb: 4 }}>
        <Box sx={{ p: { xs: 3, sm: 5 }, bgcolor: '#F8F9FA', borderBottom: '1px solid #E8EAED' }}>
            <Stepper activeStep={activeStep} alternativeLabel connector={<ColorConnector />}>
                {steps.map((step, i) => (
                    <Step key={step.label}>
                        <StepLabel StepIconComponent={(props) => <ColorStepIcon {...props} step={i + 1} />}>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', mt: 1, color: activeStep === i ? '#1A73E8' : '#5F6368' }}>{step.label}</Typography>
                        </StepLabel>
                    </Step>
                ))}
            </Stepper>
        </Box>

        <Box sx={{ p: { xs: 3, sm: 6 } }}>
            {error && <Alert severity="error" sx={{ mb: 4, borderRadius: 0}}>{error}</Alert>}
        
            {user?.kyc_status === 'rejected' && user?.kyc_rejection_reason && (
              <Alert severity="warning" sx={{ mb: 4, borderRadius: 0, fontWeight: 600, border: '1px solid #FFE082' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Further Action Required</Typography>
                Administrator feedback: {user.kyc_rejection_reason}
              </Alert>
            )}

            {stepContent[activeStep]}
        </Box>

        <Box sx={{ px: 6, py: 4, bgcolor: '#F8F9FA', borderTop: '1px solid #E8EAED', display: 'flex', justifyContent: 'space-between' }}>
            <Button 
                onClick={() => setActiveStep(s => s - 1)} 
                disabled={activeStep === 0}
                startIcon={<BackIcon />}
                sx={{ borderRadius: 0, px: 3 }}
            >
                Back
            </Button>
            {activeStep === steps.length - 1 ? (
                <Button 
                    variant="contained" 
                    onClick={handleSubmit} 
                    disabled={loading}
                    sx={{ borderRadius: 0, px: 6, fontWeight: 700, height: 48 }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit for Verification'}
                </Button>
            ) : (
                <Button 
                    variant="contained" 
                    onClick={handleNext}
                    endIcon={<NextIcon />}
                    sx={{ borderRadius: 0, px: 6, fontWeight: 700, height: 48 }}
                >
                    Save & Continue
                </Button>
            )}
        </Box>
      </Paper>
    </Box>
  )
}
