import React, { useState } from 'react'
import {
  Box, Typography, Button, IconButton, TextField, MenuItem,
  Paper, Chip, Divider, Tooltip, Badge,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowUpward as UpIcon,
  ArrowDownward as DownIcon,
  DynamicForm as FormIcon,
  TableChart as TableIcon,
  ViewHeadline as SectionIcon,
  TextFields as TextIcon,
  Numbers as NumberIcon,
  CalendarMonth as DateIcon,
  List as SelectIcon,
  ToggleOn as ToggleIcon,
  Notes as TextAreaIcon,
  AddBox as AddRowIcon,
  PlaylistAdd as AddFormIcon,
} from '@mui/icons-material'

const FIELD_TYPES = [
  { value: 'text',     label: 'Short Text',           icon: <TextIcon fontSize="small"/> },
  { value: 'textarea', label: 'Long Text',             icon: <TextAreaIcon fontSize="small"/> },
  { value: 'number',   label: 'Number / Currency',     icon: <NumberIcon fontSize="small"/> },
  { value: 'date',     label: 'Date Picker',           icon: <DateIcon fontSize="small"/> },
  { value: 'select',   label: 'Dropdown',              icon: <SelectIcon fontSize="small"/> },
  { value: 'checkbox', label: 'Yes / No',              icon: <ToggleIcon fontSize="small"/> },
  { value: 'section',  label: '── Section Header ──',  icon: <SectionIcon fontSize="small"/> },
  { value: 'table',    label: 'Data Table',            icon: <TableIcon fontSize="small"/> },
]

const COL_TYPES = ['text','number','date']

const fieldTypeColor = {
  text:'#000000', textarea:'#202124', number:'#1A237E', date:'#0D47A1',
  select:'#1565C0', checkbox:'#1976D2', section:'#424242', table:'#000000',
}

const emptyField = () => ({
  label:'', type:'text', required:true, help_text:'',
  columns:[], min_rows:2, max_rows:10, prefill_rows:[],
  options:[],
})

const emptyForm = () => ({
  name:'', description:'', is_required:true, fields:[],
})

