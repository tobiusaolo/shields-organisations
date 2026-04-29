import React from 'react'
import {
  Box, Typography, Paper, Button, Stack, Grid,
  CircularProgress, Skeleton, Chip
} from '@mui/material'
import {
  Description as PolicyIcon,
  ShoppingBag as MarketIcon,
  History as HistoryIcon,
  AddCircleOutline as AddIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { policyAPI } from '../services/api'

export default function ClientPolicies() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: policies, isLoading } = useQuery({
    queryKey: ['my-policies', user?.id],
    queryFn: async () => {
      // Assuming policyAPI.getPolicies for client returns only their policies
      // Or we might need a specific endpoint if the existing one is admin-only
      try {
        const res = await policyAPI.getPolicies(user.organization_id, { policy_holder_id: user.id })
        return res.data.items || []
      } catch (err) {
        console.error('Failed to fetch policies:', err)
        return []
      }
    },
    enabled: !!user?.id && !!user?.organization_id
  })

  if (isLoading) {
    return (
      <Box sx={{ p: 4 }}>
        <Skeleton width="200px" height={40} sx={{ mb: 4 }} />
        <Grid container spacing={3}>
          {[1, 2, 3].map(i => (
            <Grid item xs={12} key={i}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 0 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    )
  }

  const hasPolicies = policies && policies.length > 0

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#202124', mb: 0.5 }}>
            My Policies
          </Typography>
          <Typography sx={{ color: '#5F6368', fontSize: '0.95rem' }}>
            Manage and track your active insurance coverage
          </Typography>
        </Box>
        {hasPolicies && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/client/products')}
            sx={{ borderRadius: 0, fontWeight: 700, bgcolor: '#1A237E' }}
          >
            Get New Policy
          </Button>
        )}
      </Box>

      {!hasPolicies ? (
        <Paper elevation={0} sx={{
          p: 8, textAlign: 'center', borderRadius: 0,
          border: '1px solid #E8EAED', bgcolor: '#fff',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3
        }}>
          <Box sx={{
            width: 80, height: 80, borderRadius: 0,
            bgcolor: '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <PolicyIcon sx={{ fontSize: 40, color: '#9AA0A6' }} />
          </Box>
          <Box sx={{ maxWidth: 450 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#202124', mb: 1.5 }}>
              No active policies found
            </Typography>
            <Typography sx={{ color: '#5F6368', mb: 4, lineHeight: 1.6 }}>
              It looks like you haven't purchased any insurance plans yet. Explore our marketplace to find the perfect coverage for your needs.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<MarketIcon />}
              onClick={() => navigate('/client/products')}
              sx={{
                borderRadius: 0, fontWeight: 700, px: 6, py: 1.5,
                bgcolor: '#1A237E', boxShadow: 'none',
                '&:hover': { bgcolor: '#0d1b6e', boxShadow: 'none' }
              }}
            >
              Go to Marketplace
            </Button>
          </Box>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {policies.map(policy => (
            <Grid item xs={12} key={policy.id}>
              <Paper elevation={0} sx={{
                p: 3, borderRadius: 0, border: '1px solid #E8EAED',
                bgcolor: '#fff', transition: 'all 0.2s',
                '&:hover': { borderColor: '#1A237E', boxShadow: '0 4px 20px rgba(26,35,126,0.08)' }
              }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={2.5} alignItems="center">
                      <Box sx={{
                        width: 52, height: 52, borderRadius: 0,
                        bgcolor: '#E8F0FE', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <PolicyIcon sx={{ color: '#1A237E', fontSize: 24 }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#202124' }}>
                          {policy.product_name || 'Insurance Plan'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.85rem', color: '#5F6368', fontFamily: 'monospace' }}>
                          #{policy.policy_number}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#9AA0A6', mb: 0.5, textTransform: 'uppercase' }}>
                      Status
                    </Typography>
                    <Chip
                      label={policy.status?.toUpperCase()}
                      size="small"
                      sx={{
                        fontWeight: 800, fontSize: '0.65rem', borderRadius: 0,
                        bgcolor: policy.status === 'active' ? '#E6F4EA' : '#FEF3E2',
                        color: policy.status === 'active' ? '#1E8E3E' : '#E37400'
                      }}
                    />
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#9AA0A6', mb: 0.5, textTransform: 'uppercase' }}>
                      Premium
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: '#202124' }}>
                      UGX {Number(policy.premium).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={2} sx={{ textAlign: 'right' }}>
                    <Button variant="outlined" sx={{ borderRadius: 0, fontWeight: 700 }}>
                      Details
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}
