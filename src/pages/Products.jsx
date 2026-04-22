import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import {
  Add as AddIcon,
  Inventory as ProductIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  LocalOffer as CategoryIcon,
  Description as DocsIcon,
  Architecture as BlueprintIcon,
  AttachMoney as PremiumIcon,
  FileUpload as UploadIcon,
  ArrowForward as NextIcon,
  ArrowBack as BackIcon,
  Security as SecurityIcon,
  ExpandMore as ExpandMoreIcon,
  QuestionAnswer as QuestionIcon,
  Send as SendIcon,
  Star as StarIcon,
} from '@mui/icons-material'

const CATEGORIES = [
  { value: 'life', label: 'Life Insurance' },
  { value: 'health', label: 'Health Insurance' },
  { value: 'motor', label: 'Motor Insurance' },
  { value: 'property', label: 'Property Insurance' },
  { value: 'travel', label: 'Travel Insurance' },
  { value: 'funeral', label: 'Funeral Insurance' },
  { value: 'micro', label: 'Micro Insurance' },
  { value: 'other', label: 'Other' },
]

export default function Products() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const orgId = user?.organization_id

  const [wizardOpen, setWizardOpen] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [newQuestion, setNewQuestion] = useState('')
  const [answerInputs, setAnswerInputs] = useState({})
  
  // High-level State for the Wizard
  const [formData, setFormData] = useState({
    name: '',
    category: 'life',
    description: '',
    image_base64: '',
    // Blueprint (Template)
    limits: { min: 0, max: 100000000 },
    terms: '',
    // Pricing
    basePremium: 0,
    formula: 'amount * 0.01',
    // New fields for ratings and coverage
    max_coverage: 0,
    base_premium: 0,
    // Docs - downloadable documents for clients
    documents: [] // { name, url, description }
  })

  // Queries
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products', orgId],
    queryFn: async () => {
      const res = await productAPI.getProducts(orgId)
      return res.data.items
    },
    enabled: !!orgId,
  })

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['product-questions', selectedProduct?.id],
    queryFn: async () => {
      const res = await productAPI.getProductQuestions(selectedProduct.id)
      return res.data
    },
    enabled: !!selectedProduct?.id && detailsOpen,
  })

  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['product-reviews', selectedProduct?.id],
    queryFn: async () => {
      const res = await productAPI.getProductReviews(orgId, selectedProduct.id)
      return res.data
    },
    enabled: !!selectedProduct?.id && detailsOpen && !!orgId,
  })

  // Mutations
  const createQuestionMutation = useMutation({
    mutationFn: async (question) => {
      return await productAPI.createProductQuestion(selectedProduct.id, { question })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['product-questions', selectedProduct?.id])
      setNewQuestion('')
    },
  })

  const answerQuestionMutation = useMutation({
    mutationFn: async ({ questionId, answer }) => {
      return await productAPI.answerProductQuestion(selectedProduct.id, questionId, {
        answer,
        answered_by_name: user?.first_name + ' ' + user?.last_name,
        answered_by_role: user?.role
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['product-questions', selectedProduct?.id])
      setAnswerInputs({})
    },
  })

  // Mutations
  const createProductMutation = useMutation({
    mutationFn: async (data) => {
      // Step A: Create the product
      const productRes = await productAPI.createProduct(orgId, {
        name: data.name,
        category: data.category,
        description: data.description,
        image_base64: data.image_base64,
        is_active: true,
        max_coverage: data.max_coverage,
        base_premium: data.base_premium,
        documents: data.documents
      })
      const productId = productRes.data.id

      // Step B: Create the blueprint (template)
      const templateRes = await productAPI.createProductTemplate(orgId, productId, {
        product_id: productId,
        name: `${data.name} Standard Template`,
        description: data.description,
        terms_and_conditions: data.terms,
        subscription_forms: data.documents,
        coverage_limits: data.limits
      })
      const templateId = templateRes.data.id

      // Step C: Create the pricing tier/formula
      // In a real scenario, we might call another service, but for now we follow the schema
      // We assume productAPI has createPricingTier if needed, but we'll stick to basic template for now
      
      return productRes.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products', orgId])
      handleCloseWizard()
    },
  })

  const handleOpenWizard = () => {
    setActiveStep(0)
    setFormData({
      name: '',
      category: 'life',
      description: '',
      image_base64: '',
      limits: { min: 0, max: 100000000 },
      terms: '',
      basePremium: 10000,
      formula: 'amount * 0.05',
      max_coverage: 0,
      base_premium: 0,
      documents: []
    })
    setWizardOpen(true)
  }

  const handleCloseWizard = () => setWizardOpen(false)

  const handleNext = () => setActiveStep((prev) => prev + 1)
  const handleBack = () => setActiveStep((prev) => prev - 1)

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsDataURL(file)
    })
    
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, { name: file.name, url: base64, description: '' }]
    }))
  }

  const removeDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }))
  }

  const steps = ['Identity', 'Blueprint', 'Pricing', 'Compliance']

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1A73E8' }}>Basic Identity</Typography>
            <TextField
              label="Public Product Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Comprehensive Motor Plus"
            />
            <TextField
              select
              label="Industry Category"
              fullWidth
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {CATEGORIES.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Short Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 700, color: '#5F6368' }}>PRODUCT LOGO / BRANDING</Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Avatar 
                  src={formData.image_base64} 
                  variant="rounded" 
                  sx={{ width: 80, height: 80, bgcolor: '#F1F3F4', border: '1px solid #E8EAED' }}
                >
                  <ProductIcon sx={{ fontSize: 40, color: '#BDC1C6' }} />
                </Avatar>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  size="small"
                >
                  Upload Logo
                  <input type="file" hidden accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                </Button>
                {formData.image_base64 && (
                  <Button size="small" color="error" onClick={() => setFormData({ ...formData, image_base64: '' })}>Remove</Button>
                )}
              </Box>
            </Box>
          </Box>
        )
      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1A73E8' }}>Blueprint Technicals</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField 
                  label="Min Coverage (UGX)" 
                  type="number" 
                  fullWidth 
                  value={formData.limits.min}
                  onChange={(e) => setFormData({...formData, limits: {...formData.limits, min: e.target.value}})}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField 
                  label="Max Coverage (UGX)" 
                  type="number" 
                  fullWidth 
                  value={formData.limits.max}
                  onChange={(e) => setFormData({...formData, limits: {...formData.limits, max: e.target.value}})}
                />
              </Grid>
            </Grid>
            <TextField
              label="Standard Terms & Conditions"
              fullWidth
              multiline
              rows={6}
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              placeholder="Paste the legal policy terms here..."
            />
          </Box>
        )
      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1A73E8' }}>Pricing Engine</Typography>
            <TextField
              label="Base Premium (UGX)"
              type="number"
              fullWidth
              value={formData.basePremium}
              onChange={(e) => setFormData({ ...formData, basePremium: e.target.value })}
            />
            <TextField
              label="Calculation Formula"
              fullWidth
              value={formData.formula}
              onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
              helperText="Expression to calculate final premium based on risk factors"
            />
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              The formula uses standard math expressions. Example: <code>base * 1.2 + risk_factor</code>
            </Alert>
          </Box>
        )
      case 3:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1A73E8' }}>Client Documents</Typography>
            <Typography variant="body2" sx={{ color: '#5F6368' }}>
              Upload documents that clients can download and review before subscribing (e.g., policy terms, coverage details, brochures).
            </Typography>
            
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              sx={{ py: 2, borderRadius: 2, borderStyle: 'dashed' }}
            >
              Upload Document (PDF)
              <input type="file" hidden accept="application/pdf" onChange={handleFileChange} />
            </Button>

            <List>
              {formData.documents.map((doc, idx) => (
                <ListItem key={idx} sx={{ bgcolor: '#F8F9FA', borderRadius: 2, mb: 1 }}>
                  <ListItemIcon><DocsIcon color="primary" /></ListItemIcon>
                  <ListItemText primary={doc.name} secondary="Available for client download" />
                  <IconButton edge="end" color="error" onClick={() => removeDocument(idx)}>
                    <DeleteIcon />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          </Box>
        )
      default:
        return null
    }
  }

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#202124' }}>
            Product Factory
          </Typography>
          <Typography variant="body1" sx={{ color: '#5F6368' }}>
            Define, blueprint, and set compliance gates for your insurance offerings
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenWizard}
          sx={{ borderRadius: 2, px: 3, fontWeight: 700, bgcolor: '#1A73E8' }}
        >
          Build Product Blueprint
        </Button>
      </Box>

      <Grid container spacing={3}>
        {products?.map((product) => (
          <Grid item xs={12} sm={6} md={4} key={product.id}>
            <Card sx={{ 
              height: '100%', borderRadius: 4, border: '1px solid #E8EAED',
              boxShadow: 'none', transition: 'all 0.3s ease',
              '&:hover': { boxShadow: '0 8px 16px rgba(0,0,0,0.06)', borderColor: '#1A73E8' }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: '#E8F0FE', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {product.image_base64 ? (
                      <img src={product.image_base64} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <BlueprintIcon sx={{ color: '#1A73E8' }} />
                    )}
                  </Box>
                  <Chip
                    label={product.is_active ? 'Production' : 'Draft'}
                    size="small"
                    sx={{ fontWeight: 700, bgcolor: product.is_active ? '#E6F4EA' : '#F1F3F4', color: product.is_active ? '#137333' : '#5F6368' }}
                  />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>{product.name}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CategoryIcon sx={{ fontSize: 16, color: '#1A73E8' }} />
                  <Typography variant="body2" sx={{ color: '#1A73E8', fontWeight: 700, textTransform: 'uppercase' }}>{product.category}</Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip label="Gated Subscription" size="small" icon={<SecurityIcon sx={{ fontSize: '14px !important' }} />} sx={{ borderRadius: 1 }} />
                </Box>
                <Button
                  size="small"
                  onClick={() => {
                    setSelectedProduct(product)
                    setDetailsOpen(true)
                  }}
                  sx={{ mt: 2, borderRadius: 2, fontWeight: 700 }}
                >
                  View Details & Q&A
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Product Builder Wizard */}
      <Dialog open={wizardOpen} onClose={handleCloseWizard} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ bgcolor: '#F8F9FA', p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ bgcolor: '#1A73E8', color: 'white', p: 1, borderRadius: 1.5, display: 'flex' }}>
            <BlueprintIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Master Product Builder</Typography>
            <Typography variant="body2" sx={{ color: '#5F6368' }}>Step {activeStep + 1} of 4: {steps[activeStep]}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 4, minHeight: 400 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
          </Stepper>

          {renderStepContent(activeStep)}
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#F8F9FA' }}>
          <Button onClick={handleCloseWizard} sx={{ color: '#5F6368', fontWeight: 600 }}>Cancel</Button>
          <Box sx={{ flexGrow: 1 }} />
          {activeStep > 0 && <Button onClick={handleBack} startIcon={<BackIcon />}>Back</Button>}
          {activeStep < 3 ? (
            <Button variant="contained" onClick={handleNext} endIcon={<NextIcon />} sx={{ borderRadius: 2, px: 4 }}>
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              onClick={() => createProductMutation.mutate(formData)}
              disabled={createProductMutation.isLoading}
              sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}
            >
              {createProductMutation.isLoading ? <CircularProgress size={24} color="inherit" /> : 'Finalize Blueprint'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Product Details & Q&A Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ bgcolor: '#F8F9FA', p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: '#1A73E8', color: 'white', p: 1, borderRadius: 1.5, display: 'flex' }}>
              <BlueprintIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>{selectedProduct?.name}</Typography>
              <Typography variant="body2" sx={{ color: '#5F6368' }}>Product Details & Q&A</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Description</Typography>
            <Typography variant="body2" sx={{ color: '#5F6368' }}>{selectedProduct?.description}</Typography>
          </Box>

          <Box sx={{ mb: 4, display: 'flex', gap: 4 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#5F6368' }}>Max Coverage</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#1A73E8' }}>
                UGX {Number(selectedProduct?.max_coverage || 0).toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#5F6368' }}>Base Premium</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#1A73E8' }}>
                UGX {Number(selectedProduct?.base_premium || 0).toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#5F6368' }}>Rating</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#FFB300' }}>
                  {selectedProduct?.rating || 0} / 5
                </Typography>
                <Typography variant="body2" sx={{ color: '#5F6368' }}>
                  ({selectedProduct?.review_count || 0} reviews)
                </Typography>
              </Box>
            </Box>
          </Box>

          {selectedProduct?.documents && selectedProduct.documents.length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <DocsIcon sx={{ color: '#1A73E8' }} />
                Client Documents
              </Typography>
              <List>
                {selectedProduct.documents.map((doc, idx) => (
                  <ListItem key={idx} sx={{ bgcolor: '#F8F9FA', borderRadius: 2, mb: 1 }}>
                    <ListItemIcon><DocsIcon color="primary" /></ListItemIcon>
                    <ListItemText primary={doc.name} secondary={doc.description || 'Downloadable document'} />
                    <Button
                      size="small"
                      variant="outlined"
                      href={doc.url}
                      target="_blank"
                      download={doc.name}
                      sx={{ borderRadius: 2 }}
                    >
                      Download
                    </Button>
                  </ListItem>
                ))}
              </List>
            </>
          )}

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <QuestionIcon sx={{ color: '#1A73E8' }} />
            Questions & Answers
          </Typography>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Ask a question about this product..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              disabled={createQuestionMutation.isLoading}
            />
            <Button
              variant="contained"
              onClick={() => createQuestionMutation.mutate(newQuestion)}
              disabled={!newQuestion.trim() || createQuestionMutation.isLoading}
              endIcon={<SendIcon />}
              sx={{ mt: 1, borderRadius: 2 }}
            >
              {createQuestionMutation.isLoading ? 'Submitting...' : 'Ask Question'}
            </Button>
          </Box>

          {questionsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {questions?.map((q) => (
                <React.Fragment key={q.id}>
                  <ListItem sx={{ bgcolor: '#F8F9FA', borderRadius: 2, mb: 1 }}>
                    <ListItemIcon>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#E8F0FE' }}>
                        {q.user_name?.charAt(0) || 'U'}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{q.user_name || 'User'}</Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>{q.question}</Typography>
                        </Box>
                      }
                      secondary={`Asked on ${new Date(q.created_at).toLocaleDateString()}`}
                    />
                  </ListItem>

                  {q.answer && (
                    <ListItem sx={{ bgcolor: '#E6F4EA', borderRadius: 2, mb: 1, ml: 4 }}>
                      <ListItemIcon>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#1A73E8', color: 'white' }}>
                          {q.answered_by_name?.charAt(0) || 'A'}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#137333' }}>
                              {q.answered_by_name} ({q.answered_by_role})
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 0.5 }}>{q.answer}</Typography>
                          </Box>
                        }
                        secondary={`Answered on ${new Date(q.answered_at).toLocaleDateString()}`}
                      />
                    </ListItem>
                  )}

                  {!q.answer && (user?.role === 'organization_admin' || user?.role === 'underwriter' || user?.role === 'agent') && (
                    <Box sx={{ ml: 4, mb: 2, mt: 1 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="Type your answer..."
                        value={answerInputs[q.id] || ''}
                        onChange={(e) => setAnswerInputs(prev => ({ ...prev, [q.id]: e.target.value }))}
                        disabled={answerQuestionMutation.isLoading}
                        size="small"
                      />
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => answerQuestionMutation.mutate({ questionId: q.id, answer: answerInputs[q.id] })}
                        disabled={!answerInputs[q.id]?.trim() || answerQuestionMutation.isLoading}
                        sx={{ mt: 1, borderRadius: 2 }}
                      >
                        {answerQuestionMutation.isLoading ? 'Submitting...' : 'Submit Answer'}
                      </Button>
                    </Box>
                  )}
                </React.Fragment>
              ))}
            </List>
          )}

          {!questionsLoading && questions?.length === 0 && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              No questions yet. Be the first to ask!
            </Alert>
          )}

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <StarIcon sx={{ color: '#FFB300' }} />
            Customer Reviews
          </Typography>

          {reviewsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {reviews?.map((review) => (
                <ListItem key={review.id} sx={{ bgcolor: '#F8F9FA', borderRadius: 2, mb: 1 }}>
                  <ListItemIcon>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#E8F0FE' }}>
                      {review.user_id?.charAt(0) || 'U'}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {review.rating} / 5
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#5F6368' }}>
                            • {new Date(review.created_at).toLocaleDateString()}
                          </Typography>
                          {!review.is_approved && (
                            <Chip label="Pending" size="small" color="warning" />
                          )}
                        </Box>
                        <Typography variant="body1">{review.comment || 'No comment'}</Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}

          {!reviewsLoading && reviews?.length === 0 && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              No reviews yet. Be the first to review!
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#F8F9FA' }}>
          <Button onClick={() => setDetailsOpen(false)} sx={{ fontWeight: 600 }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
