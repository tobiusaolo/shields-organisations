import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Paper, 
  LinearProgress, Grid, CardContent, Button
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Payments as PaymentsIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { policyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PolicyLedger() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const res = await policyAPI.getPolicies(user.organization_id);
      setPolicies(res.data.items || []);
    } catch (err) {
      console.error("Error fetching policies:", err);
    } finally {
      setLoading(false);
    }
  };

  const getPolicyStatus = (policy) => {
    if (!policy.paid_until) return { label: 'Pending Payment', color: 'warning', icon: <ScheduleIcon size="small" /> };
    
    const paidUntil = new Date(policy.paid_until);
    const now = new Date();
    
    if (paidUntil < now) {
      return { label: 'Overdue', color: 'error', icon: <ErrorIcon size="small" /> };
    }
    
    // Check if expiring within 7 days for a warning
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);
    if (paidUntil < sevenDaysFromNow) {
      return { label: 'Expiring Soon', color: 'warning', icon: <WarningIcon size="small" /> };
    }

    return { label: 'Paid', color: 'success', icon: <CheckCircleIcon size="small" /> };
  };

  const stats = {
    total: policies.length,
    paid: policies.filter(p => getPolicyStatus(p).label === 'Paid').length,
    overdue: policies.filter(p => getPolicyStatus(p).label === 'Overdue').length,
    pending: policies.filter(p => !p.paid_until).length,
  };

  if (loading) return <LinearProgress />;

  return (
    <Box sx={{ p: 4, bgcolor: '#F8F9FE', minHeight: '100vh' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1A237E' }}>Policy Ledger</Typography>
          <Typography variant="body2" sx={{ color: '#546E7A' }}>Administrative oversight of organizational policy health and payments.</Typography>
        </Box>
        <Button variant="contained" startIcon={<PaymentsIcon />} sx={{ borderRadius: 0, bgcolor: '#1A237E' }}>
          Payment Reports
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Total Policies', value: stats.total, color: '#1A237E' },
          { label: 'Fully Paid', value: stats.paid, color: '#2E7D32' },
          { label: 'Overdue', value: stats.overdue, color: '#D32F2F' },
          { label: 'Unpaid/Draft', value: stats.pending, color: '#ED6C02' },
        ].map((item, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ borderRadius: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: item.color }}>{item.value}</Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#90A4AE', textTransform: 'uppercase' }}>{item.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <TableContainer component={Paper} sx={{ borderRadius: 0, boxShadow: '0 4px 25px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F1F3F4' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Policy Number</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Client</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Paid Until</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {policies.map((policy) => {
              const status = getPolicyStatus(policy);
              return (
                <TableRow key={policy.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ fontWeight: 600 }}>{policy.policy_number}</TableCell>
                  <TableCell>{policy.holder_name || 'N/A'}</TableCell>
                  <TableCell>{policy.product_name}</TableCell>
                  <TableCell>
                    {policy.paid_until ? new Date(policy.paid_until).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={status.label} 
                      color={status.color} 
                      icon={status.icon} 
                      sx={{ fontWeight: 600, borderRadius: 0}} 
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
