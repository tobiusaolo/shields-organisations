import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productAPI, formAPI, commissionAPI } from '../services/api'
import { formatCurrency } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'
import Swal from 'sweetalert2'
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Dialog,
  TextField,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Paper,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Drawer,
  Tabs,
  Tab,
  CircularProgress, LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import {
  Add as AddIcon,
  Inventory as ProductIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ActiveIcon,
  LocalOffer as CategoryIcon,
  Description as DocsIcon,
  AttachMoney as PremiumIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  PlaylistAdd as AddFormIcon,
  DynamicForm as FormIcon,
  Visibility as ViewIcon,
  TextFields as TextIcon,
  Numbers as NumberIcon,
  CalendarMonth as DateIcon,
  List as SelectIcon,
  ToggleOn as ToggleIcon,
  Percent as PercentIcon,
  Groups as CommissionIcon,
  WorkspacePremium as TierIcon,
  Functions as FormulaIcon,
  EmojiEvents as BronzeIcon,
  TableChart as TableIcon,
  ViewHeadline as SectionIcon,
  Info as InfoIcon,
  CheckCircleOutline as CheckIcon,
  ContentCopy as DuplicateIcon,
  ShoppingCart as PurchaseIcon,
} from '@mui/icons-material'
const CATEGORIES = [
  { value: 'life', label: 'Life Insurance' },
  { value: 'health', label: 'Health Insurance' },
  { value: 'motor', label: 'Motor Insurance' },
  { value: 'property', label: 'Property Insurance' },
  { value: 'travel', label: 'Travel Insurance' },
  { value: 'accident', label: 'Personal Accident' },
  { value: 'agriculture', label: 'Agriculture / Crop' },
  { value: 'other', label: 'Other' },
]

const SYSTEM_ROLES = [
  { value: 'agent', label: 'Agent' },
  { value: 'broker', label: 'Broker' },
  { value: 'underwriter', label: 'Underwriter' },
  { value: 'claims_officer', label: 'Claims Officer' },
  { value: 'organization_admin', label: 'Organization Admin' },
]

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text / Paragraph' },
  { value: 'number', label: 'Number / Currency' },
  { value: 'date', label: 'Date Picker' },
  { value: 'select', label: 'Dropdown Selection' },
  { value: 'checkbox', label: 'Yes / No Toggle' },
  { value: 'section', label: '── Section Header ──' },
  { value: 'table', label: 'Data Table (Rows)' },
]

const TIER_PRESETS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']

const STEP_META = [
  { label: 'Basic Info', color: '#1A73E8', desc: 'Product identity & category' },
  { label: 'Pricing', color: '#0F9D58', desc: 'Classes or dynamic formula' },
  { label: 'Commissions', color: '#F4B400', desc: 'Staff payout allocation' },
  { label: 'Forms', color: '#9C27B0', desc: 'Compliance & data collection' },
  { label: 'Review', color: '#E91E63', desc: 'Final check before deploy' },
]

const STEPS = ['Basic Info', 'Pricing & Coverage', 'Commissions', 'Compliance Forms', 'Review']

