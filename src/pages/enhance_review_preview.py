import os

path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path, 'r') as f:
    content = f.read()

# Add a Form Preview section to the Review step (case 4)
# I'll insert it after the summary list

old_review_end = "            ].map(section => ("
new_review_ui = '''            ].map(section => (
              <Paper key={section.title} sx={{ borderRadius:0, overflow:'hidden', border:'1px solid #E0E0E0', mb:1.5 }}>
                <Box sx={{ px:2.5, py:1.5, bgcolor:section.color }}>
                  <Typography sx={{ fontWeight:800, color:'#fff', fontSize:13, letterSpacing:.5 }}>{section.title.toUpperCase()}</Typography>
                </Box>
                <Box sx={{ p:2 }}>
                  {section.items.map((item,i) => (
                    <Box key={i} sx={{ display:'flex', justifyContent:'space-between', py:0.75, borderBottom: i<section.items.length-1?'1px solid #F1F3F4':undefined }}>
                      <Typography variant="body2" sx={{ color:'#5F6368' }}>{item.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight:600 }}>{item.value}</Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            ))}

            {formData.dynamicForms.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography sx={{ fontWeight: 800, color: '#5F6368', mb: 2, fontSize: 13, letterSpacing: 1 }}>DETAILED FORM PREVIEW</Typography>
                {formData.dynamicForms.map((form, fi) => (
                  <Paper key={fi} sx={{ p: 2, mb: 2, borderRadius: 0, border: '1px solid #E0E0E0' }}>
                    <Typography sx={{ fontWeight: 700, mb: 1 }}>{form.name || 'Unnamed Form'}</Typography>
                    <Box sx={{ pl: 2, borderLeft: '2px solid #E0E0E0' }}>
                      {form.fields.map((field, fli) => (
                        <Box key={fli} sx={{ mb: 1.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#1A73E8' }}>{field.type.toUpperCase()}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{field.label}</Typography>
                          {field.type === 'table' && (
                            <Box sx={{ mt: 1, border: '1px solid #F1F3F4' }}>
                              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                                <thead style={{ bgcolor: '#F8F9FA' }}>
                                  <tr>
                                    {field.columns?.map((c, ci) => <th key={ci} style={{ textAlign: 'left', padding: 4, borderBottom: '1px solid #F1F3F4' }}>{c.label}</th>)}
                                  </tr>
                                </thead>
                                <tbody>
                                  {(field.prefill_rows || []).map((row, ri) => (
                                    <tr key={ri}>
                                      {field.columns?.map((c, ci) => <td key={ci} style={{ padding: 4, borderBottom: '1px solid #F1F3F4' }}>{row[c.key || c.label?.toLowerCase().replace(/\\s+/g,'_')] || '—'}</td>)}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}'''

# Since Case 4 has a complex rendering loop, I'll replace the whole loop.
import re
pattern = r'\{\[\s*?\{ title:\'Product Identity\'.*?\}\s*?\]\.map\(section \=\> \(.*?\)\)\}'
content = re.sub(pattern, new_review_ui, content, flags=re.DOTALL)

with open(path, 'w') as f:
    f.write(content)

print("Review step enhanced with Form Preview")
