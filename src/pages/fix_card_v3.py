import os

path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path, 'r') as f:
    lines = f.readlines()

# Rebuild the CardContent block for the product card
# We'll search for the CardContent that contains product.description

new_lines = []
in_card_content = False
skip_until_end_card = False

for i, line in enumerate(lines):
    if '<CardContent>' in line and i < len(lines)-5 and 'Avatar' in lines[i+1]:
        # This is the CardContent with the Avatar (the header)
        new_lines.append(line)
        continue

    if '<CardContent>' in line and not in_card_content:
        # This is the body CardContent
        in_card_content = True
        new_lines.append(line)
        # We'll insert our new content and skip the old one
        new_lines.append('                  <Typography variant="body2" sx={{ \n')
        new_lines.append('                    color: "#5F6368", mb: 2,\n')
        new_lines.append('                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",\n')
        new_lines.append('                    overflow: "hidden", textOverflow: "ellipsis", minHeight: "3em",\n')
        new_lines.append('                    fontSize: "0.8rem", lineHeight: 1.5\n')
        new_lines.append('                  }}>\n')
        new_lines.append('                    {product.description || "No description provided for this product template."}\n')
        new_lines.append('                  </Typography>\n')
        new_lines.append('\n')
        new_lines.append('                  <Box sx={{ display: "flex", gap: 2, mb: 1 }}>\n')
        new_lines.append('                    <Box>\n')
        new_lines.append('                      <Typography variant="caption" sx={{ fontWeight: 800, color: "#1A237E", display: "block" }}>PREMIUM</Typography>\n')
        new_lines.append('                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(product.base_premium)}</Typography>\n')
        new_lines.append('                    </Box>\n')
        new_lines.append('                  </Box>\n')
        skip_until_end_card = True
        continue
    
    if '</CardContent>' in line and in_card_content:
        in_card_content = False
        skip_until_end_card = False
        new_lines.append(line)
        continue
    
    if not skip_until_end_card:
        new_lines.append(line)

with open(path, 'w') as f:
    f.writelines(new_lines)

print("Card fixed: only Premium shown")
