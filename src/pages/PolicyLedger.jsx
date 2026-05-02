import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Paper, 
  LinearProgress, Grid, CardContent, Button, Drawer,
  Tabs, Tab, Divider, Avatar, IconButton, TextField,
  InputAdornment, Skeleton, Alert, Stack, Menu, MenuItem,
  ListItemIcon, ListItemText, Tooltip, Pagination
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Payments as PaymentsIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  Description as DocIcon,
  MonetizationOn as CommIcon,
  History as HistoryIcon,
  FileDownload as DownloadIcon,
  FilterList as FilterIcon,
  ContentPaste as FormIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import { policyAPI, formAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PolicyLedger() {
  const { user } = useAuth();
  const organizationId = user?.organization_id;
  
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [policyForms, setPolicyForms] = useState([]);
  const [formsLoading, setFormsLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuPolicy, setMenuPolicy] = useState(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    if (organizationId) {
      fetchPolicies();
    }
  }, [organizationId]);

  useEffect(() => {
    if (selectedPolicy && organizationId) {
      fetchPolicyForms();
    }
  }, [selectedPolicy, organizationId]);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await policyAPI.getPolicies(organizationId);
      setPolicies(res.data.items || []);
    } catch (err) {
      console.error("Error fetching policies:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPolicyForms = async () => {
    if (!selectedPolicy?.product_template_id) return;
    setFormsLoading(true);
    try {
      const res = await formAPI.getTemplateForms(organizationId, selectedPolicy.product_template_id);
      setPolicyForms(res.data || []);
    } catch (err) {
      console.error("Error fetching policy forms:", err);
      setPolicyForms([]);
    } finally {
      setFormsLoading(false);
    }
  };

  const getPolicyStatus = (policy) => {
    if (policy.status === 'pending' || !policy.paid_until) {
      return { label: 'Pending Payment', color: 'warning', icon: <ScheduleIcon size="small" />, bg: '#FFF4E5' };
    }
    const paidUntil = new Date(policy.paid_until);
    const now = new Date();
    if (paidUntil < now) {
      return { label: 'Overdue', color: 'error', icon: <ErrorIcon size="small" />, bg: '#FDECEA' };
    }
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);
    if (paidUntil < sevenDaysFromNow) {
      return { label: 'Expiring Soon', color: 'warning', icon: <WarningIcon size="small" />, bg: '#FFF4E5' };
    }
    return { label: 'Paid', color: 'success', icon: <CheckCircleIcon size="small" />, bg: '#EDF7ED' };
  };

  const handleOpenDetails = (policy) => {
    setSelectedPolicy(policy);
    setDrawerOpen(true);
    setActiveTab(0);
    setPolicyForms([]); // Reset
  };

  const filteredPolicies = policies.filter(p => 
    p.policy_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.holder_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedPolicies = filteredPolicies.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalItems = filteredPolicies.length;

  const stats = {
    total: policies.length,
    paid: policies.filter(p => getPolicyStatus(p).label === 'Paid').length,
    overdue: policies.filter(p => getPolicyStatus(p).label === 'Overdue').length,
    premium: policies.reduce((acc, curr) => acc + parseFloat(curr.premium || 0), 0),
  };

  if (loading && policies.length === 0) return (
    <Box sx={{ p: 4 }}>
      <Skeleton variant="rectangular" width="100%" height={100} sx={{ mb: 4 }} />
      <Skeleton variant="rectangular" width="100%" height={400} />
    </Box>
  );

  return (
    <Box sx={{ p: 4, bgcolor: '#F8F9FE', minHeight: '100vh' }}>
      {/* Header Section */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#1A237E', mb: 0.5 }}>Policy Ledger</Typography>
          <Typography variant="body2" sx={{ color: '#546E7A', fontWeight: 500 }}>
            Real-time administrative oversight of organizational policies, premiums, and commissions.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<DownloadIcon />} sx={{ borderRadius: 0, fontWeight: 700, borderColor: '#E0E0E0', color: '#546E7A' }}>
            Export CSV
          </Button>
          <Button variant="contained" startIcon={<PaymentsIcon />} sx={{ borderRadius: 0, bgcolor: '#1A237E', fontWeight: 700, px: 3 }}>
            Settlement Reports
          </Button>
        </Stack>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Total Policies', value: stats.total, color: '#1A237E', icon: <DocIcon /> },
          { label: 'Active/Paid', value: stats.paid, color: '#2E7D32', icon: <CheckCircleIcon /> },
          { label: 'Payment Overdue', value: stats.overdue, color: '#D32F2F', icon: <ErrorIcon /> },
          { label: 'Total GWP (UGX)', value: stats.premium.toLocaleString(), color: '#1A237E', icon: <PaymentsIcon />, isCurrency: true },
        ].map((item, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ borderRadius: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #E3F2FD' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#90A4AE', textTransform: 'uppercase' }}>{item.label}</Typography>
                  <Box sx={{ color: item.color, opacity: 0.8 }}>{item.icon}</Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#263238' }}>{item.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Table Controls */}
      <Card sx={{ borderRadius: 0, mb: 3, boxShadow: 'none', border: '1px solid #E8EAED' }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField 
            placeholder="Search by policy #, client name or product..." 
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, bgcolor: '#fff' } }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#90A4AE' }} /></InputAdornment>
            }}
          />
          <IconButton sx={{ bgcolor: '#F5F5F5', borderRadius: 0 }}>
            <FilterIcon />
          </IconButton>
        </Box>
      </Card>

      {/* Policies Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 0, boxShadow: '0 4px 25px rgba(0,0,0,0.06)', border: '1px solid #E8EAED' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F8F9FA' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: '#546E7A' }}>POLICY NUMBER</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#546E7A' }}>CLIENT</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#546E7A' }}>PRODUCT</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#546E7A' }}>PREMIUM (UGX)</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#546E7A' }}>COMMISSION</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#546E7A' }}>STATUS</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#546E7A' }} align="right">ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedPolicies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 10 }}>
                  <Typography sx={{ color: '#90A4AE', fontWeight: 600 }}>No policies found matching your criteria.</Typography>
                </TableCell>
              </TableRow>
            ) : paginatedPolicies.map((policy) => {
              const status = getPolicyStatus(policy);
              return (
                <TableRow key={policy.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ fontWeight: 700, color: '#1A73E8' }}>{policy.policy_number}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{policy.holder_name}</Typography>
                    <Typography variant="caption" sx={{ color: '#90A4AE' }}>{policy.holder_email}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{policy.product_name}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{(parseFloat(policy.premium || 0)).toLocaleString()}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#2E7D32' }}>
                    UGX {(policy.commission_total || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={status.label} 
                      size="small"
                      sx={{ 
                        fontWeight: 800, 
                        borderRadius: '4px', 
                        bgcolor: status.bg, 
                        color: status.color === 'error' ? '#D32F2F' : status.color === 'success' ? '#2E7D32' : '#ED6C02',
                        fontSize: '0.7rem'
                      }} 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Policy Actions">
                      <IconButton 
                        size="small" 
                        onClick={(e) => { setAnchorEl(e.currentTarget); setMenuPolicy(policy); }} 
                        sx={{ color: '#546E7A' }}
                      >
                        <MoreIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {!loading && totalItems > 0 && (
        <Paper elevation={0} sx={{
          px: 3, py: 2, mt: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          border: '1px solid #E8EAED', borderRadius: 0
        }}>
          <Typography sx={{ fontSize: '0.8rem', color: '#9AA0A6', fontWeight: 600 }}>
            Showing {((page - 1) * rowsPerPage) + 1}–{Math.min(page * rowsPerPage, totalItems)} of {totalItems} entries
          </Typography>
          <Pagination
            count={Math.ceil(totalItems / rowsPerPage)}
            page={page}
            onChange={(_, v) => setPage(v)}
            color="primary"
            size="small"
            shape="rounded"
          />
        </Paper>
      )}

      {/* Policy Detail Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 700 }, borderRadius: 0 } }}
      >
        {selectedPolicy && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Drawer Header */}
            <Box sx={{ p: 3, bgcolor: '#1A237E', color: '#fff' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 700, textTransform: 'uppercase' }}>Policy Master Record</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900 }}>{selectedPolicy.policy_number}</Typography>
                </Box>
                <Chip 
                  label={getPolicyStatus(selectedPolicy).label} 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 800, borderRadius: '4px' }} 
                />
              </Box>
              <Stack direction="row" spacing={3}>
                <Box>
                  <Typography sx={{ fontSize: '0.7rem', opacity: 0.7 }}>Premium Value</Typography>
                  <Typography sx={{ fontWeight: 800 }}>UGX {(parseFloat(selectedPolicy.premium || 0)).toLocaleString()}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.7rem', opacity: 0.7 }}>Paid Until</Typography>
                  <Typography sx={{ fontWeight: 800 }}>
                    {selectedPolicy.paid_until ? new Date(selectedPolicy.paid_until).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Tabs 
              value={activeTab} 
              onChange={(e, v) => setActiveTab(v)}
              sx={{ borderBottom: '1px solid #E8EAED', px: 2 }}
            >
              <Tab label="Overview" icon={<DocIcon sx={{ fontSize: 18 }} />} iconPosition="start" sx={{ fontWeight: 700 }} />
              <Tab label="Client" icon={<PersonIcon sx={{ fontSize: 18 }} />} iconPosition="start" sx={{ fontWeight: 700 }} />
              <Tab label="Form Data" icon={<FormIcon sx={{ fontSize: 18 }} />} iconPosition="start" sx={{ fontWeight: 700 }} />
              <Tab label="Financials" icon={<CommIcon sx={{ fontSize: 18 }} />} iconPosition="start" sx={{ fontWeight: 700 }} />
            </Tabs>

            <Box sx={{ p: 3, flex: 1, overflowY: 'auto', bgcolor: '#F8F9FA' }}>
              {activeTab === 0 && (
                <Stack spacing={3}>
                  <Card elevation={0} sx={{ border: '1px solid #E8EAED', borderRadius: 0 }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: '#546E7A' }}>Product Configuration</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#90A4AE' }}>Product Name</Typography>
                          <Typography sx={{ fontWeight: 600 }}>{selectedPolicy.product_name}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#90A4AE' }}>Policy Term</Typography>
                          <Typography sx={{ fontWeight: 600 }}>{selectedPolicy.term_months || 12} Months</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#90A4AE' }}>Effective Date</Typography>
                          <Typography sx={{ fontWeight: 600 }}>{new Date(selectedPolicy.created_at).toLocaleDateString()}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#90A4AE' }}>Currency</Typography>
                          <Typography sx={{ fontWeight: 600 }}>{selectedPolicy.currency || 'UGX'}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                  
                  <Alert severity="info" sx={{ borderRadius: 0 }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Underwriting Context</Typography>
                    <Typography sx={{ fontSize: '0.75rem' }}>This policy was issued via {selectedPolicy.sales_channel || 'the marketplace'}. All risk assessments were automated based on the product template rules.</Typography>
                  </Alert>
                </Stack>
              )}

              {activeTab === 1 && (
                <Stack spacing={3}>
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 1, bgcolor: '#1A237E' }}>
                      <PersonIcon sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{selectedPolicy.holder_name}</Typography>
                    <Typography variant="body2" sx={{ color: '#546E7A' }}>{selectedPolicy.holder_email}</Typography>
                  </Box>
                  <Divider />
                  <Grid container spacing={3}>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#90A4AE' }}>Phone Number</Typography>
                      <Typography sx={{ fontWeight: 600 }}>{selectedPolicy.holder_phone || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#90A4AE' }}>KYC Status</Typography>
                      <Chip label="VERIFIED" size="small" color="success" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 800 }} />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" sx={{ color: '#90A4AE' }}>Identity ID (Internal)</Typography>
                      <Typography sx={{ fontWeight: 500, fontSize: '0.8rem', fontFamily: 'monospace' }}>{selectedPolicy.policy_holder_id}</Typography>
                    </Grid>
                  </Grid>
                </Stack>
              )}

              {activeTab === 2 && (
                <Stack spacing={3}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#546E7A' }}>Detailed Application Data</Typography>
                    {formsLoading && <LinearProgress sx={{ width: 100, borderRadius: 10 }} />}
                  </Box>

                  {policyForms.length > 0 ? (
                    policyForms.map((form) => (
                      <Card key={form.id} elevation={0} sx={{ border: '1px solid #E8EAED', borderRadius: 0, overflow: 'hidden' }}>
                        <Box sx={{ p: 2, bgcolor: '#F8F9FA', borderBottom: '1px solid #E8EAED' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1A237E' }}>{form.name}</Typography>
                          {form.description && <Typography variant="caption" sx={{ color: '#70757A' }}>{form.description}</Typography>}
                        </Box>
                        <CardContent sx={{ p: 0 }}>
                          {form.fields.map((field) => {
                            if (field.field_type === 'section') {
                              return (
                                <Box key={field.id} sx={{ p: 2, bgcolor: '#F1F3F4', borderBottom: '1px solid #E8EAED' }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#1A237E', textTransform: 'uppercase', letterSpacing: 1 }}>
                                    {field.label}
                                  </Typography>
                                </Box>
                              );
                            }

                            const value = selectedPolicy.question_responses?.[field.label] || 
                                          selectedPolicy.question_responses?.[field.field_key] || 
                                          selectedPolicy.context?.[field.label] ||
                                          selectedPolicy.context?.[field.field_key];
                            
                            const renderValue = (val) => {
                              if (!val) return 'Not provided';
                              if (Array.isArray(val)) {
                                if (val.length === 0) return 'No entries';
                                // Render a small summary table for arrays
                                const keys = Object.keys(val[0] || {});
                                return (
                                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #F1F3F4', mt: 1, borderRadius: 1 }}>
                                    <Table size="small">
                                      <TableHead sx={{ bgcolor: '#F8F9FA' }}>
                                        <TableRow>
                                          {keys.map(k => <TableCell key={k} sx={{ py: 0.5, fontSize: '0.65rem', fontWeight: 800, color: '#70757A' }}>{k.toUpperCase()}</TableCell>)}
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {val.map((row, i) => (
                                          <TableRow key={i}>
                                            {keys.map(k => <TableCell key={k} sx={{ py: 0.5, fontSize: '0.7rem' }}>{String(row[k] || '-')}</TableCell>)}
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </TableContainer>
                                );
                              }
                              if (typeof val === 'object') return JSON.stringify(val);
                              return String(val);
                            };

                            return (
                              <Box key={field.id} sx={{ p: 2, borderBottom: '1px solid #F5F5F5' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" sx={{ color: '#90A4AE', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>{field.label}</Typography>
                                    <Box sx={{ fontWeight: 600, fontSize: '0.9rem', color: value ? '#263238' : '#B0BEC5' }}>
                                      {renderValue(value)}
                                    </Box>
                                  </Box>
                                  {value && <CheckCircleIcon sx={{ fontSize: 16, color: '#4CAF50', ml: 2, mt: 0.5 }} />}
                                </Box>
                              </Box>
                            );
                          })}
                        </CardContent>
                      </Card>
                    ))
                  ) : Object.keys(selectedPolicy.question_responses || {}).length > 0 ? (
                    <Box sx={{ border: '1px solid #E8EAED', bgcolor: '#fff' }}>
                      <Box sx={{ p: 2, bgcolor: '#F8F9FA', borderBottom: '1px solid #E8EAED' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1A237E' }}>Assessment Responses</Typography>
                      </Box>
                      {Object.entries(selectedPolicy.question_responses).map(([key, value], idx) => (
                        <Box key={idx} sx={{ p: 2, borderBottom: '1px solid #F5F5F5' }}>
                          <Typography variant="caption" sx={{ color: '#90A4AE', textTransform: 'uppercase', fontWeight: 700 }}>{key.replace(/_/g, ' ')}</Typography>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{String(value)}</Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#fff', border: '1px dashed #E8EAED' }}>
                      <FormIcon sx={{ fontSize: 48, color: '#E0E0E0', mb: 2 }} />
                      <Typography variant="body2" sx={{ color: '#90A4AE', fontWeight: 600 }}>No detailed form data available for this policy.</Typography>
                      <Typography variant="caption" sx={{ color: '#B0BEC5' }}>This record may have been created manually or using a legacy flow.</Typography>
                    </Box>
                  )}
                </Stack>
              )}

              {activeTab === 3 && (
                <Stack spacing={3}>
                   <Card elevation={0} sx={{ border: '1px solid #E8EAED', bgcolor: '#E8F5E9', borderRadius: 0 }}>
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#2E7D32' }}>Total Commission Accrued</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#1B5E20' }}>UGX {(selectedPolicy.commission_total || 0).toLocaleString()}</Typography>
                      </Box>
                      <CommIcon sx={{ fontSize: 40, color: '#A5D6A7' }} />
                    </CardContent>
                  </Card>
                  
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#546E7A' }}>Ledger Distribution</Typography>
                  <Alert severity="warning" sx={{ borderRadius: 0 }}>
                    <Typography sx={{ fontSize: '0.75rem' }}>Commission payments are released upon full premium reconciliation. Currently {selectedPolicy.status === 'active' ? 'released' : 'pending reconciliation'}.</Typography>
                  </Alert>
                </Stack>
              )}
            </Box>

            {/* Footer Actions */}
            <Box sx={{ p: 2, borderTop: '1px solid #E8EAED', display: 'flex', gap: 2 }}>
              <Button fullWidth variant="outlined" sx={{ borderRadius: 0, fontWeight: 700 }}>Issue Certificate</Button>
              <Button fullWidth variant="contained" sx={{ borderRadius: 0, bgcolor: '#1A237E', fontWeight: 700 }}>Reconcile Payment</Button>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: { borderRadius: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', minWidth: 180, border: '1px solid #E8EAED' },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => { setAnchorEl(null); handleOpenDetails(menuPolicy); }}>
          <ListItemIcon><ViewIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="View Details" />
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon><HistoryIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Payment History" />
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Download Certificate" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setAnchorEl(null)} sx={{ color: '#D32F2F' }}>
          <ListItemIcon><ErrorIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText primary="Mark Overdue" />
        </MenuItem>
      </Menu>
    </Box>
  );
}
