import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { promotionAPI } from '../services/api'
import {
  Box, Typography, Grid, Paper, Tooltip, IconButton, Avatar, Chip, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider
} from '@mui/material'
import {
  LocalOffer as CouponIcon,
  ContentCopy as CopyIcon,
  People as ReferralIcon,
} from '@mui/icons-material'

const AVATAR_COLORS = ['#1A73E8', '#1E8E3E', '#E37400', '#7B61FF', '#D93025']

export default function Promotions() {
  const { user } = useAuth()
  const orgId = user?.organization_id

  const { data: coupons = [], isLoading: couponsLoading } = useQuery({
    queryKey: ['coupons', orgId],
    queryFn: async () => {
      const res = await promotionAPI.getCoupons(orgId)
      return res.data
    },
    enabled: !!orgId
  })

  const { data: referralCodeData, isLoading: referralLoading } = useQuery({
    queryKey: ['my-referral-code'],
    queryFn: async () => {
      const res = await promotionAPI.getMyReferralCode()
      return res.data
    }
  })

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    // Optional: Add a toast notification here
  }

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#202124', mb: 0.5 }}>Promotions</Typography>
        <Typography sx={{ color: '#5F6368', fontSize: '0.9rem' }}>
          Your referral code and available platform coupons
        </Typography>
      </Box>

      {/* ── My Referral Code ── */}
      <Paper sx={{ mb: 4, borderRadius: 4, overflow: 'hidden', border: '1px solid #E8EAED', display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ p: 4, bgcolor: '#F8F9FE', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Avatar sx={{ bgcolor: 'rgba(26,115,232,0.1)', color: '#1A73E8', width: 48, height: 48 }}>
              <ReferralIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#202124' }}>Refer & Earn</Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#5F6368' }}>Share this code with your network.</Typography>
            </Box>
          </Box>
          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            {referralLoading ? <CircularProgress size={24} /> : (
              <>
                <Paper elevation={0} sx={{ py: 1.5, px: 3, border: '2px dashed #1A73E8', borderRadius: 2, bgcolor: '#FFFFFF' }}>
                  <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1.2rem', color: '#1A73E8', letterSpacing: '0.1em' }}>
                    {referralCodeData?.code || '—'}
                  </Typography>
                </Paper>
                <Tooltip title="Copy Code">
                  <IconButton onClick={() => handleCopy(referralCodeData?.code)} sx={{ bgcolor: '#FFFFFF', border: '1px solid #E8EAED', '&:hover': { bgcolor: '#F1F3F4' } }}>
                    <CopyIcon sx={{ color: '#5F6368' }} />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>
        <Box sx={{ p: 4, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: { md: '1px solid #E8EAED' } }}>
          <Typography sx={{ fontWeight: 700, color: '#202124', mb: 2 }}>Your Rewards</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box>
                <Typography sx={{ fontSize: '0.8rem', color: '#5F6368', fontWeight: 600 }}>Total Referrals</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#34A853' }}>{referralCodeData?.total_successful_referrals || 0}</Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* ── Active Coupons ── */}
      <Typography variant="h6" sx={{ fontWeight: 800, color: '#202124', mb: 2 }}>Available Coupons</Typography>
      <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #E8EAED' }}>
        {couponsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 800, fontSize: '0.75rem', color: '#5F6368', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #E8EAED' } }}>
                  <TableCell>Code</TableCell>
                  <TableCell>Discount</TableCell>
                  <TableCell>Requirements</TableCell>
                  <TableCell>Valid Until</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {coupons.filter(c => c.is_active && (!c.expiry_date || new Date(c.expiry_date) > new Date())).length === 0 && (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6, color: '#9AA0A6' }}>No active coupons available right now.</TableCell></TableRow>
                )}
                {coupons.filter(c => c.is_active && (!c.expiry_date || new Date(c.expiry_date) > new Date())).map((c, i) => (
                  <TableRow key={c.id} sx={{ '&:hover': { bgcolor: '#F8F9FE' } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: AVATAR_COLORS[i % AVATAR_COLORS.length] + '15', color: AVATAR_COLORS[i % AVATAR_COLORS.length], width: 32, height: 32 }}>
                          <CouponIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '0.9rem', color: '#202124' }}>{c.code}</Typography>
                          <Typography sx={{ fontSize: '0.72rem', color: '#5F6368' }}>{c.description || 'Global Promo'}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#34A853' }}>
                      {c.discount_type === 'percentage' ? `${(c.discount_value * 100).toFixed(0)}% OFF` : `UGX ${c.discount_value?.toLocaleString()} OFF`}
                    </TableCell>
                    <TableCell>
                      {c.min_premium > 0 ? (
                        <Typography sx={{ fontSize: '0.8rem', color: '#5F6368' }}>Min. Spend: UGX {c.min_premium.toLocaleString()}</Typography>
                      ) : (
                        <Typography sx={{ fontSize: '0.8rem', color: '#9AA0A6' }}>No minimum spend</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.82rem', color: '#202124', fontWeight: 500 }}>
                      {c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : 'No Expiry'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  )
}
