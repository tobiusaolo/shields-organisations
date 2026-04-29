import os

path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path, 'r') as f:
    content = f.read()

case3_start = "case 3: {"
case3_end = "case 4:"

start_idx = content.find(case3_start)
end_idx = content.find(case3_end)

if start_idx != -1 and end_idx != -1:
    new_case3 = '''case 3: {
        const upForm = (fi, key, val) => { const f=[...formData.dynamicForms]; f[fi][key]=val; setFormData({...formData, dynamicForms:f}) }
        const upField = (fi, fli, key, val) => { const f=[...formData.dynamicForms]; f[fi].fields[fli][key]=val; setFormData({...formData, dynamicForms:f}) }
        const upCol = (fi, fli, ci, key, val) => { const f=[...formData.dynamicForms]; f[fi].fields[fli].columns[ci][key]=val; setFormData({...formData, dynamicForms:f}) }
        return (
          <Box sx={{ display:'flex', flexDirection:'column', gap:2, pt:1 }}>
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', p:2, bgcolor:'#F5F5F5', borderRadius:0 }}>
              <Box>
                <Typography sx={{ fontWeight:700, color:'#212121' }}>Compliance Form Builder</Typography>
                <Typography variant="caption" sx={{ color:'#757575' }}>Add unlimited forms — clients fill these during enrollment</Typography>
              </Box>
              <Button variant="contained" size="small" startIcon={<AddFormIcon/>} sx={{ bgcolor:'#424242','&:hover':{bgcolor:'#212121'} }}
                onClick={() => setFormData({...formData, dynamicForms:[...formData.dynamicForms, {name:'', description:'', is_required:true, fields:[]}]})}>
                New Form
              </Button>
            </Box>
            {formData.dynamicForms.length===0 && <Alert severity="info">No forms yet. Click "New Form" to start building your compliance questionnaire.</Alert>}
            {formData.dynamicForms.map((form, fi) => (
              <Accordion key={fi} defaultExpanded sx={{ border:'1px solid #BDBDBD', borderRadius:'0!important', '&:before':{display:'none'}, mb:1, overflow:'hidden' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon/>} sx={{ bgcolor:'#FAFAFA', borderBottom:'1px solid #E0E0E0' }}>
                  <Box sx={{ display:'flex', alignItems:'center', gap:2, flex:1 }}>
                    <FormIcon sx={{ color:'#546E7A' }}/>
                    <Typography sx={{ fontWeight:600, color:'#212121' }}>{form.name||`Form ${fi+1}`}</Typography>
                    <Chip label={`${form.fields.length} fields`} size="small" sx={{ ml:1 }}/>
                    <Chip label={form.is_required?'Required':'Optional'} size="small" color={form.is_required?'error':'default'} sx={{ ml:0.5 }}/>
                    <Box sx={{ flex:1 }}/>
                    <IconButton size="small" color="error" onClick={e=>{e.stopPropagation(); const f=formData.dynamicForms.filter((_,i)=>i!==fi); setFormData({...formData, dynamicForms:f})}}>
                      <DeleteIcon fontSize="small"/>
                    </IconButton>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p:2 }}>
                  <Box sx={{ display:'flex', flexDirection:'column', gap:2 }}>
                    <Box sx={{ display:'flex', gap:2 }}>
                      <TextField label="Form Name" size="small" fullWidth value={form.name} onChange={e=>upForm(fi,'name',e.target.value)} placeholder="e.g. Medical History, Personal Details"/>
                      <TextField label="Instructions" size="small" fullWidth value={form.description} onChange={e=>upForm(fi,'description',e.target.value)}/>
                      <TextField select label="Required?" size="small" sx={{ width:130 }} value={form.is_required} onChange={e=>upForm(fi,'is_required',e.target.value==='true')}>
                        <MenuItem value="true">Required</MenuItem>
                        <MenuItem value="false">Optional</MenuItem>
                      </TextField>
                    </Box>
                    <Divider/>
                    <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <Typography variant="caption" sx={{ fontWeight:800, color:'#5F6368', letterSpacing:1 }}>FORM FIELDS</Typography>
                      <Button size="small" startIcon={<AddIcon/>} onClick={()=>{const f=[...formData.dynamicForms]; f[fi].fields.push({label:'',type:'text',required:true,help_text:'',columns:[],min_rows:2,max_rows:10}); setFormData({...formData,dynamicForms:f})}}>Add Field</Button>
                    </Box>
                    {form.fields.map((field, fli) => (
                      <Paper key={fli} variant="outlined" sx={{ p:1.5, borderRadius:0, mb:1, bgcolor: field.type==='section'?'#F5F5F5':'#FAFAFA', borderLeft: field.type==='section'?'3px solid #546E7A':undefined }}>
                        <Box sx={{ display:'flex', gap:1.5, alignItems:'flex-start', flexWrap:'wrap' }}>
                          <TextField label={field.type==='section'?'Section Title':'Field Label'} size="small" sx={{ flex:2, minWidth:160 }} value={field.label} onChange={e=>{upField(fi,fli,'label',e.target.value); upField(fi,fli,'name',e.target.value.toLowerCase().replace(/\\s+/g,'_'))}}/>
                          <TextField select label="Type" size="small" sx={{ width:180 }} value={field.type} onChange={e=>{upField(fi,fli,'type',e.target.value); if(e.target.value==='table'&&!field.columns?.length) upField(fi,fli,'columns',[])}}>
                            {FIELD_TYPES.map(t=><MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                          </TextField>
                          {field.type!=='section' && <TextField select label="Required?" size="small" sx={{ width:110 }} value={field.required} onChange={e=>upField(fi,fli,'required',e.target.value==='true')}>
                            <MenuItem value="true">Yes</MenuItem><MenuItem value="false">No</MenuItem>
                          </TextField>}
                          <IconButton size="small" color="error" sx={{ mt:0.5 }} onClick={()=>{const f=[...formData.dynamicForms]; f[fi].fields=f[fi].fields.filter((_,i)=>i!==fli); setFormData({...formData,dynamicForms:f})}}><DeleteIcon fontSize="small"/></IconButton>
                        </Box>
                        {field.type==='table' && (
                          <Box sx={{ mt:1.5, pl:2, borderLeft:'2px solid #E0E0E0' }}>
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

                            <Box sx={{ display:'flex', gap:2, mb:2 }}>
                              <TextField label="Min Rows" size="small" type="number" sx={{ width:110 }} value={field.min_rows} onChange={e=>upField(fi,fli,'min_rows',parseInt(e.target.value)||1)}/>
                              <TextField label="Max Rows" size="small" type="number" sx={{ width:110 }} value={field.max_rows} onChange={e=>upField(fi,fli,'max_rows',parseInt(e.target.value)||10)}/>
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
                        )}
                      </Paper>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )
      }
      '''
    content = content[:start_idx] + new_case3 + content[end_idx:]

with open(path, 'w') as f:
    f.write(content)

print("Table Editor Order Fixed: Columns -> Min/Max -> Prefill")
