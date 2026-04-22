import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { commissionAPI, tenancyAPI } from '../services/api'
import { formatCurrencyShort } from '../utils/formatters'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Avatar,
  Grid,
  Divider,
  IconButton,
  Alert,
  Chip,
  Card,
  CardContent,
  Tooltip,
} from '@mui/material'
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CameraAlt as CameraIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Verified as VerifiedIcon,
  Shield as ShieldIcon,
  TrendingUp as TrendIcon,
  Description as PolicyIcon,
  Assignment as ClaimIcon,
  Payments as CommIcon,
} from '@mui/icons-material'

export default function Profile() {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    firstName: user?.first_name || 'John',
    lastName: user?.last_name || 'Doe',
    email: user?.email || 'john.doe@example.com',
    phone: user?.phone || '+256 700 000 000',
    location: 'Kampala, Uganda',
    organization: user?.organization_name || 'Insurance Company Ltd',
    role: user?.role ? user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Organization Admin',
    bio: 'Insurance professional with 5+ years experience in East African markets.',
  })
  const [draft, setDraft] = useState(form)

  const handleSave = () => {
    setForm(draft)
    setEditing(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 4000)
  }

  const handleCancel = () => {
    setDraft(form)
    setEditing(false)
  }

  const initials = `${form.firstName[0] || ''}${form.lastName[0] || ''}`.toUpperCase()

  const { data: memData } = useQuery({
    queryKey: ['profile-memberships', user?.id],
    queryFn: async () => (await tenancyAPI.getMemberships(user?.id)).data,
    enabled: !!user?.id,
  })
  const myMemId = memData?.items?.find((m) => m.organization_id === user?.organization_id)?.id
  const { data: ledgerData } = useQuery({
    queryKey: ['profile-ledger', user?.organization_id, myMemId],
    queryFn: async () => (await commissionAPI.getLedger(user?.organization_id, myMemId)).data,
    enabled: !!user?.organization_id && !!myMemId,
  })
  const totalEarned = ledgerData?.items?.filter(l => l.entry_type === 'earned').reduce((s, l) => s + Number(l.amount), 0) || 0
  const ledgerCurrency = ledgerData?.items?.[0]?.currency || user?.currency || 'UGX'

  const STATS = [
    { icon: PolicyIcon, label: 'Policies Managed', value: '24', color: '#1A73E8', bg: '#E8F0FE' },
    { icon: ClaimIcon, label: 'Claims Processed', value: '8', color: '#E37400', bg: '#FEF3E2' },
    { icon: CommIcon, label: 'Commission Earned', value: formatCurrencyShort(totalEarned, ledgerCurrency), color: '#1E8E3E', bg: '#E6F4EA' },
  ]

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#202124', mb: 0.5 }}>Profile</Typography>
        <Typography sx={{ color: '#5F6368', fontSize: '0.9rem' }}>
          Manage your personal information and account preferences
        </Typography>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2.5 }} onClose={() => setSuccess(false)}>
          Profile updated successfully!
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left sidebar */}
        <Grid item xs={12} md={4} lg={3}>
          {/* Avatar card */}
          <Paper elevation={1} sx={{ p: 3, textAlign: 'center', mb: 2.5 }}>
            <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
              <Avatar sx={{
                width: 100, height: 100,
                bgcolor: '#1A73E8',
                fontSize: '2rem', fontWeight: 800,
                boxShadow: '0 4px 20px rgba(26,115,232,0.3)',
              }}>
                {initials}
              </Avatar>
              <Tooltip title="Change photo">
                <IconButton
                  size="small"
                  sx={{
                    position: 'absolute', bottom: -2, right: -2,
                    bgcolor: '#1A73E8', color: '#fff', width: 30, height: 30,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    '&:hover': { bgcolor: '#1557B0' },
                  }}
                >
                  <CameraIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#202124' }}>
              {form.firstName} {form.lastName}
            </Typography>
            <Typography sx={{ fontSize: '0.82rem', color: '#5F6368', mb: 1.5 }}>
              {form.role}
            </Typography>
            <Chip
              icon={<VerifiedIcon sx={{ fontSize: '14px !important' }} />}
              label="Verified Account"
              size="small"
              sx={{ bgcolor: '#E6F4EA', color: '#1E8E3E', fontWeight: 600, fontSize: '0.72rem', height: 26 }}
            />
            {!editing && (
              <Box sx={{ mt: 2.5 }}>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => setEditing(true)}
                  fullWidth
                  sx={{ borderRadius: 2.5, fontWeight: 600 }}
                >
                  Edit Profile
                </Button>
              </Box>
            )}
          </Paper>

          {/* Quick Stats */}
          <Paper elevation={1} sx={{ p: 2.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#202124', mb: 2 }}>
              Activity Summary
            </Typography>
            {STATS.map(({ icon: Icon, label, value, color, bg }) => (
              <Box key={label} sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                mb: 2, '&:last-child': { mb: 0 },
              }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon sx={{ fontSize: 18, color }} />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography sx={{ fontSize: '0.72rem', color: '#9AA0A6' }}>{label}</Typography>
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#202124' }}>{value}</Typography>
                </Box>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={8} lg={9}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#202124' }}>
                  Personal Information
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', color: '#9AA0A6' }}>
                  {editing ? 'Edit your details and save when done' : 'Your personal contact details'}
                </Typography>
              </Box>
              {editing && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined" size="small"
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    sx={{ borderRadius: 2, fontWeight: 600, color: '#5F6368', borderColor: '#DADCE0' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained" size="small"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                  >
                    Save Changes
                  </Button>
                </Box>
              )}
            </Box>

            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              {[
                { label: 'First Name', key: 'firstName', xs: 12, sm: 6, icon: PersonIcon },
                { label: 'Last Name', key: 'lastName', xs: 12, sm: 6, icon: PersonIcon },
                { label: 'Email Address', key: 'email', xs: 12, sm: 6, icon: EmailIcon, type: 'email' },
                { label: 'Phone Number', key: 'phone', xs: 12, sm: 6, icon: PhoneIcon },
                { label: 'Location', key: 'location', xs: 12, icon: LocationIcon },
                { label: 'Short Bio', key: 'bio', xs: 12, multiline: true },
              ].map(({ label, key, xs, sm, icon: Icon, type, multiline }) => (
                <Grid item xs={xs} sm={sm} key={key}>
                  {editing ? (
                    <TextField
                      fullWidth label={label} type={type || 'text'}
                      value={draft[key]}
                      onChange={(e) => setDraft(d => ({ ...d, [key]: e.target.value }))}
                      multiline={multiline} rows={multiline ? 3 : undefined}
                      size="medium"
                      InputProps={Icon && !multiline ? {
                        startAdornment: <Icon sx={{ mr: 1, fontSize: 18, color: '#9AA0A6' }} />,
                      } : undefined}
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }}
                    />
                  ) : (
                    <Box>
                      <Typography sx={{ fontSize: '0.72rem', color: '#9AA0A6', mb: 0.5, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        {label}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {Icon && !multiline && <Icon sx={{ fontSize: 16, color: '#9AA0A6' }} />}
                        <Typography sx={{ fontSize: '0.9rem', color: '#202124', fontWeight: 500, lineHeight: 1.4 }}>
                          {form[key] || '—'}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Organization Info */}
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#202124', mb: 0.5 }}>
                Organization
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: '#9AA0A6', mb: 2.5 }}>
                Organization membership details (read-only)
              </Typography>
              <Grid container spacing={2.5}>
                {[
                  { label: 'Organization', val: form.organization, icon: BusinessIcon },
                  { label: 'Role', val: form.role, icon: ShieldIcon },
                ].map(({ label, val, icon: Icon }) => (
                  <Grid item xs={12} sm={6} key={label}>
                    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: '#F8F9FE', border: '1px solid #E8EAED', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#E8F0FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon sx={{ fontSize: 18, color: '#1A73E8' }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.72rem', color: '#9AA0A6' }}>{label}</Typography>
                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#202124' }}>{val}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
