import os

path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path, 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    # 1. Update Column editor to handle keys and labels properly
    if 'placeholder="Column Label" size="small" fullWidth value={col.label} onChange={e=>upCol(fi,fli,ci,\'label\',e.target.value)}' in line:
        new_lines.append('                                <TextField placeholder="Column Label" size="small" fullWidth value={col.label} onChange={e=>{ \n')
        new_lines.append('                                  upCol(fi,fli,ci,\'label\',e.target.value);\n')
        new_lines.append('                                  upCol(fi,fli,ci,\'key\',e.target.value.toLowerCase().replace(/\\s+/g,\'_\'));\n')
        new_lines.append('                                }}/>\n')
        continue

    # 2. Add Prefill Rows section after the columns loop
    if '                            {((field.columns||[])).map((col,ci)=>(' in line or '                            {(field.columns||[]).map((col,ci)=>(' in line:
        # We need to find the end of this map
        pass

    if '                            {/* Prefill Rows Placeholder */}' in line:
        # If I already have a placeholder, I'll replace it
        pass

    new_lines.append(line)

    if '                              </Box>\n' in line and len(new_lines) > 5 and 'ci} sx={{ display:\'flex\', gap:1, mb:0.75 }}>' in new_lines[-2]:
        # This is likely the end of the columns map
        new_lines.append('\n')
        new_lines.append('                            <Box sx={{ mt: 2 }}>\n')
        new_lines.append('                              <Box sx={{ display:\'flex\', justifyContent:\'space-between\', alignItems:\'center\', mb: 1 }}>\n')
        new_lines.append('                                <Typography variant="caption" sx={{ fontWeight:700, color:\'#546E7A\', letterSpacing:.5 }}>PREFILL ROWS (OPTIONAL)</Typography>\n')
        new_lines.append('                                <Button size="small" onClick={()=>{ \n')
        new_lines.append('                                  const f=[...formData.dynamicForms]; \n')
        new_lines.append('                                  const newRow = {}; \n')
        new_lines.append('                                  (field.columns || []).forEach(c => { if(c.key) newRow[c.key] = \'\'; }); \n')
        new_lines.append('                                  if(!f[fi].fields[fli].prefill_rows) f[fi].fields[fli].prefill_rows = []; \n')
        new_lines.append('                                  f[fi].fields[fli].prefill_rows.push(newRow); \n')
        new_lines.append('                                  setFormData({...formData,dynamicForms:f}); \n')
        new_lines.append('                                }}>+ Add Row</Button>\n')
        new_lines.append('                              </Box>\n')
        new_lines.append('                              {(field.prefill_rows || []).map((row, ri) => (\n')
        new_lines.append('                                <Box key={ri} sx={{ display:\'flex\', gap:1, mb:1, alignItems:\'center\' }}>\n')
        new_lines.append('                                  {(field.columns || []).map((col, ci) => (\n')
        new_lines.append('                                    <TextField \n')
        new_lines.append('                                      key={ci} \n')
        new_lines.append('                                      placeholder={col.label} \n')
        new_lines.append('                                      size="small" \n')
        new_lines.append('                                      sx={{ flex: 1 }} \n')
        new_lines.append('                                      value={row[col.key] || \'\'} \n')
        new_lines.append('                                      onChange={e => { \n')
        new_lines.append('                                        const f=[...formData.dynamicForms]; \n')
        new_lines.append('                                        f[fi].fields[fli].prefill_rows[ri][col.key] = e.target.value; \n')
        new_lines.append('                                        setFormData({...formData, dynamicForms: f}); \n')
        new_lines.append('                                      }} \n')
        new_lines.append('                                    />\n')
        new_lines.append('                                  ))}\n')
        new_lines.append('                                  <IconButton size="small" color="error" onClick={() => { \n')
        new_lines.append('                                    const f=[...formData.dynamicForms]; \n')
        new_lines.append('                                    f[fi].fields[fli].prefill_rows = f[fi].fields[fli].prefill_rows.filter((_,i) => i !== ri); \n')
        new_lines.append('                                    setFormData({...formData, dynamicForms: f}); \n')
        new_lines.append('                                  }}>\n')
        new_lines.append('                                    <DeleteIcon fontSize="small" />\n')
        new_lines.append('                                  </IconButton>\n')
        new_lines.append('                                </Box>\n')
        new_lines.append('                              ))}\n')
        new_lines.append('                            </Box>\n')

with open(path, 'w') as f:
    f.writelines(new_lines)

print("Form Builder Prefill Rows Restored")
