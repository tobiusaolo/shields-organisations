import os

path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path, 'r') as f:
    content = f.read()

# 1. Update formData initial state
if "pricing_frequency: 'annual'," not in content:
    content = content.replace(
        "duration_years: '1',",
        "duration_years: '1',\n    pricing_frequency: 'monthly',"
    )

# 2. Update renderStepContent case 0
# I'll add the Payment Frequency dropdown next to Category/Duration
new_fields = '''                  <Grid item xs={12} sm={4}>
                    <TextField select label="Category" fullWidth value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                      {CATEGORIES.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField label="Duration (Years)" type="number" fullWidth value={formData.duration_years} onChange={(e) => setFormData({ ...formData, duration_years: e.target.value })} InputProps={{ inputProps: { min: 1, max: 100 } }} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField select label="Payment Frequency" fullWidth value={formData.pricing_frequency} onChange={(e) => setFormData({ ...formData, pricing_frequency: e.target.value })}>
                      <MenuItem value="monthly">Monthly</MenuItem>
                      <MenuItem value="quarterly">Quarterly</MenuItem>
                      <MenuItem value="bi-annually">Bi-Annually</MenuItem>
                      <MenuItem value="annual">Annually</MenuItem>
                    </TextField>
                  </Grid>'''

old_grid_block = '''                  <Grid item xs={12} sm={6}>
                    <TextField select label="Category" fullWidth value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                      {CATEGORIES.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Policy Duration (Years)" type="number" fullWidth value={formData.duration_years} onChange={(e) => setFormData({ ...formData, duration_years: e.target.value })} InputProps={{ inputProps: { min: 1, max: 100 } }} />
                  </Grid>'''

if old_grid_block in content:
    content = content.replace(old_grid_block, new_fields)

# 3. Update mutations (handleSave)
# Update updateProductTemplate and createProductTemplate calls
content = content.replace(
    "coverage_limits: data.limits || { min: 0, max: 0 }",
    "coverage_limits: data.limits || { min: 0, max: 0 },\n            pricing_frequency: data.pricing_frequency"
)

with open(path, 'w') as f:
    f.write(content)

print("Products.jsx updated with Payment Frequency")
