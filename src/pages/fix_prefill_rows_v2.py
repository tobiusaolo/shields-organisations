import os
import re

path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path, 'r') as f:
    content = f.read()

# 1. Fix the column editor to handle keys
pattern_col = r'value=\{col\.label\} onChange=\{e\=\>upCol\(fi,fli,ci,\'label\',e\.target\.value\)\}'
replacement_col = r'''value={col.label} onChange={e=>{ 
                                  upCol(fi,fli,ci,'label',e.target.value);
                                  upCol(fi,fli,ci,'key',e.target.value.toLowerCase().replace(/\s+/g,'_'));
                                }}'''

content = re.sub(pattern_col, replacement_col, content)

# 2. Add Prefill Rows section
# We want to insert it after the columns map loop
# The pattern to find the end of the columns map loop:
pattern_loop_end = r'\{\(field\.columns\|\|\[\]\)\.map\(\(col,ci\)\=\>\(.*?\<IconButton.*?DeleteIcon.*?\/\>.*?\<\/IconButton\>.*?\<\/Box\>.*?\)\)\}'

# Actually, let's find the closing tag for the columns container
# or better yet, look for the closing curly brace of the map

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

# Since regex on complex JSX is hard, I'll use a marker
content = content.replace(
    '<IconButton size="small" color="error" sx={{ mt:0.5 }} onClick={()=>{const f=[...formData.dynamicForms]; f[fi].fields=f[fi].fields.filter((_,i)=>i!==fli); setFormData({...formData,dynamicForms:f})}}><DeleteIcon fontSize="small"/></IconButton>\n                        </Box>',
    '<IconButton size="small" color="error" sx={{ mt:0.5 }} onClick={()=>{const f=[...formData.dynamicForms]; f[fi].fields=f[fi].fields.filter((_,i)=>i!==fli); setFormData({...formData,dynamicForms:f})}}><DeleteIcon fontSize="small"/></IconButton>\n                        </Box>\n                        {/* PREFILL_MARKER */}'
)

content = content.replace('{/* PREFILL_MARKER */}', prefill_ui)

with open(path, 'w') as f:
    f.write(content)

print("Form Builder Prefill Rows Restored with Marker")
