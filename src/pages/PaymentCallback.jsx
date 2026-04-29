import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Box, Paper, Typography, Button, Stack, CircularProgress,
  Avatar, Divider, Chip
} from '@mui/material'
import {
  CheckCircle as SuccessIcon,
  ErrorOutline as FailIcon,
  Download as DownloadIcon,
  Home as HomeIcon,
  Refresh as RetryIcon,
  Security as ShieldIcon,
} from '@mui/icons-material'
import { publicAPI } from '../services/api'

export default function PaymentCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const trackingId = searchParams.get('OrderTrackingId')
  const reference  = searchParams.get('OrderMerchantReference')

  const [status, setStatus]   = useState('checking') // checking | success | failed
  const [policyInfo, setPolicyInfo] = useState(null)
  const [error, setError]     = useState(null)
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    if (!reference) {
      setStatus('failed')
      setError('No payment reference found. Your draft has been saved.')
      return
    }

    let poll
    const check = async () => {
      try {
        const res = await publicAPI.checkPolicyStatus(reference).catch(() => null)
        if (res?.data?.status === 'active') {
          setPolicyInfo(res.data)
          setStatus('success')
          clearInterval(poll)
        } else if (attempts >= 10) {
          // Give up polling after ~30s
          setStatus('failed')
          setError('Payment verification timed out. If funds were deducted, your policy will be activated within minutes.')
          clearInterval(poll)
        }
      } catch {
        if (attempts >= 10) {
          setStatus('failed')
          setError('Unable to confirm your payment at this time.')
          clearInterval(poll)
        }
      }
      setAttempts(a => a + 1)
    }

    check()
    poll = setInterval(check, 3000)
    return () => clearInterval(poll)
  }, [reference])

  return (
    <Box sx={{
      minHeight: '100vh', bgcolor: '#F4F6F8',
      display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3
    }}>
      <Paper elevation={0} sx={{
        p: { xs: 4, md: 6 }, borderRadius: 0,
        border: '1px solid #E8EAED', bgcolor: '#fff',
        maxWidth: 520, width: '100%', textAlign: 'center'
      }}>
        {/* Logo */}
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5} sx={{ mb: 5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: 0,
            background: 'linear-gradient(135deg, #1A73E8, #0D47A1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldIcon sx={{ color: '#fff', fontSize: 18 }} />
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#202124' }}>Shields Insurance</Typography>
        </Stack>

        {/* CHECKING STATE */}
        {status === 'checking' && (
          <Box>
            <CircularProgress size={64} thickness={3} sx={{ color: '#1A73E8', mb: 3 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#202124', mb: 1 }}>
              Confirming Payment
            </Typography>
            <Typography sx={{ color: '#70757A', mb: 1 }}>
              Please wait while we verify your transaction with PesaPal.
            </Typography>
            <Typography variant="caption" sx={{ color: '#BDC1C6' }}>
              Do not close this page · Attempt {attempts + 1} of 10
            </Typography>
          </Box>
        )}

        {/* SUCCESS STATE */}
        {status === 'success' && (
          <Box>
            <Avatar sx={{ width: 88, height: 88, bgcolor: '#E8F5E9', color: '#2E7D32', mx: 'auto', mb: 3 }}>
              <SuccessIcon sx={{ fontSize: 52 }} />
            </Avatar>
            <Chip label="PAYMENT CONFIRMED" size="small" sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 700, fontSize: '0.7rem', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#202124', mb: 1 }}>
              You're Protected! 🎉
            </Typography>
            <Typography sx={{ color: '#70757A', mb: 4 }}>
              Your policy is now active. A confirmation has been sent to your email.
            </Typography>

            {policyInfo && (
              <Paper elevation={0} sx={{ p: 3, bgcolor: '#F8F9FA', borderRadius: 0, mb: 4, textAlign: 'left' }}>
                <Stack spacing={2}>
                  {[
                    { label: 'Policy Number', value: policyInfo.policy_number || '—' },
                    { label: 'Product',        value: policyInfo.product_name   || '—' },
                    { label: 'Status',         value: 'Active'                        },
                    { label: 'Transaction Ref',value: reference                        },
                  ].map(row => (
                    <Stack key={row.label} direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" sx={{ color: '#70757A', fontWeight: 600 }}>{row.label}</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#202124' }}>{row.value}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            )}

            <Stack spacing={2}>
              <Button
                variant="contained" fullWidth startIcon={<HomeIcon />}
                onClick={() => navigate('/client')}
                sx={{ borderRadius: 0, py: 1.5, textTransform: 'none', fontWeight: 600, bgcolor: '#1A73E8', boxShadow: 'none' }}
              >
                Go to Dashboard
              </Button>
              <Button
                variant="outlined" fullWidth startIcon={<DownloadIcon />}
                sx={{ borderRadius: 0, py: 1.5, textTransform: 'none', fontWeight: 600, borderColor: '#DADCE0', color: '#5F6368' }}
              >
                Download Policy Certificate
              </Button>
            </Stack>
          </Box>
        )}

        {/* FAILED STATE */}
        {status === 'failed' && (
          <Box>
            <Avatar sx={{ width: 88, height: 88, bgcolor: '#FEEBEE', color: '#D93025', mx: 'auto', mb: 3 }}>
              <FailIcon sx={{ fontSize: 52 }} />
            </Avatar>
            <Chip label="PAYMENT ISSUE" size="small" sx={{ bgcolor: '#FEEBEE', color: '#D93025', fontWeight: 700, fontSize: '0.7rem', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#202124', mb: 1 }}>
              Payment Incomplete
            </Typography>
            <Typography sx={{ color: '#70757A', mb: 4 }}>
              {error || 'Something went wrong. Your draft has been saved — you can retry anytime.'}
            </Typography>

            <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#FFF8E1', borderRadius: 0, border: '1px solid #FFE082', mb: 4, textAlign: 'left' }}>
              <Typography variant="caption" sx={{ color: '#E65100', fontWeight: 600 }}>
                💾 Your quote has been saved as a draft. Log in to your dashboard to retry payment at any time.
              </Typography>
            </Paper>

            <Stack spacing={2}>
              <Button
                variant="contained" fullWidth startIcon={<RetryIcon />}
                onClick={() => navigate(-2)} // Go back to product page
                sx={{ borderRadius: 0, py: 1.5, textTransform: 'none', fontWeight: 600, bgcolor: '#1A73E8', boxShadow: 'none' }}
              >
                Retry Payment
              </Button>
              <Button
                variant="outlined" fullWidth startIcon={<HomeIcon />}
                onClick={() => navigate('/client')}
                sx={{ borderRadius: 0, py: 1.5, textTransform: 'none', fontWeight: 600, borderColor: '#DADCE0', color: '#5F6368' }}
              >
                Go to Dashboard (Draft Saved)
              </Button>
            </Stack>
          </Box>
        )}

        <Divider sx={{ my: 4, borderStyle: 'dashed' }} />
        <Typography variant="caption" sx={{ color: '#BDC1C6' }}>
          Ref: {reference || '—'} · {trackingId || '—'}<br />
          Secured by PesaPal · CarryIT Digital Ledger
        </Typography>
      </Paper>
    </Box>
  )
}
