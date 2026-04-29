import os

path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path, 'r') as f:
    content = f.read()

case4_start = "case 4:"
case4_end = "].map(section => (" # This is where the loop ends and the buttons start? 
# Wait, let's find the end of case 4.

# Case 4 ends with the default case or the end of the return
case4_end = "default:"

start_idx = content.find(case4_start)
end_idx = content.find(case4_end)

if start_idx != -1 and end_idx != -1:
    new_case4 = '''case 4:
        return (
          <Box sx={{ display:'flex', flexDirection:'column', gap:3, pt:1 }}>
            <Alert severity="success" icon={<CheckIcon/>}>Everything looks good! Review your configuration below before finalizing.</Alert>
            {[
              { title:'Product Identity', color:'#1A73E8', items:[
                {label:'Name', value:formData.name},
                {label:'Category', value:CATEGORIES.find(c=>c.value===formData.category)?.label},
                {label:'Duration', value:formData.duration_years ? `${formData.duration_years} year(s)` : 'Not set'},
                {label:'Frequency', value:formData.pricing_frequency},
              ]},

              { title:'Pricing Model', color:'#0F9D58', items: formData.pricingModel==='classes'
                ? formData.pricingTiers.map(t=>({label:t.name, value:`Premium: UGX ${t.coverage_amount?.toLocaleString()}`}))
                : [{label:'Formula', value:formData.formula},{label:'Premium', value:`UGX ${formData.limits.max?.toLocaleString()}`}]
              },
              { title:'Commissions', color:'#F4B400', items: formData.commissions.length ? formData.commissions.map(c=>({label:SYSTEM_ROLES.find(r=>r.value===c.role_code)?.label||c.role_code, value:`${c.commission_value}${c.commission_type==='percentage'?'%':' UGX (flat)'}`})) : [{label:'', value:'No commissions configured'}]},
              { title:'Compliance Forms', color:'#9C27B0', items: formData.dynamicForms.length ? formData.dynamicForms.map(f=>({label:f.name||'Unnamed Form', value:`${f.fields.length} fields · ${f.is_required?'Required':'Optional'}`})) : [{label:'', value:'No forms added'}]},
            ].map(section => (
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
                                  <tr style={{ background: '#F8F9FA' }}>
                                    {field.columns?.map((c, ci) => <th key={ci} style={{ textAlign: 'left', padding: 4, borderBottom: '1px solid #F1F3F4' }}>{c.label}</th>)}
                                  </tr>
                                </thead>
                                <tbody>
                                  {(field.prefill_rows || []).map((row, ri) => (
                                    <tr key={ri}>
                                      {field.columns?.map((c, ci) => <td key={ci} style={{ padding: 4, borderBottom: '1px solid #F1F3F4' }}>{row[c.key || (c.label ? c.label.toLowerCase().replace(/\\s+/g,'_') : '')] || '—'}</td>)}
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
            )}
          </Box>
        )
      '''
    content = content[:start_idx] + new_case4 + content[end_idx:]

with open(path, 'w') as f:
    f.write(content)

print("Review step enhanced with Form Preview (Total Block Replacement)")
