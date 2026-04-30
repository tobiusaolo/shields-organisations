import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Swal from 'sweetalert2'
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
  CheckCircle as CheckCircleIcon,
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
          borderRadius: 3, 
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
          size="small" 
          onClick={handleAddRow}
          startIcon={<AddIcon />}
          sx={{ 
            color: '#1A73E8', 
            fontWeight: 700, 
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
  const { user, refreshContext } = useAuth()
  const queryClient = useQueryClient()
  const [activeStep, setActiveStep] = useState(0)
  const [expandedForm, setExpandedForm] = useState(0)
  const [formData, setFormData] = useState({
    coverageAmount: '',
    startDate: new Date().toISOString().split('T')[0],
    duration: 1,
    riskFactors: {} // For dynamic forms
  })
  const [createdQuote, setCreatedQuote] = useState(null)
  const [isCalculated, setIsCalculated] = useState(false)
  const [selectedTier, setSelectedTier] = useState(null)
  const [createdPolicyId, setCreatedPolicyId] = useState(null)
  const [createdPolicyNumber, setCreatedPolicyNumber] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState('idle')
  const [paymentError, setPaymentError] = useState(null)
  const [isCreatingQuote, setIsCreatingQuote] = useState(false)
  const [monthsToPay, setMonthsToPay] = useState(1) // For monthly products: how many installments to pay upfront
  const [isSavingDraft, setIsSavingDraft] = useState(false)

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
  // Get current active template (reactive to selected tier or fallback to is_active/first)
  const activeTemplate = React.useMemo(() => {
    if (selectedTier?.product_template_id) {
      const found = templates.find(t => t.id === selectedTier.product_template_id)
      if (found) return found
    }
    return templates.find(t => t.is_active) || templates[0]
  }, [templates, selectedTier])

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
      premium: tier.premium || 0,
      coverageAmount: tier.coverage_amount || prev.coverageAmount
    }))
  }

  // Fetch true Dynamic Forms from the backend
  const { data: dynamicForms = [], isLoading: formsLoading } = useQuery({
    queryKey: ['product-forms', id, activeTemplate?.id],
    queryFn: async () => {
      const res = await publicAPI.getTemplateFormsPublic(id, activeTemplate.id)
      const forms = res.data || []
      // Primary sort by order, secondary by creation date
      return forms.sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(form => ({
          ...form,
          fields: (form.fields || []).sort((a, b) => (a.order || 0) - (b.order || 0))
        }))
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
      setIsCreatingQuote(true)
      const res = await publicAPI.createPublicQuotation(data)
      return res.data
    },
    onSuccess: async (data) => {
      setCreatedQuote(data)
      
      // Automatically convert quotation to a pending policy
      // This ensures the policy appears in "My Policies" even if the user drops off before payment
      try {
        const policyRes = await publicAPI.createPublicPolicy({ 
          quotation_id: data.id,
          payment_method: 'pesapal'
        })
        setCreatedPolicyId(policyRes.data?.id)
        setCreatedPolicyNumber(policyRes.data?.policy_number)
        console.log('[Auto-Convert] Policy created automatically:', policyRes.data?.id)
      } catch (err) {
        console.error("Auto policy conversion failed. This is okay, it will retry on payment:", err)
      }

      setIsCreatingQuote(false)
      setActiveStep(2) // Move to Review Quote
    },
    onError: (err) => {
      setIsCreatingQuote(false)
      console.error('Quote creation failed:', err)
      alert('Quote creation took too long or failed. Please try again.')
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
      // Enrich context with labels for better readability on the policies page
      const enrichedContext = {}
      dynamicForms.forEach(form => {
        form.fields.forEach(field => {
          const val = formData.riskFactors[field.field_key]
          if (val !== undefined && val !== null && val !== '') {
            const label = field.label || field.field_key
            
            // Handle table enrichment (nested fields)
            if (field.field_type === 'table' && Array.isArray(val)) {
              const columns = field.columns || []
              const enrichedRows = val.map(row => {
                const enrichedRow = {}
                columns.forEach(col => {
                  const cellVal = row[col.key || col.label]
                  if (cellVal !== undefined && cellVal !== null) {
                    enrichedRow[col.label || col.key] = cellVal
                  }
                })
                return enrichedRow
              })
              enrichedContext[label] = enrichedRows
            } else {
              enrichedContext[label] = val
            }
          }
        })
      })

      createQuote.mutate({
        organization_id: product.organization_id,
        policy_holder_email: user.email,
        policy_holder_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Client',
        policy_holder_phone: user.phone || '000000000',
        product_template_id: activeTemplate?.id || '',
        start_date: formData.startDate,
        end_date: new Date(new Date(formData.startDate).setFullYear(new Date(formData.startDate).getFullYear() + (Number(product.duration_years) || 1))).toISOString().split('T')[0],
        coverage_amount: Number(formData.coverageAmount) || product.max_coverage || 0,
        premium_amount: Number(formData.premium) || activeTemplate?.base_premium || 0,
        context: {
          ...enrichedContext,
          premium_amount: Number(formData.premium) || activeTemplate?.base_premium || 0
        },
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

  const handleSaveDraft = async () => {
    setIsSavingDraft(true)
    try {
      let qId = createdQuote?.id
      
      // 1. If no quote exists yet, create it now (e.g. they are on Step 1 and click Save)
      if (!qId) {
        // Build enriched context
        const enrichedContext = {}
        dynamicForms.forEach(form => {
          form.fields.forEach(field => {
            const val = formData.riskFactors[field.field_key]
            if (val !== undefined && val !== null && val !== '') {
              const label = field.label || field.field_key
              
              if (field.field_type === 'table' && Array.isArray(val)) {
                const columns = field.columns || []
                enrichedContext[label] = val.map(row => {
                  const enrichedRow = {}
                  columns.forEach(col => {
                    const cellVal = row[col.key || col.label]
                    if (cellVal !== undefined && cellVal !== null) {
                      enrichedRow[col.label || col.key] = cellVal
                    }
                  })
                  return enrichedRow
                })
              } else {
                enrichedContext[label] = val
              }
            }
          })
        })

        const res = await publicAPI.createPublicQuotation({
          organization_id: product.organization_id,
          policy_holder_email: user.email,
          policy_holder_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Client',
          policy_holder_phone: user.phone || '000000000',
          product_template_id: activeTemplate?.id || '',
          start_date: formData.startDate,
          end_date: new Date(new Date(formData.startDate).setFullYear(new Date(formData.startDate).getFullYear() + (Number(product.duration_years) || 1))).toISOString().split('T')[0],
          coverage_amount: Number(formData.coverageAmount) || product.max_coverage || 0,
          context: enrichedContext,
          productId: product.id
        })
        qId = res.data.id
        setCreatedQuote(res.data)
      }

      // 2. If no policy exists yet, create it now
      if (!createdPolicyId && qId) {
        const policyRes = await publicAPI.createPublicPolicy({ 
          quotation_id: qId,
          payment_method: 'pesapal'
        })
        setCreatedPolicyId(policyRes.data?.id)
        setCreatedPolicyNumber(policyRes.data?.policy_number)
      }

      // 3. Refresh and navigate
      if (typeof refreshContext === 'function') await refreshContext()
      queryClient.invalidateQueries(['my-policies'])
      setIsSavingDraft(false)
      Swal.fire({
        title: 'Draft Saved!',
        text: 'Your application has been saved to My Policies.',
        icon: 'success',
        confirmButtonColor: '#1A237E'
      }).then(() => {
        navigate('/client/policies')
      })
    } catch (err) {
      console.error("Draft save error:", err)
      setIsSavingDraft(false)
      Swal.fire('Error', 'Failed to save the draft. Please try again.', 'error')
    }
  }

  const handleCompletePayment = async () => {
    setPaymentStatus('processing')
    setPaymentError(null)

    // 30-second watchdog — if PesaPal takes too long, surface an error
    const watchdog = setTimeout(() => {
      setPaymentStatus('failed')
      setPaymentError('The payment provider is taking too long to respond. Your policy has been saved — please try paying again from "My Policies".')
    }, 30000)

    try {
      const orgId = product.organization_id
      let policyId = createdPolicyId || createdQuote?.policy_id || (createdQuote?.status === 'active' ? createdQuote?.id : null)

      // Fallback: If we somehow don't have a policy ID yet, convert it now
      if (!policyId && createdQuote?.id) {
        try {
          const policyRes = await publicAPI.createPublicPolicy({ 
            quotation_id: createdQuote.id,
            payment_method: 'pesapal'
          })
          policyId = policyRes.data?.id
          setCreatedPolicyId(policyRes.data?.id)
          setCreatedPolicyNumber(policyRes.data?.policy_number)
        } catch (error) {
          const detail = error?.response?.data?.detail || error.message;
          throw new Error(`Could not prepare your policy for payment: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
        }
      }

      if (!orgId || !policyId) throw new Error('Missing policy or organisation details.')
      
      // === PAYMENT AMOUNT CALCULATION ===
      // max_coverage = total contract value
      // Monthly: user selects how many installments to pay upfront (monthsToPay)
      // Annual: pay full max_coverage

      const frequency = activeTemplate?.pricing_frequency?.toLowerCase()
      const maxCoverage = Number(createdQuote?.coverage_amount || product.max_coverage) || 0
      const durationYears = Number(product.duration_years) || 1
      const isMonthly = frequency === 'monthly' || frequency === 'month'
      const basePremium = Number(formData.premium || activeTemplate?.base_premium || product?.base_premium || product?.max_coverage || 0)
      const monthlyInstallment = isMonthly ? basePremium : Math.ceil(basePremium / 12)

      let paymentAmount = 0
      let monthsPaid = 1

      if (isMonthly) {
        monthsPaid = Math.max(1, Number(monthsToPay) || 1)
        paymentAmount = monthlyInstallment * monthsPaid
      } else {
        paymentAmount = basePremium
        monthsPaid = durationYears * 12
      }

      if (!paymentAmount || paymentAmount <= 0) {
        throw new Error('Could not determine a valid payment amount. Please contact support.')
      }

      console.log(`[Payment] frequency=${frequency}, maxCoverage=${maxCoverage}, monthsPaid=${monthsPaid}, paymentAmount=${paymentAmount}`)

      // Initiate PesaPal payment — PesaPal handles phone/method on their checkout page
      const res = await publicAPI.initiatePesapalPayment(orgId, policyId, { 
        months_paid: monthsPaid, 
        amount: paymentAmount
      })
      const redirectUrl = res.data?.redirect_url

      if (!redirectUrl) throw new Error(res.data?.error || 'Could not get payment URL. Please try again.')

      // DIRECT REDIRECT: This is the "Gold Standard" fix for the errors you saw.
      // PesaPal's security scripts (Songbird/Check.js) are designed to run on a full page, 
      // not in an iframe. Redirecting ensures all payment methods and security checks pass.
      clearTimeout(watchdog)
      window.location.href = redirectUrl
    } catch (err) {
      clearTimeout(watchdog)
      console.error("Payment initiation failed:", err)
      setPaymentStatus('failed')
      const detail = err?.response?.data?.detail
      setPaymentError(typeof detail === 'string' ? detail : (err.message || 'Payment initiation failed. Your policy is saved — try again from My Policies.'))
    }
  }

  return (
    <Box sx={{ bgcolor: '#F8F9FA', minHeight: '100vh', pb: 10 }}>
      {/* Premium Google-Style Header */}
      <Paper elevation={0} sx={{ borderBottom: '1px solid #E8EAED', bgcolor: '#fff', position: 'sticky', top: 0, zIndex: 10, px: { xs: 2, md: 6 }, py: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={3} alignItems="center">
            <IconButton onClick={() => navigate('/client/products')} size="small" sx={{ bgcolor: '#F8F9FA', '&:hover': { bgcolor: '#E8EAED' } }}>
              <BackIcon sx={{ fontSize: 20, color: '#5F6368' }} />
            </IconButton>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#202124', fontSize: '1.25rem', letterSpacing: '-0.02em' }}>{product.name}</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" sx={{ color: '#5F6368', fontWeight: 600 }}>By {product.provider_name}</Typography>
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
                  <Paper elevation={0} sx={{ p: { xs: 4, md: 5 }, borderRadius: 3, border: '1px solid #E8EAED', mb: 4, bgcolor: '#fff' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1A73E8', mb: 2.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Product Overview</Typography>
                    <Typography variant="body1" sx={{ color: '#3C4043', mb: 4, lineHeight: 1.8 }}>
                      {product.description || 'This insurance product provides comprehensive coverage tailored to your specific needs. Please review the assessment steps to customize your plan.'}
                    </Typography>
                    
                    <Grid container spacing={4}>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" sx={{ color: '#70757A', fontWeight: 700, mb: 0.5, display: 'block' }}>CATEGORY</Typography>
                        <Chip label={product.category?.toUpperCase() || 'INSURANCE'} size="small" sx={{ fontWeight: 800, borderRadius: 3, bgcolor: '#E8F0FE', color: '#1A73E8', height: 24, fontSize: '0.65rem' }} />
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
                  <Accordion elevation={0} sx={{ borderRadius: 3, border: '1px solid #E8EAED', mb: 4, bgcolor: '#fff', '&:before': { display: 'none' } }}>
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
                              onClick={() => handleSelectTier(tier)}
                              sx={{ 
                                p: 3, height: '100%', border: '1px solid', 
                                borderColor: selectedTier?.id === tier.id ? '#1A73E8' : '#E8EAED',
                                bgcolor: selectedTier?.id === tier.id ? '#F8F9FF' : '#fff', 
                                transition: 'all 0.3s',
                                cursor: 'pointer',
                                '&:hover': { borderColor: '#1A73E8', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
                                position: 'relative'
                              }}
                            >
                              {selectedTier?.id === tier.id && (
                                <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                                  <CheckCircleIcon sx={{ color: '#1A73E8', fontSize: 20 }} />
                                </Box>
                              )}
                              <Typography variant="overline" sx={{ fontWeight: 800, color: '#1A73E8', mb: 1, display: 'block' }}>
                                {tier.name}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                                <Typography variant="h5" sx={{ fontWeight: 900, color: '#202124' }}>
                                  UGX {Number(tier.premium || tier.coverage_amount || 0).toLocaleString()}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#70757A', ml: 1, fontWeight: 600 }}>
                                  / {activeTemplate?.pricing_frequency || 'period'}
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ color: '#5F6368', mb: 2.5, minHeight: 40, fontSize: '0.85rem', lineHeight: 1.5 }}>
                                {tier.description || `Comprehensive ${tier.name} package.`}
                              </Typography>
                              
                              <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />
                              
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#202124', mb: 1.5, display: 'block' }}>COVERAGE LIMIT</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: '#3C4043', mb: 2 }}>
                                UGX {Number(tier.coverage_amount).toLocaleString()}
                              </Typography>
                              
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#202124', mb: 1.5, display: 'block' }}>INCLUDED BENEFITS</Typography>
                              <List sx={{ p: 0 }}>
                                {(tier.benefits || []).map((benefit, bi) => (
                                  <ListItem key={bi} sx={{ p: 0, mb: 1, alignItems: 'flex-start' }}>
                                    <SuccessIcon sx={{ fontSize: 14, color: '#0F9D58', mr: 1, mt: 0.3, flexShrink: 0 }} />
                                    <Typography variant="caption" sx={{ color: '#3C4043', fontWeight: 600, lineHeight: 1.4 }}>{benefit}</Typography>
                                  </ListItem>
                                ))}
                              </List>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {/* Benefits & Coverage Limits */}
                  <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E8EAED', mb: 4, bgcolor: '#fff' }}>
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
                            borderRadius: 3, border: '1px solid #E8EAED',
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
                                  width: 40, height: 40, borderRadius: 3, 
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
                                        sx={{ borderRadius: 3, bgcolor: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#DADCE0' } }}
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
                                        sx: { borderRadius: 3, bgcolor: '#fff', '& fieldset': { borderColor: '#DADCE0' } }
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
                  <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, borderRadius: 3, border: '1px solid #E8EAED', mb: 4 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
                      <SuccessIcon sx={{ color: '#0F9D58', fontSize: 28 }} />
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: '#202124' }}>Review your Quote</Typography>
                        <Typography variant="body2" sx={{ color: '#70757A' }}>Confirm the details before proceeding to payment.</Typography>
                      </Box>
                    </Stack>

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ p: 3, bgcolor: '#F8F9FA', borderRadius: 3, border: '1px solid #F1F3F4' }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#70757A', mb: 2, display: 'block' }}>PLAN DETAILS</Typography>
                          <Stack spacing={1.5}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" sx={{ color: '#5F6368' }}>Policy Term</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{product.duration_years || 1} Year(s)</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" sx={{ color: '#5F6368' }}>Coverage Limit</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>UGX {Number(product.max_coverage || createdQuote?.coverage_amount || 0).toLocaleString()}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px solid #E8EAED' }}>
                              {(activeTemplate?.pricing_frequency?.toLowerCase() === 'monthly' || activeTemplate?.pricing_frequency?.toLowerCase() === 'month') ? (
                                <>
                                  <Typography variant="body2" sx={{ color: '#5F6368' }}>Monthly Installment</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#1A73E8' }}>
                                    UGX {(
                                      (activeTemplate?.pricing_frequency?.toLowerCase() === 'monthly' || activeTemplate?.pricing_frequency?.toLowerCase() === 'month') 
                                      ? Number(formData.premium || activeTemplate?.base_premium || product?.base_premium || 0)
                                      : Math.ceil(Number(formData.premium || activeTemplate?.base_premium || product?.base_premium || product?.max_coverage || 0) / 12)
                                    ).toLocaleString()} / month
                                  </Typography>
                                </>
                              ) : (
                                <>
                                  <Typography variant="body2" sx={{ color: '#5F6368' }}>Amount Due</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F9D58' }}>
                                    UGX {Number(formData.premium || activeTemplate?.base_premium || product?.base_premium || product?.max_coverage || 0).toLocaleString()}
                                  </Typography>
                                </>
                              )}
                            </Box>
                          </Stack>
                        </Box>

                        {/* Months Selector for Monthly Products */}
                        {(activeTemplate?.pricing_frequency?.toLowerCase() === 'monthly' || activeTemplate?.pricing_frequency?.toLowerCase() === 'month') && (
                          <Box sx={{ mt: 3, p: 3, bgcolor: '#fff', borderRadius: 3, border: '1px solid #1A73E8' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#1A73E8' }}>PAYMENT SCHEDULE</Typography>
                            <Typography variant="body2" sx={{ color: '#5F6368', mb: 2 }}>
                              How many months would you like to pay for upfront?
                            </Typography>
                            <TextField
                              select
                              fullWidth
                              value={monthsToPay}
                              onChange={(e) => setMonthsToPay(e.target.value)}
                              InputProps={{ sx: { borderRadius: 3 } }}
                              SelectProps={{ native: true }}
                            >
                              {[1, 2, 3, 4, 6, 12].map(m => (
                                <option key={m} value={m}>{m} Month{m > 1 ? 's' : ''}</option>
                              ))}
                            </TextField>
                          </Box>
                        )}
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ p: 4, bgcolor: '#1A73E8', borderRadius: 3, color: '#fff', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: '0 10px 30px rgba(26,115,232,0.2)' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, textAlign: 'center', letterSpacing: 1 }}>READY TO SECURE COVERAGE</Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9, mt: 1.5, display: 'block', textAlign: 'center', maxWidth: '80%' }}>
                            Please review the plan details and proceed to payment to activate your policy instantly.
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Client Assessment Summary (Dynamic Form Data) */}
                  {dynamicForms.length > 0 && Object.keys(formData.riskFactors).length > 0 && (
                    <Accordion elevation={0} sx={{ border: '1px solid #E8EAED', borderRadius: 3, mb: 4, '&:before': { display: 'none' } }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#1A73E8' }} />}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CheckCircleIcon sx={{ color: '#1A73E8', fontSize: 18 }} />
                          <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>YOUR ASSESSMENT DETAILS</Typography>
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails sx={{ bgcolor: '#F8F9FA', borderTop: '1px solid #E8EAED', p: 3 }}>
                        <Grid container spacing={3}>
                          {dynamicForms.map(form => (
                            form.fields.map(field => {
                              const value = formData.riskFactors[field.field_key]
                              if (!value) return null
                              
                              if (field.field_type === 'table') {
                                return (
                                  <Grid item xs={12} key={field.id}>
                                    <Typography variant="caption" sx={{ color: '#5F6368', display: 'block', mb: 1, textTransform: 'uppercase', fontWeight: 700 }}>{field.label}</Typography>
                                    <Paper elevation={0} sx={{ border: '1px solid #E8EAED', borderRadius: 2, overflow: 'hidden' }}>
                                      <Table size="small">
                                        <TableHead sx={{ bgcolor: '#F1F3F4' }}>
                                          <TableRow>
                                            {(field.columns || []).map((col, i) => (
                                              <TableCell key={i} sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1 }}>{col.label}</TableCell>
                                            ))}
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {(Array.isArray(value) ? value : []).map((row, ri) => (
                                            <TableRow key={ri}>
                                              {(field.columns || []).map((col, ci) => (
                                                <TableCell key={ci} sx={{ fontSize: '0.8rem', py: 1 }}>{row[col.key || col.label] || '-'}</TableCell>
                                              ))}
                                            </TableRow>
                                          ))}
                                          {(!Array.isArray(value) || value.length === 0) && (
                                            <TableRow>
                                              <TableCell colSpan={field.columns?.length || 1} sx={{ textAlign: 'center', py: 2, color: '#70757A', fontStyle: 'italic', fontSize: '0.8rem' }}>No entries</TableCell>
                                            </TableRow>
                                          )}
                                        </TableBody>
                                      </Table>
                                    </Paper>
                                  </Grid>
                                )
                              }

                              return (
                                <Grid item xs={12} md={field.field_type === 'textarea' ? 12 : 6} key={field.id}>
                                  <Typography variant="caption" sx={{ color: '#5F6368', display: 'block', mb: 0.5, textTransform: 'uppercase', fontWeight: 700 }}>{field.label}</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#202124' }}>
                                    {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                                  </Typography>
                                </Grid>
                              )
                            })
                          ))}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {/* Benefits & Terms Summary in Review */}
                  <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={6}>
                       <Accordion elevation={0} sx={{ border: '1px solid #E8EAED', borderRadius: 3, '&:before': { display: 'none' } }}>
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
                       <Accordion elevation={0} sx={{ border: '1px solid #E8EAED', borderRadius: 3, '&:before': { display: 'none' } }}>
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

                  <Box sx={{ display: 'flex', gap: 2, mt: 4, flexWrap: 'wrap' }}>
                    <Button 
                      variant="outlined" 
                      onClick={() => setActiveStep(1)}
                      sx={{ borderRadius: 2, px: 4, py: 1.5, borderColor: '#DADCE0', color: '#1A73E8', textTransform: 'none', fontWeight: 600 }}
                    >
                      Edit Assessment
                    </Button>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button 
                      variant="outlined" 
                      disabled={isSavingDraft}
                      onClick={handleSaveDraft}
                      sx={{ borderRadius: 2, px: 4, py: 1.5, borderColor: '#DADCE0', color: '#5F6368', textTransform: 'none', fontWeight: 600 }}
                    >
                      {isSavingDraft ? <CircularProgress size={20} sx={{ color: '#5F6368', mr: 1 }} /> : null}
                      {isSavingDraft ? 'Saving...' : 'Save Draft & Pay Later'}
                    </Button>
                    <Button 
                      variant="contained" 
                      onClick={() => setActiveStep(3)}
                      sx={{ borderRadius: 2, px: 6, py: 1.5, bgcolor: '#1A73E8', textTransform: 'none', fontWeight: 600, boxShadow: '0 4px 14px rgba(26,115,232,0.3)', '&:hover': { bgcolor: '#1765CC', boxShadow: '0 6px 20px rgba(26,115,232,0.4)' } }}
                    >
                      Proceed to Checkout
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
                  
                  <Paper elevation={0} sx={{ p: 3, bgcolor: '#F8F9FA', borderRadius: 3, border: '1px solid #E8EAED', maxWidth: 400, mx: 'auto', mb: 4, textAlign: 'left' }}>
                    <Stack spacing={1.5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#70757A' }}>POLICY NO.</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, bgcolor: '#E8F0FE', color: '#1A73E8', px: 1, py: 0.5, borderRadius: 1 }}>
                          {createdPolicyNumber || 'Processing...'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#70757A' }}>QUOTE REF</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#202124' }}>
                          {createdQuote?.quote_number || 'N/A'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>

                  <Button 
                    variant="contained" 
                    onClick={() => navigate('/client/dashboard')}
                    sx={{ borderRadius: 3, px: 6, bgcolor: '#1A73E8', textTransform: 'none', fontWeight: 600 }}
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
                      sx={{ borderRadius: 3, px: 4, bgcolor: '#1A73E8', textTransform: 'none', fontWeight: 600 }}
                    >
                      Try Repaying
                    </Button>
                    <Button 
                      variant="outlined" 
                      onClick={() => navigate('/client/dashboard')}
                      sx={{ borderRadius: 3, px: 4, borderColor: '#DADCE0', color: '#70757A', textTransform: 'none', fontWeight: 600 }}
                    >
                      Exit to Dashboard (Saved as Draft)
                    </Button>
                  </Stack>
                </Box>
              )}

              {activeStep === 3 && paymentStatus === 'processing' && (
                <Box sx={{ textAlign: 'center', py: 10 }}>
                  <CircularProgress size={60} thickness={4} sx={{ color: '#1A73E8', mb: 3 }} />
                  <Typography variant="h5" sx={{ fontWeight: 600, color: '#202124', mb: 1 }}>Preparing Secure Payment...</Typography>
                  <Typography variant="body2" sx={{ color: '#70757A', mb: 1 }}>Connecting to PesaPal. You will be redirected shortly.</Typography>
                  <Typography variant="caption" sx={{ color: '#9AA0A6', display: 'block', mb: 4 }}>This usually takes 5–10 seconds.</Typography>
                  <Button
                    variant="text"
                    size="small"
                    sx={{ color: '#D93025', textTransform: 'none' }}
                    onClick={() => {
                      setPaymentStatus('idle')
                      setPaymentError(null)
                    }}
                  >
                    Cancel and go back
                  </Button>
                </Box>
              )}

              {activeStep === 3 && paymentStatus === 'idle' && (
                <Box>
                  <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, borderRadius: 3, border: '1px solid #E8EAED', mb: 4, textAlign: 'center' }}>
                    <PaymentIcon sx={{ color: '#1A73E8', fontSize: 48, mb: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 600, color: '#202124', mb: 1 }}>Ready for Checkout</Typography>
                    <Typography variant="body1" sx={{ color: '#70757A', mb: 4, maxWidth: 400, mx: 'auto' }}>
                      You will be redirected to PesaPal's secure checkout gateway where you can choose your preferred mobile money or card option.
                    </Typography>

                    <Box sx={{ bgcolor: '#F8F9FA', p: 3, border: '1px solid #E8EAED', display: 'inline-block', minWidth: 300, mb: 4, textAlign: 'left' }}>
                      <Stack spacing={2}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#5F6368' }}>Product</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{product.name}</Typography>
                        </Box>
                        {(activeTemplate?.pricing_frequency?.toLowerCase() === 'monthly' || activeTemplate?.pricing_frequency?.toLowerCase() === 'month') && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ color: '#5F6368' }}>Installments</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{monthsToPay} Month(s)</Typography>
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2, borderTop: '1px dashed #DADCE0' }}>
                          <Typography variant="body1" sx={{ color: '#202124', fontWeight: 600 }}>Total Due Now</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: '#1A73E8' }}>
                            UGX {(() => {
                              const maxCov = Number(createdQuote?.coverage_amount || product.max_coverage) || 0;
                              const isMonthly = activeTemplate?.pricing_frequency?.toLowerCase() === 'monthly' || activeTemplate?.pricing_frequency?.toLowerCase() === 'month';
                              if (isMonthly) {
                                return (Math.ceil(maxCov / ((Number(product.duration_years) || 1) * 12)) * Math.max(1, Number(monthsToPay) || 1)).toLocaleString();
                              }
                              return maxCov.toLocaleString();
                            })()}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                       
                       
                       
<Typography variant="caption" sx={{ color: '#70757A', display: 'flex', alignItems: 'center', gap: 1 }}>
  <LockIcon sx={{ fontSize: 14 }} /> Secure 256-bit Encrypted Checkout
</Typography>

                    </Box>
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
                        sx={{ borderRadius: 3, px: 4, py: 1.5, borderColor: '#DADCE0', color: '#5F6368', textTransform: 'none', fontWeight: 600 }}
                      >
                        Back
                      </Button>
                    )}
                    {activeStep === 3 && (
                      <Button 
                        variant="text"
                        onClick={() => setActiveStep(2)}
                        sx={{ borderRadius: 3, px: 4, py: 1.5, color: '#5F6368', textTransform: 'none', fontWeight: 600 }}
                      >
                        Back to Summary
                      </Button>
                    )}
                  </Box>
                  <Button 
                    variant="contained" 
                    disabled={isCreatingQuote}
                    onClick={handleNext}
                    sx={{ 
                      borderRadius: 3, px: 6, py: 1.5, bgcolor: '#1A73E8', textTransform: 'none', fontWeight: 600,
                      boxShadow: '0 4px 14px rgba(26,115,232,0.3)', '&:hover': { bgcolor: '#1765CC', boxShadow: '0 6px 20px rgba(26,115,232,0.4)' }
                    }}
                  >
                    {isCreatingQuote ? <CircularProgress size={20} color="inherit" /> : activeStep === 1 ? 'Generate Quote' : activeStep === 3 ? 'Complete Payment' : 'Continue'}
                  </Button>
                </Stack>
              )}

            </Box>
          </Fade>
        </Grid>

        {/* Floating Sidebar Summary */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ position: 'sticky', top: 100 }}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E8EAED', bgcolor: '#fff' }}>
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

                <Box sx={{ p: 2, bgcolor: '#F8F9FA', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
