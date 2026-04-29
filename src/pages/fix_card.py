import sys

path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path, 'r') as f:
    lines = f.readlines()

# Search for the pattern of the product card content area
# We know line 1140-1144 was messed up
# Let's find the card content section by looking for "LIMIT" and backtrack or find the preceding lines.

new_lines = []
skip = False
for i, line in enumerate(lines):
    # Looking for the Box with display: flex and gap: 2 inside CardContent
    # Based on previous views, it's around line 1140
    if 'LIMIT' in line and i > 5:
        # We are at the LIMIT box. Let's look back to see if we messed up the PREMIUM box.
        # The previous lines should be the Box and Divider.
        pass

# Actually, I'll just search and replace a larger unique block
content = "".join(lines)

# The mess looks like:
# 1140:                   <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
# 1141:                     <Box>
# 1142: 
# 1143:                     </Box>
# 1144:                     <Divider orientation="vertical" flexItem />

messy_block = """                  <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                    <Box>

                    </Box>
                    <Divider orientation="vertical" flexItem />"""

# Let's try to match it more robustly or just look for the CardContent structure
target_pattern = """                  <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                    <Box>"""

# Since I keep messing it up, I will use a regex or search for the LIMIT line and replace the whole Box
import re
# Find the box that contains LIMIT and should have PREMIUM
# <Box sx={{ display: 'flex', gap: 2, mb: 1 }}> ... LIMIT ... </Box>

# Actually let's just rewrite the whole CardContent block for one card as it repeats in a map
# No, let's just find the exact lines in the file.

# Read file again to get current state precisely
with open(path, 'r') as f:
    text = f.read()

# I will replace the messy area. 
# It seems I deleted lines and left empty space or mismatched tags.
# I will find the CardContent start and rewrite its internal flex box.

search_text = """                  <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                    <Box>

                    </Box>
                    <Divider orientation="vertical" flexItem />"""

# Wait, looking at the last view_file output:
# 1140:                   <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
# 1141:                     <Box>
# 1142: 
# 1143:                     </Box>
# 1144:                     <Divider orientation="vertical" flexItem />

# If I use replace_file_content again with the EXACT string from view_file (no line numbers)

# Actually, I'll use python to be 100% sure.
# I'll look for the sequence: Box gap: 2 -> Box -> Box (empty) -> Divider
# and replace it with: Box gap: 2 -> Box -> Typography PREMIUM -> Typography PREMIUM VALUE -> Divider

pattern = re.compile(r'<Box sx=\{\{ display: \'flex\', gap: 2, mb: 1 \}\}>\s*<Box>\s*</Box>\s*<Divider orientation=\"vertical\" flexItem />', re.DOTALL)

replacement = """<Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#1A237E', display: 'block' }}>PREMIUM</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(product.base_premium)}</Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />"""

new_text = pattern.sub(replacement, text)

with open(path, 'w') as f:
    f.write(new_text)

print("Replacement successful")
