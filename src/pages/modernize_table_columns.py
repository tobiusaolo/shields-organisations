import os

path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path, 'r') as f:
    content = f.read()

case3_start = "case 3: {"
case3_end = "case 4:"

start_idx = content.find(case3_start)
end_idx = content.find(case3_end)

if start_idx != -1 and end_idx != -1:
    case3_content = content[start_idx:end_idx]
    
    # Redesign the Columns list to look more like a table
    new_columns_ui = '''<Box sx={{ mb: 2 }}>
                              <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:2 }}>
                                <Typography variant="caption" sx={{ fontWeight:700, color:'#546E7A', letterSpacing:.5 }}>TABLE COLUMNS</Typography>
                                <Button size="small" variant="outlined" startIcon={<AddIcon/>} onClick={()=>{const f=[...formData.dynamicForms]; f[fi].fields[fli].columns.push({label:'',type:'text', key:''}); setFormData({...formData,dynamicForms:f})}}>Add Column</Button>
                              </Box>
                              
                              {field.columns?.length > 0 && (
                                <Box sx={{ mb: 1, display: 'flex', gap: 1, px: 1, bgcolor: '#ECEFF1', py: 0.5, borderRadius: 1 }}>
                                  <Typography variant="caption" sx={{ flex: 3, fontWeight: 800, color: '#455A64' }}>COLUMN LABEL</Typography>
                                  <Typography variant="caption" sx={{ flex: 1.5, fontWeight: 800, color: '#455A64' }}>DATA TYPE</Typography>
                                  <Box sx={{ width: 32 }} />
                                </Box>
                              )}

                              {(field.columns||[]).map((col,ci)=>(
                                <Box key={ci} sx={{ display:'flex', gap:1, mb:1, alignItems: 'center' }}>
                                  <TextField 
                                    placeholder="e.g. Item Name" 
                                    size="small" 
                                    sx={{ flex: 3 }} 
                                    value={col.label} 
                                    onChange={e=>{ 
                                      upCol(fi,fli,ci,'label',e.target.value);
                                      upCol(fi,fli,ci,'key',e.target.value.toLowerCase().replace(/\\s+/g,'_'));
                                    }}
                                  />
                                  <TextField 
                                    select 
                                    size="small" 
                                    sx={{ flex: 1.5 }} 
                                    value={col.type} 
                                    onChange={e=>upCol(fi,fli,ci,'type',e.target.value)}
                                  >
                                    <MenuItem value="text">Text</MenuItem>
                                    <MenuItem value="number">Number</MenuItem>
                                    <MenuItem value="date">Date</MenuItem>
                                  </TextField>
                                  <IconButton size="small" color="error" onClick={()=>{const f=[...formData.dynamicForms]; f[fi].fields[fli].columns=f[fi].fields[fli].columns.filter((_,i)=>i!==ci); setFormData({...formData,dynamicForms:f})}}>
                                    <DeleteIcon fontSize="small"/>
                                  </IconButton>
                                </Box>
                              ))}
                            </Box>'''

    # Replace the existing columns block
    pattern = r'\<Box sx\=\{\{ mb: 2 \}\}\>.*?TABLE COLUMNS.*?\<\/Box\>\s*?\{\(field\.columns\|\|\[\]\)\.map.*?\<\/Box\>\s*?\)\)\}\s*?\<\/Box\>'
    
    # Surgical replacement using landmarks
    case3_content = case3_content.replace(
        '<Typography variant="caption" sx={{ fontWeight:700, color:\'#546E7A\', letterSpacing:.5 }}>TABLE COLUMNS</Typography>',
        'REPLACE_COL_START'
    )
    
    # We'll just replace the whole sequence again to be safe
    import re
    sequence_pattern = r'\<Box sx\=\{\{ mb: 2 \}\}\>.*?TABLE COLUMNS.*?\<\/IconButton\>\s*?\<\/Box\>\s*?\)\)\}\s*?\<\/Box\>'
    new_case3_content = re.sub(sequence_pattern, new_columns_ui, case3_content, flags=re.DOTALL)
    
    content = content[:start_idx] + new_case3_content + content[end_idx:]

with open(path, 'w') as f:
    f.write(content)

print("Table Columns UI Modernized")
