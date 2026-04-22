import React, { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Switch,
  Divider,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material'
import {
  Notifications as NotifIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  Palette as AppearanceIcon,
  Lock as LockIcon,
  Email as EmailIcon,
  Save as SaveIcon,
  DarkMode as DarkModeIcon,
  Sms as SmsIcon,
  PhoneAndroid as PushIcon,
  VerifiedUser as TFAIcon,
  ManageAccounts as PersonalIcon,
  ChevronRight as ChevRight,
  FiberManualRecord as DotIcon,
  Payments as PaymentsIcon,
  Edit as EditIcon,
} from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'
import { paymentAPI } from '../services/api'

const SECTION_CONFIGS = [
  {
    key: 'notifications',
    title: 'Notifications',
    subtitle: 'Control how and when you receive alerts',
    icon: NotifIcon,
    color: '#1A73E8',
    bg: '#E8F0FE',
  },
  {
    key: 'security',
    title: 'Security',
    subtitle: 'Manage authentication and access controls',
    icon: SecurityIcon,
    color: '#1E8E3E',
    bg: '#E6F4EA',
  },
  {
    key: 'preferences',
    title: 'Preferences',
    subtitle: 'Locale, timezone and display settings',
    icon: LanguageIcon,
    color: '#7B61FF',
    bg: '#F0EDFF',
  },
  {
    key: 'appearance',
    title: 'Appearance',
    subtitle: 'Theme and layout customization',
    icon: AppearanceIcon,
    color: '#E37400',
    bg: '#FEF3E2',
  },
]

function SettingsSection({ icon: Icon, title, subtitle, color, bg, children }) {
  return (
    <Paper elevation={1} sx={{ overflow: 'hidden' }}>
      <Box sx={{
        p: 3, borderBottom: '1px solid #E8EAED',
        display: 'flex', alignItems: 'center', gap: 2,
      }}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2.5, bgcolor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon sx={{ fontSize: 20, color }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#202124' }}>{title}</Typography>
          <Typography sx={{ fontSize: '0.78rem', color: '#9AA0A6' }}>{subtitle}</Typography>
        </Box>
      </Box>
      <Box sx={{ px: 0.5 }}>{children}</Box>
    </Paper>
  )
}

function ToggleRow({ label, desc, checked, onChange, icon: Icon }) {
  return (
    <>
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, py: 2,
        '&:hover': { bgcolor: 'rgba(26,115,232,0.03)' },
        transition: 'background 0.15s',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {Icon && <Icon sx={{ fontSize: 18, color: '#9AA0A6' }} />}
          <Box>
            <Typography sx={{ fontSize: '0.88rem', fontWeight: 500, color: '#202124' }}>{label}</Typography>
            {desc && <Typography sx={{ fontSize: '0.75rem', color: '#9AA0A6' }}>{desc}</Typography>}
          </Box>
        </Box>
        <Switch
          checked={checked}
          onChange={onChange}
          size="small"
          sx={{
            '& .MuiSwitch-switchBase.Mui-checked': { color: '#1A73E8' },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#1A73E8' },
          }}
        />
      </Box>
    </>
  )
}

export default function Settings() {
  const [success, setSuccess] = useState(false)
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    claimAlerts: true,
    policyAlerts: true,
    commissionAlerts: true,
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: true,
    language: 'en',
    timezone: 'Africa/Kampala',
    dateFormat: 'DD/MM/YYYY',
    currency: 'UGX',
    darkMode: false,
    compactMode: false,
    highContrast: false,
  })

  const { organizationId } = useAuth()
  const [pesapal, setPesapal] = useState({
    consumer_key: '',
    consumer_secret: '',
    is_sandbox: true,
    ipn_id: '',
  })
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [configError, setConfigError] = useState(null)
  const [isEditingPesapal, setIsEditingPesapal] = useState(false)

  React.useEffect(() => {
    if (organizationId) {
      fetchPesapalConfig()
    }
  }, [organizationId])

  const fetchPesapalConfig = async () => {
    setLoadingConfig(true)
    try {
      const res = await paymentAPI.getPesapalConfig(organizationId)
      if (res.data) {
        setPesapal(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch PesaPal config:', err)
    } finally {
      setLoadingConfig(false)
    }
  }

  const handleSavePesapal = async () => {
    setSaveLoading(true)
    setConfigError(null)
    try {
      await paymentAPI.savePesapalConfig(organizationId, pesapal)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
      fetchPesapalConfig() // Refresh to get the new IPN ID if generated
      setIsEditingPesapal(false) // Exit edit mode after saving
    } catch (err) {
      setConfigError(err.response?.data?.detail || 'Failed to save PesaPal configuration')
    } finally {
      setSaveLoading(false)
    }
  }

  const toggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }))
  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }))

  const handleSave = () => {
    setSuccess(true)
    setTimeout(() => setSuccess(false), 4000)
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#202124', mb: 0.5 }}>Settings</Typography>
          <Typography sx={{ color: '#5F6368', fontSize: '0.9rem' }}>
            Manage your account preferences and platform configuration
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          sx={{ borderRadius: 2.5, fontWeight: 700 }}
        >
          Save Changes
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2.5 }} onClose={() => setSuccess(false)}>
          Settings saved successfully!
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Notifications */}
        <Grid item xs={12} md={6}>
          <SettingsSection icon={NotifIcon} title="Notifications" subtitle="Control how and when you receive alerts" color="#1A73E8" bg="#E8F0FE">
            <ToggleRow icon={EmailIcon} label="Email Notifications" desc="Receive updates via email" checked={settings.emailNotifications} onChange={() => toggle('emailNotifications')} />
            <Divider sx={{ mx: 3 }} />
            <ToggleRow icon={PushIcon} label="Push Notifications" desc="Browser and app push alerts" checked={settings.pushNotifications} onChange={() => toggle('pushNotifications')} />
            <Divider sx={{ mx: 3 }} />
            <ToggleRow icon={SmsIcon} label="SMS Notifications" desc="Text message alerts" checked={settings.smsNotifications} onChange={() => toggle('smsNotifications')} />
            <Divider sx={{ my: 0 }} />
            <Box sx={{ px: 3, py: 2.5, bgcolor: '#FAFBFF' }}>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#5F6368', mb: 1.5 }}>ALERT TYPES</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[
                  { key: 'claimAlerts', label: 'Claim status changes' },
                  { key: 'policyAlerts', label: 'Policy renewals & expirations' },
                  { key: 'commissionAlerts', label: 'Commission payouts' },
                ].map(({ key, label }) => (
                  <Box key={key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DotIcon sx={{ fontSize: 8, color: '#9AA0A6' }} />
                      <Typography sx={{ fontSize: '0.82rem', color: '#5F6368' }}>{label}</Typography>
                    </Box>
                    <Switch
                      checked={settings[key]}
                      onChange={() => toggle(key)}
                      size="small"
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#1A73E8' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#1A73E8' },
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          </SettingsSection>
        </Grid>

        {/* Security */}
        <Grid item xs={12} md={6}>
          <SettingsSection icon={SecurityIcon} title="Security" subtitle="Manage authentication and access controls" color="#1E8E3E" bg="#E6F4EA">
            <ToggleRow
              icon={TFAIcon}
              label="Two-Factor Authentication"
              desc="Extra layer via authenticator app"
              checked={settings.twoFactorAuth}
              onChange={() => toggle('twoFactorAuth')}
            />
            <Divider sx={{ mx: 3 }} />
            <ToggleRow
              label="Login Alerts"
              desc="Notify on new sign-in events"
              checked={settings.loginAlerts}
              onChange={() => toggle('loginAlerts')}
            />
            <Divider sx={{ mx: 3 }} />
            <ToggleRow
              label="Auto Session Timeout"
              desc="Sign out after 30 min inactivity"
              checked={settings.sessionTimeout}
              onChange={() => toggle('sessionTimeout')}
            />
            <Divider />
            <Box sx={{ p: 3 }}>
              <Button
                variant="outlined"
                startIcon={<LockIcon />}
                fullWidth
                sx={{
                  borderRadius: 2.5, fontWeight: 700,
                  mb: 1.5, color: '#202124', borderColor: '#E8EAED',
                  '&:hover': { borderColor: '#1A73E8', color: '#1A73E8' },
                }}
              >
                Change Password
              </Button>
              <Button
                variant="outlined"
                fullWidth
                sx={{
                  borderRadius: 2.5, fontWeight: 700,
                  color: '#D93025', borderColor: '#FCCAC8',
                  '&:hover': { bgcolor: '#FCE8E6', borderColor: '#EA4335' },
                }}
              >
                Revoke All Sessions
              </Button>
            </Box>
          </SettingsSection>
        </Grid>

        {/* Preferences */}
        <Grid item xs={12} md={6}>
          <SettingsSection icon={LanguageIcon} title="Preferences" subtitle="Locale, timezone and display settings" color="#7B61FF" bg="#F0EDFF">
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2.5}>
                {[
                  {
                    label: 'Language', key: 'language', options: [
                      { val: 'en', label: 'English' },
                      { val: 'fr', label: 'French' },
                      { val: 'sw', label: 'Swahili' },
                    ],
                  },
                  {
                    label: 'Timezone', key: 'timezone', options: [
                      { val: 'Africa/Kampala', label: 'Africa/Kampala (EAT)' },
                      { val: 'Africa/Nairobi', label: 'Africa/Nairobi (EAT)' },
                      { val: 'Africa/Dar_es_Salaam', label: 'Africa/Dar es Salaam' },
                      { val: 'UTC', label: 'UTC' },
                    ],
                  },
                  {
                    label: 'Date Format', key: 'dateFormat', options: [
                      { val: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                      { val: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                      { val: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
                    ],
                  },
                  {
                    label: 'Currency', key: 'currency', options: [
                      { val: 'UGX', label: 'UGX — Ugandan Shilling' },
                      { val: 'KES', label: 'KES — Kenyan Shilling' },
                      { val: 'TZS', label: 'TZS — Tanzanian Shilling' },
                      { val: 'USD', label: 'USD — US Dollar' },
                    ],
                  },
                ].map(({ label, key, options }) => (
                  <Grid item xs={12} key={key}>
                    <FormControl fullWidth size="small">
                      <InputLabel>{label}</InputLabel>
                      <Select
                        value={settings[key]}
                        onChange={(e) => set(key, e.target.value)}
                        label={label}
                        sx={{ bgcolor: '#fff' }}
                      >
                        {options.map((o) => (
                          <MenuItem key={o.val} value={o.val}>{o.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </SettingsSection>
        </Grid>

        {/* Appearance */}
        <Grid item xs={12} md={6}>
          <SettingsSection icon={AppearanceIcon} title="Appearance" subtitle="Theme and layout customization" color="#E37400" bg="#FEF3E2">
            <ToggleRow
              icon={DarkModeIcon}
              label="Dark Mode"
              desc="Switch to dark theme (coming soon)"
              checked={settings.darkMode}
              onChange={() => toggle('darkMode')}
            />
            <Divider sx={{ mx: 3 }} />
            <ToggleRow
              label="Compact Mode"
              desc="Reduce spacing for denser layouts"
              checked={settings.compactMode}
              onChange={() => toggle('compactMode')}
            />
            <Divider sx={{ mx: 3 }} />
            <ToggleRow
              label="High Contrast"
              desc="Improve accessibility contrast"
              checked={settings.highContrast}
              onChange={() => toggle('highContrast')}
            />
            <Divider />
            <Box sx={{ p: 3 }}>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#5F6368', mb: 1.5 }}>THEME COLOR</Typography>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                {[
                  { color: '#1A73E8', label: 'Google Blue', active: true },
                  { color: '#1E8E3E', label: 'Green' },
                  { color: '#7B61FF', label: 'Purple' },
                  { color: '#E37400', label: 'Orange' },
                ].map(({ color, label, active }) => (
                  <Tooltip key={color} title={label}>
                    <Box sx={{
                      width: 28, height: 28,
                      borderRadius: '50%', bgcolor: color,
                      cursor: 'pointer',
                      boxShadow: active ? `0 0 0 3px white, 0 0 0 5px ${color}` : 'none',
                      transition: 'box-shadow 0.2s',
                      '&:hover': { boxShadow: `0 0 0 3px white, 0 0 0 5px ${color}` },
                    }} />
                  </Tooltip>
                ))}
              </Box>
            </Box>
          </SettingsSection>
        </Grid>

        {/* Payment Gateway */}
        <Grid item xs={12} md={6}>
          <SettingsSection 
            icon={PaymentsIcon} 
            title="Payment Gateway" 
            subtitle="PesaPal V3 API Integration" 
            color="#EA4335" 
            bg="#FCE8E6"
          >
            <Box sx={{ p: 3 }}>
              {configError && <Alert severity="error" sx={{ mb: 2 }}>{typeof configError === 'string' ? configError : configError?.detail || 'An error occurred'}</Alert>}
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Consumer Key"
                    value={pesapal.consumer_key}
                    onChange={(e) => setPesapal({ ...pesapal, consumer_key: e.target.value })}
                    disabled={!isEditingPesapal || loadingConfig}
                    placeholder={isEditingPesapal ? '' : '••••••••••••'}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    type="password"
                    label="Consumer Secret"
                    value={pesapal.consumer_secret}
                    onChange={(e) => setPesapal({ ...pesapal, consumer_secret: e.target.value })}
                    disabled={!isEditingPesapal || loadingConfig}
                    placeholder={isEditingPesapal ? '' : '••••••••••••'}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#f8f9fa', p: 1.5, borderRadius: 1.5 }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.88rem', fontWeight: 500 }}>Sandbox Mode</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#5F6368' }}>Use PesaPal demo environment</Typography>
                    </Box>
                    <Switch
                      checked={pesapal.is_sandbox}
                      onChange={(e) => setPesapal({ ...pesapal, is_sandbox: e.target.checked })}
                      size="small"
                      disabled={!isEditingPesapal}
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: '0.82rem', color: '#5F6368' }}>Status:</Typography>
                      <Chip 
                        size="small" 
                        label={pesapal.ipn_id ? "Configured" : "Not Linked"} 
                        color={pesapal.ipn_id ? "success" : "default"}
                        variant={pesapal.ipn_id ? "filled" : "outlined"}
                      />
                    </Box>
                    {isEditingPesapal ? (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setIsEditingPesapal(false)
                            fetchPesapalConfig() // Revert to original values
                          }}
                          disabled={saveLoading}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={handleSavePesapal}
                          disabled={saveLoading}
                          startIcon={saveLoading ? <CircularProgress size={16} /> : <SaveIcon />}
                        >
                          {saveLoading ? 'Saving...' : 'Save'}
                        </Button>
                      </Box>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setIsEditingPesapal(true)}
                        startIcon={<EditIcon />}
                      >
                        Update
                      </Button>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </SettingsSection>
        </Grid>
      </Grid>

      {/* Save footer */}
      <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #E8EAED', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          sx={{ borderRadius: 2.5, fontWeight: 600, color: '#5F6368', borderColor: '#DADCE0' }}
        >
          Reset to Defaults
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          sx={{ borderRadius: 2.5, fontWeight: 700, px: 4 }}
        >
          Save All Settings
        </Button>
      </Box>
    </Box>
  )
}
