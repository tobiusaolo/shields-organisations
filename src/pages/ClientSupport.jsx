import React from 'react'
import {
  Box, Typography, Paper, Grid, Stack, Button,
  Accordion, AccordionSummary, AccordionDetails, Divider, Avatar
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Chat as ChatIcon,
  HelpOutline as HelpIcon,
  Description as DocIcon,
  Payments as PaymentIcon,
  Verified as SecurityIcon
} from '@mui/icons-material'

const FAQS = [
  {
    q: 'How do I purchase a new policy?',
    a: 'Simply visit the Marketplace from your sidebar, browse available insurance plans, and click "Purchase" on the one that fits your needs. You will be guided through a simple registration form.'
  },
  {
    q: 'How do I file a claim?',
    a: 'Navigate to the "Claims Center" and click on "File New Claim". You will need to select the active policy associated with the claim and provide supporting documentation such as photos or reports.'
  },
  {
    q: 'What is the "Identity Verification" step?',
    a: 'To comply with industrial insurance regulations, all policyholders must verify their identity. You can upload your National ID or Passport in the "Verification" section to ensure uninterrupted coverage.'
  },
  {
    q: 'How are payments processed?',
    a: 'Shields supports multiple payment methods including Mobile Money (MTN/Airtel) and Card payments. All transactions are secured using enterprise-grade 256-bit encryption.'
  },
  {
    q: 'Can I cancel my policy?',
    a: 'Yes, you can request a cancellation through the My Account section. Please note that refund policies vary depending on the specific insurance provider and product terms.'
  }
]

export default function ClientSupport() {
  return (
    <Box>
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#202124', mb: 0.5 }}>
          Help & Support
        </Typography>
        <Typography sx={{ color: '#5F6368', fontSize: '1rem' }}>
          Get assistance with your policies, claims, or account settings
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Contact Channels */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 0, border: '1px solid #E8EAED', bgcolor: '#fff' }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#202124', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ChatIcon sx={{ fontSize: 18, color: '#1A237E' }} /> Live Assistance
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#5F6368', mb: 2.5, lineHeight: 1.6 }}>
                Our advisors are available Monday–Friday, 8am–6pm EAT to help with complex claims or product inquiries.
              </Typography>
              <Button variant="contained" fullWidth sx={{ borderRadius: 0, fontWeight: 700, bgcolor: '#1A237E' }}>
                Start Live Chat
              </Button>
            </Paper>

            <Paper elevation={0} sx={{ p: 3, borderRadius: 0, border: '1px solid #E8EAED', bgcolor: '#fff' }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#202124', mb: 2 }}>Contact Info</Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: '#F8F9FA', color: '#1A237E', width: 32, height: 32 }}>
                    <PhoneIcon sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontSize: '0.7rem', color: '#9AA0A6', fontWeight: 700 }}>HOTLINE</Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>+256 800 123 456</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: '#F8F9FA', color: '#1A237E', width: 32, height: 32 }}>
                    <EmailIcon sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontSize: '0.7rem', color: '#9AA0A6', fontWeight: 700 }}>EMAIL</Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>support@shields.co.ug</Typography>
                  </Box>
                </Box>
              </Stack>
            </Paper>
          </Stack>
        </Grid>

        {/* FAQs */}
        <Grid item xs={12} lg={8}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#202124', mb: 3 }}>
            Frequently Asked Questions
          </Typography>
          <Box sx={{ border: '1px solid #E8EAED', bgcolor: '#fff' }}>
            {FAQS.map((faq, i) => (
              <Accordion 
                key={i} 
                elevation={0} 
                square 
                sx={{ 
                  borderBottom: i < FAQS.length - 1 ? '1px solid #E8EAED' : 'none',
                  '&:before': { display: 'none' }
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{faq.q}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: '#F8F9FA', pb: 3 }}>
                  <Typography sx={{ color: '#5F6368', lineHeight: 1.7, fontSize: '0.9rem' }}>
                    {faq.a}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>

          <Box sx={{ mt: 4, p: 3, bgcolor: '#E8F0FE', display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <SecurityIcon sx={{ color: '#1A73E8', mt: 0.5 }} />
            <Box>
              <Typography sx={{ fontWeight: 800, color: '#1A237E', mb: 0.5 }}>Compliance & Security Notice</Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#1A237E', opacity: 0.8, lineHeight: 1.5 }}>
                Shields is fully regulated by the Insurance Regulatory Authority (IRA). All your documents and financial data are encrypted and protected under East African data protection acts.
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}
