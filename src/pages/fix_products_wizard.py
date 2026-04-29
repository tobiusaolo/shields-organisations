path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path) as f:
    src = f.read()

# ─── 1. WIZARD DIALOG – replace from the Dialog open line to the closing </Dialog> ───
old_wiz_start = "      {/* Wizard Dialog */}\n      <Dialog open={wizardOpen}"
old_wiz_end_marker = "      {/* Success Dialog */}"

wi = src.index(old_wiz_start)
we = src.index(old_wiz_end_marker)

new_wizard = """      {/* Wizard Dialog */}
      <Dialog open={wizardOpen} onClose={() => setWizardOpen(false)} maxWidth="lg" fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', height: '92vh', boxShadow: '0 32px 64px rgba(0,0,0,0.2)' } }}>

        {/* Header */}
        <Box sx={{ background: 'linear-gradient(135deg, #1A237E 0%, #283593 100%)', p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', p: 1, borderRadius: 2, display: 'flex' }}>
              <ProductIcon sx={{ fontSize: 22, color: '#fff' }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 900, color: '#fff', fontSize: '1rem', letterSpacing: 0.3 }}>
                {isEditing ? 'Edit Product' : 'Product Factory'}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.78rem' }}>
                {STEP_META[activeStep]?.desc}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 0.8 }}>
              {STEP_META.map((s, i) => (
                <Box key={i} sx={{
                  width: i === activeStep ? 28 : 8, height: 8, borderRadius: 4,
                  bgcolor: i < activeStep ? '#4CAF50' : i === activeStep ? '#fff' : 'rgba(255,255,255,0.25)',
                  transition: 'all 0.3s', cursor: i < activeStep ? 'pointer' : 'default'
                }} onClick={() => i < activeStep && setActiveStep(i)} />
              ))}
            </Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
              {activeStep + 1}/{STEPS.length}
            </Typography>
            <IconButton onClick={() => setWizardOpen(false)} sx={{ color: 'rgba(255,255,255,0.7)', p: 0.5 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', bgcolor: '#F8F9FE' }}>
          {/* Sidebar */}
          <Box sx={{ width: 220, bgcolor: '#fff', borderRight: '1px solid #E8EAED', display: 'flex', flexDirection: 'column', py: 2, flexShrink: 0 }}>
            {STEP_META.map((s, i) => (
              <Box key={i} onClick={() => i < activeStep && setActiveStep(i)}
                sx={{
                  px: 2.5, py: 1.8, cursor: i < activeStep ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  bgcolor: activeStep === i ? '#F8F9FE' : 'transparent',
                  borderLeft: activeStep === i ? `3px solid ${s.color}` : '3px solid transparent',
                  transition: 'all 0.15s',
                  '&:hover': i < activeStep ? { bgcolor: '#F8F9FE' } : {}
                }}>
                <Box sx={{
                  width: 26, height: 26, borderRadius: 2,
                  bgcolor: i < activeStep ? '#E6F4EA' : i === activeStep ? s.color : '#F1F3F4',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {i < activeStep
                    ? <CheckIcon sx={{ fontSize: 14, color: '#1E8E3E' }} />
                    : <Typography sx={{ fontSize: '0.72rem', fontWeight: 900, color: i === activeStep ? '#fff' : '#9AA0A6' }}>{i + 1}</Typography>
                  }
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: activeStep === i ? 800 : 500, color: activeStep === i ? '#202124' : i < activeStep ? '#1E8E3E' : '#9AA0A6', lineHeight: 1.2 }}>
                    {s.label}
                  </Typography>
                  {activeStep === i && (
                    <Typography sx={{ fontSize: '0.68rem', color: '#9AA0A6', mt: 0.2 }}>{s.desc}</Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Box>

          {/* Step Content */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 3.5 }}>
            {renderStepContent(activeStep)}
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2.5, borderTop: '1px solid #E8EAED', display: 'flex', alignItems: 'center', bgcolor: '#fff' }}>
          <Button onClick={() => setWizardOpen(false)} sx={{ color: '#9AA0A6', fontWeight: 600 }}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          {activeStep > 0 && (
            <Button onClick={handleBack} sx={{ mr: 1.5, fontWeight: 700, color: '#5F6368' }}>← Back</Button>
          )}
          {activeStep < STEPS.length - 1
            ? <Button variant="contained" onClick={handleNext}
                sx={{ px: 4, borderRadius: 2.5, fontWeight: 800, bgcolor: '#1A237E', boxShadow: '0 4px 12px rgba(26,35,126,0.3)', '&:hover': { bgcolor: '#0D47A1' } }}>
                Continue →
              </Button>
            : <Button variant="contained" onClick={() => createProductMutation.mutate(formData)}
                disabled={createProductMutation.isLoading}
                sx={{ px: 4, borderRadius: 2.5, fontWeight: 800, bgcolor: '#1E8E3E', boxShadow: '0 4px 12px rgba(30,142,62,0.3)', '&:hover': { bgcolor: '#137333' } }}>
                {createProductMutation.isLoading ? 'Deploying...' : '🚀 Finalize & Deploy'}
              </Button>
          }
        </Box>
      </Dialog>

      """

src = src[:wi] + new_wizard + src[we:]

with open(path, 'w') as f:
    f.write(src)
print("Wizard redesign done")