export default function FormBuilder({ dynamicForms, onChange }) {
  const [activeIdx, setActiveIdx] = useState(0)

  // ── helpers ──────────────────────────────────────────────────
  const setForms = (next) => onChange(next)

  const upForm  = (fi, key, val) => {
    const f = [...dynamicForms]; f[fi] = { ...f[fi], [key]: val }; setForms(f)
  }
  const upField = (fi, fli, key, val) => {
    const f = [...dynamicForms]
    f[fi].fields[fli] = { ...f[fi].fields[fli], [key]: val }
    setForms(f)
  }
  const upCol   = (fi, fli, ci, key, val) => {
    const f = [...dynamicForms]
    f[fi].fields[fli].columns[ci] = { ...f[fi].fields[fli].columns[ci], [key]: val }
    setForms(f)
  }
  const upPrefillCell = (fi, fli, ri, colKey, val) => {
    const f = [...dynamicForms]
    const rows = [...(f[fi].fields[fli].prefill_rows || [])]
    rows[ri] = { ...rows[ri], [colKey]: val }
    f[fi].fields[fli].prefill_rows = rows
    setForms(f)
  }

  const addForm = () => {
    const f = [...dynamicForms, emptyForm()]
    setForms(f)
    setActiveIdx(f.length - 1)
  }
  const removeForm = (fi) => {
    const f = dynamicForms.filter((_, i) => i !== fi)
    setForms(f)
    setActiveIdx(Math.max(0, fi - 1))
  }
  const addField = (fi) => {
    const f = [...dynamicForms]
    f[fi].fields.push(emptyField())
    setForms(f)
  }
  const removeField = (fi, fli) => {
    const f = [...dynamicForms]
    f[fi].fields = f[fi].fields.filter((_, i) => i !== fli)
    setForms(f)
  }
  const moveField = (fi, fli, dir) => {
    const f = [...dynamicForms]
    const fields = [...f[fi].fields]
    const target = fli + dir
    if (target < 0 || target >= fields.length) return
    ;[fields[fli], fields[target]] = [fields[target], fields[fli]]
    f[fi].fields = fields
    setForms(f)
  }
  const addColumn = (fi, fli) => {
    const f = [...dynamicForms]
    const col = { label: `Column ${f[fi].fields[fli].columns.length + 1}`, type: 'text', key: `col_${Date.now()}` }
    f[fi].fields[fli].columns.push(col)
    setForms(f)
  }
  const removeColumn = (fi, fli, ci) => {
    const f = [...dynamicForms]
    const colKey = f[fi].fields[fli].columns[ci]?.key
    f[fi].fields[fli].columns = f[fi].fields[fli].columns.filter((_, i) => i !== ci)
    // remove that key from prefill rows
    f[fi].fields[fli].prefill_rows = (f[fi].fields[fli].prefill_rows || []).map(row => {
      const r = { ...row }; delete r[colKey]; return r
    })
    setForms(f)
  }
  const addPrefillRow = (fi, fli) => {
    const f = [...dynamicForms]
    const cols = f[fi].fields[fli].columns || []
    const row = {}; cols.forEach(c => { row[c.key] = '' })
    f[fi].fields[fli].prefill_rows = [...(f[fi].fields[fli].prefill_rows || []), row]
    setForms(f)
  }
  const removePrefillRow = (fi, fli, ri) => {
    const f = [...dynamicForms]
    f[fi].fields[fli].prefill_rows = f[fi].fields[fli].prefill_rows.filter((_, i) => i !== ri)
    setForms(f)
  }

  const form = dynamicForms[activeIdx]

  // ── Table field editor ────────────────────────────────────────
  const renderTableEditor = (fi, fli, field) => {
    const cols = field.columns || []
    const prefillRows = field.prefill_rows || []
    return (
      <Box sx={{ mt:2, border:'1.5px solid #000', borderRadius: 0, overflow:'hidden' }}>
        {/* Header bar */}
        <Box sx={{ bgcolor:'#000000', px:2, py:1, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <Typography sx={{ color:'#fff', fontWeight:700, fontSize:13 }}>Table Designer</Typography>
          <Box sx={{ display:'flex', gap:1 }}>
            <Chip label={`${cols.length} cols`} size="small" sx={{ borderRadius: 0, bgcolor:'rgba(255,255,255,.2)', color:'#fff', fontSize:11 }}/>
            <Chip label={`${prefillRows.length} prefill rows`} size="small" sx={{ borderRadius: 0, bgcolor:'rgba(255,255,255,.2)', color:'#fff', fontSize:11 }}/>
          </Box>
        </Box>

        <Box sx={{ p:2, bgcolor:'#FFF3E0' }}>
          {/* Row controls */}
          <Box sx={{ display:'flex', gap:2, mb:2 }}>
            <TextField label="Min Rows" size="small" type="number" sx={{ width:110 }}
              value={field.min_rows}
              onChange={e => upField(fi, fli, 'min_rows', parseInt(e.target.value)||1)}/>
            <TextField label="Max Rows" size="small" type="number" sx={{ width:110 }}
              value={field.max_rows}
              onChange={e => upField(fi, fli, 'max_rows', parseInt(e.target.value)||10)}/>
            <Box sx={{ flex:1 }}/>
            <Button size="small" variant="outlined" startIcon={<AddIcon/>} onClick={() => addColumn(fi, fli)}
              sx={{ borderRadius: 0, borderColor:'#000', color:'#000', '&:hover':{borderColor:'#1A237E', bgcolor:'#f5f5f5'} }}>
              Add Column
            </Button>
          </Box>

          {cols.length === 0 ? (
            <Box sx={{ textAlign:'center', py:3, color:'#BDBDBD' }}>
              <TableIcon sx={{ fontSize:36, opacity:.4 }}/>
              <Typography variant="caption" display="block">No columns yet — click "Add Column"</Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    {cols.map((col, ci) => (
                      <th key={ci} style={{ padding:'4px 6px', background:'#FF5722', borderRight:'1px solid rgba(255,255,255,.3)' }}>
                        <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                          <TextField
                            variant="standard"
                            value={col.label}
                            placeholder={`Col ${ci+1}`}
                            onChange={e => {
                              const newKey = e.target.value.toLowerCase().replace(/\s+/g,'_') || col.key
                              const oldKey = col.key
                              // rename in prefill rows too
                              const f2 = [...dynamicForms]
                              f2[fi].fields[fli].prefill_rows = (f2[fi].fields[fli].prefill_rows||[]).map(row => {
                                const r2 = { ...row }
                                r2[newKey] = r2[oldKey] ?? ''
                                delete r2[oldKey]
                                return r2
                              })
                              f2[fi].fields[fli].columns[ci] = { ...col, label: e.target.value, key: newKey }
                              setForms(f2)
                            }}
                            InputProps={{ disableUnderline:true, sx:{ color:'#fff', fontWeight:700, fontSize:12, width:90 }}}
                          />
                          <TextField
                            select size="small" variant="standard"
                            value={col.type}
                            onChange={e => upCol(fi, fli, ci, 'type', e.target.value)}
                            InputProps={{ disableUnderline:true, sx:{ color:'rgba(255,255,255,.8)', fontSize:11 }}}
                            sx={{ width:68 }}>
                            {COL_TYPES.map(t => <MenuItem key={t} value={t} sx={{ fontSize:12 }}>{t}</MenuItem>)}
                          </TextField>
                          <IconButton size="small" onClick={() => removeColumn(fi, fli, ci)} sx={{ color:'rgba(255,255,255,.7)', p:0.3 }}>
                            <DeleteIcon sx={{ fontSize:14 }}/>
                          </IconButton>
                        </Box>
                      </th>
                    ))}
                    <th style={{ width:32, background:'#FF5722' }}/>
                  </tr>
                </thead>
                <tbody>
                  {prefillRows.map((row, ri) => (
                    <tr key={ri} style={{ background: ri%2===0 ? '#fff':'#FFF8F5' }}>
                      {cols.map((col, ci) => (
                        <td key={ci} style={{ borderRight:'1px solid #FFE0B2', padding:'2px 4px' }}>
                          <TextField
                            variant="standard" fullWidth size="small"
                            value={row[col.key] ?? ''}
                            placeholder={`${col.label}…`}
                            onChange={e => upPrefillCell(fi, fli, ri, col.key, e.target.value)}
                            InputProps={{ disableUnderline:true, sx:{ fontSize:12, px:0.5 }}}
                          />
                        </td>
                      ))}
                      <td style={{ width:32, textAlign:'center' }}>
                        <IconButton size="small" color="error" onClick={() => removePrefillRow(fi, fli, ri)} sx={{ p:0.3 }}>
                          <DeleteIcon sx={{ fontSize:14 }}/>
                        </IconButton>
                      </td>
                    </tr>
                  ))}
                  {prefillRows.length === 0 && (
                    <tr>
                      <td colSpan={cols.length+1} style={{ padding:'8px', textAlign:'center', color:'#BDBDBD', fontSize:12 }}>
                        No prefill rows — add one below to pre-populate the table
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Box>
          )}

          <Button size="small" startIcon={<AddRowIcon/>} onClick={() => addPrefillRow(fi, fli)}
            disabled={cols.length === 0}
            sx={{ mt:1.5, color:'#FF5722', '&:hover':{bgcolor:'#FBE9E7'} }}>
            Add Prefill Row
          </Button>
        </Box>
      </Box>
    )
  }

  // ── Single field card ─────────────────────────────────────────
  const renderFieldCard = (fi, fli, field, totalFields) => {
    const isSection = field.type === 'section'
    const isTable   = field.type === 'table'
    const color = fieldTypeColor[field.type] || '#607D8B'

    return (
      <Paper key={fli} variant="outlined"
        sx={{ mb:1.5, borderRadius: 0, overflow:'hidden',
          borderColor: isSection ? '#000' : '#E0E0E0',
          borderLeftColor: color, borderLeftWidth:6,
        }}>
        <Box sx={{ px:2, py:1.5, bgcolor: isSection ? '#ECEFF1' : '#FAFAFA',
          display:'flex', alignItems:'flex-start', gap:1.5, flexWrap:'wrap' }}>
          {/* Field label */}
          <TextField
            label={isSection ? 'Section Title' : 'Field Label'} size="small"
            sx={{ flex:2, minWidth:160 }}
            value={field.label}
            onChange={e => {
              upField(fi, fli, 'label', e.target.value)
              upField(fi, fli, 'name', e.target.value.toLowerCase().replace(/\s+/g,'_'))
            }}
          />
          {/* Field type */}
          <TextField select label="Type" size="small" sx={{ width:180 }}
            value={field.type}
            onChange={e => {
              upField(fi, fli, 'type', e.target.value)
              if (e.target.value === 'table' && !field.columns?.length)
                upField(fi, fli, 'columns', [])
            }}>
            {FIELD_TYPES.map(t => (
              <MenuItem key={t.value} value={t.value}>
                <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                  <Box sx={{ color: fieldTypeColor[t.value] }}>{t.icon}</Box>
                  {t.label}
                </Box>
              </MenuItem>
            ))}
          </TextField>
          {/* Required */}
          {!isSection && (
            <TextField select label="Required?" size="small" sx={{ width:110 }}
              value={field.required}
              onChange={e => upField(fi, fli, 'required', e.target.value === 'true')}>
              <MenuItem value="true">Required</MenuItem>
              <MenuItem value="false">Optional</MenuItem>
            </TextField>
          )}
          {/* Help text */}
          {!isSection && !isTable && (
            <TextField label="Hint text" size="small" sx={{ flex:2, minWidth:140 }}
              value={field.help_text}
              onChange={e => upField(fi, fli, 'help_text', e.target.value)}/>
          )}
          {/* Controls */}
          <Box sx={{ display:'flex', gap:0.5, ml:'auto', mt:0.5 }}>
            <Tooltip title="Move up"><span>
              <IconButton size="small" disabled={fli===0} onClick={() => moveField(fi, fli, -1)}>
                <UpIcon fontSize="small"/>
              </IconButton>
            </span></Tooltip>
            <Tooltip title="Move down"><span>
              <IconButton size="small" disabled={fli===totalFields-1} onClick={() => moveField(fi, fli, 1)}>
                <DownIcon fontSize="small"/>
              </IconButton>
            </span></Tooltip>
            <Tooltip title="Remove field">
              <IconButton size="small" color="error" onClick={() => removeField(fi, fli)}>
                <DeleteIcon fontSize="small"/>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Select options */}
        {field.type === 'select' && (
          <Box sx={{ px:2, pb:1.5 }}>
            <Typography variant="caption" sx={{ fontWeight:700, color:'#5F6368', letterSpacing:.5 }}>
              DROPDOWN OPTIONS
            </Typography>
            {(field.options || []).map((opt, oi) => (
              <Box key={oi} sx={{ display:'flex', gap:1, mt:0.75 }}>
                <TextField size="small" fullWidth value={opt}
                  placeholder={`Option ${oi+1}`}
                  onChange={e => {
                    const opts = [...(field.options||[])]
                    opts[oi] = e.target.value
                    upField(fi, fli, 'options', opts)
                  }}/>
                <IconButton size="small" color="error"
                  onClick={() => upField(fi, fli, 'options', (field.options||[]).filter((_,i)=>i!==oi))}>
                  <DeleteIcon fontSize="small"/>
                </IconButton>
              </Box>
            ))}
            <Button size="small" onClick={() => upField(fi, fli, 'options', [...(field.options||[]),''])}
              sx={{ mt:0.5, color:'#1A73E8' }}>+ Add Option</Button>
          </Box>
        )}

        {/* Table editor */}
        {isTable && (
          <Box sx={{ px:2, pb:2 }}>
            {renderTableEditor(fi, fli, field)}
          </Box>
        )}
      </Paper>
    )
  }

  // ── Main render ───────────────────────────────────────────────
  return (
    <Box sx={{ display:'flex', height:'100%', gap:0 }}>
      {/* Left rail — form list */}
      <Box sx={{ width:220, flexShrink:0, borderRight:'1.5px solid #E8EAED',
        display:'flex', flexDirection:'column', bgcolor:'#F8F9FA' }}>
        <Box sx={{ px:2, py:1.5, borderBottom:'1px solid #E8EAED',
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <Typography sx={{ fontWeight:800, fontSize:12, color:'#5F6368', letterSpacing:.8 }}>FORMS</Typography>
          <Tooltip title="New Form">
            <IconButton size="small" onClick={addForm} sx={{ bgcolor:'#1A237E', color:'#fff', '&:hover':{bgcolor:'#283593'}, width:26, height:26 }}>
              <AddIcon sx={{ fontSize:16 }}/>
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ flex:1, overflowY:'auto', py:1 }}>
          {dynamicForms.length === 0 ? (
            <Box sx={{ p:2, textAlign:'center' }}>
              <FormIcon sx={{ color:'#BDBDBD', fontSize:32, mb:1 }}/>
              <Typography variant="caption" sx={{ color:'#9E9E9E', display:'block' }}>
                No forms yet
              </Typography>
              <Button size="small" onClick={addForm} sx={{ mt:1, fontSize:11 }}>
                + Add First Form
              </Button>
            </Box>
          ) : dynamicForms.map((f, fi) => (
            <Box key={fi}
              onClick={() => setActiveIdx(fi)}
              sx={{
                px:2, py:1.5, cursor:'pointer', mx:1, mb:0.5, borderRadius: 0,
                bgcolor: activeIdx===fi ? '#F0F4FF' : 'transparent',
                borderLeft: activeIdx===fi ? '4px solid #1A237E' : '4px solid transparent',
                '&:hover':{ bgcolor: activeIdx===fi ? '#F0F4FF' : '#F1F3F4' },
                transition:'all .15s',
                display:'flex', justifyContent:'space-between', alignItems:'center',
              }}>
              <Box sx={{ overflow:'hidden' }}>
                <Typography sx={{ fontWeight: activeIdx===fi ? 700 : 500, fontSize:13,
                  color: activeIdx===fi ? '#1A237E' : '#424242',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:140 }}>
                  {f.name || `Form ${fi+1}`}
                </Typography>
                <Typography variant="caption" sx={{ color:'#9E9E9E' }}>
                  {f.fields.length} field{f.fields.length!==1?'s':''}
                  {f.is_required ? ' · Required' : ''}
                </Typography>
              </Box>
              <IconButton size="small" color="error"
                onClick={e => { e.stopPropagation(); removeForm(fi) }}
                sx={{ p:0.3, opacity:.5, '&:hover':{ opacity:1 } }}>
                <DeleteIcon sx={{ fontSize:15 }}/>
              </IconButton>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Right canvas */}
      <Box sx={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {!form ? (
          <Box sx={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#BDBDBD', gap:2 }}>
            <AddFormIcon sx={{ fontSize:64, opacity:.3 }}/>
            <Typography sx={{ color:'#9E9E9E' }}>Select a form from the left or add a new one</Typography>
            <Button variant="outlined" onClick={addForm} startIcon={<AddIcon/>}>New Form</Button>
          </Box>
        ) : (
          <>
            {/* Form metadata */}
            <Box sx={{ px:3, py:2, bgcolor:'#fff', borderBottom:'1px solid #E8EAED' }}>
              <Box sx={{ display:'flex', gap:2, alignItems:'flex-start', flexWrap:'wrap' }}>
                <TextField label="Form Name" size="small" sx={{ flex:2, minWidth:200 }}
                  value={form.name}
                  placeholder="e.g. Medical History, Personal Details"
                  onChange={e => upForm(activeIdx, 'name', e.target.value)}/>
                <TextField label="Instructions / Description" size="small" sx={{ flex:3, minWidth:200 }}
                  value={form.description}
                  onChange={e => upForm(activeIdx, 'description', e.target.value)}/>
                <TextField select label="Required?" size="small" sx={{ width:130 }}
                  value={form.is_required}
                  onChange={e => upForm(activeIdx, 'is_required', e.target.value === 'true')}>
                  <MenuItem value="true">Required</MenuItem>
                  <MenuItem value="false">Optional</MenuItem>
                </TextField>
              </Box>
            </Box>

            {/* Fields canvas */}
            <Box sx={{ flex:1, overflowY:'auto', p:2.5, bgcolor:'#F8F9FA' }}>
              {form.fields.length === 0 ? (
                <Box sx={{ textAlign:'center', py:6, color:'#BDBDBD' }}>
                  <Typography sx={{ mb:1 }}>This form has no fields yet</Typography>
                  <Button variant="contained" startIcon={<AddIcon/>}
                    onClick={() => addField(activeIdx)}
                    sx={{ bgcolor:'#3F51B5' }}>
                    Add First Field
                  </Button>
                </Box>
              ) : (
                form.fields.map((field, fli) =>
                  renderFieldCard(activeIdx, fli, field, form.fields.length)
                )
              )}
            </Box>

            {/* Canvas footer */}
            <Box sx={{ px:3, py:1.5, borderTop:'1px solid #E8EAED', bgcolor:'#fff',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <Typography variant="caption" sx={{ color:'#9E9E9E' }}>
                {form.fields.length} field{form.fields.length!==1?'s':''} in this form
              </Typography>
              <Button variant="contained" size="small" startIcon={<AddIcon/>}
                onClick={() => addField(activeIdx)}
                sx={{ bgcolor:'#3F51B5', '&:hover':{ bgcolor:'#283593' } }}>
                Add Field
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Box>
  )
}
