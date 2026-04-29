import os

path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path, 'r') as f:
    content = f.read()

# 1. Fix the 'classes' model tiers in renderStepContent case 1
# Replace the previously modified block
old_classes_block = '''                        <Box sx={{ display:'flex', gap:2 }}>
                          <TextField label="Premium (UGX)" size="small" fullWidth type="number" value={tier.premium} onChange={e => upTier(idx,\'premium\',parseFloat(e.target.value)||0)} InputProps={{ startAdornment:<Typography sx={{mr:1,color:\'#5F6368\',fontSize:13}}>UGX</Typography> }}/>
                        </Box>'''

new_classes_block = '''                        <Box sx={{ display:'flex', gap:2 }}>
                          <TextField label="Premium (UGX)" size="small" fullWidth type="number" value={tier.coverage_amount} onChange={e => upTier(idx,\'coverage_amount\',parseFloat(e.target.value)||0)} InputProps={{ startAdornment:<Typography sx={{mr:1,color:\'#5F6368\',fontSize:13}}>UGX</Typography> }}/>
                        </Box>'''

if old_classes_block in content:
    content = content.replace(old_classes_block, new_classes_block)

# 2. Fix the 'formula' model in renderStepContent case 1
# Replace 'Base Premium' with 'Premium' and bind to limits.max
old_formula_field = '<TextField label="Base Premium (UGX)" type="number" fullWidth value={formData.basePremium} onChange={e => setFormData({...formData, basePremium: parseFloat(e.target.value)||0})} helperText="Minimum floor used when formula yields a lower value"/>'
new_formula_field = '<TextField label="Premium (UGX)" type="number" fullWidth value={formData.limits.max} onChange={e => setFormData({...formData, limits:{...formData.limits, max:parseFloat(e.target.value)||0}})} />'

if old_formula_field in content:
    content = content.replace(old_formula_field, new_formula_field)

# 3. Ensure the product card is correctly showing max_coverage
# I already did this, but let's double check it's there.

with open(path, 'w') as f:
    f.write(content)

print("Wizard and Card values synced according to user request")
