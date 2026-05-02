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
  List, ListItem, Autocomplete, Drawer, LinearProgress
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
  Stars as TierIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import { publicAPI, tenancyAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

const STEPS = ['Select Client', 'Plan Details', 'Required Assessment', 'Review Quote', 'Payment']

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

export default function AgentEnrollment() {
  const { productId: id } = useParams()
  const navigate = useNavigate()
  const { user, refreshContext } = useAuth()
  const queryClient = useQueryClient()
  const [activeStep, setActiveStep] = useState(0)

  const [selectedClient, setSelectedClient] = useState(null)
  const [isRegisteringClient, setIsRegisteringClient] = useState(false)
  const [registrationActiveStep, setRegistrationActiveStep] = useState(0)
  const [registrationForm, setRegistrationForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', password: 'ClientInit123!',
    nin: '', tin: '', address: '', documents: []
  })
  const [uploadedDocs, setUploadedDocs] = useState({
    national_id_front: null, national_id_back: null, drivers_permit_front: null,
    drivers_permit_back: null, selfie: null, passport_bio: null
  })
  const [registrationError, setRegistrationError] = useState('')

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
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [pesapalUrl, setPesapalUrl] = useState(null)

// 1. Fetch Clients (Merging Organization & Personal Network)
  const { data: clients = [], isLoading: clientsLoading, refetch: refetchClients } = useQuery({
    queryKey: ['agent-enrollment-clients', user?.organization_id],
    queryFn: async () => {
      const orgId = user?.organization_id || user?.default_organization_id
      if (!orgId) return []
      
      // Attempt sequential fetching if parallel fails or is slow
      const fetchClientsResiliently = async () => {
        try {
          // Attempt organization clients
          const orgRes = await tenancyAPI.getOrganizationClients(orgId)
          const orgClients = orgRes.data?.items || orgRes.data || []
          
          // Attempt personal clients
          const myRes = await tenancyAPI.getMyClients()
          const myClients = myRes.data?.items || myRes.data || []
          
          return [...orgClients, ...myClients]
        } catch (err) {
          console.warn('One or more client fetch operations failed, falling back to partial data:', err)
          // Return whatever we have if one fails
          return []
        }
      }

      const allClients = await fetchClientsResiliently()
      const uniqueClients = Array.from(new Map(allClients.map(c => [c.id, c])).values())
      
      console.log('Final Merged Clients:', uniqueClients)
      return uniqueClients
    },
    enabled: !!user,
    retry: 2,
    retryDelay: 3000
  })

  
const handleFileUpload = (docType, file) => {
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedDocs(prev => ({ ...prev, [docType]: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileRemove = (docType) => {
    setUploadedDocs(prev => ({ ...prev, [docType]: null }))
  }

  const registerClientMutation = useMutation({
    mutationFn: async (newData) => {
      const { kyc_data, ...clientData } = newData
      return await tenancyAPI.registerClient(clientData, kyc_data)
    },
    onSuccess: (res) => {
      Swal.fire({
        icon: 'success',
        title: 'Registration Successful',
        text: `Client ${registrationForm.first_name} registered successfully!`,
        confirmButtonColor: '#1A73E8'
      })
      queryClient.invalidateQueries(['agent-enrollment-clients'])
      setSelectedClient(res.data)
      setIsRegisteringClient(false)
      setRegistrationForm({
        first_name: '', last_name: '', email: '', phone: '', password: 'ClientInit123!',
        nin: '', tin: '', address: '', documents: []
      })
      setUploadedDocs({
        selfie: null, national_id_front: null, national_id_back: null,
        drivers_permit_front: null, drivers_permit_back: null, passport_bio: null
      })
      setRegistrationActiveStep(0)
      setRegistrationError('')
    },
    onError: (err) => {
      setRegistrationError(err.response?.data?.detail || 'Failed to register client.')
    }
  })

  const handleRegisterClient = async () => {
    setRegistrationError('')
    if (!registrationForm.email || !registrationForm.first_name || !registrationForm.last_name || !registrationForm.phone) {
      setRegistrationError('Please fill out all required fields.')
      return
    }

    const documents = Object.keys(uploadedDocs)
      .filter(key => uploadedDocs[key] !== null)
      .map(key => ({
        document_type: key,
        file_url: uploadedDocs[key],
        file_name: `${key}.jpg`
      }))

    registerClientMutation.mutate({
      ...registrationForm,
      kyc_data: {
        nin: registrationForm.nin,
        tin: registrationForm.tin,
        address: registrationForm.address,
        documents
      }
    })
  }

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
      const rawItems = res.data?.items || res.data || []
      // Deduplicate by tier ID to fix identical cards issue without hiding tiers that share the same name
      const uniqueMap = new Map()
      rawItems.forEach(t => {
        if (!uniqueMap.has(t.id)) {
          uniqueMap.set(t.id, {
            id: t.id,
            name: t.name,
            description: t.description,
            coverage_amount: t.coverage_amount,
            premium: t.premium,
            benefits: t.benefits || [],
            product_template_id: t.product_template_id
          })
        }
      })
      return Array.from(uniqueMap.values())
    },
    enabled: !!id && !!activeTemplate?.id && !!product?.organization_id
  })

  // Handle tier selection
  const handleSelectTier = (tier) => {
    setSelectedTier(tier)
    setFormData(prev => ({
      ...prev,
      premium: tier.coverage_amount || 0,
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
  
  // Removed max_coverage sync

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
      setActiveStep(3) // Move to Review Quote
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

  const performSave = async () => {
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
        organization_id: product?.organization_id,
        policy_holder_email: selectedClient?.email,
        policy_holder_name: `${selectedClient?.first_name || ''} ${selectedClient?.last_name || ''}`.trim() || 'Client',
        policy_holder_phone: selectedClient?.phone || '000000000',
        policy_holder_id: selectedClient?.id,
        product_template_id: activeTemplate?.id || '',
        start_date: formData.startDate,
        end_date: new Date(new Date(formData.startDate).setFullYear(new Date(formData.startDate).getFullYear() + (Number(product?.duration_years) || 1))).toISOString().split('T')[0],
        coverage_amount: Number(formData.coverageAmount) || 0,
        context: enrichedContext,
        productId: product?.id
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

    if (typeof refreshContext === 'function') await refreshContext()
    queryClient.invalidateQueries(['my-policies'])
    queryClient.invalidateQueries(['ledger'])
  }

  const handleSaveDraft = async () => {
    setIsSavingDraft(true)
    try {
      await performSave()
      setIsSavingDraft(false)
      Swal.fire({
        title: 'Draft Saved!',
        text: 'The application has been saved to the Policy Ledger.',
        icon: 'success',
        confirmButtonColor: '#1A237E'
      }).then(() => {
        navigate('/admin/ledger')
      })
    } catch (err) {
      console.error("Draft save error:", err)
      setIsSavingDraft(false)
      Swal.fire('Error', 'Failed to save the draft. Please try again.', 'error')
    }
  }

  // 20-Second Auto-Save Watchdog for Payment Step
  React.useEffect(() => {
    let timer
    // If we are on the Payment step (index 4) and haven't saved the policy yet
    if (activeStep === 4 && !createdPolicyId) {
      timer = setTimeout(async () => {
        try {
          console.log("[AutoSave] User idling on payment step. Auto-saving draft...")
          await performSave()
          // Subtle toast notification
          const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          })
          Toast.fire({
            icon: 'info',
            title: 'Progress auto-saved'
          })
        } catch (e) {
          console.error("[AutoSave] Failed:", e)
        }
      }, 20000)
    }
    return () => clearTimeout(timer)
  }, [activeStep, createdPolicyId])

  const handleCompletePayment = async () => {
    setPaymentStatus('processing')
    setPaymentError(null)

    try {
      if (!product) throw new Error("Product data is missing")

      // 1. Make sure the policy is saved as a draft first
      await performSave()

      const freq = activeTemplate?.pricing_frequency?.toLowerCase() || 'annual'
      // Resolve premium: tier premium > formData > template base > product base
      const paymentAmount = Number(
        formData.premium ||
        selectedTier?.premium ||
        selectedTier?.base_premium ||
        activeTemplate?.base_premium ||
        product?.base_premium ||
        0
      )
      const monthsPaid = freq === 'annual' || freq === 'annually' ? ((product.duration_years || 1) * 12) : 1

      if (!paymentAmount || paymentAmount <= 0) {
        throw new Error('Could not determine a valid payment amount. Please contact support.')
      }

      // 2. Initiate Payment for the policy (using the active policy ID, NOT the quote ID)
      if (createdPolicyId) {
        console.log(`[PesaPal] Agent flow → orgId=${product.organization_id}, policyId=${createdPolicyId}, amount=${paymentAmount}, months=${monthsPaid}`)
        const res = await publicAPI.initiatePesapalPayment(product.organization_id, createdPolicyId, { months_paid: monthsPaid, amount: paymentAmount })
        // Redirect to PesaPal Predefined UI immediately
        if (res.data?.redirect_url) {
            window.location.href = res.data.redirect_url
        } else {
            throw new Error("No redirect URL received from PesaPal.")
        }
      } else {
        throw new Error("Policy creation failed before payment.")
      }
      
    } catch (err) {
      console.error('Payment initiation failed:', err)
      setPaymentError('Payment failed to initiate. Please try again.')
      setPaymentStatus('error')
    }
  }

  const isLoading = productLoading || templatesLoading || formsLoading

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
      if (!selectedClient) {
        Swal.fire('Select Client', 'Please select a client to proceed.', 'warning')
        return
      }
      setActiveStep(1)
    } else if (activeStep === 1) {
      if (!selectedTier) {
        Swal.fire('Select Plan', 'Please select a coverage plan.', 'warning')
        return
      }
      setActiveStep(2)
    } else if (activeStep === 2) {
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
        policy_holder_email: selectedClient?.email,
        policy_holder_name: `${selectedClient?.first_name || ''} ${selectedClient?.last_name || ''}`.trim() || 'Client',
        policy_holder_phone: selectedClient?.phone || '000000000',
        policy_holder_id: selectedClient?.id,
        product_template_id: activeTemplate?.id || '',
        start_date: formData.startDate,
        end_date: new Date(new Date(formData.startDate).setFullYear(new Date(formData.startDate).getFullYear() + (Number(product.duration_years) || 1))).toISOString().split('T')[0],
        coverage_amount: Number(formData.coverageAmount) || 0,
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
      // Step 3 is Review. Clicking "Continue" moves to Step 4 (Payment Prompt)
      setActiveStep(4)
    } else if (activeStep === 4) {
      handleCompletePayment()
    } else {
      setActiveStep(activeStep + 1)
    }
  }


  if (isLoading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress />
    </Box>
  )

  if (!product) return (
    <Box p={4} textAlign="center">
      <Typography variant="h5">Product not found</Typography>
      <Button onClick={() => navigate('/admin/products')}>Back to Products</Button>
    </Box>
  )

  return (
    <Box sx={{ bgcolor: '#F8F9FA', minHeight: '100vh', pb: 10 }}>
      {/* Premium Google-Style Header */}
      <Paper elevation={0} sx={{ borderBottom: '1px solid #E8EAED', bgcolor: '#fff', position: 'sticky', top: 0, zIndex: 10, px: { xs: 2, md: 6 }, py: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={3} alignItems="center">
            <IconButton onClick={() => navigate(-1)} size="small" sx={{ bgcolor: '#F8F9FA', '&:hover': { bgcolor: '#E8EAED' } }}>
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
              {/* STEP 0: SELECT CLIENT */}
        {activeStep === 0 && (
          <Box>
            <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
              <Autocomplete
                fullWidth
                options={clients}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option
                  if (option.inputValue) return option.inputValue
                  return `${option.first_name || ''} ${option.last_name || ''} (${option.email || ''})`.trim()
                }}
                value={selectedClient}
                onChange={(_, val) => {
                  if (typeof val === 'string') {
                  } else if (val && val.inputValue) {
                    setIsRegisteringClient(true)
                    setRegistrationForm(prev => ({ ...prev, first_name: val.inputValue }))
                  } else {
                    setSelectedClient(val)
                  }
                }}
                filterOptions={(options, params) => {
                  const filtered = options.filter(o => 
                    `${o.first_name} ${o.last_name} ${o.email}`.toLowerCase().includes(params.inputValue.toLowerCase())
                  )
                  const { inputValue } = params;
                  const isExisting = options.some((option) => inputValue === `${option.first_name} ${option.last_name}`);
                  if (inputValue !== '' && !isExisting) {
                    filtered.push({
                      inputValue,
                      first_name: `Register "${inputValue}" as new client`,
                      last_name: '', email: '', isNew: true
                    });
                  }
                  return filtered;
                }}
                renderOption={(props, option) => {
                  const { key, ...optionProps } = props;
                  return (
                    <li key={key || (option.isNew ? 'new' : option.id)} {...optionProps}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {option.isNew ? <PersonAddIcon color="primary" /> : <SearchIcon color="action" />}
                        <Typography sx={{ fontWeight: option.isNew ? 700 : 400 }}>
                          {option.first_name} {option.last_name} {option.email ? `(${option.email})` : ''}
                        </Typography>
                      </Box>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Search Existing Client or Type New Name" 
                    variant="outlined" 
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" />
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              />
              <Button 
                variant="outlined" 
                startIcon={<AddIcon />} 
                onClick={() => setIsRegisteringClient(true)}
                sx={{ height: 56, px: 4, borderRadius: 0, whiteSpace: 'nowrap' }}
              >
                Register New
              </Button>
            </Stack>

            <Box sx={{ mt: 4 }}>
               <Alert severity="info" sx={{ borderRadius: 0 }}>
                  Enrolling for product: <b>{product?.name || 'Loading...'}</b>
               </Alert>
            </Box>
          </Box>
        )}

        
              {activeStep === 1 && (
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
                                  UGX {Number(tier.coverage_amount || 0).toLocaleString()}
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ color: '#5F6368', mb: 2.5, minHeight: 40, fontSize: '0.85rem', lineHeight: 1.5 }}>
                                {tier.description || `Comprehensive ${tier.name} package.`}
                              </Typography>
                              
                              {/* Removed redundant Coverage Limit row */}
                              
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

                  {/* Removed Full Product Benefits & Limits block as per user request */}
                </Box>
              )}

              {activeStep === 2 && (
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

              {activeStep === 3 && (
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
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px solid #E8EAED' }}>
                              <Typography variant="body2" sx={{ color: '#5F6368' }}>Premium Amount</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F9D58' }}>
                                UGX {Number(formData.premium || activeTemplate?.base_premium || product?.base_premium || 0).toLocaleString()}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>

                        {/* Months Selector for Monthly Products */}
                        {(activeTemplate?.pricing_frequency?.toLowerCase() === 'monthly' || activeTemplate?.pricing_frequency?.toLowerCase() === 'month') && null}
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
                               {selectedTier?.benefits?.map((benefit, bi) => (
                                 <Box key={bi} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                   <SuccessIcon sx={{ color: '#0F9D58', fontSize: 16, mt: 0.2 }} />
                                   <Typography variant="caption" sx={{ fontWeight: 600, color: '#3C4043', lineHeight: 1.4 }}>
                                     {benefit}
                                   </Typography>
                                 </Box>
                               ))}
                               {(!selectedTier?.benefits || selectedTier.benefits.length === 0) && <Typography variant="caption" sx={{ color: '#BDC1C6', fontStyle: 'italic' }}>Standard {selectedTier?.name || 'tier'} coverage benefits apply.</Typography>}
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
                      onClick={() => setActiveStep(2)}
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
                      onClick={() => setActiveStep(4)}
                      sx={{ borderRadius: 2, px: 6, py: 1.5, bgcolor: '#1A73E8', textTransform: 'none', fontWeight: 600, boxShadow: '0 4px 14px rgba(26,115,232,0.3)', '&:hover': { bgcolor: '#1765CC', boxShadow: '0 6px 20px rgba(26,115,232,0.4)' } }}
                    >
                      Proceed to Checkout
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Navigation Buttons are now at the very bottom of the view */}

              {activeStep === 4 && paymentStatus === 'success' && (
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
                    onClick={() => navigate('/admin/dashboard')}
                    sx={{ borderRadius: 3, px: 6, bgcolor: '#1A73E8', textTransform: 'none', fontWeight: 600 }}
                  >
                    Go to Dashboard
                  </Button>
                </Box>
              )}

              {activeStep === 4 && paymentStatus === 'failed' && (
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
                      onClick={() => navigate('/admin/dashboard')}
                      sx={{ borderRadius: 3, px: 4, borderColor: '#DADCE0', color: '#70757A', textTransform: 'none', fontWeight: 600 }}
                    >
                      Exit to Dashboard (Saved as Draft)
                    </Button>
                  </Stack>
                </Box>
              )}

              {activeStep === 4 && paymentStatus === 'processing' && (
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

              {activeStep === 4 && paymentStatus === 'idle' && (
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
                        {/* Removed installments row */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2, borderTop: '1px dashed #DADCE0' }}>
                          <Typography variant="body1" sx={{ color: '#202124', fontWeight: 600 }}>Total Due Now</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: '#1A73E8' }}>
                            UGX {Number(formData.premium || activeTemplate?.base_premium || product?.base_premium || 0).toLocaleString()}
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
              {!(activeStep === 3 || (activeStep === 4 && paymentStatus !== 'idle')) && (
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 4, pt: 3, borderTop: '1px solid #E8EAED' }}>
                  <Box>
                    {activeStep > 1 && activeStep < 4 && (
                      <Button 
                        variant="outlined"
                        onClick={() => setActiveStep(activeStep - 1)}
                        sx={{ borderRadius: 3, px: 4, py: 1.5, borderColor: '#DADCE0', color: '#5F6368', textTransform: 'none', fontWeight: 600 }}
                      >
                        Back
                      </Button>
                    )}
                    {activeStep === 4 && (
                      <Button 
                        variant="text"
                        onClick={() => setActiveStep(3)}
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
                    {isCreatingQuote ? <CircularProgress size={20} color="inherit" /> : activeStep === 2 ? 'Generate Quote' : activeStep === 4 ? 'Complete Payment' : 'Continue'}
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


      {/* FULL REGISTRATION DRAWER */}
      <Drawer 
        anchor="right" 
        open={isRegisteringClient} 
        onClose={() => setIsRegisteringClient(false)} 
        PaperProps={{ sx: { width: 600, borderRadius: 0 } }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#fff' }}>
          <Box sx={{ p: 3, borderBottom: '1px solid #E8EAED', bgcolor: '#F8F9FA' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#202124' }}>Register New Client</Typography>
              <IconButton onClick={() => setIsRegisteringClient(false)} size="small"><ArrowIcon sx={{ transform: 'rotate(180deg)' }} /></IconButton>
            </Box>
            <Stepper activeStep={registrationActiveStep} alternativeLabel>
              <Step><StepLabel>Basic Info</StepLabel></Step>
              <Step><StepLabel>KYC & Documents</StepLabel></Step>
            </Stepper>
            {registerClientMutation.isPending && <LinearProgress sx={{ mt: 2 }} />}
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', p: 4 }}>
            {registrationError && <Alert severity="error" sx={{ mb: 3, borderRadius: 0 }}>{registrationError}</Alert>}

            {registrationActiveStep === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField label="First Name" required fullWidth value={registrationForm.first_name} onChange={(e) => setRegistrationForm({ ...registrationForm, first_name: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Last Name" required fullWidth value={registrationForm.last_name} onChange={(e) => setRegistrationForm({ ...registrationForm, last_name: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Email Address" type="email" required fullWidth value={registrationForm.email} onChange={(e) => setRegistrationForm({ ...registrationForm, email: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Phone Number" required fullWidth value={registrationForm.phone} onChange={(e) => setRegistrationForm({ ...registrationForm, phone: e.target.value })} />
                </Grid>
              </Grid>
            )}

            {registrationActiveStep === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField label="National ID (NIN)" required fullWidth value={registrationForm.nin} onChange={(e) => setRegistrationForm({ ...registrationForm, nin: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Tax ID (TIN)" fullWidth value={registrationForm.tin} onChange={(e) => setRegistrationForm({ ...registrationForm, tin: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Physical Address" required fullWidth multiline rows={2} value={registrationForm.address} onChange={(e) => setRegistrationForm({ ...registrationForm, address: e.target.value })} />
                </Grid>

                {/* National ID */}
                <Grid item xs={12}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#5F6368', mb: 1 }}>National ID Card</Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Box
                        sx={{ border: '2px dashed #E8EAED', p: 2, textAlign: 'center', cursor: 'pointer', bgcolor: uploadedDocs.national_id_front ? '#F0FDF4' : '#FAFAFA' }}
                        onClick={() => document.getElementById('enroll_id_front').click()}
                      >
                        {uploadedDocs.national_id_front ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <img src={uploadedDocs.national_id_front} alt="Front" style={{ width: '100%', maxHeight: '80px', objectFit: 'contain', marginBottom: '8px' }} />
                            <Typography sx={{ fontSize: '0.75rem', color: '#16A34A', mt: 1 }}>Front Uploaded</Typography>
                            <Button size="small" onClick={(e) => { e.stopPropagation(); handleFileRemove('national_id_front') }}>Remove</Button>
                          </Box>
                        ) : (
                          <Box><DocIcon sx={{ fontSize: 32, color: '#9AA0A6' }} /><Typography sx={{ fontSize: '0.75rem', color: '#5F6368', mt: 1 }}>Upload Front</Typography></Box>
                        )}
                        <input type="file" id="enroll_id_front" hidden accept="image/*" onChange={(e) => handleFileUpload('national_id_front', e.target.files[0])} />
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box
                        sx={{ border: '2px dashed #E8EAED', p: 2, textAlign: 'center', cursor: 'pointer', bgcolor: uploadedDocs.national_id_back ? '#F0FDF4' : '#FAFAFA' }}
                        onClick={() => document.getElementById('enroll_id_back').click()}
                      >
                        {uploadedDocs.national_id_back ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <img src={uploadedDocs.national_id_back} alt="Back" style={{ width: '100%', maxHeight: '80px', objectFit: 'contain', marginBottom: '8px' }} />
                            <Typography sx={{ fontSize: '0.75rem', color: '#16A34A', mt: 1 }}>Back Uploaded</Typography>
                            <Button size="small" onClick={(e) => { e.stopPropagation(); handleFileRemove('national_id_back') }}>Remove</Button>
                          </Box>
                        ) : (
                          <Box><DocIcon sx={{ fontSize: 32, color: '#9AA0A6' }} /><Typography sx={{ fontSize: '0.75rem', color: '#5F6368', mt: 1 }}>Upload Back</Typography></Box>
                        )}
                        <input type="file" id="enroll_id_back" hidden accept="image/*" onChange={(e) => handleFileUpload('national_id_back', e.target.files[0])} />
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Selfie */}
                <Grid item xs={12}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#5F6368', mb: 1 }}>Selfie (Photo of Face)</Typography>
                  <Box
                    sx={{ border: '2px dashed #E8EAED', p: 2, textAlign: 'center', cursor: 'pointer', bgcolor: uploadedDocs.selfie ? '#F0FDF4' : '#FAFAFA' }}
                    onClick={() => document.getElementById('enroll_selfie').click()}
                  >
                    {uploadedDocs.selfie ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Avatar src={uploadedDocs.selfie} sx={{ width: 80, height: 80, mb: 1, border: '2px solid #16A34A' }} />
                        <Typography sx={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 600 }}>Selfie Uploaded</Typography>
                        <Button size="small" onClick={(e) => { e.stopPropagation(); handleFileRemove('selfie') }}>Remove</Button>
                      </Box>
                    ) : (
                      <Box><PersonAddIcon sx={{ fontSize: 32, color: '#9AA0A6' }} /><Typography sx={{ fontSize: '0.75rem', color: '#5F6368', mt: 1 }}>Upload Selfie</Typography></Box>
                    )}
                    <input type="file" id="enroll_selfie" hidden accept="image/*" onChange={(e) => handleFileUpload('selfie', e.target.files[0])} />
                  </Box>
                </Grid>
              </Grid>
            )}

            <Box sx={{ mt: 4, p: 2, bgcolor: '#F8F9FA', borderRadius: 0, border: '1px solid #E8EAED' }}>
               <Typography sx={{ fontSize: '0.8rem', color: '#5F6368', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VerifiedIcon sx={{ fontSize: 16, color: '#1A73E8' }} />
                  Registration will auto-verify the client so they can immediately proceed with the enrollment.
               </Typography>
            </Box>
          </Box>

          <Box sx={{ p: 2, borderTop: '1px solid #E8EAED', display: 'flex', justifyContent: 'space-between', bgcolor: '#fff' }}>
            <Button disabled={registrationActiveStep === 0 || registerClientMutation.isPending} onClick={() => setRegistrationActiveStep(prev => prev - 1)} sx={{ fontWeight: 700 }}>Back</Button>
            {registrationActiveStep === 0 ? (
              <Button variant="contained" onClick={() => setRegistrationActiveStep(prev => prev + 1)} sx={{ borderRadius: 0, fontWeight: 700 }}>Next Step</Button>
            ) : (
              <Button variant="contained" color="primary" onClick={handleRegisterClient} disabled={registerClientMutation.isPending} sx={{ borderRadius: 0, fontWeight: 700 }}>Confirm Registration</Button>
            )}
          </Box>
        </Box>
      </Drawer>
    </Box>
  )
}
