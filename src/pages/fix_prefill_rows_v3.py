import os

path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path, 'r') as f:
    content = f.read()

# 1. Fix the column editor to handle keys
old_col = "value={col.label} onChange={e=>upCol(fi,fli,ci,'label',e.target.value)}"
new_col = """value={col.label} onChange={e=>{ 
                                  upCol(fi,fli,ci,'label',e.target.value);
                                  upCol(fi,fli,ci,'key',e.target.value.toLowerCase().replace(/\s+/g,'_'));
                                }}"""

content = content.replace(old_col, new_col)

# 2. Add Prefill Rows section
prefill_ui = '''                            {field.type==='table' && (
                            <Box sx={{ mt: 2 }}>
                              <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight:700, color:'#546E7A', letterSpacing:.5 }}>PREFILL ROWS (OPTIONAL)</Typography>
                                <Button size="small" onClick={()=>{ 
                                  const f=[...formData.dynamicForms]; 
                                  const newRow = {}; 
                                  (field.columns || []).forEach(c => { if(c.key) newRow[c.key] = ''; }); 
                                  if(!f[fi].fields[fli].prefill_rows) f[fi].fields[fli].prefill_rows = []; 
                                  f[fi].fields[fli].prefill_rows.push(newRow); 
                                  setFormData({...formData,dynamicForms:f}); 
                                }}>+ Add Row</Button>
                              </Box>
                              {(field.prefill_rows || []).map((row, ri) => (
                                <Box key={ri} sx={{ display:'flex', gap:1, mb:1, alignItems:'center' }}>
                                  {(field.columns || []).map((col, ci) => (
                                    <TextField 
                                      key={ci} 
                                      placeholder={col.label} 
                                      size="small" 
                                      sx={{ flex: 1 }} 
                                      value={row[col.key] || ''} 
                                      onChange={e => { 
                                        const f=[...formData.dynamicForms]; 
                                        f[fi].fields[fli].prefill_rows[ri][col.key] = e.target.value; 
                                        setFormData({...formData, dynamicForms: f}); 
                                      }} 
                                    />
                                  ))}
                                  <IconButton size="small" color="error" onClick={() => { 
                                    const f=[...formData.dynamicForms]; 
                                    f[fi].fields[fli].prefill_rows = f[fi].fields[fli].prefill_rows.filter((_,i) => i !== ri); 
                                    setFormData({...formData, dynamicForms: f}); 
                                  }}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              ))}
                            </Box>
                            )}'''

# We want to insert this at the end of the field editor block
marker = '<IconButton size="small" color="error" sx={{ mt:0.5 }} onClick={()=>{const f=[...formData.dynamicForms]; f[fi].fields=f[fi].fields.filter((_,i)=>i!==fli); setFormData({...formData,dynamicForms:f})}}><DeleteIcon fontSize="small"/></IconButton>\n                        </Box>'
new_marker = marker + '\n                        {/* PREFILL_MARKER */}'

if marker in content:
    content = content.replace(marker, new_marker)
    content = content.replace('{/* PREFILL_MARKER */}', prefill_ui)
else:
    print("Marker not found")

with open(path, 'w') as f:
    f.write(content)

print("Form Builder Prefill Rows Restored with Marker (v3)")
