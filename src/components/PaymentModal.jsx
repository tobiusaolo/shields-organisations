
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  IconButton, 
  Typography, 
  Box, 
  CircularProgress,
  Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { publicAPI } from '../services/api';

const PaymentModal = ({ open, onClose, paymentUrl, policyId, policyNumber, onPaymentSuccess }) => {
  const [status, setStatus] = useState('paying'); // paying, verifying, success, error
  const [pollCount, setPollCount] = useState(0);

  // Remove the aggressive auto-timer and let the user decide when to verify, or wait longer
  useEffect(() => {
    const startTimer = setTimeout(() => {
      if (status === 'paying') setStatus('verifying');
    }, 60000); // Increased to 60 seconds
    return () => clearTimeout(startTimer);
  }, [status]);

  // Poll for status — only when we have a valid identifier
  useEffect(() => {
    const identifier = policyNumber || policyId;
    if (status === 'verifying' && pollCount < 30 && identifier) {
      const timer = setTimeout(async () => {
        try {
          const res = await publicAPI.checkPolicyStatus(identifier);
          if (res.data?.status === 'active' || res.data?.is_active) {
            setStatus('success');
            if (onPaymentSuccess) onPaymentSuccess();
          }
          setPollCount(prev => prev + 1);
        } catch (err) {
          console.error("Polling error", err);
          setPollCount(prev => prev + 1);
        }
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [status, pollCount, policyId, policyNumber]);

  const handleOpenNewTab = () => {
    window.open(paymentUrl, '_blank');
    setStatus('verifying');
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: '85vh',
          borderRadius: '16px',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8f9fa' }}>
        <Typography variant="h6" component="span" fontWeight="bold">Secure Premium Payment</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {status === 'paying' && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, bgcolor: '#fff3cd', borderBottom: '1px solid #ffeeba', textAlign: 'center' }}>
              <Typography variant="caption" color="#856404" fontWeight="600">
                If the payment form doesn't load below, please 
                <Button size="small" onClick={handleOpenNewTab} sx={{ textTransform: 'none', ml: 0.5, fontWeight: 700 }}>click here to open it in a new window</Button>
              </Typography>
            </Box>
            <Box sx={{ flex: 1, position: 'relative' }}>
              <iframe
                src={paymentUrl}
                title="PesaPal Payment"
                width="100%"
                height="100%"
                frameBorder="0"
                allow="payment"
                style={{ border: 'none' }}
              />
            </Box>
            <Box sx={{ p: 2, textAlign: 'center', borderTop: '1px solid #E8EAED' }}>
              <Button variant="outlined" onClick={() => setStatus('verifying')}>
                I have completed the payment
              </Button>
            </Box>
          </Box>
        )}

        {status === 'verifying' && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h5" gutterBottom>Verifying Payment...</Typography>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              We are waiting for confirmation from PesaPal. <br/>
              This usually takes a few seconds after you authorize on your phone.
            </Typography>
            <Button sx={{ mt: 4 }} onClick={() => setStatus('paying')}>
              Go back to payment window
            </Button>
          </Box>
        )}

        {status === 'success' && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4, textAlign: 'center' }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 100, color: '#4caf50', mb: 3 }} />
            <Typography variant="h4" gutterBottom>Payment Successful!</Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>Your policy is now active.</Typography>
            <Button variant="contained" color="success" size="large" onClick={onClose}>
              Go to My Policies
            </Button>
          </Box>
        )}

        {status === 'error' && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4, textAlign: 'center' }}>
            <ErrorOutlineIcon sx={{ fontSize: 100, color: '#f44336', mb: 3 }} />
            <Typography variant="h4" gutterBottom>Payment Failed</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>Something went wrong with the transaction. Please try again.</Typography>
            <Button variant="contained" onClick={() => setStatus('paying')}>
              Retry Payment
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
