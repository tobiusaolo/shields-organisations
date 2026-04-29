import os

path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path, 'r') as f:
    content = f.read()

# 1. Add LinearProgress to imports if not there
if 'LinearProgress,' not in content:
    content = content.replace('CircularProgress,', 'CircularProgress, LinearProgress,')

# 2. Add Progress Bar to the Wizard Dialog
# I'll put it right above the step content container or as an overlay

saving_overlay = '''            {createProductMutation.isLoading && (
              <Box sx={{ 
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                bgcolor: 'rgba(255,255,255,0.7)', zIndex: 10, 
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(4px)'
              }}>
                <CircularProgress size={60} thickness={4} sx={{ color: '#1A237E', mb: 3 }} />
                <Typography sx={{ fontWeight: 800, color: '#1A237E', fontSize: '1.2rem' }}>Finalizing & Deploying...</Typography>
                <Typography sx={{ color: '#5F6368', mt: 1 }}>Standardizing product blueprints in the registry...</Typography>
                <Box sx={{ width: '300px', mt: 4 }}>
                  <LinearProgress sx={{ height: 8, borderRadius: 4 }} />
                </Box>
              </Box>
            )}'''

# We'll insert it inside the <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', bgcolor: '#F8F9FE' }}>
insertion_point = "<Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', bgcolor: '#F8F9FE' }}>"
content = content.replace(insertion_point, insertion_point + "\n" + saving_overlay)

with open(path, 'w') as f:
    f.write(content)

print("Finalize & Deploy Progress Bar Added")
