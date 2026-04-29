import os
import re

path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path, 'r') as f:
    content = f.read()

# I'll use a more surgical approach.
# Find the case 3 block.
case3_start = "case 3: {"
case3_end = "case 4:"

start_idx = content.find(case3_start)
end_idx = content.find(case3_end)

if start_idx != -1 and end_idx != -1:
    case3_content = content[start_idx:end_idx]
    
    # Define the NEW table editor block
    clean_table_editor = '''{field.type==='table' && (
                          <Box sx={{ mt:1.5, pl:2, borderLeft:'2px solid #E0E0E0' }}>
                            <Box sx={{ display:'flex', gap:2, mb:2 }}>
                              <TextField label="Min Rows" size="small" type="number" sx={{ width:110 }} value={field.min_rows} onChange={e=>upField(fi,fli,'min_rows',parseInt(e.target.value)||1)}/>
                              <TextField label="Max Rows" size="small" type="number" sx={{ width:110 }} value={field.max_rows} onChange={e=>upField(fi,fli,'max_rows',parseInt(e.target.value)||10)}/>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                              <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:1 }}>
                                <Typography variant="caption" sx={{ fontWeight:700, color:'#546E7A', letterSpacing:.5 }}>TABLE COLUMNS</Typography>
                                <Button size="small" onClick={()=>{const f=[...formData.dynamicForms]; f[fi].fields[fli].columns.push({label:'',type:'text', key:''}); setFormData({...formData,dynamicForms:f})}}>+ Column</Button>
                              </Box>
                              {(field.columns||[]).map((col,ci)=>(
                                <Box key={ci} sx={{ display:'flex', gap:1, mb:0.75 }}>
                                  <TextField placeholder="Column Label" size="small" fullWidth value={col.label} onChange={e=>{ 
                                    upCol(fi,fli,ci,'label',e.target.value);
                                    upCol(fi,fli,ci,'key',e.target.value.toLowerCase().replace(/\\s+/g,'_'));
                                  }}/>
                                  <TextField select size="small" sx={{ width:120 }} value={col.type} onChange={e=>upCol(fi,fli,ci,'type',e.target.value)}>
                                    <MenuItem value="text">Text</MenuItem><MenuItem value="number">Number</MenuItem><MenuItem value="date">Date</MenuItem>
                                  </TextField>
                                  <IconButton size="small" color="error" onClick={()=>{const f=[...formData.dynamicForms]; f[fi].fields[fli].columns=f[fi].fields[fli].columns.filter((_,i)=>i!==ci); setFormData({...formData,dynamicForms:f})}}><DeleteIcon fontSize="small"/></IconButton>
                                </Box>
                              ))}
                            </Box>

                            <Box sx={{ mt: 2 }}>
                              <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight:700, color:'#546E7A', letterSpacing:.5 }}>PREFILL ROWS (OPTIONAL)</Typography>
                                <Button size="small" disabled={!field.columns?.length} onClick={()=>{ 
                                  const f=[...formData.dynamicForms]; 
                                  const newRow = {}; 
                                  (field.columns || []).forEach(c => { 
                                    const k = c.key || c.label?.toLowerCase().replace(/\\s+/g,'_');
                                    if(k) newRow[k] = ''; 
                                  }); 
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
                                      value={row[col.key || col.label?.toLowerCase().replace(/\\s+/g,'_')] || ''} 
                                      onChange={e => { 
                                        const f=[...formData.dynamicForms]; 
                                        const k = col.key || col.label?.toLowerCase().replace(/\\s+/g,'_');
                                        f[fi].fields[fli].prefill_rows[ri][k] = e.target.value; 
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
                          </Box>
                        )}'''
    
    # Use regex to find any block starting with {field.type==='table' && ( and ending with )}
    # within the case 3 content, and replace all of them with our clean block
    # We'll do it once.
    
    # First, find the whole area from the first {field.type==='table' to the last closing brace of such a block
    new_case3 = re.sub(r'\{field\.type\=\=\=\'table\' \&\& \(.*?\<\/Box\>\s*?\)\}', 'REPLACEMENT_HOLDER', case3_content, flags=re.DOTALL)
    
    # If there were multiple, they are all replaced by the holder. We only want one.
    # So we replace the first holder with our UI and remove the others.
    new_case3 = new_case3.replace('REPLACEMENT_HOLDER', clean_table_editor, 1)
    new_case3 = new_case3.replace('REPLACEMENT_HOLDER', '')
    
    content = content[:start_idx] + new_case3 + content[end_idx:]

with open(path, 'w') as f:
    f.write(content)

print("Table Editor Unified and Cleaned (v2)")
