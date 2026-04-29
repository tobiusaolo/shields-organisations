path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path, 'r') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if '<Typography variant="caption" sx={{ fontWeight: 800, color: \'#1A237E\', display: \'block\' }}>LIMIT</Typography>' in line:
        # This is the LIMIT box. We need to find the Box and Divider before it.
        # Let's check the previous lines.
        # Actually, let's just rebuild the flex box content.
        
        # We need to find the start of this flex box.
        # It's usually a few lines up.
        
        # Let's try a different approach: find the Divider and if it has nothing before it in the flex box, insert PREMIUM.
        pass

# Simple search and replace for the specific corrupted section
with open(path, 'r') as f:
    text = f.read()

# The corrupted part seems to be:
# <CardContent ...>
#   <Typography ...> description </Typography>
#   
#   <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
#     <Box>
#
#     </Box>
#     <Divider ... />

import re

# Match the empty box inside the flex container
pattern = re.compile(r'(<Box sx=\{\{ display: \'flex\', gap: 2, mb: 1 \}\}>\s*)<Box>\s*</Box>(\s*<Divider orientation=\"vertical\" flexItem />)', re.DOTALL)

# But wait, view_file showed:
# 1140: 
# 1141:                     <Divider orientation="vertical" flexItem />

# This means the Box start might be gone too? No, let's check further up.
f = open(path, 'r')
all_text = f.read()
f.close()

# I'll just replace the whole CardContent block with a fresh one.
# It's safer.

new_card_content = """                <CardContent sx={{ flexGrow: 1, pt: 2, pb: 1 }}>
                  <Typography variant="body2" sx={{ 
                    color: '#5F6368', mb: 2,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden', textOverflow: 'ellipsis', minHeight: '3em',
                    fontSize: '0.8rem', lineHeight: 1.5
                  }}>
                    {product.description || 'No description provided for this product template.'}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#1A237E', display: 'block' }}>PREMIUM</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(product.base_premium)}</Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#1A237E', display: 'block' }}>LIMIT</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(product.max_coverage)}</Typography>
                    </Box>
                  </Box>
                </CardContent>"""

# Find the broken CardContent
# It starts around line 1130.
# I'll look for the product.description line and replace the block around it.

pattern = re.compile(r'\s*<CardContent sx=\{\{ flexGrow: 1, pt: 2, pb: 1 \}\}>.*?{product\.description || \'No description provided for this product template\.\'}.*?</CardContent>', re.DOTALL)

new_text = pattern.sub("\\n" + new_card_content, all_text)

with open(path, 'w') as f:
    f.write(new_text)

print("Rebuilt CardContent")
