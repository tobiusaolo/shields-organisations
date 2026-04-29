import React from 'react'
import {
  Box, Typography, Paper, Button, Stack, Grid,
  Skeleton
} from '@mui/material'
import {
  Assignment as ClaimIcon,
  ShoppingBag as MarketIcon,
  AddCircleOutline as AddIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useQuery } from '@tanstack/react-query'

export default function ClientClaims() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // For now, let's assume claims would be fetched here
  // But the logic is: if no policies, you can't even have claims
  const { data: claims, isLoading } = useQuery({
    queryKey: ['my-claims', user?.id],
    queryFn: async () => {
      // Placeholder for actual claims fetching
      return []
    },
    enabled: !!user?.id
  })

  if (isLoading) {
    return (
      <Box sx={{ p: 4 }}>
        <Skeleton width="200px" height={40} sx={{ mb: 4 }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 0 }} />
      </Box>
    )
  }

  const hasClaims = claims && claims.length > 0

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#202124', mb: 0.5 }}>
            Claims Center
          </Typography>
          <Typography sx={{ color: '#5F6368', fontSize: '0.95rem' }}>
            Submit and track your insurance claims in real-time
          </Typography>
        </Box>
        {hasClaims && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ borderRadius: 0, fontWeight: 700, bgcolor: '#1A237E' }}
          >
            File New Claim
          </Button>
        )}
      </Box>

      {!hasClaims ? (
        <Paper elevation={0} sx={{
          p: 8, textAlign: 'center', borderRadius: 0,
          border: '1px solid #E8EAED', bgcolor: '#fff',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3
        }}>
          <Box sx={{
            width: 80, height: 80, borderRadius: 0,
            bgcolor: '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ClaimIcon sx={{ fontSize: 40, color: '#9AA0A6' }} />
          </Box>
          <Box sx={{ maxWidth: 450 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#202124', mb: 1.5 }}>
              No claims found
            </Typography>
            <Typography sx={{ color: '#5F6368', mb: 4, lineHeight: 1.6 }}>
              You don't have any active claims at the moment. To file a claim, you must first have an active policy. Visit the marketplace to get started.
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
        <Typography>Claims list would go here...</Typography>
      )}
    </Box>
  )
}
