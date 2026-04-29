import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Box, Typography, Grid, Paper, Button, Avatar, Stack, Chip,
  Divider, TextField, InputAdornment, CircularProgress, Alert,
  Stepper, Step, StepLabel, Card, CardContent, Fade,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, FormControl, Checkbox, FormControlLabel, IconButton,
  Accordion, AccordionSummary, AccordionDetails, useTheme, OutlinedInput,
  List, ListItem
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Shield as ShieldIcon,
  CheckCircle as SuccessIcon,
  Calculate as CalcIcon,
  Description as DocIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  TableChart as TableIcon,
  ExpandMore as ExpandMoreIcon,
  Payments as PaymentIcon,
  Analytics as AnalyticsIcon,
  Lock as LockIcon,
  KeyboardArrowRight as ArrowIcon,
  BusinessCenter as BusinessIcon,
  Info as InfoIcon,
  Stars as TierIcon
} from '@mui/icons-material'
import { publicAPI, tenancyAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

const STEPS = ['Plan Details', 'Required Assessment', 'Review Quote', 'Payment']

const DynamicTable = ({ field, value = [], onChange }) => {
  const columns = field.columns || []
  const rows = Array.isArray(value) ? value : []

  const handleAddRow = () => {
    if (field.max_rows && rows.length >= field.max_rows) return
    const newRow = {}
    columns.forEach(col => {
      const key = col.key || col.label
      newRow[key] = ''
    })
    onChange([...rows, newRow])
  }

  const handleRemoveRow = (idx) => {
    if (field.min_rows && rows.length <= field.min_rows) return
    onChange(rows.filter((_, i) => i !== idx))
  }

  const handleCellChange = (idx, key, val) => {
    const next = [...rows]
    next[idx] = { ...next[idx], [key]: val }
    onChange(next)
  }

  return (
    <Box sx={{ mt: 2 }}>
      <TableContainer 
        component={Paper} 
        elevation={0} 
        sx={{ 
          borderRadius: 0, 
          border: '1px solid #F1F3F4', 
          overflow: 'hidden',
          bgcolor: '#FFFFFF'
        }}
      >
        <Table size="small" sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8F9FA' }}>
              <TableCell sx={{ width: 60, fontWeight: 700, color: '#70757A', fontSize: '0.75rem', borderBottom: '1px solid #F1F3F4', textAlign: 'center' }}>NO.</TableCell>
              {columns.map((col, i) => (
                <TableCell key={i} sx={{ fontWeight: 700, color: '#202124', fontSize: '0.75rem', borderBottom: '1px solid #F1F3F4' }}>
                  {col.label?.toUpperCase()}
                </TableCell>
              ))}
              <TableCell sx={{ width: 60, borderBottom: '1px solid #F1F3F4' }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, ri) => (
              <TableRow key={ri} sx={{ '&:hover': { bgcolor: '#FBFBFC' }, transition: 'background-color 0.2s' }}>
                <TableCell sx={{ textAlign: 'center', color: '#BDC1C6', fontSize: '0.8rem', fontWeight: 600, borderBottom: '1px solid #F1F3F4' }}>
                  {ri + 1}
                </TableCell>
                {columns.map((col, ci) => {
                  const key = col.key || col.label
                  return (
                    <TableCell key={ci} sx={{ py: 1.5, borderBottom: '1px solid #F1F3F4' }}>
                      <TextField
                        fullWidth
                        size="small"
                        variant="standard"
                        type={col.type || 'text'}
                        value={row[key] || ''}
                        onChange={(e) => handleCellChange(ri, key, e.target.value)}
                        placeholder={col.label}
                        InputProps={{ 
                          disableUnderline: true, 
                          sx: { fontSize: '0.9rem', fontWeight: 500, color: '#3C4043' } 
                        }}
                      />
                    </TableCell>
                  )
                })}
                <TableCell sx={{ textAlign: 'center', borderBottom: '1px solid #F1F3F4' }}>
                  <IconButton 
                    size="small" 
                    onClick={() => handleRemoveRow(ri)} 
                    disabled={field.min_rows && rows.length <= field.min_rows}
                    sx={{ color: '#DADCE0', '&:hover': { color: '#D93025', bgcolor: '#FEEBEE' } }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 2} sx={{ textAlign: 'center', py: 8 }}>
                  <Stack alignItems="center" spacing={2} sx={{ opacity: 0.5 }}>
                    <TableIcon sx={{ fontSize: 48, color: '#DADCE0' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>No entries added yet.</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-start' }}>
        <Button 
          variant="text"
          startIcon={<AddIcon />} 
          onClick={handleAddRow} 
          disabled={field.max_rows && rows.length >= field.max_rows}
          sx={{ 
            borderRadius: 0, 
            fontWeight: 600, 
            color: '#1A73E8',
            px: 2,
            textTransform: 'none',
            '&:hover': { bgcolor: '#E8F0FE' }
          }}
        >
          Add {field.label || 'entry'} {field.max_rows ? `(${rows.length}/${field.max_rows})` : ''}
        </Button>
      </Box>
    </Box>
  )
}

export default function ClientProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeStep, setActiveStep] = useState(0)
  const [expandedForm, setExpandedForm] = useState(0)
  const [formData, setFormData] = useState({
    coverageAmount: '',
    startDate: new Date().toISOString().split('T')[0],
    duration: 1,
    riskFactors: {} // For dynamic forms
  })
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)
  const [paymentInfo, setPaymentInfo] = useState({
    phoneNumber: '',
    cardNumber: '',
    cardExpiry: '',
    cardCVV: ''
  })
  const [paymentStatus, setPaymentStatus] = useState('idle') // idle, processing, success, failed
  const [paymentError, setPaymentError] = useState(null)
  const [createdQuote, setCreatedQuote] = useState(null) // Stores the real quote/policy returned from backend
  const [isCalculated, setIsCalculated] = useState(false)
  const [selectedTier, setSelectedTier] = useState(null)

  // Fetch product details
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      // Mirror organization side by fetching from the public products list
      const res = await publicAPI.getPublicProducts()
      const all = res.data?.items || res.data || []
      const found = all.find(p => p.id === id)
      if (!found) throw new Error('Product not found')
      return found
    },
    enabled: !!id
  })

  // Fetch product templates (for dynamic forms)
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['product-templates', id],
    queryFn: async () => {
      const res = await publicAPI.getProductTemplates(id)
      return res.data?.items || res.data || []
    },
    enabled: !!id
  })

  // Get current active template (fallback to first if none marked active)
  const activeTemplate = templates.find(t => t.is_active) || templates[0]

  // Fetch pricing tiers for the active template
  const { data: pricingTiers = [], isLoading: tiersLoading } = useQuery({
    queryKey: ['pricing-tiers', id, activeTemplate?.id],
    queryFn: async () => {
      const res = await publicAPI.getPricingTiersPublic(product.organization_id, activeTemplate.id)
      const items = res.data?.items || res.data || []
      // Mirror organization side: map fields exactly
      return items.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        coverage_amount: t.coverage_amount,
        premium: t.premium,
        benefits: t.benefits || []
      }))
    },
    enabled: !!id && !!activeTemplate?.id && !!product?.organization_id
  })

  // Handle tier selection
  const handleSelectTier = (tier) => {
    setSelectedTier(tier)
    setFormData(prev => ({
      ...prev,
      premium: tier.coverage_amount || 0
    }))
  }

  // Fetch true Dynamic Forms from the backend
  const { data: dynamicForms = [], isLoading: formsLoading } = useQuery({
    queryKey: ['product-forms', id, activeTemplate?.id],
    queryFn: async () => {
      const res = await publicAPI.getTemplateFormsPublic(id, activeTemplate.id)
      return res.data || []
    },
    enabled: !!id && !!activeTemplate?.id
  })

  // Initialize table data with prefill_rows or min_rows
  React.useEffect(() => {
    if (dynamicForms.length > 0) {
      const initialRiskFactors = { ...formData.riskFactors }
      let updated = false
      
      dynamicForms.forEach(form => {
        form.fields.forEach(field => {
          if (field.field_type === 'table' && !initialRiskFactors[field.field_key]) {
            const prefill = field.prefill_rows || []
            const min = field.min_rows || 0
            
            if (prefill.length > 0) {
              initialRiskFactors[field.field_key] = prefill
              updated = true
            } else if (min > 0) {
              const emptyRows = Array.from({ length: min }).map(() => {
                const row = {}
                field.columns?.forEach(col => row[col.key || col.label] = '')
                return row
              })
              initialRiskFactors[field.field_key] = emptyRows
              updated = true
            }
          }
        })
      })
      
      if (updated) {
        setFormData(prev => ({ ...prev, riskFactors: initialRiskFactors }))
      }
    }
  }, [dynamicForms])
  
  // Sync coverage amount with product max_coverage if available
  React.useEffect(() => {
    if (product?.max_coverage && !formData.coverageAmount) {
      setFormData(prev => ({ ...prev, coverageAmount: product.max_coverage }))
    }
  }, [product])

  // Mutation for creating quotation (calls real backend)
  const createQuote = useMutation({
    mutationFn: async (data) => {
      const res = await publicAPI.createPublicQuotation(data)
      return res.data
    },
    onSuccess: (data) => {
      setCreatedQuote(data)
      setActiveStep(2) // Move to Review Quote
    },
    onError: (err) => {
      console.error('Quote creation failed:', err)
    }
  })

  // Dynamic premium calculation (simplified: using coverageAmount as requested)
  const calculateDisplayPremium = () => {
    return Number(formData.premium || formData.coverageAmount || 0);
  };

  const isLoading = productLoading || templatesLoading || formsLoading

  if (isLoading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress />
    </Box>
  )

  if (!product) return (
    <Box p={4} textAlign="center">
      <Typography variant="h5">Product not found</Typography>
      <Button onClick={() => navigate('/client/products')}>Back to Marketplace</Button>
    </Box>
  )

  const handleRiskFactorChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      riskFactors: {
        ...prev.riskFactors,
        [fieldId]: value
      }
    }))
  }

  const handleNext = () => {
    if (activeStep === 0) {
      setActiveStep(1)
    } else if (activeStep === 1) {
      createQuote.mutate({
        organization_id: product.organization_id,
        policy_holder_email: user.email,
        policy_holder_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Client',
        policy_holder_phone: user.phone || '000000000',
        product_template_id: activeTemplate?.id || '',
        start_date: formData.startDate,
        end_date: new Date(new Date(formData.startDate).setFullYear(new Date(formData.startDate).getFullYear() + 1)).toISOString().split('T')[0],
        coverage_amount: Number(formData.coverageAmount) || product.max_coverage || 0,
        context: formData.riskFactors,
        // Optional backend fields just in case
        productId: product.id,
        productName: product.name,
        provider: product.provider_name
      })
    } else if (activeStep === 3) {
      handleCompletePayment()
    } else {
      setActiveStep(activeStep + 1)
    }
  }

  const handleCompletePayment = async () => {
    setPaymentStatus('processing')
    setPaymentError(null)

    try {
      const orgId = product.organization_id
      let policyId = createdQuote?.policy_id || (createdQuote?.status === 'active' ? createdQuote?.id : null)

      // If we only have a quotation, convert it to a policy first
      if (!policyId && createdQuote?.id) {
        try {
          const policyRes = await publicAPI.createPublicPolicy({ 
            quotation_id: createdQuote.id,
            payment_method: selectedPaymentMethod?.id || 'pesapal'
          })
          policyId = policyRes.data?.id
        } catch (error) {
          console.error("Policy conversion failed:", error)
          throw new Error('Could not prepare your policy for payment. Please try again.')
        }
      }

      if (!orgId || !policyId) throw new Error('Missing policy or organisation details.')
      
      // Calculate payment amount based on pricing frequency
      let paymentAmount = 0
      const frequency = activeTemplate?.pricing_frequency?.toLowerCase()
      const coverageAmount = product.max_coverage || 0
      const durationYears = product.duration_years || 1
      
      if (frequency === 'annual') {
        paymentAmount = coverageAmount
      } else if (frequency === 'month') {
        // Calculate monthly installment: total coverage / (years * 12)
        paymentAmount = coverageAmount / (durationYears * 12)
      } else {
        // Fallback to standard premium if no special rule matches
        paymentAmount = createdQuote?.premium || product.base_premium || 0
      }

      // Initiate PesaPal payment — backend returns a redirect_url to PesaPal hosted checkout
      const res = await publicAPI.initiatePesapalPayment(orgId, policyId, { 
        months_paid: 1, 
        amount: paymentAmount 
      })
      const redirectUrl = res.data?.redirect_url

      if (!redirectUrl) throw new Error('Could not get payment URL. Please try again.')

      // Redirect user to PesaPal checkout
      window.location.href = redirectUrl
    } catch (err) {
      console.error("Payment initiation failed:", err)
      setPaymentStatus('failed')
      const detail = err?.response?.data?.detail
      setPaymentError(typeof detail === 'string' ? detail : (err.message || 'Payment initiation failed.'))
    }
  }

  return (
    <Box sx={{ bgcolor: '#F8F9FA', minHeight: '100vh', pb: 10 }}>
      {/* Premium Google-Style Header */}
      <Paper elevation={0} sx={{ borderBottom: '1px solid #E8EAED', bgcolor: '#fff', position: 'sticky', top: 0, zIndex: 10, px: { xs: 2, md: 6 }, py: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={3} alignItems="center">
            <IconButton onClick={() => navigate('/client/products')} size="small" sx={{ bgcolor: '#F1F3F4' }}>
              <BackIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#202124', fontSize: '1.25rem' }}>{product.name}</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" sx={{ color: '#70757A', fontWeight: 500 }}>{product.provider_name}</Typography>
                <VerifiedIcon sx={{ fontSize: 14, color: '#1A73E8' }} />
              </Stack>
            </Box>
          </Stack>

          <Box sx={{ display: { xs: 'none', md: 'block' }, width: 600 }}>
            <Stepper activeStep={activeStep} connector={null}>
              {STEPS.map((label, index) => (
                <Step key={label} sx={{ px: 1 }}>
                  <StepLabel 
                    StepIconComponent={() => (
                      <Avatar 
                        sx={{ 
                          width: 24, height: 24, 
                          bgcolor: activeStep >= index ? '#1A73E8' : '#F1F3F4',
                          color: activeStep >= index ? '#fff' : '#70757A',
                          fontSize: '0.75rem', fontWeight: 700
                        }}
                      >
                        {index + 1}
                      </Avatar>
                    )}
                  >
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontWeight: 600, 
                        color: activeStep >= index ? '#202124' : '#70757A'
                      }}
                    >
                      {label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

        </Stack>
      </Paper>

      <Grid container spacing={4} sx={{ mt: 4, px: { xs: 2, md: 6 } }}>
        {/* Main Form Area */}
        <Grid item xs={12} lg={8}>
          <Fade in timeout={500}>
            <Box>
              {activeStep === 0 && (
                <Box>
                  {/* Product Overview Card */}
                  <Paper elevation={0} sx={{ p: { xs: 4, md: 5 }, borderRadius: 0, border: '1px solid #E8EAED', mb: 4, bgcolor: '#fff' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1A73E8', mb: 2.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Product Overview</Typography>
                    <Typography variant="body1" sx={{ color: '#3C4043', mb: 4, lineHeight: 1.8 }}>
                      {product.description || 'This insurance product provides comprehensive coverage tailored to your specific needs. Please review the assessment steps to customize your plan.'}
                    </Typography>
                    
                    <Grid container spacing={4}>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" sx={{ color: '#70757A', fontWeight: 700, mb: 0.5, display: 'block' }}>CATEGORY</Typography>
                        <Chip label={product.category?.toUpperCase() || 'INSURANCE'} size="small" sx={{ fontWeight: 800, borderRadius: 0, bgcolor: '#E8F0FE', color: '#1A73E8', height: 24, fontSize: '0.65rem' }} />
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" sx={{ color: '#70757A', fontWeight: 700, mb: 0.5, display: 'block' }}>PRICING CYCLE</Typography>
                        <Typography sx={{ fontWeight: 700, color: '#202124', fontSize: '0.95rem' }}>{activeTemplate?.pricing_frequency?.toUpperCase() || 'ANNUAL'}</Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" sx={{ color: '#70757A', fontWeight: 700, mb: 0.5, display: 'block' }}>BASE TENURE</Typography>
                        <Typography sx={{ fontWeight: 700, color: '#202124', fontSize: '0.95rem' }}>{product.duration_years || 1} YEAR(S)</Typography>
                      </Grid>
                      {activeTemplate?.code && (
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" sx={{ color: '#70757A', fontWeight: 700, mb: 0.5, display: 'block' }}>PLAN CLASS</Typography>
                          <Typography sx={{ fontWeight: 700, color: '#202124', fontSize: '0.95rem' }}>{activeTemplate.code}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>

                  {/* Terms and Conditions Accordion */}
                  <Accordion elevation={0} sx={{ borderRadius: 0, border: '1px solid #E8EAED', mb: 4, bgcolor: '#fff', '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#1A73E8' }} />}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <DocIcon sx={{ color: '#1A73E8', fontSize: 20 }} />
                        <Typography sx={{ fontWeight: 700, color: '#202124' }}>Policy Terms & Conditions</Typography>
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ bgcolor: '#F8F9FA', px: 4, py: 3, borderTop: '1px solid #E8EAED' }}>
                      <Typography variant="body2" sx={{ color: '#5F6368', whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '0.88rem' }}>
                        {activeTemplate?.terms_and_conditions || 'Standard policy terms and conditions apply to this insurance product. Please contact support for a detailed breakdown of the legal framework.'}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>

                  {/* Coverage Plans (Tiers) from Database */}
                  {pricingTiers.length > 0 && (
                    <Box sx={{ mb: 6 }}>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                        <TierIcon sx={{ color: '#1A73E8', fontSize: 24 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#202124' }}>Available Coverage Plans</Typography>
                      </Stack>
                      <Grid container spacing={3}>
                        {pricingTiers.map((tier) => (
                          <Grid item xs={12} md={pricingTiers.length > 1 ? 4 : 12} key={tier.id}>
                            <Paper 
                              elevation={0} 
                              sx={{ 
                                p: 3, height: '100%', border: '1px solid #E8EAED', 
                                bgcolor: '#fff', transition: 'all 0.3s',
                                '&:hover': { borderColor: '#1A73E8', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }
                              }}
                            >
                              <Typography variant="overline" sx={{ fontWeight: 800, color: '#1A73E8', mb: 1, display: 'block' }}>
                                {tier.name}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                                <Typography variant="h5" sx={{ fontWeight: 900, color: '#202124' }}>
                                  UGX {tier.coverage_amount?.toLocaleString()}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#70757A', ml: 1, fontWeight: 600 }}>
                                  / {activeTemplate?.pricing_frequency || 'period'}
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ color: '#5F6368', mb: 2.5, minHeight: 40, fontSize: '0.85rem', lineHeight: 1.5 }}>
                                {tier.description || `Comprehensive ${tier.name} coverage package.`}
                              </Typography>
                              
                              <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />
                              
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#202124', mb: 1.5, display: 'block' }}>INCLUDED BENEFITS</Typography>
                              <List sx={{ p: 0 }}>
                                {(tier.benefits || []).map((benefit, bi) => (
                                  <ListItem key={bi} sx={{ p: 0, mb: 1, alignItems: 'flex-start' }}>
                                    <SuccessIcon sx={{ fontSize: 14, color: '#0F9D58', mr: 1, mt: 0.3, flexShrink: 0 }} />
                                    <Typography variant="caption" sx={{ color: '#3C4043', fontWeight: 600, lineHeight: 1.4 }}>{benefit}</Typography>
                                  </ListItem>
                                ))}
                                {(!tier.benefits || tier.benefits.length === 0) && (
                                  <Typography variant="caption" sx={{ color: '#BDC1C6', fontStyle: 'italic' }}>Standard tier benefits apply.</Typography>
                                )}
                              </List>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {/* Benefits & Coverage Limits */}
                  <Paper elevation={0} sx={{ p: 4, borderRadius: 0, border: '1px solid #E8EAED', mb: 4, bgcolor: '#fff' }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
                      <ShieldIcon sx={{ color: '#1A73E8', fontSize: 20 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1A73E8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Full Product Benefits & Limits</Typography>
                    </Stack>

                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#70757A', mb: 1.5, display: 'block', textTransform: 'uppercase' }}>Standard Coverage Limits</Typography>
                    {activeTemplate?.coverage_limits && Object.keys(activeTemplate.coverage_limits).length > 0 ? (
                      <Grid container spacing={2}>
                        {Object.entries(activeTemplate.coverage_limits).map(([key, val]) => (
                          <Grid item xs={12} md={6} key={key}>
                            <Box sx={{ 
                              p: 2, bgcolor: '#F8F9FA', border: '1px solid #E8EAED', 
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              transition: 'all 0.2s', '&:hover': { bgcolor: '#fff', borderColor: '#1A73E8' }
                            }}>
                              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#5F6368', textTransform: 'capitalize' }}>
                                {key.replace(/_/g, ' ')}
                              </Typography>
                              <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#202124' }}>
                                {typeof val === 'number' ? `UGX ${val.toLocaleString()}` : val}
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#70757A', fontStyle: 'italic' }}>
                        Comprehensive coverage benefits as per the standard plan class. Detailed limits will be provided in your policy document.
                      </Typography>
                    )}
                  </Paper>
                </Box>
              )}

              {activeStep === 1 && (
                <Box>
                  {/* Dynamic Risk Forms Section */}
                  {dynamicForms && dynamicForms.length > 0 ? (
                    <Box>
                      {dynamicForms.map((form, index) => (
                        <Accordion 
                          key={form.id} 
                          elevation={0} 
                          expanded={expandedForm === index}
                          onChange={() => setExpandedForm(expandedForm === index ? -1 : index)}
                          sx={{ 
                            borderRadius: 0, border: '1px solid #E8EAED',
                            overflow: 'hidden', mb: 2, '&:before': { display: 'none' },
                            bgcolor: '#fff'
                          }}
                        >
                          <AccordionSummary 
                            expandIcon={<ExpandMoreIcon sx={{ color: '#1A73E8' }} />}
                            sx={{ px: 4, py: 1 }}
                          >
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Box 
                                sx={{ 
                                  width: 40, height: 40, borderRadius: 0, 
                                  bgcolor: expandedForm === index ? '#E8F0FE' : '#F1F3F4',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: '0.3s'
                                }}
                              >
                                <DocIcon sx={{ color: expandedForm === index ? '#1A73E8' : '#70757A', fontSize: 20 }} />
                              </Box>
                              <Box>
                                <Typography sx={{ fontWeight: 600, color: '#202124' }}>{form.name}</Typography>
                                {form.description && <Typography variant="caption" sx={{ color: '#70757A' }}>{form.description}</Typography>}
                              </Box>
                            </Stack>
                          </AccordionSummary>
                          <AccordionDetails sx={{ px: 4, pb: 4 }}>
                            <Divider sx={{ mb: 4, borderStyle: 'dashed' }} />
                            <Grid container spacing={4}>
                              {form.fields.map((field) => {
                                if (field.field_type === 'section') {
                                  return (
                                    <Grid item xs={12} key={field.id} sx={{ mt: 2 }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1A73E8', letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                        {field.label}
                                      </Typography>
                                      <Divider sx={{ mt: 1, mb: 2, width: 40, borderBottomWidth: 2, borderColor: '#1A73E8' }} />
                                    </Grid>
                                  )
                                }
                                
                                if (field.field_type === 'table') {
                                  return (
                                    <Grid item xs={12} key={field.id}>
                                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#202124', mb: 1, display: 'block' }}>{field.label?.toUpperCase()}</Typography>
                                      <DynamicTable 
                                        field={field} 
                                        value={formData.riskFactors[field.field_key]} 
                                        onChange={(val) => handleRiskFactorChange(field.field_key, val)}
                                      />
                                    </Grid>
                                  )
                                }

                                if (field.field_type === 'checkbox') {
                                  return (
                                    <Grid item xs={12} md={6} key={field.id}>
                                      <FormControlLabel
                                        control={
                                          <Checkbox 
                                            checked={!!formData.riskFactors[field.field_key]} 
                                            onChange={(e) => handleRiskFactorChange(field.field_key, e.target.checked)}
                                            sx={{ color: '#DADCE0', '&.Mui-checked': { color: '#1A73E8' } }}
                                          />
                                        }
                                        label={<Typography variant="body2" sx={{ fontWeight: 500, color: '#3C4043' }}>{field.label}</Typography>}
                                      />
                                    </Grid>
                                  )
                                }

                                if (field.field_type === 'select') {
                                  return (
                                    <Grid item xs={12} md={6} key={field.id}>
                                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#202124', mb: 1, display: 'block' }}>{field.label?.toUpperCase()}</Typography>
                                      <Select
                                        fullWidth
                                        value={formData.riskFactors[field.field_key] || ''}
                                        onChange={(e) => handleRiskFactorChange(field.field_key, e.target.value)}
                                        sx={{ borderRadius: 0, bgcolor: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#DADCE0' } }}
                                        displayEmpty
                                      >
                                        <MenuItem value="" disabled>Select {field.label}</MenuItem>
                                        {(field.options || []).map(opt => (
                                          <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                        ))}
                                      </Select>
                                    </Grid>
                                  )
                                }

                                return (
                                  <Grid item xs={12} md={field.field_type === 'textarea' ? 12 : 6} key={field.id}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#202124', mb: 1, display: 'block' }}>{field.label?.toUpperCase()}</Typography>
                                    <TextField 
                                      fullWidth 
                                      multiline={field.field_type === 'textarea'}
                                      rows={field.field_type === 'textarea' ? 4 : 1}
                                      type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                                      placeholder={`Enter ${field.label?.toLowerCase()}`}
                                      value={formData.riskFactors[field.field_key] || ''}
                                      onChange={(e) => handleRiskFactorChange(field.field_key, e.target.value)}
                                      InputProps={{ 
                                        sx: { borderRadius: 0, bgcolor: '#fff', '& fieldset': { borderColor: '#DADCE0' } }
                                      }}
                                    />
                                  </Grid>
                                )
                              })}
                            </Grid>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ py: 10, textAlign: 'center' }}>
                      <SuccessIcon sx={{ fontSize: 60, color: '#0F9D58', mb: 2, opacity: 0.2 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#202124' }}>No assessment required</Typography>
                      <Typography variant="body2" sx={{ color: '#70757A' }}>You can proceed directly to generate your quote.</Typography>
                    </Box>
                  )}
                </Box>
              )}

              {activeStep === 2 && (
                <Box>
                  <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, borderRadius: 0, border: '1px solid #E8EAED', mb: 4 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
                      <SuccessIcon sx={{ color: '#0F9D58', fontSize: 28 }} />
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: '#202124' }}>Review your Quote</Typography>
                        <Typography variant="body2" sx={{ color: '#70757A' }}>Confirm the details before proceeding to payment.</Typography>
                      </Box>
                    </Stack>

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ p: 3, bgcolor: '#F8F9FA', borderRadius: 0, border: '1px solid #F1F3F4' }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#70757A', mb: 2, display: 'block' }}>PLAN DETAILS</Typography>
                          <Stack spacing={1}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" sx={{ color: '#5F6368' }}>Policy Term</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{product.duration_years || 1} Year(s)</Typography>
                            </Box>
                          </Stack>
                        </Box>
                      </Grid>
                        <Box sx={{ p: 3, bgcolor: '#1A73E8', borderRadius: 0, color: '#fff', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, textAlign: 'center' }}>READY TO SECURE COVERAGE</Typography>
                          <Typography variant="caption" sx={{ opacity: 0.8, mt: 1, display: 'block', textAlign: 'center' }}>
                            Please proceed to payment to activate your policy.
                          </Typography>
                        </Box>
                    </Grid>
                  </Paper>

                  {/* Benefits & Terms Summary in Review */}
                  <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={6}>
                       <Accordion elevation={0} sx={{ border: '1px solid #E8EAED', borderRadius: 0, '&:before': { display: 'none' } }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#1A73E8' }} />}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <ShieldIcon sx={{ color: '#1A73E8', fontSize: 18 }} />
                              <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>INCLUDED BENEFITS</Typography>
                            </Stack>
                          </AccordionSummary>
                          <AccordionDetails sx={{ bgcolor: '#F8F9FA', borderTop: '1px solid #E8EAED' }}>
                             <Stack spacing={1}>
                               {Object.entries(activeTemplate?.coverage_limits || {}).map(([k, v]) => (
                                 <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                   <Typography variant="caption" sx={{ color: '#5F6368', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</Typography>
                                   <Typography variant="caption" sx={{ fontWeight: 800, color: '#202124' }}>{typeof v === 'number' ? `UGX ${v.toLocaleString()}` : v}</Typography>
                                 </Box>
                               ))}
                               {(!activeTemplate?.coverage_limits || Object.keys(activeTemplate.coverage_limits).length === 0) && <Typography variant="caption" sx={{ color: '#BDC1C6', fontStyle: 'italic' }}>Standard coverage benefits apply.</Typography>}
                             </Stack>
                          </AccordionDetails>
                       </Accordion>
                    </Grid>
                    <Grid item xs={12} md={6}>
                       <Accordion elevation={0} sx={{ border: '1px solid #E8EAED', borderRadius: 0, '&:before': { display: 'none' } }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#1A73E8' }} />}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <DocIcon sx={{ color: '#1A73E8', fontSize: 18 }} />
                              <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>POLICY TERMS</Typography>
                            </Stack>
                          </AccordionSummary>
                          <AccordionDetails sx={{ bgcolor: '#F8F9FA', borderTop: '1px solid #E8EAED' }}>
                             <Typography variant="caption" sx={{ color: '#5F6368', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.6 }}>
                               {activeTemplate?.terms_and_conditions || 'Standard policy terms and conditions apply.'}
                             </Typography>
                          </AccordionDetails>
                       </Accordion>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button 
                      variant="outlined" 
                      onClick={() => setActiveStep(1)}
                      sx={{ borderRadius: 0, px: 4, borderColor: '#DADCE0', color: '#1A73E8', textTransform: 'none', fontWeight: 600 }}
                    >
                      Edit Assessment
                    </Button>
                    <Button 
                      variant="contained" 
                      onClick={() => setActiveStep(3)}
                      sx={{ borderRadius: 0, px: 6, bgcolor: '#1A73E8', textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}
                    >
                      Proceed to Payment
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Navigation Buttons are now at the very bottom of the view */}

              {activeStep === 3 && paymentStatus === 'success' && (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Avatar sx={{ width: 100, height: 100, bgcolor: '#E8F5E9', color: '#0F9D58', mx: 'auto', mb: 3 }}>
                    <SuccessIcon sx={{ fontSize: 60 }} />
                  </Avatar>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#202124', mb: 1 }}>Payment Successful!</Typography>
                  <Typography sx={{ color: '#70757A', mb: 4 }}>Your policy for {product.name} is now active. You will receive a confirmation email shortly.</Typography>
                  
                  <Paper elevation={0} sx={{ p: 3, bgcolor: '#F8F9FA', borderRadius: 0, border: '1px solid #E8EAED', maxWidth: 400, mx: 'auto', mb: 4, textAlign: 'left' }}>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: '#70757A' }}>POLICY NO.</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>POL-2026-X821</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: '#70757A' }}>TRANS ID</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>TXN_{Math.random().toString(36).substr(2, 9).toUpperCase()}</Typography>
                      </Box>
                    </Stack>
                  </Paper>

                  <Button 
                    variant="contained" 
                    onClick={() => navigate('/client/dashboard')}
                    sx={{ borderRadius: 0, px: 6, bgcolor: '#1A73E8', textTransform: 'none', fontWeight: 600 }}
                  >
                    Go to Dashboard
                  </Button>
                </Box>
              )}

              {activeStep === 3 && paymentStatus === 'failed' && (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Avatar sx={{ width: 100, height: 100, bgcolor: '#FEEBEE', color: '#D93025', mx: 'auto', mb: 3 }}>
                    <WarningIcon sx={{ fontSize: 60 }} />
                  </Avatar>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#202124', mb: 1 }}>Payment Failed</Typography>
                  <Typography sx={{ color: '#70757A', mb: 4 }}>{paymentError || 'We could not process your payment at this time.'}</Typography>
                  
                  <Stack direction="row" spacing={2} justifyContent="center">
                    <Button 
                      variant="contained" 
                      onClick={handleCompletePayment}
                      sx={{ borderRadius: 0, px: 4, bgcolor: '#1A73E8', textTransform: 'none', fontWeight: 600 }}
                    >
                      Try Repaying
                    </Button>
                    <Button 
                      variant="outlined" 
                      onClick={() => navigate('/client/dashboard')}
                      sx={{ borderRadius: 0, px: 4, borderColor: '#DADCE0', color: '#70757A', textTransform: 'none', fontWeight: 600 }}
                    >
                      Exit to Dashboard (Saved as Draft)
                    </Button>
                  </Stack>
                </Box>
              )}

              {activeStep === 3 && paymentStatus === 'processing' && (
                <Box sx={{ textAlign: 'center', py: 10 }}>
                  <CircularProgress size={60} thickness={4} sx={{ color: '#1A73E8', mb: 3 }} />
                  <Typography variant="h5" sx={{ fontWeight: 600, color: '#202124', mb: 1 }}>Processing Payment...</Typography>
                  <Typography variant="body2" sx={{ color: '#70757A' }}>Please do not refresh the page or click 'Back'.</Typography>
                </Box>
              )}

              {activeStep === 3 && paymentStatus === 'idle' && (
                <Box>
                  <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, borderRadius: 0, border: '1px solid #E8EAED', mb: 4 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
                      <PaymentIcon sx={{ color: '#1A73E8', fontSize: 28 }} />
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: '#202124' }}>Select Payment Method</Typography>
                        <Typography variant="body2" sx={{ color: '#70757A' }}>Complete your purchase to activate coverage immediately.</Typography>
                      </Box>
                    </Stack>

                    <Grid container spacing={2}>
                      {[
                        { id: 'mtn', name: 'MTN Mobile Money', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/New-mtn-logo.jpg/512px-New-mtn-logo.jpg', type: 'mobile' },
                        { id: 'airtel', name: 'Airtel Money', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Airtel_logo.svg/512px-Airtel_logo.svg.png', type: 'mobile' },
                        { id: 'card', name: 'Visa / Mastercard', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Mastercard_2019_logo.svg/512px-Mastercard_2019_logo.svg.png', type: 'card' },
                        { id: 'bank', name: 'Direct Bank Transfer', icon: '🏦', type: 'bank' }
                      ].map((method) => (
                        <Grid item xs={12} key={method.id}>
                          <Button 
                            fullWidth 
                            variant="outlined" 
                            onClick={() => setSelectedPaymentMethod(method)}
                            sx={{ 
                              p: 2.5, borderRadius: 0, justifyContent: 'flex-start',
                              borderColor: selectedPaymentMethod?.id === method.id ? '#1A73E8' : '#DADCE0',
                              bgcolor: selectedPaymentMethod?.id === method.id ? '#F8F9FA' : 'transparent',
                              color: '#202124', textTransform: 'none',
                              borderWidth: selectedPaymentMethod?.id === method.id ? 2 : 1,
                              '&:hover': { borderColor: '#1A73E8', bgcolor: '#F8F9FA' }
                            }}
                          >
                            <Box sx={{ width: 44, height: 32, borderRadius: 0, bgcolor: method.logo ? '#fff' : (selectedPaymentMethod?.id === method.id ? '#E8F0FE' : '#F1F3F4'), display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2, fontSize: '1.2rem', overflow: 'hidden', p: method.logo ? 0.5 : 0, border: method.logo ? '1px solid #E8EAED' : 'none' }}>
                              {method.logo ? <img src={method.logo} alt={method.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : method.icon}
                            </Box>
                            <Typography sx={{ fontWeight: 600 }}>{method.name}</Typography>
                            <Box sx={{ flex: 1 }} />
                            {selectedPaymentMethod?.id === method.id ? (
                              <SuccessIcon sx={{ color: '#1A73E8', fontSize: 20 }} />
                            ) : (
                              <ArrowIcon sx={{ color: '#BDC1C6' }} />
                            )}
                          </Button>
                        </Grid>
                      ))}
                    </Grid>

                    {/* Conditional Input Fields */}
                    {selectedPaymentMethod && (
                      <Fade in timeout={400}>
                        <Box sx={{ mt: 4, p: 4, bgcolor: '#F8F9FA', borderRadius: 0, border: '1px solid #E8EAED' }}>
                          {selectedPaymentMethod.type === 'mobile' && (
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#202124' }}>ENTER {selectedPaymentMethod.name.toUpperCase()} NUMBER</Typography>
                              <TextField 
                                fullWidth
                                placeholder="07XX XXX XXX"
                                value={paymentInfo.phoneNumber}
                                onChange={(e) => setPaymentInfo({...paymentInfo, phoneNumber: e.target.value})}
                                InputProps={{
                                  sx: { borderRadius: 0, bgcolor: '#fff' }
                                }}
                              />
                              <Typography variant="caption" sx={{ color: '#70757A', mt: 1, display: 'block' }}>
                                A push notification will be sent to this number to authorize the transaction.
                              </Typography>
                            </Box>
                          )}
                          {selectedPaymentMethod.type === 'card' && (
                            <Grid container spacing={2}>
                              <Grid item xs={12}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#202124' }}>CARD NUMBER</Typography>
                                <TextField fullWidth placeholder="XXXX XXXX XXXX XXXX" InputProps={{ sx: { borderRadius: 0, bgcolor: '#fff' } }} />
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#202124' }}>EXPIRY</Typography>
                                <TextField fullWidth placeholder="MM/YY" InputProps={{ sx: { borderRadius: 0, bgcolor: '#fff' } }} />
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#202124' }}>CVV</Typography>
                                <TextField fullWidth placeholder="XXX" InputProps={{ sx: { borderRadius: 0, bgcolor: '#fff' } }} />
                              </Grid>
                            </Grid>
                          )}
                          {selectedPaymentMethod.type === 'bank' && (
                            <Box sx={{ textAlign: 'center', py: 2 }}>
                              <Typography variant="body2" sx={{ color: '#202124', fontWeight: 600 }}>CarryIT Bank Details</Typography>
                              <Typography variant="caption" sx={{ color: '#70757A', display: 'block' }}>Stanbic Bank • 9030012345678 • PHOSAI LTD</Typography>
                              <Typography variant="caption" sx={{ color: '#70757A', mt: 1, display: 'block' }}>Please use your Quote REF as the payment reference.</Typography>
                            </Box>
                          )}
                        </Box>
                      </Fade>
                    )}
                  </Paper>
                </Box>
              )}

              {/* Navigation Buttons (Bottom) */}
              {!(activeStep === 3 && paymentStatus !== 'idle') && (
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 4, pt: 3, borderTop: '1px solid #E8EAED' }}>
                  <Box>
                    {activeStep > 0 && activeStep < 3 && (
                      <Button 
                        variant="outlined"
                        onClick={() => setActiveStep(activeStep - 1)}
                        sx={{ borderRadius: 0, px: 4, py: 1.5, borderColor: '#DADCE0', color: '#5F6368', textTransform: 'none', fontWeight: 600 }}
                      >
                        Back
                      </Button>
                    )}
                    {activeStep === 3 && (
                      <Button 
                        variant="text"
                        onClick={() => setActiveStep(2)}
                        sx={{ borderRadius: 0, px: 4, py: 1.5, color: '#5F6368', textTransform: 'none', fontWeight: 600 }}
                      >
                        Back to Summary
                      </Button>
                    )}
                  </Box>
                  <Button 
                    variant="contained" 
                    disabled={
                      createQuote.isLoading || 
                      (activeStep === 3 && !selectedPaymentMethod) ||
                      (activeStep === 3 && selectedPaymentMethod?.type === 'mobile' && !paymentInfo.phoneNumber)
                    }
                    onClick={handleNext}
                    sx={{ 
                      borderRadius: 0, px: 6, py: 1.5, bgcolor: '#1A73E8', textTransform: 'none', fontWeight: 600,
                      boxShadow: '0 4px 14px rgba(26,115,232,0.3)', '&:hover': { bgcolor: '#1765CC', boxShadow: '0 6px 20px rgba(26,115,232,0.4)' }
                    }}
                  >
                    {createQuote.isLoading ? <CircularProgress size={20} color="inherit" /> : activeStep === 1 ? 'Generate Quote' : activeStep === 3 ? 'Complete Payment' : 'Continue'}
                  </Button>
                </Stack>
              )}

            </Box>
          </Fade>
        </Grid>

        {/* Floating Sidebar Summary */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ position: 'sticky', top: 100 }}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 0, border: '1px solid #E8EAED', bgcolor: '#fff' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#202124', mb: 3, letterSpacing: 0.5 }}>POLICY SUMMARY</Typography>
              
              <Stack spacing={2.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#70757A', fontWeight: 600, display: 'block' }}>PROVIDER</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{product.provider_name}</Typography>
                  </Box>
                  <Avatar src={product.provider_logo} variant="rounded" sx={{ width: 32, height: 32, border: '1px solid #F1F3F4' }} />
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: '#70757A', fontWeight: 600, display: 'block' }}>COVERAGE TYPE</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{product.category?.toUpperCase()} INSURANCE</Typography>
                </Box>

                <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

                <Box sx={{ p: 2, bgcolor: '#F8F9FA', borderRadius: 0, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <LockIcon sx={{ fontSize: 16, color: '#0F9D58' }} />
                  <Typography variant="caption" sx={{ color: '#5F6368', fontWeight: 500 }}>
                    Secure, encrypted checkout
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            <Box sx={{ mt: 3, p: 2, textAlign: 'center', opacity: 0.6 }}>
              <Typography variant="caption" sx={{ color: '#70757A', fontWeight: 500 }}>
                Powered by CarryIT Digital Ledger • 2026
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}