export default function Products() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const orgId = user?.organization_id
  const queryClient = useQueryClient()
  
  // UI State
  const [wizardOpen, setWizardOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [inspectorTab, setInspectorTab] = useState(0)
  const [activeStep, setActiveStep] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [editProductId, setEditProductId] = useState(null)
  const [isHierarchyLoading, setIsHierarchyLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'life',
    description: '',
    image_base64: '',
    pricingModel: 'classes', // 'classes' or 'formula'
    terms: '',
    basePremium: 0,
    formula: 'amount * 0.05',
    pricingTiers: [
      { name: 'Bronze', description: 'Basic Coverage', coverage_amount: 1000000, premium: 10000, benefits: ['Standard support'] }
    ],
    duration_years: '1',
    pricing_frequency: 'annual',
    commissions: [
      { role_code: 'agent', commission_type: 'percentage', commission_value: 10 }
    ],
    documents: [],
    dynamicForms: []
  })

  // Queries
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', orgId],
    queryFn: () => productAPI.getProducts(orgId).then(res => res.data.items || []),
    enabled: !!orgId,
  })

  const { data: hierarchy = [], isLoading: isInspectorLoading } = useQuery({
    queryKey: ['product-hierarchy', selectedProductId],
    queryFn: async () => {
      if (!selectedProductId) return null
      const templatesRes = await productAPI.getProductTemplates(orgId, selectedProductId)
      const templates = templatesRes.data.items || []
      
      const details = await Promise.all(templates.map(async (tpl) => {
        const [tiersRes, commsRes, formsRes] = await Promise.all([
          productAPI.getPricingTiers(orgId, tpl.id),
          commissionAPI.getCommissionStructures(orgId, tpl.id),
          formAPI.getTemplateForms(orgId, tpl.id)
        ])
        return {
          template: tpl,
          tiers: tiersRes.data.items || [],
          commissions: commsRes.data.items || [],
          forms: formsRes.data || []
        }
      }))
      return details
    },
    enabled: !!selectedProductId && inspectorOpen
  })

  const deleteProductMutation = useMutation({
    mutationFn: (productId) => productAPI.deleteProduct(orgId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries(['products', orgId])
      Swal.fire('Deleted!', 'Product deleted successfully.', 'success')
    },
    onError: (err) => {
      Swal.fire('Error!', `Delete failed: ${err.response?.data?.detail || 'Unknown error'}`, 'error')
    }
  })

  // Mutations
  const createProductMutation = useMutation({
    mutationFn: async (data) => {
      let productId = editProductId
      let templateId = null

      if (isEditing) {
        // 1. Update Core Product
        await productAPI.updateProduct(orgId, productId, {
          name: data.name,
          category: data.category,
          description: data.description,
          image_base64: data.image_base64,
          max_coverage: 0,
          base_premium: parseFloat(data.basePremium),
          duration_years: data.duration_years ? parseInt(data.duration_years) : null,
          documents: data.documents
        })

        // 2. Sync Template (Assume first template for simplicity)
        const templatesRes = await productAPI.getProductTemplates(orgId, productId)
        const template = (templatesRes.data.items || [])[0]
        if (template) {
          templateId = template.id
          await productAPI.updateProductTemplate(orgId, templateId, {
            name: `${data.name} Standard Template`,
            description: data.description || '',
            terms_and_conditions: data.terms || 'Standard terms apply',
            subscription_forms: data.documents || [],
            coverage_limits: { min: 0, max: 0 },
            pricing_frequency: data.pricing_frequency
          })

          // 3. Sync Children (Delete First)
          const existingTiersRes = await productAPI.getPricingTiers(orgId, templateId)
          const existingTiers = existingTiersRes.data.items || []
          for (const t of existingTiers) await productAPI.deletePricingTier(orgId, t.id)
          
          await commissionAPI.deleteTemplateCommissions(orgId, templateId)
          await formAPI.deleteTemplateForms(orgId, templateId)
        }
      } else {
        // 1. Create Product
        const productRes = await productAPI.createProduct(orgId, {
          name: data.name,
          category: data.category,
          description: data.description,
          image_base64: data.image_base64,
          is_active: true,
          max_coverage: 0,
          base_premium: parseFloat(data.basePremium),
          duration_years: data.duration_years ? parseInt(data.duration_years) : null,
          documents: data.documents
        })
        productId = productRes.data.id

        // 2. Create Template
        const templateRes = await productAPI.createProductTemplate(orgId, {
          product_id: productId,
          name: `${data.name} Standard Template`,
          description: data.description || '',
          terms_and_conditions: data.terms || 'Standard terms apply',
          subscription_forms: data.documents || [],
          coverage_limits: { min: 0, max: 0 },
          pricing_frequency: data.pricing_frequency,
          effective_from: new Date().toISOString().split('T')[0]
        })
        templateId = templateRes.data.id
      }

      // 3. Pricing (Shared Re-creation logic)
      if (data.pricingModel === 'classes') {
        for (const tier of data.pricingTiers) {
          await productAPI.createPricingTier(orgId, {
            product_template_id: templateId,
            name: tier.name,
            description: tier.description,
            coverage_amount: tier.coverage_amount,
            premium: tier.premium,
            benefits: tier.benefits,
            is_active: true
          })
        }
      } else {
        await productAPI.createCalculationTemplate(orgId, {
          product_template_id: templateId,
          formula: data.formula,
          base_premium: data.basePremium,
          min_premium: 0,
          max_premium: 10000000,
          effective_from: new Date().toISOString().split('T')[0]
        })
      }

      // 4. Commissions (Shared Re-creation logic)
      for (const comm of data.commissions) {
        await commissionAPI.createCommissionStructure(orgId, {
          product_template_id: templateId,
          role_code: comm.role_code,
          commission_type: comm.commission_type,
          commission_value: parseFloat(comm.commission_value),
          is_active: true
        })
      }

      // 5. Dynamic Forms (Shared Re-creation logic)
      for (const form of data.dynamicForms) {
        await formAPI.createForm(orgId, {
          product_template_id: templateId,
          name: form.name,
          description: form.description,
          is_required: form.is_required,
          order: 0,
          fields: form.fields.map((f, idx) => ({
            label: f.label,
            field_type: f.type,
            field_key: f.name || `field_${idx}`,
            help_text: f.help_text,
            is_required: f.required,
            order: idx,
            columns: f.columns,
            min_rows: f.min_rows,
            max_rows: f.max_rows,
            prefill_rows: f.prefill_rows
          }))
        })
      }
      return { id: productId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products', orgId])
      setWizardOpen(false)
      setIsEditing(false)
      setEditProductId(null)
      setShowSuccess(true)
    },
    onError: (err) => {
      console.error('Finalize failed:', err.response?.data || err)
      alert(`Build Failed: ${err.response?.data?.detail || 'Verify your configuration and try again.'}`)
    }
  })

  // Handlers
  const handleOpenWizard = () => {
    setActiveStep(0)
    setIsEditing(false)
    setEditProductId(null)
    setFormData({
      name: '',
      category: 'life',
      description: '',
      image_base64: '',
      pricingModel: 'classes',
      terms: '',
      basePremium: 10000,
      formula: 'amount * 0.05',
      pricingTiers: [
        { name: 'Bronze', description: 'Basic Coverage', coverage_amount: 1000000, premium: 5000, benefits: ['Standard support'] }
      ],
      duration_years: '1',
    pricing_frequency: 'monthly',
      commissions: [
        { role_code: 'agent', commission_type: 'percentage', commission_value: 10 }
      ],
      documents: [],
      dynamicForms: []
    })
    setWizardOpen(true)
  }

  const handleEditProduct = async (product) => {
    setIsHierarchyLoading(true)
    try {
      setEditProductId(product.id)
      setIsEditing(true)
      
      // Fetch full hierarchy
      const templatesRes = await productAPI.getProductTemplates(orgId, product.id)
      const template = (templatesRes.data.items || [])[0]
      
      if (template) {
        const [tiersRes, commsRes, formsRes] = await Promise.all([
          productAPI.getPricingTiers(orgId, template.id),
          commissionAPI.getCommissionStructures(orgId, template.id),
          formAPI.getTemplateForms(orgId, template.id)
        ])

        const tiers = tiersRes.data.items || []
        const comms = commsRes.data.items || []
        const forms = formsRes.data || []

        setFormData({
          name: product.name,
          category: product.category,
          description: product.description,
          image_base64: product.image_base64,
          pricingModel: tiers.length > 0 ? 'classes' : 'formula',
          terms: template.terms_and_conditions,
          basePremium: product.base_premium,
          formula: 'amount * 0.05', // Default if not found
          pricingTiers: tiers.map(t => ({
            name: t.name,
            description: t.description,
            coverage_amount: t.coverage_amount,
            premium: t.premium,
            benefits: t.benefits
          })),
          duration_years: product.duration_years?.toString() || '1',
          commissions: comms.map(c => ({
            role_code: c.role_code,
            commission_type: c.commission_type,
            commission_value: c.commission_value
          })),
          pricing_frequency: template.pricing_frequency || 'annual',
          documents: template.subscription_forms || [],
          dynamicForms: forms.map(f => ({
            name: f.name,
            description: f.description,
            is_required: f.is_required,
            fields: f.fields.map(fld => ({
              label: fld.label,
              type: fld.field_type,
              name: fld.field_key,
              help_text: fld.help_text,
              required: fld.is_required,
              columns: fld.columns,
              min_rows: fld.min_rows,
              max_rows: fld.max_rows
            }))
          }))
        })
        setActiveStep(0)
        setWizardOpen(true)
      }
    } catch (err) {
      alert('Failed to load product details for editing.')
    } finally {
      setIsHierarchyLoading(false)
    }
  }

  const handleDeleteProduct = (productId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You want to delete this product? This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteProductMutation.mutate(productId)
      }
    })
  }

  const handleNext = () => setActiveStep(prev => prev + 1)
  const handleBack = () => setActiveStep(prev => prev - 1)

  const handleAddField = (formIndex) => {
    const updated = [...formData.dynamicForms]
    updated[formIndex].fields.push({ label: '', type: 'text', required: false, help_text: '', columns: [], min_rows: 1, max_rows: 5 })
    setFormData({ ...formData, dynamicForms: updated })
  }

  // Render Helpers
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Avatar 
                  src={formData.image_base64 || ''} 
                  variant="rounded" 
                  sx={{ width: 100, height: 100, bgcolor: '#F1F3F4', border: '1px dashed #BDC1C6' }}
                >
                  {!formData.image_base64 && <ProductIcon sx={{ color: '#9AA0A6', fontSize: 40 }} />}
                </Avatar>
                <Button variant="outlined" size="small" component="label" sx={{ textTransform: 'none', borderRadius: 0}}>
                  Upload Logo
                  <input type="file" hidden accept="image/*" onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setFormData({ ...formData, image_base64: reader.result });
                      reader.readAsDataURL(file);
                    }
                  }} />
                </Button>
                {formData.image_base64 && (
                  <Button size="small" color="error" onClick={() => setFormData({ ...formData, image_base64: '' })} sx={{ textTransform: 'none' }}>Remove</Button>
                )}
              </Box>
              
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField label="Product Name" variant="outlined" fullWidth value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Comprehensive Motor Insurance" />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField select label="Category" fullWidth value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                      {CATEGORIES.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField label="Duration (Years)" type="number" fullWidth value={formData.duration_years} onChange={(e) => setFormData({ ...formData, duration_years: e.target.value })} InputProps={{ inputProps: { min: 1, max: 100 } }} />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField select label="Payment Frequency" fullWidth value={formData.pricing_frequency} onChange={(e) => setFormData({ ...formData, pricing_frequency: e.target.value })}>
                      <MenuItem value="monthly">Monthly</MenuItem>
                      <MenuItem value="quarterly">Quarterly</MenuItem>
                      <MenuItem value="bi-annually">Bi-Annually</MenuItem>
                      <MenuItem value="annual">Annually</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField label="Base Premium (UGX)" type="number" fullWidth value={formData.basePremium} onChange={(e) => setFormData({ ...formData, basePremium: parseFloat(e.target.value) || 0 })} InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: '#5F6368', fontSize: 13 }}>UGX</Typography> }} />
                  </Grid>
                </Grid>
              </Box>
            </Box>
            
            <TextField label="Description" fullWidth multiline rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the main benefits and purpose of this product..." />
            
            <TextField label="Terms and Conditions" fullWidth multiline rows={4} value={formData.terms} onChange={(e) => setFormData({ ...formData, terms: e.target.value })} placeholder="Enter the legal terms and conditions for this product..." />
          </Box>
        )
      case 1: {
        const upTier = (idx, key, val) => { const t = [...formData.pricingTiers]; t[idx][key] = val; setFormData({ ...formData, pricingTiers: t }) }
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {[{v:'classes', label:'Pricing Classes', sub:'Fixed tiers (Bronze, Gold…)', icon:<TierIcon/>},{v:'formula',label:'Dynamic Formula',sub:'Calculated at quote time',icon:<FormulaIcon/>}].map(opt => (
                <Paper key={opt.v} onClick={() => setFormData({...formData, pricingModel: opt.v})} sx={{ flex:1, p:2.5, cursor:'pointer', border: formData.pricingModel===opt.v ? '2px solid #1A237E':'2px solid #E8EAED', borderRadius: 0, transition:'border-color .15s', bgcolor: formData.pricingModel===opt.v?'#F0F4FF':'#fff' }}>
                  <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb:0.5 }}>
                    <Box sx={{ color: formData.pricingModel===opt.v?'#1A73E8':'#BDC1C6' }}>{opt.icon}</Box>
                    <Typography sx={{ fontWeight:700 }}>{opt.label}</Typography>
                    {formData.pricingModel===opt.v && <CheckIcon sx={{ ml:'auto', color:'#1A73E8', fontSize:20 }}/>}
                  </Box>
                  <Typography variant="caption" sx={{ color:'#5F6368' }}>{opt.sub}</Typography>
                </Paper>
              ))}
            </Box>
            {formData.pricingModel === 'classes' ? (
              <Box>
                <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:2 }}>
                  <Typography sx={{ fontWeight:700, color:'#202124' }}>Coverage Tiers ({formData.pricingTiers.length})</Typography>
                  <Button size="small" variant="outlined" startIcon={<AddIcon/>} onClick={() => setFormData({...formData, pricingTiers:[...formData.pricingTiers, {name: TIER_PRESETS[formData.pricingTiers.length] || 'New Tier', description:'', coverage_amount:0, premium:0, benefits:['']}]})}>Add Tier</Button>
                </Box>
                {formData.pricingTiers.map((tier, idx) => {
                  const colors = ['#CD7F32','#9E9E9E','#FFD700','#E5E4E2','#A8D8EA']
                  const tierColor = colors[idx % colors.length]
                  return (
                  <Paper key={idx} sx={{ mb:1.5, borderRadius: 0, overflow:'hidden', border:'1px solid #E0E0E0' }}>
                      <Box sx={{ p:1.5, bgcolor: '#37474F', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <TextField variant="standard" value={tier.name} placeholder="Tier Name" InputProps={{disableUnderline:true, sx:{color:'#fff', fontWeight:800, fontSize:16}}} onChange={(e) => upTier(idx,'name',e.target.value)} sx={{ flex:1 }}/>
                        <IconButton size="small" onClick={() => { const t=[...formData.pricingTiers]; t.splice(idx,1); setFormData({...formData,pricingTiers:t}) }} sx={{ color:'rgba(255,255,255,.8)' }}><DeleteIcon fontSize="small"/></IconButton>
                      </Box>
                      <Box sx={{ p:2, display:'flex', flexDirection:'column', gap:2 }}>
                        <TextField label="Description" size="small" fullWidth value={tier.description} onChange={e => upTier(idx,'description',e.target.value)} placeholder="What does this tier cover?" />
                        <Box sx={{ display:'flex', gap:2 }}>
                          <TextField label="Premium / Coverage Amount" size="small" fullWidth type="number" value={tier.coverage_amount} onChange={e => upTier(idx,'coverage_amount',parseFloat(e.target.value)||0)} InputProps={{ startAdornment:<Typography sx={{mr:1,color:'#5F6368',fontSize:13}}>UGX</Typography> }}/>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight:700, color:'#5F6368', mb:0.5, display:'block' }}>BENEFITS</Typography>
                          {(tier.benefits||['']).map((b,bi) => (
                            <Box key={bi} sx={{ display:'flex', gap:1, mb:0.75 }}>
                              <TextField size="small" fullWidth value={b} placeholder={`Benefit ${bi+1}`} onChange={e => { const nb=[...tier.benefits]; nb[bi]=e.target.value; upTier(idx,'benefits',nb) }}/>
                              <IconButton size="small" color="error" onClick={() => { const nb=tier.benefits.filter((_,i)=>i!==bi); upTier(idx,'benefits',nb.length?nb:['']) }}><DeleteIcon fontSize="small"/></IconButton>
                            </Box>
                          ))}
                          <Button size="small" onClick={() => upTier(idx,'benefits',[...(tier.benefits||[]),''])}>+ Add Benefit</Button>
                        </Box>
                      </Box>
                    </Paper>
                  )
                })}
              </Box>
            ) : (
              <Box sx={{ display:'flex', flexDirection:'column', gap:2 }}>
                <Alert severity="info">Write a formula using variables like <strong>sum_insured</strong>, <strong>age</strong>, <strong>duration</strong>. The system evaluates it at quote time.</Alert>
                <TextField label="Pricing Formula" fullWidth multiline rows={3} value={formData.formula} onChange={e => setFormData({...formData, formula:e.target.value})} placeholder="e.g.  sum_insured * 0.05 * (age / 30)" sx={{ fontFamily:'monospace' }}/>
                <TextField label="Premium (UGX)" type="number" fullWidth value={formData.basePremium} onChange={e => setFormData({...formData, basePremium:parseFloat(e.target.value)||0})} />
              </Box>
            )}
          </Box>
        )
      }
      case 2: {
        const upComm = (idx, key, val) => { const c=[...formData.commissions]; c[idx][key]=val; setFormData({...formData, commissions:c}) }
        return (
          <Box sx={{ display:'flex', flexDirection:'column', gap:2, pt:1 }}>
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <Box>
                <Typography sx={{ fontWeight:700 }}>Commission Allocation</Typography>
                <Typography variant="caption" sx={{ color:'#5F6368' }}>Define payout rates for each staff role when a policy is sold</Typography>
              </Box>
              <Button size="small" variant="outlined" startIcon={<AddIcon/>} onClick={() => setFormData({...formData, commissions:[...formData.commissions, {role_code:'agent', commission_type:'percentage', commission_value:5}]})}>Add Role</Button>
            </Box>
            {formData.commissions.length === 0 && (
              <Alert severity="warning">No commission rules defined. Add at least one role to configure payouts.</Alert>
            )}
            {formData.commissions.map((comm, idx) => (
              <Paper key={idx} sx={{ p:2, borderRadius: 0, border:'1px solid #E0E0E0' }}>
                <Box sx={{ display:'flex', gap:2, alignItems:'center' }}>
                  <TextField select label="Staff Role" size="small" sx={{ flex:1 }} value={comm.role_code} onChange={e => upComm(idx,'role_code',e.target.value)}>
                    {SYSTEM_ROLES.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
                  </TextField>
                  <TextField select label="Type" size="small" sx={{ width:160 }} value={comm.commission_type} onChange={e => upComm(idx,'commission_type',e.target.value)}>
                    <MenuItem value="percentage"><Box sx={{ display:'flex', alignItems:'center', gap:1 }}><PercentIcon fontSize="small"/> Percentage</Box></MenuItem>
                    <MenuItem value="flat"><Box sx={{ display:'flex', alignItems:'center', gap:1 }}><PremiumIcon fontSize="small"/> Flat Amount</Box></MenuItem>
                  </TextField>
                  <TextField label={comm.commission_type==='percentage'?'Rate (%)':'Amount (UGX)'} size="small" type="number" sx={{ width:140 }} value={comm.commission_value}
                    onChange={e => upComm(idx,'commission_value',parseFloat(e.target.value)||0)}
                    InputProps={{ endAdornment: <Typography sx={{ color:'#5F6368', ml:1, fontSize:13 }}>{comm.commission_type==='percentage'?'%':'UGX'}</Typography> }}
                  />
                  <IconButton color="error" size="small" onClick={() => { const c=formData.commissions.filter((_,i)=>i!==idx); setFormData({...formData, commissions:c}) }}><DeleteIcon/></IconButton>
                </Box>
              </Paper>
            ))}
          </Box>
        )
      }
      case 3: {
        const upForm = (fi, key, val) => { const f=[...formData.dynamicForms]; f[fi].key=val; f[fi][key]=val; setFormData({...formData, dynamicForms:f}) }
        const upField = (fi, fli, key, val) => { const f=[...formData.dynamicForms]; f[fi].fields[fli][key]=val; setFormData({...formData, dynamicForms:f}) }
        const upCol = (fi, fli, ci, key, val) => { const f=[...formData.dynamicForms]; f[fi].fields[fli].columns[ci][key]=val; setFormData({...formData, dynamicForms:f}) }
        return (
          <Box sx={{ display:'flex', flexDirection:'column', gap:2, pt:1 }}>
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', p:2, bgcolor:'#F5F5F5', borderRadius: 0}}>
              <Box>
                <Typography sx={{ fontWeight:700, color:'#212121' }}>Compliance Form Builder</Typography>
                <Typography variant="caption" sx={{ color:'#757575' }}>Add unlimited forms — clients fill these during enrollment</Typography>
              </Box>
              <Button variant="contained" size="small" startIcon={<AddFormIcon/>} sx={{ bgcolor:'#424242','&:hover':{bgcolor:'#212121'} }}
                onClick={() => setFormData({...formData, dynamicForms:[...formData.dynamicForms, {name:'', description:'', is_required:true, fields:[]}]})}>
                New Form
              </Button>
            </Box>
            {formData.dynamicForms.length===0 && <Alert severity="info">No forms yet. Click "New Form" to start building your compliance questionnaire.</Alert>}
            {formData.dynamicForms.map((form, fi) => (
              <Accordion key={fi} defaultExpanded sx={{ border:'1px solid #BDBDBD', borderRadius: 0, '&:before':{display:'none'}, mb:1, overflow:'hidden' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon/>} sx={{ bgcolor:'#FAFAFA', borderBottom:'1px solid #E0E0E0' }}>
                  <Box sx={{ display:'flex', alignItems:'center', gap:2, flex:1 }}>
                    <FormIcon sx={{ color:'#546E7A' }}/>
                    <Typography sx={{ fontWeight:600, color:'#212121' }}>{form.name||`Form ${fi+1}`}</Typography>
                    <Chip label={`${form.fields.length} fields`} size="small" sx={{ ml:1 }}/>
                    <Chip label={form.is_required?'Required':'Optional'} size="small" color={form.is_required?'error':'default'} sx={{ ml:0.5 }}/>
                    <Box sx={{ flex:1 }}/>
                    <IconButton size="small" color="error" onClick={e=>{e.stopPropagation(); const f=formData.dynamicForms.filter((_,i)=>i!==fi); setFormData({...formData, dynamicForms:f})}}>
                      <DeleteIcon fontSize="small"/>
                    </IconButton>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p:2 }}>
                  <Box sx={{ display:'flex', flexDirection:'column', gap:2 }}>
                    <Box sx={{ display:'flex', gap:2 }}>
                      <TextField label="Form Name" size="small" fullWidth value={form.name} onChange={e=>upForm(fi,'name',e.target.value)} placeholder="e.g. Medical History, Personal Details"/>
                      <TextField label="Instructions" size="small" fullWidth value={form.description} onChange={e=>upForm(fi,'description',e.target.value)}/>
                      <TextField select label="Required?" size="small" sx={{ width:130 }} value={form.is_required} onChange={e=>upForm(fi,'is_required',e.target.value==='true')}>
                        <MenuItem value="true">Required</MenuItem>
                        <MenuItem value="false">Optional</MenuItem>
                      </TextField>
                    </Box>
                    <Divider/>
                    <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <Typography variant="caption" sx={{ fontWeight:800, color:'#5F6368', letterSpacing:1 }}>FORM FIELDS</Typography>
                      <Button size="small" startIcon={<AddIcon/>} onClick={()=>{const f=[...formData.dynamicForms]; f[fi].fields.push({label:'',type:'text',required:true,help_text:'',columns:[],min_rows:2,max_rows:10}); setFormData({...formData,dynamicForms:f})}}>Add Field</Button>
                    </Box>
                    {form.fields.map((field, fli) => (
                      <Paper key={fli} variant="outlined" sx={{ p:1.5, borderRadius: 0, mb:1, bgcolor: field.type==='section'?'#F5F5F5':'#FAFAFA', borderLeft: field.type==='section'?'3px solid #546E7A':undefined }}>
                        <Box sx={{ display:'flex', gap:1.5, alignItems:'flex-start', flexWrap:'wrap' }}>
                          <TextField label={field.type==='section'?'Section Title':'Field Label'} size="small" sx={{ flex:2, minWidth:160 }} value={field.label} onChange={e=>{upField(fi,fli,'label',e.target.value); upField(fi,fli,'name',e.target.value.toLowerCase().replace(/\\s+/g,'_'))}}/>
                          <TextField select label="Type" size="small" sx={{ width:180 }} value={field.type} onChange={e=>{upField(fi,fli,'type',e.target.value); if(e.target.value==='table'&&!field.columns?.length) upField(fi,fli,'columns',[])}}>
                            {FIELD_TYPES.map(t=><MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                          </TextField>
                          {field.type!=='section' && <TextField select label="Required?" size="small" sx={{ width:110 }} value={field.required} onChange={e=>upField(fi,fli,'required',e.target.value==='true')}>
                            <MenuItem value="true">Yes</MenuItem><MenuItem value="false">No</MenuItem>
                          </TextField>}
                          <IconButton size="small" color="error" sx={{ mt:0.5 }} onClick={()=>{const f=[...formData.dynamicForms]; f[fi].fields=f[fi].fields.filter((_,i)=>i!==fli); setFormData({...formData,dynamicForms:f})}}><DeleteIcon fontSize="small"/></IconButton>
                        </Box>
                        {field.type==='table' && (
                          <Box sx={{ mt:1.5, pl:2, borderLeft:'2px solid #E0E0E0' }}>
                            
                            <Box sx={{ mb: 2 }}>
                              <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:2 }}>
                                <Typography variant="caption" sx={{ fontWeight:700, color:'#546E7A', letterSpacing:.5 }}>TABLE COLUMNS</Typography>
                                <Button size="small" variant="outlined" startIcon={<AddIcon/>} onClick={()=>{const f=[...formData.dynamicForms]; f[fi].fields[fli].columns.push({label:'',type:'text', key:''}); setFormData({...formData,dynamicForms:f})}}>Add Column</Button>
                              </Box>
                              
                              {field.columns?.length > 0 && (
                                <Box sx={{ mb: 1, display: 'flex', gap: 1, px: 1, bgcolor: '#ECEFF1', py: 0.5, borderRadius: 0}}>
                                  <Typography variant="caption" sx={{ flex: 3, fontWeight: 800, color: '#455A64' }}>COLUMN LABEL</Typography>
                                  <Typography variant="caption" sx={{ flex: 1.5, fontWeight: 800, color: '#455A64' }}>DATA TYPE</Typography>
                                  <Box sx={{ width: 32 }} />
                                </Box>
                              )}

                              {(field.columns||[]).map((col,ci)=>(
                                <Box key={ci} sx={{ display:'flex', gap:1, mb:1, alignItems: 'center' }}>
                                  <TextField 
                                    placeholder="e.g. Item Name" 
                                    size="small" 
                                    sx={{ flex: 3 }} 
                                    value={col.label} 
                                    onChange={e=>{ 
                                      upCol(fi,fli,ci,'label',e.target.value);
                                      upCol(fi,fli,ci,'key',e.target.value.toLowerCase().replace(/\\s+/g,'_'));
                                    }}
                                  />
                                  <TextField 
                                    select 
                                    size="small" 
                                    sx={{ flex: 1.5 }} 
                                    value={col.type} 
                                    onChange={e=>upCol(fi,fli,ci,'type',e.target.value)}
                                  >
                                    <MenuItem value="text">Text</MenuItem>
                                    <MenuItem value="number">Number</MenuItem>
                                    <MenuItem value="date">Date</MenuItem>
                                  </TextField>
                                  <IconButton size="small" color="error" onClick={()=>{const f=[...formData.dynamicForms]; f[fi].fields[fli].columns=f[fi].fields[fli].columns.filter((_,i)=>i!==ci); setFormData({...formData,dynamicForms:f})}}>
                                    <DeleteIcon fontSize="small"/>
                                  </IconButton>
                                </Box>
                              ))}
                            </Box>

                            <Box sx={{ display:'flex', gap:2, mb:2 }}>
                              <TextField label="Min Rows" size="small" type="number" sx={{ width:110 }} value={field.min_rows} onChange={e=>upField(fi,fli,'min_rows',parseInt(e.target.value)||1)}/>
                              <TextField label="Max Rows" size="small" type="number" sx={{ width:110 }} value={field.max_rows} onChange={e=>upField(fi,fli,'max_rows',parseInt(e.target.value)||10)}/>
                            </Box>

                            <Box sx={{ mt: 2 }}>
                              <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight:700, color:'#546E7A', letterSpacing:.5 }}>PREFILL ROWS (OPTIONAL)</Typography>
                                <Button size="small" disabled={!field.columns?.length} onClick={()=>{ 
                                  const f=[...formData.dynamicForms]; 
                                  const newRow = {}; 
                                  (field.columns || []).forEach(c => { 
                                    const k = c.key || c.label?.toLowerCase().replace(/\\s+/g,'_');
                                    if(k) newRow[k] = ''; 
                                  }); 
                                  if(!f[fi].fields[fli].prefill_rows) f[fi].fields[fli].prefill_rows = []; 
                                  f[fi].fields[fli].prefill_rows.push(newRow); 
                                  setFormData({...formData,dynamicForms:f}); 
                                }}>+ Add Row</Button>
                              </Box>
                              {(field.prefill_rows || []).map((row, ri) => (
                                <Box key={ri} sx={{ display:'flex', gap:1, mb:1, alignItems:'center' }}>
                                  {(field.columns || []).map((col, ci) => (
                                    <TextField 
                                      key={ci} 
                                      placeholder={col.label} 
                                      size="small" 
                                      sx={{ flex: 1 }} 
                                      value={row[col.key || col.label?.toLowerCase().replace(/\\s+/g,'_')] || ''} 
                                      onChange={e => { 
                                        const f=[...formData.dynamicForms]; 
                                        const k = col.key || col.label?.toLowerCase().replace(/\\s+/g,'_');
                                        f[fi].fields[fli].prefill_rows[ri][k] = e.target.value; 
                                        setFormData({...formData, dynamicForms: f}); 
                                      }} 
                                    />
                                  ))}
                                  <IconButton size="small" color="error" onClick={() => { 
                                    const f=[...formData.dynamicForms]; 
                                    f[fi].fields[fli].prefill_rows = f[fi].fields[fli].prefill_rows.filter((_,i) => i !== ri); 
                                    setFormData({...formData, dynamicForms: f}); 
                                  }}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Paper>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )
      }case 4:
        return (
          <Box sx={{ display:'flex', flexDirection:'column', gap:3, pt:1 }}>
            <Alert severity="success" icon={<CheckIcon/>}>Everything looks good! Review your configuration below before finalizing.</Alert>
            {[
              { title:'Product Identity', color:'#1A73E8', items:[
                {label:'Name', value:formData.name},
                {label:'Category', value:CATEGORIES.find(c=>c.value===formData.category)?.label},
                {label:'Duration', value:formData.duration_years ? `${formData.duration_years} year(s)` : 'Not set'},
                {label:'Frequency', value:formData.pricing_frequency},
              ]},

              { title:'Pricing Model', color:'#0F9D58', items: formData.pricingModel==='classes'
                ? formData.pricingTiers.map(t=>({label:t.name, value:`Premium: UGX ${t.coverage_amount?.toLocaleString()}`}))
                : [{label:'Formula', value:formData.formula},{label:'Premium', value:`UGX ${formData.basePremium?.toLocaleString()}`}]
              },
              { title:'Commissions', color:'#F4B400', items: formData.commissions.length ? formData.commissions.map(c=>({label:SYSTEM_ROLES.find(r=>r.value===c.role_code)?.label||c.role_code, value:`${c.commission_value}${c.commission_type==='percentage'?'%':' UGX (flat)'}`})) : [{label:'', value:'No commissions configured'}]},
              { title:'Compliance Forms', color:'#9C27B0', items: formData.dynamicForms.length ? formData.dynamicForms.map(f=>({label:f.name||'Unnamed Form', value:`${f.fields.length} fields · ${f.is_required?'Required':'Optional'}`})) : [{label:'', value:'No forms added'}]},
            ].map(section => (
              <Paper key={section.title} sx={{ borderRadius: 0, overflow:'hidden', border:'1px solid #E0E0E0', mb:1.5 }}>
                <Box sx={{ px:2.5, py:1.5, bgcolor:section.color }}>
                  <Typography sx={{ fontWeight:800, color:'#fff', fontSize:13, letterSpacing:.5 }}>{section.title.toUpperCase()}</Typography>
                </Box>
                <Box sx={{ p:2 }}>
                  {section.items.map((item,i) => (
                    <Box key={i} sx={{ display:'flex', justifyContent:'space-between', py:0.75, borderBottom: i<section.items.length-1?'1px solid #F1F3F4':undefined }}>
                      <Typography variant="body2" sx={{ color:'#5F6368' }}>{item.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight:600 }}>{item.value}</Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            ))}

            {formData.dynamicForms.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography sx={{ fontWeight: 800, color: '#5F6368', mb: 2, fontSize: 13, letterSpacing: 1 }}>DETAILED FORM PREVIEW</Typography>
                {formData.dynamicForms.map((form, fi) => (
                  <Paper key={fi} sx={{ p: 2, mb: 2, borderRadius: 0, border: '1px solid #E0E0E0' }}>
                    <Typography sx={{ fontWeight: 700, mb: 1 }}>{form.name || 'Unnamed Form'}</Typography>
                    <Box sx={{ pl: 2, borderLeft: '2px solid #E0E0E0' }}>
                      {form.fields.map((field, fli) => (
                        <Box key={fli} sx={{ mb: 1.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#1A73E8' }}>{field.type.toUpperCase()}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{field.label}</Typography>
                          {field.type === 'table' && (
                            <Box sx={{ mt: 1, border: '1px solid #F1F3F4' }}>
                              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                                <thead style={{ bgcolor: '#F8F9FA' }}>
                                  <tr style={{ background: '#F8F9FA' }}>
                                    {field.columns?.map((c, ci) => <th key={ci} style={{ textAlign: 'left', padding: 4, borderBottom: '1px solid #F1F3F4' }}>{c.label}</th>)}
                                  </tr>
                                </thead>
                                <tbody>
                                  {(field.prefill_rows || []).map((row, ri) => (
                                    <tr key={ri}>
                                      {field.columns?.map((c, ci) => <td key={ci} style={{ padding: 4, borderBottom: '1px solid #F1F3F4' }}>{row[c.key || (c.label ? c.label.toLowerCase().replace(/\s+/g,'_') : '')] || '—'}</td>)}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        )
      default: return null
    }
  }

  return (
    <Box sx={{ p: 4, bgcolor: '#F8F9FA', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#1A237E' }}>Product Factory</Typography>
          <Typography variant="body1" sx={{ color: '#5F6368' }}>Standardize your insurance blueprints and registries</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenWizard} size="large">Create Product</Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
          <CircularProgress />
        </Box>
      ) : products.length === 0 ? (
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 8, 
            textAlign: 'center', 
            bgcolor: '#fff', 
            borderRadius: 0, 
            border: '2px dashed #E8EAED',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            mt: 4
          }}
        >
          <Box 
            sx={{ 
              width: 80, 
              height: 80, 
              borderRadius: 0, 
              bgcolor: '#F0F4FF', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              mb: 1
            }}
          >
            <ProductIcon sx={{ fontSize: 40, color: '#1A73E8' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#202124' }}>
            No products in your factory yet
          </Typography>
          <Typography variant="body1" sx={{ color: '#5F6368', maxWidth: 400, mx: 'auto', mb: 2 }}>
            Start by creating a product blueprint. You can define pricing models, commission structures, and compliance forms.
          </Typography>
          <Button 
            variant="contained" 
            size="large" 
            startIcon={<AddIcon />}
            onClick={handleOpenWizard}
            sx={{ px: 4, py: 1.5, borderRadius: 0, textTransform: 'none', fontWeight: 700 }}
          >
            Create Your First Product
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {products.map(product => (
            <Grid item xs={12} sm={6} md={4} key={product.id}>
              <Card sx={{ borderRadius: 0, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
                    {product.image_base64 ? (
                      <Avatar src={product.image_base64} variant="rounded" sx={{ width: 56, height: 56, boxShadow: 1 }} />
                    ) : (
                      <Avatar variant="rounded" sx={{ width: 56, height: 56, bgcolor: CATEGORIES.find(c => c.value === product.category)?.color || 'primary.main', boxShadow: 1 }}>
                        <CategoryIcon />
                      </Avatar>
                    )}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2, mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</Typography>
                      <Chip 
                        icon={<CategoryIcon fontSize="small" />}
                        label={CATEGORIES.find(c => c.value === product.category)?.label || product.category}
                        size="small"
                        sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, bgcolor: 'rgba(0,0,0,0.04)' }}
                      />
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ 
                    color: "#5F6368", mb: 2,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    overflow: "hidden", textOverflow: "ellipsis", minHeight: "3em",
                    fontSize: "0.8rem", lineHeight: 1.5
                  }}>
                    {product.description || "No description provided for this product template."}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, mb: 1, alignItems: "center", flexWrap: "wrap" }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: "#1A237E" }}>TIERS ({product.tiers_count || 0}):</Typography>
                    {product.tier_names && product.tier_names.length > 0 ? (
                      product.tier_names.map((tName, i) => (
                        <Chip key={i} label={tName} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#E8F0FE', color: '#1A73E8' }} />
                      ))
                    ) : (
                      <Typography variant="caption" sx={{ color: '#9AA0A6', fontStyle: 'italic' }}>
                        {(product.tiers_count || 0) > 0 ? 'Names pending...' : 'Dynamic Pricing'}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
                <Divider />
                <CardActions sx={{ justifyContent: 'flex-end', p: 2, gap: 1 }}>
                  <Button startIcon={<PurchaseIcon />} size="small" color="secondary" onClick={() => navigate(`/admin/enroll/${product.id}`)}>Purchase</Button>
                  <Button startIcon={<ViewIcon />} size="small" onClick={() => { setSelectedProductId(product.id); setInspectorOpen(true) }}>View</Button>
                  <IconButton color="primary" size="small" onClick={() => handleEditProduct(product)} disabled={isHierarchyLoading}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" size="small" onClick={() => handleDeleteProduct(product.id)}>
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Inspector Drawer */}
      <Drawer anchor="right" open={inspectorOpen} onClose={() => setInspectorOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 640 }, bgcolor: '#F8F9FE', boxShadow: '-12px 0 40px rgba(0,0,0,0.12)' } }}>
        {isInspectorLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (() => {
          const prod = products.find(p => p.id === selectedProductId)
          if (!prod) return null
          const cat = CATEGORIES.find(c => c.value === prod.category)
          const mainTemplate = hierarchy?.[0]?.template
          return (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Hero Header */}
              <Box sx={{ background: `linear-gradient(135deg, ${cat?.color || '#1A237E'} 0%, ${cat?.color || '#283593'}CC 100%)`, p: 3, color: '#fff', position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: 0, bgcolor: 'rgba(255,255,255,0.07)' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Box sx={{ width: 64, height: 64, bgcolor: '#fff', borderRadius: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', flexShrink: 0 }}>
                      {prod.image_base64
                        ? <img src={prod.image_base64} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        : <Typography sx={{ fontSize: '1.8rem' }}>{cat?.emoji}</Typography>}
                    </Box>
                    <Box>
                      <Chip label={cat?.label || prod.category} size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 800, height: 20, fontSize: '0.68rem', mb: 0.8 }} />
                      <Typography sx={{ fontWeight: 900, fontSize: '1.15rem', lineHeight: 1.2 }}>{prod.name}</Typography>
                      <Typography sx={{ fontSize: '0.78rem', opacity: 0.75, mt: 0.3 }}>
                        {prod.is_active ? '● Active' : '○ Inactive'} · ID: {prod.id?.substring(0, 8)}...
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Maximum Coverage</Typography>
                    <Typography sx={{ fontSize: '1.4rem', fontWeight: 950 }}>
                      { (hierarchy?.[0]?.tiers?.length > 0) 
                        ? formatCurrency(Math.max(...hierarchy[0].tiers.map(t => t.coverage_amount)))
                        : formatCurrency(prod.max_coverage || 0) }
                    </Typography>
                  </Box>
                  <IconButton onClick={() => setInspectorOpen(false)} sx={{ color: 'rgba(255,255,255,0.8)', p: 0.5 }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
                {/* Quick Stat Row */}
                <Box sx={{ display: 'flex', gap: 3, mt: 2.5, pt: 2, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                  {[
                    { 
                      label: 'Premium Amount', 
                      value: (hierarchy?.[0]?.tiers?.length > 0) 
                        ? formatCurrency(Math.max(...hierarchy[0].tiers.map(t => t.coverage_amount)))
                        : formatCurrency(prod.max_coverage || 0) 
                    },
                    { label: 'Tiers', value: `${prod.tiers_count || 0}` },
                    { label: 'Policy Period', value: `${prod.duration_years || 1}yr` },
                  ].map((s, i) => (
                    <Box key={i}>
                      <Typography sx={{ fontSize: '0.63rem', opacity: 0.6, fontWeight: 700, textTransform: 'uppercase', mb: 0.2 }}>{s.label}</Typography>
                      <Typography sx={{ fontWeight: 900, fontSize: '0.85rem' }}>{s.value}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Tabs */}
              <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #E8EAED' }}>
                <Tabs value={inspectorTab} onChange={(_, v) => setInspectorTab(v)}
                  sx={{ '& .MuiTab-root': { fontWeight: 700, fontSize: '0.8rem', minHeight: 46, textTransform: 'none' } }}>
                  <Tab icon={<InfoIcon sx={{ fontSize: 15 }} />} iconPosition="start" label="Overview" />
                  <Tab icon={<PremiumIcon sx={{ fontSize: 15 }} />} iconPosition="start" label="Pricing" />
                  <Tab icon={<CommissionIcon sx={{ fontSize: 15 }} />} iconPosition="start" label="Commissions" />
                  <Tab icon={<FormIcon sx={{ fontSize: 15 }} />} iconPosition="start" label="Forms" />
                </Tabs>
              </Box>

              {/* Tab Content */}
              <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>

                {/* OVERVIEW TAB */}
                {inspectorTab === 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Description */}
                    <Paper sx={{ p: 2.5, borderRadius: 0, border: '1px solid #E8EAED', bgcolor: '#fff' }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.72rem', color: '#5F6368', textTransform: 'uppercase', letterSpacing: 0.8, mb: 1 }}>Description</Typography>
                      <Typography sx={{ fontSize: '0.875rem', color: '#202124', lineHeight: 1.65 }}>
                        {prod.description || 'No description provided for this product.'}
                      </Typography>
                    </Paper>

                    {/* Architecture */}
                    <Paper sx={{ p: 2.5, borderRadius: 0, border: '1px solid #E8EAED', bgcolor: '#fff' }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.72rem', color: '#1A237E', textTransform: 'uppercase', letterSpacing: 0.8, mb: 2 }}>Product Architecture</Typography>
                      {(hierarchy || []).map((item, tIdx) => (
                        <Box key={tIdx} sx={{ mb: 2 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#5F6368', mb: 1.5 }}>
                            {item.template.name}
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                            {item.tiers?.map((tier, ti) => {
                              const tierColors = { Bronze: '#CD7F32', Silver: '#9E9E9E', Gold: '#F9AB00', Platinum: '#607D8B', Diamond: '#1A73E8' }
                              const tc = tierColors[tier.name] || '#1A73E8'
                              return (
                                <Box key={ti} sx={{ p: 2, bgcolor: '#F8F9FE', borderRadius: 0, borderLeft: `4px solid ${tc}` }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Box sx={{ width: 10, height: 10, borderRadius: 0, bgcolor: tc }} />
                                      <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#202124' }}>{tier.name}</Typography>
                                    </Box>
                                    <Typography sx={{ fontWeight: 900, fontSize: '0.88rem', color: tc }}>{formatCurrency(tier.coverage_amount)}</Typography>
                                  </Box>
                                  {tier.description && <Typography sx={{ fontSize: '0.75rem', color: '#5F6368', mb: 1 }}>{tier.description}</Typography>}
                                  {tier.benefits?.filter(Boolean).length > 0 && (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
                                      {tier.benefits.filter(Boolean).map((b, bi) => (
                                        <Chip key={bi} label={b} size="small" variant="outlined"
                                          sx={{ fontSize: '0.68rem', height: 20, borderRadius: 0, borderColor: `${tc}40`, color: tc }} />
                                      ))}
                                    </Box>
                                  )}
                                </Box>
                              )
                            })}
                            {(!item.tiers || item.tiers.length === 0) && (
                              <Typography sx={{ fontSize: '0.8rem', color: '#9AA0A6', fontStyle: 'italic' }}>Dynamic formula pricing</Typography>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Paper>

                    {/* Terms */}
                    {mainTemplate?.terms_and_conditions && (
                      <Paper sx={{ p: 2.5, borderRadius: 0, border: '1px solid #E8EAED', bgcolor: '#fff' }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.72rem', color: '#5F6368', textTransform: 'uppercase', letterSpacing: 0.8, mb: 1.5 }}>Terms & Conditions</Typography>
                        <Typography sx={{ fontSize: '0.78rem', color: '#5F6368', whiteSpace: 'pre-wrap', lineHeight: 1.7, bgcolor: '#F8F9FA', p: 2, borderRadius: 0, fontFamily: 'monospace', border: '1px solid #E8EAED', maxHeight: 180, overflow: 'auto' }}>
                          {mainTemplate.terms_and_conditions}
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                )}

                {/* PRICING TAB */}
                {inspectorTab === 1 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {(hierarchy || []).map((item, idx) => (
                      <Box key={idx}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#5F6368', mb: 1.5 }}>{item.template.name}</Typography>
                        {(item.tiers || []).length > 0 ? item.tiers.map(tier => (
                          <Paper key={tier.id} sx={{ p: 2.5, mb: 1.5, borderRadius: 0, border: '1px solid #E8EAED', bgcolor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem' }}>{tier.name}</Typography>
                              <Typography sx={{ fontSize: '0.78rem', color: '#5F6368', mt: 0.3 }}>{tier.description || 'Standard tier'}</Typography>
                              
                              {tier.benefits && tier.benefits.length > 0 && (
                                <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                                  {tier.benefits.map((benefit, bIdx) => (
                                    <Chip 
                                      key={bIdx} 
                                      label={benefit} 
                                      size="small" 
                                      variant="outlined"
                                      sx={{ height: 22, fontSize: '0.65rem', fontWeight: 700, borderColor: '#E8EAED', color: '#1A73E8', bgcolor: '#f1f8ff' }} 
                                    />
                                  ))}
                                </Box>
                              )}
                            </Box>
                            <Box sx={{ textAlign: 'right', ml: 2 }}>
                              <Typography sx={{ fontWeight: 900, fontSize: '1rem', color: '#1E8E3E' }}>{formatCurrency(tier.coverage_amount)}</Typography>
                              <Typography sx={{ fontSize: '0.7rem', color: '#9AA0A6' }}>Premium Amount</Typography>
                            </Box>
                          </Paper>
                        )) : (
                          <Paper sx={{ p: 2.5, borderRadius: 0, border: '1px solid #E8EAED', bgcolor: '#fff' }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#5F6368' }}>Dynamic formula pricing model</Typography>
                            <Typography sx={{ fontSize: '0.78rem', color: '#9AA0A6', mt: 0.5 }}>Premiums calculated at quote time</Typography>
                          </Paper>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}

                {/* COMMISSIONS TAB */}
                {inspectorTab === 2 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {(hierarchy || []).map((item, idx) => (
                      <Box key={idx}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#5F6368', mb: 1.5 }}>{item.template.name}</Typography>
                        {(item.commissions || []).length === 0
                          ? <Alert severity="info" sx={{ borderRadius: 0}}>No commission rules configured.</Alert>
                          : item.commissions.map(c => (
                          <Paper key={c.id} sx={{ p: 2.5, mb: 1.5, borderRadius: 0, border: '1px solid #E8EAED', bgcolor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box sx={{ p: 1, bgcolor: '#E8F0FE', borderRadius: 0, color: '#1A73E8' }}><CommissionIcon sx={{ fontSize: 18 }} /></Box>
                              <Box>
                                <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', textTransform: 'capitalize' }}>
                                  {c.role_code?.replace(/_/g, ' ')}
                                </Typography>
                                <Typography sx={{ fontSize: '0.75rem', color: '#5F6368' }}>{c.commission_type} commission</Typography>
                              </Box>
                            </Box>
                            <Chip label={c.commission_type === 'percentage' ? `${c.commission_value}%` : formatCurrency(c.commission_value)}
                              sx={{ fontWeight: 900, bgcolor: '#E6F4EA', color: '#1E8E3E', fontSize: '0.85rem' }} />
                          </Paper>
                        ))}
                      </Box>
                    ))}
                  </Box>
                )}

                {/* FORMS TAB */}
                {inspectorTab === 3 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {(hierarchy || []).map((item, idx) => (
                      (item.forms || []).length === 0 ? (
                        <Alert key={idx} severity="info" sx={{ borderRadius: 0}}>No compliance forms added to this product.</Alert>
                      ) : item.forms.map(form => (
                        <Paper key={form.id} sx={{ borderRadius: 0, border: '1px solid #E8EAED', overflow: 'hidden', bgcolor: '#fff' }}>
                          <Box sx={{ px: 2.5, py: 1.8, bgcolor: '#F8F9FE', borderBottom: '1px solid #E8EAED', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem' }}>{form.name}</Typography>
                              {form.description && <Typography sx={{ fontSize: '0.72rem', color: '#5F6368', mt: 0.2 }}>{form.description}</Typography>}
                            </Box>
                            {form.is_required && <Chip label="REQUIRED" size="small" color="error" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }} />}
                          </Box>
                          <Box sx={{ p: 2.5 }}>
                            {(form.fields || []).map((field) => {
                              if (field.field_type === 'section') return (
                                <Typography key={field.id} sx={{ fontWeight: 900, fontSize: '0.72rem', color: '#1A237E', textTransform: 'uppercase', letterSpacing: 0.8, mt: 1.5, mb: 1, pt: 1.5, borderTop: '1px solid #E8EAED' }}>{field.label}</Typography>
                              )
                              if (field.field_type === 'table') return (
                                <Box key={field.id} sx={{ mb: 2 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>{field.label}</Typography>
                                  <Box sx={{ overflow: 'auto', borderRadius: 0, border: '1px solid #E8EAED' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                                      <thead><tr style={{ background: '#F8F9FE' }}>
                                        {(field.columns || []).map(col => <th key={col.key} style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'left', borderBottom: '1px solid #E8EAED' }}>{col.label}</th>)}
                                      </tr></thead>
                                      <tbody>
                                        {(field.prefill_rows || []).map((row, ri) => (
                                          <tr key={ri}>{(field.columns || []).map(col => <td key={col.key} style={{ padding: '8px 12px' }}>{row[col.key || col.label?.toLowerCase().replace(/\s+/g,'_')] || '—'}</td>)}</tr>
                                        ))}
                                        {(field.prefill_rows || []).length === 0 && Array.from({ length: field.min_rows || 1 }).map((_, ri) => (
                                          <tr key={ri}>{(field.columns || []).map(col => <td key={col.key} style={{ padding: '8px 12px', color: '#BDC1C6', fontStyle: 'italic' }}>Enter {col.label}...</td>)}</tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </Box>
                                </Box>
                              )
                              return (
                                <Box key={field.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', py: 1, borderBottom: '1px solid #F1F3F4' }}>
                                  <Box>
                                    <Typography sx={{ fontSize: '0.83rem', fontWeight: 600 }}>{field.label}</Typography>
                                    {field.help_text && <Typography sx={{ fontSize: '0.72rem', color: '#9AA0A6' }}>{field.help_text}</Typography>}
                                  </Box>
                                  <Box sx={{ display: 'flex', gap: 0.8, ml: 2, flexShrink: 0 }}>
                                    <Chip label={field.field_type} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
                                    {field.is_required && <Chip label="req" size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem' }} />}
                                  </Box>
                                </Box>
                              )
                            })}
                          </Box>
                        </Paper>
                      ))
                    ))}
                  </Box>
                )}
              </Box>

              {/* Footer */}
              <Box sx={{ p: 2.5, borderTop: '1px solid #E8EAED', bgcolor: '#fff', display: 'flex', gap: 1.5 }}>
                <Button variant="outlined" startIcon={<EditIcon />} onClick={() => { setInspectorOpen(false); handleEditProduct(prod) }}
                  sx={{ flex: 1, borderRadius: 0, fontWeight: 700 }}>
                  Edit Product
                </Button>
                <Button variant="outlined" startIcon={<DuplicateIcon />} onClick={() => { setInspectorOpen(false); handleDuplicateProduct(prod) }}
                  sx={{ borderRadius: 0, fontWeight: 700 }}>
                  Clone
                </Button>
              </Box>
            </Box>
          )
        })()}
      </Drawer>

      {/* Wizard Dialog */}
      <Dialog open={wizardOpen} onClose={() => setWizardOpen(false)} maxWidth="lg" fullWidth
        PaperProps={{ sx: { borderRadius: 0, overflow: 'hidden', height: '92vh', boxShadow: '0 32px 64px rgba(0,0,0,0.2)' } }}>
        {createProductMutation.isPending && (
          <Box sx={{ 
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
            bgcolor: 'rgba(255,255,255,0.8)', zIndex: 9999, 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(6px)'
          }}>
            <CircularProgress size={60} thickness={4} sx={{ color: '#1A237E', mb: 3 }} />
            <Typography sx={{ fontWeight: 900, color: '#1A237E', fontSize: '1.4rem', letterSpacing: 1 }}>FINALIZING & DEPLOYING</Typography>
            <Typography sx={{ color: '#5F6368', mt: 1, fontWeight: 500 }}>Standardizing product blueprints in the registry...</Typography>
            <Box sx={{ width: '340px', mt: 4 }}>
              <LinearProgress sx={{ height: 10, borderRadius: 0, bgcolor: '#E8EAF6', '& .MuiLinearProgress-bar': { bgcolor: '#1A237E' } }} />
            </Box>
          </Box>
        )}

        {/* Header */}
        <Box sx={{ background: 'linear-gradient(135deg, #1A237E 0%, #283593 100%)', p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', p: 1, borderRadius: 0, display: 'flex' }}>
              <ProductIcon sx={{ fontSize: 22, color: '#fff' }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 900, color: '#fff', fontSize: '1rem', letterSpacing: 0.3 }}>
                {isEditing ? 'Edit Product' : 'Product Factory'}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.78rem' }}>
                {STEP_META[activeStep]?.desc}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 0.8 }}>
              {STEP_META.map((s, i) => (
                <Box key={i} sx={{
                  width: i === activeStep ? 28 : 8, height: 8, borderRadius: 0,
                  bgcolor: i < activeStep ? '#4CAF50' : i === activeStep ? '#fff' : 'rgba(255,255,255,0.25)',
                  transition: 'all 0.3s', cursor: i < activeStep ? 'pointer' : 'default'
                }} onClick={() => i < activeStep && setActiveStep(i)} />
              ))}
            </Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
              {activeStep + 1}/{STEPS.length}
            </Typography>
            <IconButton onClick={() => setWizardOpen(false)} sx={{ color: 'rgba(255,255,255,0.7)', p: 0.5 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', bgcolor: '#F8F9FE' }}>

          {/* Sidebar */}
          <Box sx={{ width: 220, bgcolor: '#fff', borderRight: '1px solid #E8EAED', display: 'flex', flexDirection: 'column', py: 2, flexShrink: 0 }}>
            {STEP_META.map((s, i) => (
              <Box key={i} onClick={() => i < activeStep && setActiveStep(i)}
                sx={{
                  px: 2.5, py: 1.8, cursor: i < activeStep ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  bgcolor: activeStep === i ? '#F8F9FE' : 'transparent',
                  borderLeft: activeStep === i ? `3px solid ${s.color}` : '3px solid transparent',
                  transition: 'all 0.15s',
                  '&:hover': i < activeStep ? { bgcolor: '#F8F9FE' } : {}
                }}>
                <Box sx={{
                  width: 26, height: 26, borderRadius: 0,
                  bgcolor: i < activeStep ? '#E6F4EA' : i === activeStep ? s.color : '#F1F3F4',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {i < activeStep
                    ? <CheckIcon sx={{ fontSize: 14, color: '#1E8E3E' }} />
                    : <Typography sx={{ fontSize: '0.72rem', fontWeight: 900, color: i === activeStep ? '#fff' : '#9AA0A6' }}>{i + 1}</Typography>
                  }
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: activeStep === i ? 800 : 500, color: activeStep === i ? '#202124' : i < activeStep ? '#1E8E3E' : '#9AA0A6', lineHeight: 1.2 }}>
                    {s.label}
                  </Typography>
                  {activeStep === i && (
                    <Typography sx={{ fontSize: '0.68rem', color: '#9AA0A6', mt: 0.2 }}>{s.desc}</Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Box>

          {/* Step Content */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 3.5 }}>
            {renderStepContent(activeStep)}
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2.5, borderTop: '1px solid #E8EAED', display: 'flex', alignItems: 'center', bgcolor: '#fff' }}>
          <Button onClick={() => setWizardOpen(false)} sx={{ color: '#9AA0A6', fontWeight: 600 }}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          {activeStep > 0 && (
            <Button onClick={handleBack} sx={{ mr: 1.5, fontWeight: 700, color: '#5F6368' }}>← Back</Button>
          )}
          {activeStep < STEPS.length - 1
            ? <Button variant="contained" onClick={handleNext}
                sx={{ px: 4, borderRadius: 0, fontWeight: 800, bgcolor: '#1A237E', boxShadow: '0 4px 12px rgba(26,35,126,0.3)', '&:hover': { bgcolor: '#0D47A1' } }}>
                Continue →
              </Button>
            : <Button variant="contained" onClick={() => createProductMutation.mutate(formData)}
                disabled={createProductMutation.isPending}
                sx={{ px: 4, borderRadius: 0, fontWeight: 800, bgcolor: '#1E8E3E', boxShadow: '0 4px 12px rgba(30,142,62,0.3)', '&:hover': { bgcolor: '#137333' } }}>
                {createProductMutation.isPending ? 'Deploying...' : '🚀 Finalize & Deploy'}
              </Button>
          }
        </Box>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onClose={() => setShowSuccess(false)} maxWidth="xs" fullWidth>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <ActiveIcon sx={{ fontSize: 80, color: '#4CAF50', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Build Successful!</Typography>
          <Typography variant="body1" sx={{ mt: 2, mb: 4 }}>Product hierarchy has been deployed to the Production registry.</Typography>
          <Button variant="contained" color="success" fullWidth onClick={() => setShowSuccess(false)}>Acknowledge</Button>
        </Box>
      </Dialog>
    </Box>
  )
}
