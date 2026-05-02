import React, { useState } from 'react'
import {
  Box, Grid, Typography, TextField, InputAdornment, Chip,
  Stack, Card, CardContent, CardMedia, Button, CircularProgress,
  Avatar, Paper, Divider, Dialog, IconButton
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import {
  Search as SearchIcon, Shield as ShieldIcon,
  ArrowForward as ArrowIcon, CheckCircle as VerifiedIcon,
  Close as CloseIcon, Star as StarIcon, Business as BusinessIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { publicAPI } from '../services/api'

const CATEGORIES = [
  { id: 'all', label: 'All Plans', emoji: '🛡️' },
  { id: 'health', label: 'Health', emoji: '🏥' },
  { id: 'life', label: 'Life', emoji: '❤️' },
  { id: 'motor', label: 'Motor', emoji: '🚗' },
  { id: 'property', label: 'Property', emoji: '🏠' },
  { id: 'travel', label: 'Travel', emoji: '✈️' },
]

export default function ClientProducts() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [preview, setPreview] = useState(null)

  const { data: products = [], isLoading: loading } = useQuery({
    queryKey: ['public-products'],
    queryFn: async () => {
      const res = await publicAPI.getPublicProducts()
      return res.data?.items || res.data || []
    }
  })

  const filtered = products.filter(p => {
    const matchQ = p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase())
    const matchC = category === 'all' || (p.category || 'other').toLowerCase() === category
    return matchQ && matchC
  })

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress sx={{ color: '#1A237E' }} />
    </Box>
  )

  return (
    <Box sx={{ pb: 6 }}>
      {/* Hero Search */}
      <Box sx={{ mb: 5, p: { xs: 4, md: 6 }, bgcolor: '#F8F9FA', borderRadius: 0, border: '1px solid #E8EAED', textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#202124', mb: 1 }}>Find the right plan for you</Typography>
        <Typography sx={{ color: '#5F6368', mb: 4 }}>
          Browse {products.length} insurance plans from Uganda's top providers.
        </Typography>
        <Box sx={{ maxWidth: 560, mx: 'auto' }}>
          <TextField
            fullWidth
            placeholder="Search by plan name or coverage type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#9AA0A6' }} /></InputAdornment>,
              sx: { borderRadius: 0, bgcolor: '#fff', fontSize: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }
            }}
          />
        </Box>
      </Box>

      {/* Category Filter Tabs */}
      <Stack direction="row" spacing={1} sx={{ mb: 4, flexWrap: 'wrap', gap: 1 }}>
        {CATEGORIES.map(cat => (
          <Chip
            key={cat.id}
            label={`${cat.emoji} ${cat.label}`}
            onClick={() => setCategory(cat.id)}
            sx={{
              fontWeight: 700, fontSize: '0.88rem', px: 1, py: 2.5,
              borderRadius: 0, cursor: 'pointer',
              bgcolor: category === cat.id ? '#1A237E' : '#fff',
              color: category === cat.id ? '#fff' : '#202124',
              border: '1px solid', borderColor: category === cat.id ? '#1A237E' : '#E8EAED',
              '&:hover': { bgcolor: category === cat.id ? '#0d1b6e' : '#F8F9FA' },
              transition: 'all 0.2s'
            }}
          />
        ))}
      </Stack>

      {/* Results count */}
      <Typography variant="body2" sx={{ color: '#5F6368', mb: 3, fontWeight: 500 }}>
        {filtered.length} plan{filtered.length !== 1 ? 's' : ''} found{category !== 'all' ? ` in ${CATEGORIES.find(c => c.id === category)?.label}` : ''}
      </Typography>

      {/* Products Grid */}
      {filtered.length > 0 ? (
        <Grid container spacing={3}>
          {filtered.map(product => (
            <Grid item xs={12} sm={6} lg={4} key={product.id}>
              <Card elevation={0} sx={{ borderRadius: 0, border: '1px solid #E8EAED', height: '100%', display: 'flex', flexDirection: 'column', transition: 'all 0.25s', '&:hover': { borderColor: '#1A237E', boxShadow: '0 8px 32px rgba(26,35,126,0.1)', transform: 'translateY(-3px)' } }}>
                {/* Card Image / Header */}
                <Box sx={{ height: 140, bgcolor: '#E8F0FE', position: 'relative', borderRadius: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {product.image_base64
                    ? <CardMedia component="img" image={product.image_base64} sx={{ height: '100%', width: '100%', objectFit: 'cover' }} />
                    : <ShieldIcon sx={{ fontSize: 56, color: '#1A237E', opacity: 0.25 }} />
                  }
                  <Chip label={product.category?.toUpperCase() || 'INSURANCE'} size="small"
                    sx={{ position: 'absolute', top: 12, left: 12, bgcolor: '#1A237E', color: '#fff', fontWeight: 700, borderRadius: 0, fontSize: '0.7rem' }} />
                  
                  {/* Provider Hero Overlay */}
                  <Box sx={{ 
                    position: 'absolute', bottom: 0, left: 0, right: 0, 
                    bgcolor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)',
                    px: 1.5, py: 1, display: 'flex', alignItems: 'center', gap: 1,
                    borderTop: '1px solid rgba(0,0,0,0.05)'
                  }}>
                    <Avatar 
                      src={product.provider_logo} 
                      sx={{ width: 22, height: 22, bgcolor: '#fff', border: '1px solid #E8EAED' }}
                    >
                      <BusinessIcon sx={{ fontSize: 14, color: '#9AA0A6' }} />
                    </Avatar>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#1A237E', fontSize: '0.65rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {product.provider_name || 'Shields Partner'}
                    </Typography>
                  </Box>
                </Box>

                <CardContent sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {/* Verified badge */}
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <VerifiedIcon sx={{ fontSize: 14, color: '#2E7D32' }} />
                    <Typography variant="caption" sx={{ color: '#2E7D32', fontWeight: 700 }}>SHIELDS VERIFIED</Typography>
                  </Stack>

                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#202124', lineHeight: 1.3 }}>{product.name}</Typography>
                  <Typography variant="body2" sx={{ color: '#5F6368', lineHeight: 1.7, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {product.description}
                  </Typography>

                  <Box sx={{ mt: 'auto' }}>
                    <Divider sx={{ mb: 2 }} />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="caption" sx={{ color: '#5F6368', fontWeight: 600, display: 'block', mb: 0.5 }}>Pricing Tiers ({product.tiers_count || 0})</Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {product.tier_names && product.tier_names.length > 0 ? (
                            product.tier_names.map((tName, i) => (
                              <Chip key={i} label={tName} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#E8F0FE', color: '#1A73E8', borderRadius: 1 }} />
                            ))
                          ) : (
                            <Typography variant="caption" sx={{ color: '#9AA0A6', fontStyle: 'italic' }}>
                              {(product.tiers_count || 0) > 0 ? 'Names pending...' : 'Dynamic'}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="text" onClick={() => setPreview(product)}
                          sx={{ color: '#5F6368', fontWeight: 700, borderRadius: 0, px: 1.5 }}>
                          Details
                        </Button>
                        <Button size="small" variant="contained" onClick={() => navigate(`/client/products/${product.id}`)}
                          sx={{ bgcolor: '#1A237E', color: '#fff', fontWeight: 700, borderRadius: 0, boxShadow: 'none', '&:hover': { bgcolor: '#0d1b6e', boxShadow: 'none' } }}>
                          Purchase
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <ShieldIcon sx={{ fontSize: 56, color: '#E8EAED', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#202124', fontWeight: 700, mb: 0.5 }}>No plans found</Typography>
          <Typography variant="body2" sx={{ color: '#5F6368', mb: 3 }}>Try adjusting your search or changing the category.</Typography>
          <Button onClick={() => { setSearch(''); setCategory('all') }} variant="outlined"
            sx={{ borderRadius: 0, borderColor: '#1A237E', color: '#1A237E', fontWeight: 700 }}>
            Clear filters
          </Button>
        </Box>
      )}

      {/* Product Detail Dialog */}
      <Dialog open={Boolean(preview)} onClose={() => setPreview(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 0} }}>
        {preview && (
          <Box sx={{ p: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
              <Box>
                <Chip label={preview.category?.toUpperCase()} size="small" sx={{ bgcolor: '#E8F0FE', color: '#1A237E', fontWeight: 700, borderRadius: 0, mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#202124' }}>{preview.name}</Typography>
              </Box>
              <IconButton onClick={() => setPreview(null)} size="small"><CloseIcon /></IconButton>
            </Stack>

            <Typography variant="body1" sx={{ color: '#5F6368', lineHeight: 1.8, mb: 3 }}>{preview.description}</Typography>

            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ color: '#5F6368', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, mb: 2, display: 'block' }}>Available Tiers & Benefits</Typography>
              <Stack spacing={2}>
                {(preview.tiers || []).length > 0 ? preview.tiers.map((tier, idx) => (
                  <Paper key={idx} elevation={0} sx={{ p: 2, border: '1px solid #E8EAED', bgcolor: '#F8F9FA', borderRadius: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#1A237E' }}>{tier.name}</Typography>
                      <Typography sx={{ fontWeight: 900, fontSize: '0.9rem', color: '#1E8E3E' }}>UGX {(tier.coverage_amount || 0).toLocaleString()}</Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#5F6368', display: 'block', mb: 1.5 }}>{tier.description}</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                      {(tier.benefits || []).map((benefit, bIdx) => (
                        <Chip 
                          key={bIdx} 
                          label={benefit} 
                          size="small" 
                          sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#E8F0FE', color: '#1A73E8', borderRadius: 1 }} 
                        />
                      ))}
                    </Box>
                  </Paper>
                )) : (
                  <Typography variant="body2" sx={{ color: '#9AA0A6', fontStyle: 'italic' }}>No tiered pricing defined. Enrollment is based on dynamic assessment.</Typography>
                )}
              </Stack>
            </Box>

            <Box sx={{ mt: 4, pt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" onClick={() => { setPreview(null); navigate(`/client/products/${preview.id}`) }}
                sx={{ bgcolor: '#1A237E', borderRadius: 0, fontWeight: 700, px: 3, boxShadow: 'none', '&:hover': { bgcolor: '#0d1b6e', boxShadow: 'none' } }}>
                Get a Quote →
              </Button>
            </Box>
          </Box>
        )}
      </Dialog>
    </Box>
  )
}
