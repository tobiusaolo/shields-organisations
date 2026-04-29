import os

path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path, 'r') as f:
    content = f.read()

# Fix the accidental deletion from previous turn (empty line at 815)
# Actually, let's just find the pattern and replace it correctly.
# The card content looks like:
# <Typography variant="caption" ...>PREMIUM</Typography>
# <Typography variant="body2" ...>{formatCurrency(product.base_premium)}</Typography>
# Or maybe it's already deleted.

if '{formatCurrency(product.base_premium)}' in content:
    content = content.replace('{formatCurrency(product.base_premium)}', '{formatCurrency(product.max_coverage)}')
elif '<Typography variant="caption" sx={{ fontWeight: 800, color: "#1A237E", display: "block" }}>PREMIUM</Typography>\n                    \n' in content:
    # This matches the empty line I might have created
    content = content.replace(
        '<Typography variant="caption" sx={{ fontWeight: 800, color: "#1A237E", display: "block" }}>PREMIUM</Typography>\n                    \n',
        '<Typography variant="caption" sx={{ fontWeight: 800, color: "#1A237E", display: "block" }}>PREMIUM</Typography>\n                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(product.max_coverage)}</Typography>\n'
    )
else:
    # Generic fallback
    content = content.replace(
        'variant="caption" sx={{ fontWeight: 800, color: "#1A237E", display: "block" }}>PREMIUM</Typography>',
        'variant="caption" sx={{ fontWeight: 800, color: "#1A237E", display: "block" }}>PREMIUM</Typography>\n                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(product.max_coverage)}</Typography>'
    )

with open(path, 'w') as f:
    f.write(content)

print("Product Card Value Updated")
