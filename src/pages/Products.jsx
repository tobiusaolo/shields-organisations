import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productAPI, formAPI, commissionAPI } from '../services/api'
import { formatCurrency } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'
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
  CircularProgress,
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
    limits: { min: 0, max: 100000000 },
    terms: '',
    basePremium: 10000,
    formula: 'amount * 0.05',
    pricingTiers: [
      { name: 'Bronze', description: 'Basic Coverage', coverage_amount: 1000000, premium: 5000, benefits: ['Standard support'] }
    ],
    duration_years: '1',
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
      alert('Product deleted successfully.')
    },
    onError: (err) => {
      alert(`Delete failed: ${err.response?.data?.detail || 'Unknown error'}`)
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
          max_coverage: parseFloat(data.limits.max),
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
            coverage_limits: data.limits || { min: 0, max: 0 }
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
          max_coverage: parseFloat(data.limits.max),
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
          coverage_limits: data.limits || { min: 0, max: 0 },
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
            max_rows: f.max_rows
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
      limits: { min: 0, max: 100000000 },
      terms: '',
      basePremium: 10000,
      formula: 'amount * 0.05',
      pricingTiers: [
        { name: 'Bronze', description: 'Basic Coverage', coverage_amount: 1000000, premium: 5000, benefits: ['Standard support'] }
      ],
      duration_years: '1',
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
          limits: template.coverage_limits || { min: 0, max: 100000000 },
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
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      deleteProductMutation.mutate(productId)
    }
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <TextField label="Product Name" fullWidth value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <TextField select label="Category" fullWidth value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
              {CATEGORIES.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
            </TextField>
            <TextField label="Description" fullWidth multiline rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            <TextField label="Policy Duration (Years)" type="number" fullWidth value={formData.duration_years} onChange={(e) => setFormData({ ...formData, duration_years: e.target.value })} />
          </Box>
        )
      case 1: {
        const upTier = (idx, key, val) => { const t = [...formData.pricingTiers]; t[idx][key] = val; setFormData({ ...formData, pricingTiers: t }) }
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {[{v:'classes', label:'Pricing Classes', sub:'Fixed tiers (Bronze, Gold…)', icon:<TierIcon/>},{v:'formula',label:'Dynamic Formula',sub:'Calculated at quote time',icon:<FormulaIcon/>}].map(opt => (
                <Paper key={opt.v} onClick={() => setFormData({...formData, pricingModel: opt.v})} sx={{ flex:1, p:2.5, cursor:'pointer', border: formData.pricingModel===opt.v ? '2px solid #1A237E':'2px solid #E8EAED', borderRadius:0, transition:'border-color .15s', bgcolor: formData.pricingModel===opt.v?'#F0F4FF':'#fff' }}>
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
                  <Paper key={idx} sx={{ mb:1.5, borderRadius:0, overflow:'hidden', border:'1px solid #E0E0E0' }}>
                      <Box sx={{ p:1.5, bgcolor: '#37474F', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <TextField variant="standard" value={tier.name} placeholder="Tier Name" InputProps={{disableUnderline:true, sx:{color:'#fff', fontWeight:800, fontSize:16}}} onChange={(e) => upTier(idx,'name',e.target.value)} sx={{ flex:1 }}/>
                        <IconButton size="small" onClick={() => { const t=[...formData.pricingTiers]; t.splice(idx,1); setFormData({...formData,pricingTiers:t}) }} sx={{ color:'rgba(255,255,255,.8)' }}><DeleteIcon fontSize="small"/></IconButton>
                      </Box>
                      <Box sx={{ p:2, display:'flex', flexDirection:'column', gap:2 }}>
                        <TextField label="Description" size="small" fullWidth value={tier.description} onChange={e => upTier(idx,'description',e.target.value)} placeholder="What does this tier cover?" />
                        <Box sx={{ display:'flex', gap:2 }}>
                          <TextField label="Installment (UGX)" size="small" fullWidth type="number" value={tier.premium} onChange={e => upTier(idx,'premium',parseFloat(e.target.value)||0)} InputProps={{ startAdornment:<Typography sx={{mr:1,color:'#5F6368',fontSize:13}}>UGX</Typography> }}/>
                          <TextField label="Max Coverage (UGX)" size="small" fullWidth type="number" value={tier.coverage_amount} onChange={e => upTier(idx,'coverage_amount',parseFloat(e.target.value)||0)} InputProps={{ startAdornment:<Typography sx={{mr:1,color:'#5F6368',fontSize:13}}>UGX</Typography> }}/>
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
                <TextField label="Base Installment (UGX)" type="number" fullWidth value={formData.basePremium} onChange={e => setFormData({...formData, basePremium: parseFloat(e.target.value)||0})} helperText="Minimum floor used when formula yields a lower value"/>
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
              <Paper key={idx} sx={{ p:2, borderRadius:0, border:'1px solid #E0E0E0' }}>
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
        const upForm = (fi, key, val) => { const f=[...formData.dynamicForms]; f[fi][key]=val; setFormData({...formData, dynamicForms:f}) }
        const upField = (fi, fli, key, val) => { const f=[...formData.dynamicForms]; f[fi].fields[fli][key]=val; setFormData({...formData, dynamicForms:f}) }
        const upCol = (fi, fli, ci, key, val) => { const f=[...formData.dynamicForms]; f[fi].fields[fli].columns[ci][key]=val; setFormData({...formData, dynamicForms:f}) }
        return (
          <Box sx={{ display:'flex', flexDirection:'column', gap:2, pt:1 }}>
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', p:2, bgcolor:'#F5F5F5', borderRadius:0 }}>
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
              <Accordion key={fi} defaultExpanded sx={{ border:'1px solid #BDBDBD', borderRadius:'0!important', '&:before':{display:'none'}, mb:1, overflow:'hidden' }}>
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
                      <Paper key={fli} variant="outlined" sx={{ p:1.5, borderRadius:0, mb:1, bgcolor: field.type==='section'?'#F5F5F5':'#FAFAFA', borderLeft: field.type==='section'?'3px solid #546E7A':undefined }}>
                        <Box sx={{ display:'flex', gap:1.5, alignItems:'flex-start', flexWrap:'wrap' }}>
                          <TextField label={field.type==='section'?'Section Title':'Field Label'} size="small" sx={{ flex:2, minWidth:160 }} value={field.label} onChange={e=>{upField(fi,fli,'label',e.target.value); upField(fi,fli,'name',e.target.value.toLowerCase().replace(/\s+/g,'_'))}}/>
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
                            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:1 }}>
                              <Typography variant="caption" sx={{ fontWeight:700, color:'#546E7A', letterSpacing:.5 }}>TABLE COLUMNS</Typography>
                              <Button size="small" onClick={()=>{const f=[...formData.dynamicForms]; f[fi].fields[fli].columns.push({label:'',type:'text'}); setFormData({...formData,dynamicForms:f})}}>+ Column</Button>
                            </Box>
                            <Box sx={{ display:'flex', gap:2, mb:1.5 }}>
                              <TextField label="Min Rows" size="small" type="number" sx={{ width:110 }} value={field.min_rows} onChange={e=>upField(fi,fli,'min_rows',parseInt(e.target.value)||1)}/>
                              <TextField label="Max Rows" size="small" type="number" sx={{ width:110 }} value={field.max_rows} onChange={e=>upField(fi,fli,'max_rows',parseInt(e.target.value)||10)}/>
                            </Box>
                            {(field.columns||[]).map((col,ci)=>(
                              <Box key={ci} sx={{ display:'flex', gap:1, mb:0.75 }}>
                                <TextField placeholder="Column Label" size="small" fullWidth value={col.label} onChange={e=>upCol(fi,fli,ci,'label',e.target.value)}/>
                                <TextField select size="small" sx={{ width:120 }} value={col.type} onChange={e=>upCol(fi,fli,ci,'type',e.target.value)}>
                                  <MenuItem value="text">Text</MenuItem><MenuItem value="number">Number</MenuItem><MenuItem value="date">Date</MenuItem>
                                </TextField>
                                <IconButton size="small" color="error" onClick={()=>{const f=[...formData.dynamicForms]; f[fi].fields[fli].columns=f[fi].fields[fli].columns.filter((_,i)=>i!==ci); setFormData({...formData,dynamicForms:f})}}><DeleteIcon fontSize="small"/></IconButton>
                              </Box>
                            ))}
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
      }
      case 4:
        return (
          <Box sx={{ display:'flex', flexDirection:'column', gap:3, pt:1 }}>
            <Alert severity="success" icon={<CheckIcon/>}>Everything looks good! Review your configuration below before finalizing.</Alert>
            {[
              { title:'Product Identity', color:'#1A73E8', items:[
                {label:'Name', value:formData.name},
                {label:'Category', value:CATEGORIES.find(c=>c.value===formData.category)?.label},
                {label:'Duration', value:formData.duration_years ? `${formData.duration_years} year(s)` : 'Not set'},
              ]},
              { title:'Pricing Model', color:'#0F9D58', items: formData.pricingModel==='classes'
                ? formData.pricingTiers.map(t=>({label:t.name, value:`UGX ${t.premium?.toLocaleString()} / Coverage: ${t.coverage_amount?.toLocaleString()}`}))
                : [{label:'Formula', value:formData.formula},{label:'Base Installment', value:`UGX ${formData.basePremium?.toLocaleString()}`}]
              },
              { title:'Commissions', color:'#F4B400', items: formData.commissions.length ? formData.commissions.map(c=>({label:SYSTEM_ROLES.find(r=>r.value===c.role_code)?.label||c.role_code, value:`${c.commission_value}${c.commission_type==='percentage'?'%':' UGX (flat)'}`})) : [{label:'', value:'No commissions configured'}]},
              { title:'Compliance Forms', color:'#9C27B0', items: formData.dynamicForms.length ? formData.dynamicForms.map(f=>({label:f.name||'Unnamed Form', value:`${f.fields.length} fields · ${f.is_required?'Required':'Optional'}`})) : [{label:'', value:'No forms added'}]},
            ].map(section => (
              <Paper key={section.title} sx={{ borderRadius:0, overflow:'hidden', border:'1px solid #E0E0E0', mb:1.5 }}>
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
            borderRadius: 4, 
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
              borderRadius: '50%', 
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
            sx={{ px: 4, py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Create Your First Product
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {products.map(product => (
            <Grid item xs={12} sm={6} md={4} key={product.id}>
              <Card sx={{ borderRadius: 3, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                    <Avatar src={product.image_base64} sx={{ width: 56, height: 56, borderRadius: 2, bgcolor: '#E8F0FE', color: '#1A73E8' }}>
                      {product.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>{product.name}</Typography>
                      <Chip label={product.category} size="small" color="primary" variant="outlined" />
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ height: 40, overflow: 'hidden' }}>{product.description}</Typography>
                </CardContent>
                <Divider />
                <CardActions sx={{ justifyContent: 'flex-end', p: 2, gap: 1 }}>
                  <Button startIcon={<ViewIcon />} size="small" onClick={() => { setSelectedProductId(product.id); setInspectorOpen(true) }}>View</Button>
                  <IconButton color="primary" size="small" onClick={() => handleEditProduct(product)} disabled={isHierarchyLoading}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" size="small" onClick={() => handleDeleteProduct(product.id)} disabled={deleteProductMutation.isLoading}>
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Inspector Drawer */}
      <Drawer anchor="right" open={inspectorOpen} onClose={() => setInspectorOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 600 }, bgcolor: '#F8F9FA' } }}>
        {isInspectorLoading ? <CircularProgress sx={{ m: 'auto' }} /> : (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 3, bgcolor: '#fff', borderBottom: '1px solid #E8EAED', display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Product Inspector</Typography>
              <IconButton onClick={() => setInspectorOpen(false)}><CloseIcon /></IconButton>
            </Box>
            <Tabs value={inspectorTab} onChange={(_, v) => setInspectorTab(v)} variant="fullWidth">
              <Tab label="Pricing" icon={<PremiumIcon />} iconPosition="start" />
              <Tab label="Commissions" icon={<CategoryIcon />} iconPosition="start" />
              <Tab label="Compliance" icon={<FormIcon />} iconPosition="start" />
            </Tabs>
            <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
              {hierarchy.map((item, idx) => (
                <Box key={idx} sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" sx={{ color: '#3F51B5', mb: 2 }}>{item.template.name}</Typography>
                  
                  {inspectorTab === 0 && item.tiers.map(tier => (
                    <Paper key={tier.id} sx={{ p: 2, mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{tier.name}</Typography>
                      <Typography sx={{ color: '#2E7D32', fontWeight: 700 }}>{formatCurrency(tier.premium)}</Typography>
                    </Paper>
                  ))}

                  {inspectorTab === 1 && (
                    <List>
                      {item.commissions.map(c => (
                        <ListItem key={c.id}>
                          <ListItemText primary={c.role_code.toUpperCase()} secondary={c.commission_type} />
                          <Typography sx={{ fontWeight: 800 }}>{c.commission_value}%</Typography>
                        </ListItem>
                      ))}
                    </List>
                  )}

                  {inspectorTab === 2 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {item.forms.map(form => (
                        <Paper key={form.id} sx={{ p: 4, borderRadius: 3, border: '1px solid #E8EAED' }}>
                          <Box sx={{ borderBottom: '2px solid #3F51B5', pb: 1, mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>{form.name}</Typography>
                            {form.is_required && <Chip label="MANDATORY" size="small" color="error" />}
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {form.fields.map(field => {
                              if (field.field_type === 'section') return <Typography key={field.id} variant="subtitle1" sx={{ fontWeight: 800, color: '#3F51B5' }}>{field.label}</Typography>
                              if (field.field_type === 'table') return (
                                <Box key={field.id}>
                                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{field.label}</Typography>
                                  <TableContainer component={Paper} variant="outlined"><Table size="small">
                                    <TableHead><TableRow>
                                      {field.columns?.map(col => <TableCell key={col.key} sx={{ fontWeight: 700 }}>{col.label}</TableCell>)}
                                    </TableRow></TableHead>
                                    <TableBody>
                                      {Array.from({ length: field.min_rows || 1 }).map((_, rowIndex) => (
                                        <TableRow key={rowIndex}>
                                          {field.columns?.map(col => <TableCell key={`${rowIndex}-${col.key}`} sx={{ color: '#BDC1C6' }}>Enter {col.type}...</TableCell>)}
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table></TableContainer>
                                </Box>
                              )
                              if (field.field_type === 'checkbox') return <FormControlLabel key={field.id} control={<Checkbox disabled />} label={field.label} />
                              return <TextField key={field.id} label={field.label} fullWidth disabled size="small" multiline={field.field_type === 'textarea'} InputLabelProps={{ shrink: true }} />
                            })}
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Wizard Dialog */}
      <Dialog open={wizardOpen} onClose={() => setWizardOpen(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 0, overflow: 'hidden', height: '90vh' } }}>
        {/* Header */}
        <Box sx={{ bgcolor: '#1A237E', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ fontWeight: 900, color: '#fff', fontSize: 20 }}>{isEditing ? 'Edit Product' : 'Product Factory Wizard'}</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,.7)', fontSize: 13 }}>{STEP_META[activeStep]?.desc}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ color: 'rgba(255,255,255,.6)', fontSize: 13 }}>Step {activeStep + 1} of {STEPS.length}</Typography>
            <IconButton onClick={() => setWizardOpen(false)} sx={{ color: 'rgba(255,255,255,.8)' }}><CloseIcon/></IconButton>
          </Box>
        </Box>

        {/* Step Progress Bar */}
        <Box sx={{ display: 'flex', height: 4 }}>
          {STEP_META.map((s, i) => (
            <Box key={i} sx={{ flex: 1, bgcolor: i <= activeStep ? s.color : '#E8EAED', transition: 'background .3s' }}/>
          ))}
        </Box>

        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Step Sidebar */}
          <Box sx={{ width: 200, bgcolor: '#F8F9FA', borderRight: '1px solid #E8EAED', display: 'flex', flexDirection: 'column', py: 2, flexShrink: 0 }}>
            {STEP_META.map((s, i) => (
              <Box key={i} onClick={() => i < activeStep && setActiveStep(i)} sx={{ px: 2.5, py: 1.5, cursor: i < activeStep ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: activeStep === i ? '#fff' : 'transparent', borderRight: activeStep === i ? `3px solid ${s.color}` : '3px solid transparent', transition: 'all .2s' }}>
                <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: i < activeStep ? '#4CAF50' : i === activeStep ? s.color : '#E8EAED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {i < activeStep ? <CheckIcon sx={{ fontSize: 14, color: '#fff' }}/> : <Typography sx={{ fontSize: 11, fontWeight: 800, color: i === activeStep ? '#fff' : '#9E9E9E' }}>{i + 1}</Typography>}
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: activeStep === i ? 700 : 400, color: activeStep === i ? s.color : i < activeStep ? '#202124' : '#9E9E9E' }}>{s.label}</Typography>
              </Box>
            ))}
          </Box>

          {/* Step Content */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
            {renderStepContent(activeStep)}
          </Box>
        </Box>

        {/* Footer Actions */}
        <Box sx={{ p: 2.5, borderTop: '1px solid #E8EAED', display: 'flex', alignItems: 'center', bgcolor: '#fff' }}>
          <Button onClick={() => setWizardOpen(false)} sx={{ color: '#5F6368' }}>Cancel</Button>
          <Box sx={{ flex: 1 }}/>
          {activeStep > 0 && <Button onClick={handleBack} sx={{ mr: 1 }}>← Back</Button>}
          {activeStep < STEPS.length - 1
            ? <Button variant="contained" onClick={handleNext} sx={{ px: 4, background: `linear-gradient(135deg, ${STEP_META[activeStep + 1]?.color || '#1A73E8'}, ${STEP_META[activeStep]?.color || '#1A73E8'})` }}>
                Continue →
              </Button>
            : <Button variant="contained" color="success" onClick={() => createProductMutation.mutate(formData)} disabled={createProductMutation.isLoading}
                sx={{ px: 4, background: 'linear-gradient(135deg, #2E7D32, #4CAF50)', fontWeight: 800 }}>
                {createProductMutation.isLoading ? 'Building...' : '🚀 Finalize & Deploy'}
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
