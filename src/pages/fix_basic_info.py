import os
import re

path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path, 'r') as f:
    content = f.read()

replacement = '''      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Avatar 
                  src={formData.image_base64 || ''} 
                  variant="rounded" 
                  sx={{ width: 100, height: 100, bgcolor: '#F1F3F4', border: '1px dashed #BDC1C6' }}
                >
                  {!formData.image_base64 && <ProductIcon sx={{ color: '#9AA0A6', fontSize: 40 }} />}
                </Avatar>
                <Button variant="outlined" size="small" component="label" sx={{ textTransform: 'none', borderRadius: 2 }}>
                  Upload Logo
                  <input type="file" hidden accept="image/*" onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setFormData({ ...formData, image_base64: reader.result });
                      reader.readAsDataURL(file);
                    }
                  }} />
                </Button>
                {formData.image_base64 && (
                  <Button size="small" color="error" onClick={() => setFormData({ ...formData, image_base64: '' })} sx={{ textTransform: 'none' }}>Remove</Button>
                )}
              </Box>
              
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField label="Product Name" variant="outlined" fullWidth value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Comprehensive Motor Insurance" />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField select label="Category" fullWidth value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                      {CATEGORIES.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Policy Duration (Years)" type="number" fullWidth value={formData.duration_years} onChange={(e) => setFormData({ ...formData, duration_years: e.target.value })} InputProps={{ inputProps: { min: 1, max: 100 } }} />
                  </Grid>
                </Grid>
              </Box>
            </Box>
            
            <TextField label="Description" fullWidth multiline rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the main benefits and purpose of this product..." />
            
            <TextField label="Terms and Conditions" fullWidth multiline rows={4} value={formData.terms} onChange={(e) => setFormData({ ...formData, terms: e.target.value })} placeholder="Enter the legal terms and conditions for this product..." />
          </Box>
        )'''

pattern = r"      case 0:\n        return \(\n          \<Box sx=\{\{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 \}\}\>\n            \<TextField label=\"Product Name\".*?\<\/Box\>\n        \)"

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open(path, 'w') as f:
    f.write(content)

print("Basic Info fixed")
