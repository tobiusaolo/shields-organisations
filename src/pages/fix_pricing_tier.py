import os

path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path, 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if line.strip() == '<TextField label="Description" size="small" fullWidth value={tier.description} onChange={e => upTier(idx,\'description\',e.target.value)} placeholder="What does this tier cover?" />':
        new_lines.append(line)
        new_lines.append('                        <Box sx={{ display:\'flex\', gap:2 }}>\n')
        new_lines.append('                          <TextField label="Premium (UGX)" size="small" fullWidth type="number" value={tier.premium} onChange={e => upTier(idx,\'premium\',parseFloat(e.target.value)||0)} InputProps={{ startAdornment:<Typography sx={{mr:1,color:\'#5F6368\',fontSize:13}}>UGX</Typography> }}/>\n')
        new_lines.append('                        </Box>\n')
        skip = True
        continue
    
    if skip:
        if line.strip() == '<Box>':
            skip = False
            new_lines.append(line)
        continue
    
    new_lines.append(line)

with open(path, 'w') as f:
    f.writelines(new_lines)

print("Pricing Tier fixed")
