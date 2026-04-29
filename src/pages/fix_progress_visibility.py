import os

path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path, 'r') as f:
    content = f.read()

# 1. Remove the old progress overlay
old_overlay = '''            {createProductMutation.isLoading && (
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

content = content.replace(old_overlay, "")

# 2. Add the progress overlay as a direct child of the Dialog Paper
# I'll insert it right after the Dialog opening tag

new_overlay = '''        {createProductMutation.isLoading && (
          <Box sx={{ 
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
            bgcolor: 'rgba(255,255,255,0.8)', zIndex: 9999, 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(6px)'
          }}>
            <CircularProgress size={60} thickness={4} sx={{ color: '#1A237E', mb: 3 }} />
            <Typography sx={{ fontWeight: 900, color: '#1A237E', fontSize: '1.4rem', letterSpacing: 1 }}>FINALIZING & DEPLOYING</Typography>
            <Typography sx={{ color: '#5F6368', mt: 1, fontWeight: 500 }}>Standardizing product blueprints in the registry...</Typography>
            <Box sx={{ width: '340px', mt: 4 }}>
              <LinearProgress sx={{ height: 10, borderRadius: 5, bgcolor: '#E8EAF6', '& .MuiLinearProgress-bar': { bgcolor: '#1A237E' } }} />
            </Box>
          </Box>
        )}'''

insertion_point = "PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', height: '92vh', boxShadow: '0 32px 64px rgba(0,0,0,0.2)' } }}>"
content = content.replace(insertion_point, insertion_point + "\n" + new_overlay)

with open(path, 'w') as f:
    f.write(content)

print("Progress overlay moved to Dialog root for better visibility")
