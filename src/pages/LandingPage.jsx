import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Container, Typography, Button, Grid, Stack,
  AppBar, Toolbar, Paper, Avatar, Divider, Chip, useScrollTrigger,
  CircularProgress, Card, CardContent
} from '@mui/material'
import {
  Security as ShieldIcon,
  ArrowForward as ArrowIcon,
  Person as ClientIcon,
  CheckCircle as CheckIcon,
  LocalHospital as HealthIcon,
  DirectionsCar as MotorIcon,
  Home as HomeIcon,
  Favorite as LifeIcon,
  Star as StarIcon,
  Apple as AppleIcon,
  Android as AndroidIcon,
  East as EastIcon,
  LocalActivity as ProductIcon
} from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { publicAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

const PARTNERS = [
  'Jubilee Insurance', 'Sanlam', 'Old Mutual', 'Britam', 'Prudential',
  'ICEA LION', 'NIC Holdings', 'APA Insurance', 'CIC Africa',
  'Liberty Life', 'Excel Insurance', 'GA Insurance'
]

const PLANS = [
  { icon: <HealthIcon />, name: 'Health Insurance', desc: 'Hospital, outpatient, dental and optical cover for you and your family.', color: '#E8F5E9', iconColor: '#2E7D32' },
  { icon: <LifeIcon />, name: 'Life Insurance', desc: 'Protect your family\'s financial future with life and critical illness cover.', color: '#FCE4EC', iconColor: '#C62828' },
  { icon: <MotorIcon />, name: 'Motor Insurance', desc: 'Comprehensive and third-party cover for your vehicles.', color: '#E3F2FD', iconColor: '#1565C0' },
  { icon: <HomeIcon />, name: 'Property Insurance', desc: 'Cover for your home, office, or commercial property against loss or damage.', color: '#FFF3E0', iconColor: '#E65100' },
]

const STEPS = [
  { n: '01', title: 'Tell us about yourself', desc: 'Create a free account in under 2 minutes. No paperwork needed.' },
  { n: '02', title: 'Find the right plan', desc: 'Browse and compare plans from Uganda\'s top insurers side-by-side.' },
  { n: '03', title: 'Get covered instantly', desc: 'Choose your plan, pay online, and receive your certificate immediately.' },
]

const TESTIMONIALS = [
  { name: 'Sarah M.', role: 'Small Business Owner', text: 'Finding insurance used to take weeks. With SHIELDS I had a motor policy in 20 minutes.', stars: 5 },
  { name: 'James O.', role: 'Freelance Consultant', text: 'Finally a platform that explains what you\'re actually covered for. No hidden surprises.', stars: 5 },
  { name: 'Grace N.', role: 'Healthcare Professional', text: 'The claims process is so much simpler. I submitted everything from my phone.', stars: 5 },
]

function NavBar(props) {
  const navigate = useNavigate()
  const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 10 })

  return React.cloneElement(
    <AppBar elevation={0} position="fixed">
      <Container maxWidth="lg">
        <Toolbar sx={{ justifyContent: 'space-between', py: 1, px: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <Box sx={{ width: 34, height: 34, bgcolor: '#1A237E', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldIcon sx={{ color: '#fff', fontSize: 19 }} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#1A237E' }}>SHIELDS</Typography>
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          {props.user ? (
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#202124', lineHeight: 1.2 }}>{props.user.full_name || 'User'}</Typography>
                <Typography variant="caption" sx={{ color: '#5F6368', textTransform: 'capitalize' }}>{props.user.role?.replace('_', ' ')}</Typography>
              </Box>
              <Avatar 
                src={props.user.logo} 
                onClick={() => props.navigate(props.user.role === 'client' ? '/client/dashboard' : '/admin/dashboard')}
                sx={{ width: 40, height: 40, cursor: 'pointer', border: '2px solid #E8F0FE', bgcolor: '#1A237E' }}
              >
                {props.user.full_name?.[0] || 'U'}
              </Avatar>
            </Stack>
          ) : (
            <>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
                <Button onClick={() => props.navigate('/client/login')} sx={{ fontWeight: 700, color: '#202124', borderRadius: 0, px: 2.5 }}>
                  Sign in
                </Button>
                <Button variant="outlined" onClick={() => props.navigate('/admin/login')}
                  sx={{ fontWeight: 700, borderRadius: 0, borderColor: '#1A237E', color: '#1A237E', px: 2.5 }}>
                  For Organizations
                </Button>
                <Button variant="contained" onClick={() => props.navigate('/client/register')}
                  sx={{ fontWeight: 700, borderRadius: 0, bgcolor: '#1A237E', boxShadow: 'none', px: 3, '&:hover': { bgcolor: '#0d1b6e', boxShadow: 'none' } }}>
                  Get started free
                </Button>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ display: { xs: 'flex', md: 'none' } }}>
                <Button size="small" onClick={() => props.navigate('/client/login')} sx={{ fontWeight: 700, color: '#1A237E' }}>Sign in</Button>
                <Button size="small" variant="contained" onClick={() => props.navigate('/client/register')}
                  sx={{ fontWeight: 700, borderRadius: 0, bgcolor: '#1A237E', boxShadow: 'none' }}>
                  Start
                </Button>
              </Stack>
            </>
          )}
        </Toolbar>
      </Container>
    </AppBar>,
    { sx: { bgcolor: trigger ? 'rgba(255,255,255,0.75)' : 'transparent', backdropFilter: trigger ? 'blur(20px)' : 'none', borderBottom: trigger ? '1px solid rgba(0,0,0,0.05)' : 'none', transition: 'all 0.3s ease' } }
  )
}

export default function LandingPage(props) {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  React.useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'client' || user.role === 'user') {
        navigate('/client')
      } else {
        navigate('/admin')
      }
    }
  }, [user, authLoading, navigate])

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['public-products'],
    queryFn: async () => {
      const res = await publicAPI.getPublicProducts()
      return res.data?.items || res.data || []
    }
  })

  const handlePurchase = (productId) => {
    if (!user) {
      navigate('/client/login', { state: { redirectTo: `/client/products/${productId}` } })
    } else {
      navigate(`/client/products/${productId}`)
    }
  }

  return (
    <Box sx={{ bgcolor: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <NavBar {...props} navigate={navigate} user={user} />

      {/* ─── HERO ─── */}
      <Box sx={{ 
        pt: { xs: 20, md: 28 }, 
        pb: { xs: 16, md: 24 }, 
        position: 'relative',
        backgroundImage: 'url(/images/hero.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(180deg, rgba(0,0,20,0.7) 0%, rgba(0,0,10,0.85) 100%)',
          zIndex: 0
        }
      }}>
        <Box sx={{ 
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'radial-gradient(at 0% 0%, rgba(26,115,232,0.05) 0%, transparent 50%), radial-gradient(at 100% 100%, rgba(26,35,126,0.05) 0%, transparent 50%)',
          zIndex: 0
        }} />
        <Box sx={{ 
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
          opacity: 0.1, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(#fff 0.5px, transparent 0.5px)',
          backgroundSize: '40px 40px',
          zIndex: 0
        }} />

        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <Chip label="Trusted by businesses across Uganda 🇺🇬" size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 700, borderRadius: 0, mb: 4, px: 1 }} />
            
            <Typography variant="h1" sx={{ fontWeight: 900, color: '#fff', lineHeight: 1.1, mb: 3, fontSize: { xs: '2.8rem', md: '4.8rem' }, letterSpacing: -2.5 }}>
              Insurance made<br />
              <Box component="span" sx={{ 
                background: 'linear-gradient(90deg, #4DA3FF, #80BFFF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>simple and fast.</Box>
            </Typography>

            <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.25rem', lineHeight: 1.6, mb: 6, maxWidth: 640, mx: 'auto' }}>
              Compare, buy, and manage insurance plans from Uganda's top providers — all in one place. No brokers, no paperwork, no waiting.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" alignItems="center">
              <Button variant="contained" size="large" onClick={() => navigate('/client/register')} endIcon={<ArrowIcon />}
                sx={{ bgcolor: '#4DA3FF', color: '#000', borderRadius: 0, fontWeight: 800, px: 5, py: 2, fontSize: '1.05rem', '&:hover': { bgcolor: '#80BFFF' } }}>
                Get started — it's free
              </Button>
              <Button size="large" onClick={() => navigate('/client/products')}
                sx={{ color: '#fff', borderRadius: 0, fontWeight: 700, px: 5, py: 2, fontSize: '1.05rem', border: '1px solid rgba(255,255,255,0.3)', bgcolor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                Browse plans →
              </Button>
            </Stack>

            <Stack direction="row" spacing={5} sx={{ mt: 10 }} justifyContent="center">
              {[['500+', 'Plans'], ['2,000+', 'Clients'], ['< 1 min', 'Quotes']].map(([v, l]) => (
                <Box key={l}>
                  <Typography sx={{ fontWeight: 900, fontSize: '1.75rem', color: '#fff', lineHeight: 1 }}>{v}</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: 0.5 }}>{l.toUpperCase()}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* ─── PARTNER TICKER ─── */}
      <Box sx={{ py: 3, bgcolor: '#F8F9FA', borderTop: '1px solid #E8EAED', borderBottom: '1px solid #E8EAED', overflow: 'hidden' }}>
        <Container maxWidth="lg" sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ color: '#9AA0A6', fontWeight: 700, letterSpacing: 2 }}>TRUSTED PARTNERS</Typography>
        </Container>
        <Box sx={{ display: 'flex', gap: 0, animation: 'ticker 28s linear infinite', '@keyframes ticker': { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } }, width: '200%' }}>
          {[...PARTNERS, ...PARTNERS].map((name, i) => (
            <Box key={i} sx={{ flexShrink: 0, px: 5, display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 800, color: '#9AA0A6', fontSize: '0.95rem', whiteSpace: 'nowrap', letterSpacing: 0.5 }}>{name}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ─── LIVE MARKETPLACE ─── */}
      <Box id="marketplace" sx={{ py: { xs: 10, md: 14 }, bgcolor: '#F8F9FA' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 6 }}>
            <Box>
              <Typography variant="overline" sx={{ color: '#1A237E', fontWeight: 800, letterSpacing: 2 }}>LIVE MARKETPLACE</Typography>
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#202124', mt: 1, letterSpacing: -0.75 }}>
                Featured Insurance Plans
              </Typography>
            </Box>
            <Button 
              onClick={() => navigate('/client/products')}
              sx={{ fontWeight: 700, color: '#1A237E', textTransform: 'none', display: { xs: 'none', sm: 'flex' } }}
            >
              View all products →
            </Button>
          </Box>

          {productsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <CircularProgress sx={{ color: '#1A237E' }} />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {products.slice(0, 6).map(product => (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <Card elevation={0} sx={{ borderRadius: 0, border: '1px solid #E8EAED', height: '100%', display: 'flex', flexDirection: 'column', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 30px rgba(0,0,0,0.08)', borderColor: '#1A237E' } }}>
                    <Box sx={{ height: 160, bgcolor: '#E8F0FE', position: 'relative' }}>
                      {product.image_base64 ? (
                        <img src={product.image_base64} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}>
                          <ProductIcon sx={{ fontSize: 80 }} />
                        </Box>
                      )}
                      <Chip 
                        label={product.category?.toUpperCase()} 
                        size="small" 
                        sx={{ position: 'absolute', top: 16, left: 16, bgcolor: '#fff', fontWeight: 800, fontSize: '0.65rem', borderRadius: 0, color: '#1A237E' }} 
                      />
                    </Box>
                    <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                        <Avatar src={product.provider_logo} sx={{ width: 28, height: 28, border: '1px solid #F1F3F4' }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#5F6368' }}>{product.provider_name}</Typography>
                      </Stack>
                      
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#202124', mb: 1 }}>{product.name}</Typography>
                      <Typography variant="body2" sx={{ color: '#5F6368', mb: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 40 }}>
                        {product.description}
                      </Typography>
                      
                      <Box sx={{ mt: 'auto' }}>
                        <Divider sx={{ mb: 2.5 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="caption" sx={{ color: '#70757A', fontWeight: 600, display: 'block' }}>Premium</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 900, color: '#1A237E' }}>
                              UGX {(product.max_coverage || 0).toLocaleString()}
                            </Typography>
                          </Box>
                          <Button 
                            variant="contained" 
                            onClick={() => handlePurchase(product.id)}
                            sx={{ borderRadius: 0, bgcolor: '#1A237E', fontWeight: 700, textTransform: 'none', px: 3 }}
                          >
                            Purchase
                          </Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {products.length === 0 && (
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 8, textAlign: 'center', bgcolor: 'transparent', border: '2px dashed #E8EAED' }}>
                    <Typography sx={{ color: '#9AA0A6', fontWeight: 500 }}>No products currently available in the marketplace.</Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </Container>
      </Box>

      {/* ─── HOW IT WORKS ─── */}
      <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: '#F8F9FA' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="overline" sx={{ color: '#1A237E', fontWeight: 800, letterSpacing: 2 }}>HOW IT WORKS</Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#202124', mt: 1, letterSpacing: -0.75 }}>
              Get covered in 3 easy steps
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {STEPS.map((step, i) => (
              <Grid item xs={12} md={4} key={step.n}>
                <Box sx={{ textAlign: 'center', px: 2 }}>
                  <Typography sx={{ fontWeight: 900, fontSize: '3rem', color: '#E8EAED', lineHeight: 1, mb: 2 }}>{step.n}</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.15rem', color: '#202124', mb: 1.5 }}>{step.title}</Typography>
                  <Typography variant="body2" sx={{ color: '#5F6368', lineHeight: 1.8 }}>{step.desc}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
          <Box sx={{ textAlign: 'center', mt: 7 }}>
            <Button variant="contained" size="large" onClick={() => navigate('/client/register')}
              sx={{ bgcolor: '#1A237E', borderRadius: 0, fontWeight: 700, px: 5, py: 1.75, boxShadow: 'none', '&:hover': { bgcolor: '#0d1b6e', boxShadow: 'none' } }}>
              Create a free account
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ─── TESTIMONIALS ─── */}
      <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: '#fff' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="overline" sx={{ color: '#1A237E', fontWeight: 800, letterSpacing: 2 }}>CUSTOMER STORIES</Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#202124', mt: 1, letterSpacing: -0.75 }}>
              People love SHIELDS
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {TESTIMONIALS.map(t => (
              <Grid item xs={12} md={4} key={t.name}>
                <Paper elevation={0} sx={{ p: 4, borderRadius: 0, border: '1px solid #E8EAED', height: '100%' }}>
                  <Stack direction="row" spacing={0.5} sx={{ mb: 2.5 }}>
                    {[...Array(t.stars)].map((_, i) => <StarIcon key={i} sx={{ color: '#FFC107', fontSize: 18 }} />)}
                  </Stack>
                  <Typography sx={{ color: '#202124', lineHeight: 1.8, mb: 3, fontSize: '0.95rem' }}>"{t.text}"</Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ bgcolor: '#E8F0FE', color: '#1A237E', width: 36, height: 36, fontWeight: 700, fontSize: '0.9rem' }}>{t.name[0]}</Avatar>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#202124' }}>{t.name}</Typography>
                      <Typography variant="caption" sx={{ color: '#5F6368' }}>{t.role}</Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── MOBILE APP ─── */}
      <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: '#1A237E' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 800, letterSpacing: 2 }}>SHIELDS MOBILE APP</Typography>
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#fff', mt: 1, mb: 2, letterSpacing: -0.75 }}>
                Manage your policies<br />from your phone
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.05rem', mb: 5, maxWidth: 460, lineHeight: 1.75 }}>
                View your active policies, submit claims, download certificates, and chat with an advisor — all from the SHIELDS mobile app.
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button startIcon={<AppleIcon />} variant="outlined"
                  sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', borderRadius: 0, fontWeight: 700, px: 3, py: 1.25, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: '#fff' } }}>
                  App Store
                </Button>
                <Button startIcon={<AndroidIcon />} variant="outlined"
                  sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', borderRadius: 0, fontWeight: 700, px: 3, py: 1.25, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: '#fff' } }}>
                  Google Play
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 0, p: 4, border: '1px solid rgba(255,255,255,0.15)' }}>
                <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=600" alt="Mobile app"
                  style={{ width: '100%', borderRadius: 0, objectFit: 'cover', height: 280 }} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ─── FOR ORGANIZATIONS CTA ─── */}
      <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: '#F8F9FA' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="overline" sx={{ color: '#1A237E', fontWeight: 800, letterSpacing: 2 }}>FOR INSURERS & BROKERS</Typography>
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#202124', mt: 1, mb: 2, letterSpacing: -0.75 }}>
                Are you an insurance organization?
              </Typography>
              <Typography sx={{ color: '#5F6368', fontSize: '1.05rem', lineHeight: 1.75, maxWidth: 560 }}>
                SHIELDS provides a complete digital platform for insurers, brokers, and managing general agents to issue policies, manage clients, and process claims at scale.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Stack spacing={2} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                <Button variant="contained" size="large" onClick={() => navigate('/admin/register')} endIcon={<ArrowIcon />}
                  sx={{ bgcolor: '#1A237E', borderRadius: 0, fontWeight: 700, px: 4, py: 1.75, boxShadow: 'none', '&:hover': { bgcolor: '#0d1b6e', boxShadow: 'none' } }}>
                  Register your organization
                </Button>
                <Button size="large" onClick={() => navigate('/admin/login')}
                  sx={{ color: '#1A237E', fontWeight: 700, borderRadius: 0, border: '1px solid #E8EAED', px: 4, py: 1.5, '&:hover': { bgcolor: '#E8F0FE' } }}>
                  Sign in to portal →
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ─── FOOTER ─── */}
      <Box sx={{ py: 6, bgcolor: '#202124', color: '#fff' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} sx={{ mb: 5 }}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
                <Box sx={{ width: 32, height: 32, bgcolor: '#1A237E', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldIcon sx={{ color: '#fff', fontSize: 18 }} />
                </Box>
                <Typography sx={{ fontWeight: 800, color: '#fff' }}>SHIELDS</Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>
                Uganda's most trusted digital insurance platform. Licensed and regulated by the Insurance Regulatory Authority of Uganda.
              </Typography>
            </Grid>
            {[
              { title: 'Products', links: ['Health Insurance', 'Life Insurance', 'Motor Insurance', 'Property Insurance'] },
              { title: 'Company', links: ['About us', 'Careers', 'Press', 'Contact'] },
              { title: 'Support', links: ['Help Center', 'File a Claim', 'Advisor Chat', 'IRA Uganda'] },
            ].map(col => (
              <Grid item xs={6} md={2} key={col.title}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, display: 'block', mb: 2 }}>{col.title.toUpperCase()}</Typography>
                <Stack spacing={1.25}>
                  {col.links.map(link => (
                    <Typography key={link} variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', cursor: 'pointer', '&:hover': { color: '#fff' }, transition: 'color 0.2s' }}>{link}</Typography>
                  ))}
                </Stack>
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.08)', mb: 4 }} />
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>© 2024 SHIELDS. All rights reserved.</Typography>
            <Stack direction="row" spacing={3}>
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(l => (
                <Typography key={l} variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', cursor: 'pointer', '&:hover': { color: '#fff' } }}>{l}</Typography>
              ))}
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  )
}
