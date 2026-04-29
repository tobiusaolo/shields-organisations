import os

path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path, 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if line.strip() == '<Grid item xs={12} sm={6} md={4} key={product.id}>':
        new_lines.append(line)
        new_lines.append("              <Card sx={{ borderRadius: 0, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>\n")
        new_lines.append("                <CardContent>\n")
        new_lines.append("                  <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>\n")
        new_lines.append("                    {product.image_base64 ? (\n")
        new_lines.append("                      <Avatar src={product.image_base64} variant=\"rounded\" sx={{ width: 56, height: 56, boxShadow: 1 }} />\n")
        new_lines.append("                    ) : (\n")
        new_lines.append("                      <Avatar variant=\"rounded\" sx={{ width: 56, height: 56, bgcolor: CATEGORIES.find(c => c.value === product.category)?.color || 'primary.main', boxShadow: 1 }}>\n")
        new_lines.append("                        <CategoryIcon />\n")
        new_lines.append("                      </Avatar>\n")
        new_lines.append("                    )}\n")
        new_lines.append("                    <Box sx={{ flex: 1, minWidth: 0 }}>\n")
        new_lines.append("                      <Typography variant=\"h6\" sx={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2, mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</Typography>\n")
        new_lines.append("                      <Chip \n")
        new_lines.append("                        icon={<CategoryIcon fontSize=\"small\" />}\n")
        new_lines.append("                        label={CATEGORIES.find(c => c.value === product.category)?.label || product.category}\n")
        new_lines.append("                        size=\"small\"\n")
        new_lines.append("                        sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, bgcolor: 'rgba(0,0,0,0.04)' }}\n")
        new_lines.append("                      />\n")
        new_lines.append("                    </Box>\n")
        new_lines.append("                  </Box>\n")
        new_lines.append("                  <Typography variant=\"body2\" sx={{ \n")
        new_lines.append("                    color: \"#5F6368\", mb: 2,\n")
        new_lines.append("                    display: \"-webkit-box\", WebkitLineClamp: 2, WebkitBoxOrient: \"vertical\",\n")
        new_lines.append("                    overflow: \"hidden\", textOverflow: \"ellipsis\", minHeight: \"3em\",\n")
        new_lines.append("                    fontSize: \"0.8rem\", lineHeight: 1.5\n")
        new_lines.append("                  }}>\n")
        new_lines.append("                    {product.description || \"No description provided for this product template.\"}\n")
        new_lines.append("                  </Typography>\n")
        skip = True
        continue
    
    if skip:
        if line.strip() == '<Box sx={{ display: "flex", gap: 2, mb: 1 }}>':
            skip = False
            new_lines.append(line)
        continue
    
    new_lines.append(line)

with open(path, 'w') as f:
    f.writelines(new_lines)

print("Product Card Fixed")
