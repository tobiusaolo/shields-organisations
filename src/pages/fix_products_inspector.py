path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path) as f:
    src = f.read()

old_inspector_start = "      {/* Inspector Drawer */}\n      <Drawer anchor=\"right\" open={inspectorOpen}"
old_inspector_end = "      {/* Wizard Dialog */}"

ii = src.index(old_inspector_start)
ie = src.index(old_inspector_end)

new_inspector = """      {/* Inspector Drawer */}
      <Drawer anchor="right" open={inspectorOpen} onClose={() => setInspectorOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 640 }, bgcolor: '#F8F9FE', boxShadow: '-12px 0 40px rgba(0,0,0,0.12)' } }}>
        {isInspectorLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (() => {
          const prod = products.find(p => p.id === selectedProductId)
          if (!prod) return null
          const cat = CATEGORY_CONFIG.find(c => c.value === prod.category)
          const mainTemplate = hierarchy?.[0]?.template
          return (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Hero Header */}
              <Box sx={{ background: `linear-gradient(135deg, ${cat?.color || '#1A237E'} 0%, ${cat?.color || '#283593'}CC 100%)`, p: 3, color: '#fff', position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.07)' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Box sx={{ width: 64, height: 64, bgcolor: '#fff', borderRadius: 2.5, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', flexShrink: 0 }}>
                      {prod.image_base64
                        ? <img src={prod.image_base64} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        : <Typography sx={{ fontSize: '1.8rem' }}>{cat?.emoji}</Typography>}
                    </Box>
                    <Box>
                      <Chip label={cat?.label || prod.category} size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 800, height: 20, fontSize: '0.68rem', mb: 0.8 }} />
                      <Typography sx={{ fontWeight: 900, fontSize: '1.15rem', lineHeight: 1.2 }}>{prod.name}</Typography>
                      <Typography sx={{ fontSize: '0.78rem', opacity: 0.75, mt: 0.3 }}>
                        {prod.is_active ? '● Active' : '○ Inactive'} · ID: {prod.id?.substring(0, 8)}...
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton onClick={() => setInspectorOpen(false)} sx={{ color: 'rgba(255,255,255,0.8)', p: 0.5 }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
                {/* Quick Stat Row */}
                <Box sx={{ display: 'flex', gap: 3, mt: 2.5, pt: 2, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                  {[
                    { label: 'Base Premium', value: formatCurrency(prod.base_premium) },
                    { label: 'Max Coverage', value: formatCurrency(prod.max_coverage) },
                    { label: 'Policy Period', value: `${prod.duration_years || 1}yr` },
                    { label: 'Billing', value: (mainTemplate?.pricing_frequency || 'Annual').toUpperCase() },
                  ].map((s, i) => (
                    <Box key={i}>
                      <Typography sx={{ fontSize: '0.63rem', opacity: 0.6, fontWeight: 700, textTransform: 'uppercase', mb: 0.2 }}>{s.label}</Typography>
                      <Typography sx={{ fontWeight: 900, fontSize: '0.85rem' }}>{s.value}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Tabs */}
              <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #E8EAED' }}>
                <Tabs value={inspectorTab} onChange={(_, v) => setInspectorTab(v)}
                  sx={{ '& .MuiTab-root': { fontWeight: 700, fontSize: '0.8rem', minHeight: 46, textTransform: 'none' } }}>
                  <Tab icon={<InfoIcon sx={{ fontSize: 15 }} />} iconPosition="start" label="Overview" />
                  <Tab icon={<PremiumIcon sx={{ fontSize: 15 }} />} iconPosition="start" label="Pricing" />
                  <Tab icon={<CommissionIcon sx={{ fontSize: 15 }} />} iconPosition="start" label="Commissions" />
                  <Tab icon={<FormIcon sx={{ fontSize: 15 }} />} iconPosition="start" label="Forms" />
                </Tabs>
              </Box>

              {/* Tab Content */}
              <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>

                {/* OVERVIEW TAB */}
                {inspectorTab === 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Description */}
                    <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E8EAED', bgcolor: '#fff' }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.72rem', color: '#5F6368', textTransform: 'uppercase', letterSpacing: 0.8, mb: 1 }}>Description</Typography>
                      <Typography sx={{ fontSize: '0.875rem', color: '#202124', lineHeight: 1.65 }}>
                        {prod.description || 'No description provided for this product.'}
                      </Typography>
                    </Paper>

                    {/* Architecture */}
                    <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E8EAED', bgcolor: '#fff' }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.72rem', color: '#1A237E', textTransform: 'uppercase', letterSpacing: 0.8, mb: 2 }}>Product Architecture</Typography>
                      {(hierarchy || []).map((item, tIdx) => (
                        <Box key={tIdx} sx={{ mb: 2 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#5F6368', mb: 1.5 }}>
                            {item.template.name}
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                            {item.tiers?.map((tier, ti) => {
                              const tierColors = { Bronze: '#CD7F32', Silver: '#9E9E9E', Gold: '#F9AB00', Platinum: '#607D8B', Diamond: '#1A73E8' }
                              const tc = tierColors[tier.name] || '#1A237E'
                              return (
                                <Box key={ti} sx={{ p: 2, bgcolor: '#F8F9FE', borderRadius: 2.5, borderLeft: `4px solid ${tc}` }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: tc }} />
                                      <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#202124' }}>{tier.name}</Typography>
                                    </Box>
                                    <Typography sx={{ fontWeight: 900, fontSize: '0.88rem', color: tc }}>{formatCurrency(tier.premium)}</Typography>
                                  </Box>
                                  {tier.description && <Typography sx={{ fontSize: '0.75rem', color: '#5F6368', mb: 1 }}>{tier.description}</Typography>}
                                  {tier.benefits?.filter(Boolean).length > 0 && (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
                                      {tier.benefits.filter(Boolean).map((b, bi) => (
                                        <Chip key={bi} label={b} size="small" variant="outlined"
                                          sx={{ fontSize: '0.68rem', height: 20, borderRadius: 1.5, borderColor: `${tc}40`, color: tc }} />
                                      ))}
                                    </Box>
                                  )}
                                </Box>
                              )
                            })}
                            {(!item.tiers || item.tiers.length === 0) && (
                              <Typography sx={{ fontSize: '0.8rem', color: '#9AA0A6', fontStyle: 'italic' }}>Dynamic formula pricing</Typography>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Paper>

                    {/* Terms */}
                    {mainTemplate?.terms_and_conditions && (
                      <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E8EAED', bgcolor: '#fff' }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.72rem', color: '#5F6368', textTransform: 'uppercase', letterSpacing: 0.8, mb: 1.5 }}>Terms & Conditions</Typography>
                        <Typography sx={{ fontSize: '0.78rem', color: '#5F6368', whiteSpace: 'pre-wrap', lineHeight: 1.7, bgcolor: '#F8F9FA', p: 2, borderRadius: 2, fontFamily: 'monospace', border: '1px solid #E8EAED', maxHeight: 180, overflow: 'auto' }}>
                          {mainTemplate.terms_and_conditions}
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                )}

                {/* PRICING TAB */}
                {inspectorTab === 1 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {(hierarchy || []).map((item, idx) => (
                      <Box key={idx}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#5F6368', mb: 1.5 }}>{item.template.name}</Typography>
                        {(item.tiers || []).length > 0 ? item.tiers.map(tier => (
                          <Paper key={tier.id} sx={{ p: 2.5, mb: 1.5, borderRadius: 3, border: '1px solid #E8EAED', bgcolor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem' }}>{tier.name}</Typography>
                              <Typography sx={{ fontSize: '0.78rem', color: '#5F6368', mt: 0.3 }}>{tier.description || 'Standard tier'}</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography sx={{ fontWeight: 900, fontSize: '1rem', color: '#1E8E3E' }}>{formatCurrency(tier.premium)}</Typography>
                              <Typography sx={{ fontSize: '0.7rem', color: '#9AA0A6' }}>Coverage: {formatCurrency(tier.coverage_amount)}</Typography>
                            </Box>
                          </Paper>
                        )) : (
                          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E8EAED', bgcolor: '#fff' }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#5F6368' }}>Dynamic formula pricing model</Typography>
                            <Typography sx={{ fontSize: '0.78rem', color: '#9AA0A6', mt: 0.5 }}>Premiums calculated at quote time</Typography>
                          </Paper>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}

                {/* COMMISSIONS TAB */}
                {inspectorTab === 2 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {(hierarchy || []).map((item, idx) => (
                      <Box key={idx}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#5F6368', mb: 1.5 }}>{item.template.name}</Typography>
                        {(item.commissions || []).length === 0
                          ? <Alert severity="info" sx={{ borderRadius: 2.5 }}>No commission rules configured.</Alert>
                          : item.commissions.map(c => (
                          <Paper key={c.id} sx={{ p: 2.5, mb: 1.5, borderRadius: 3, border: '1px solid #E8EAED', bgcolor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box sx={{ p: 1, bgcolor: '#E8F0FE', borderRadius: 2, color: '#1A73E8' }}><CommissionIcon sx={{ fontSize: 18 }} /></Box>
                              <Box>
                                <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', textTransform: 'capitalize' }}>
                                  {c.role_code?.replace(/_/g, ' ')}
                                </Typography>
                                <Typography sx={{ fontSize: '0.75rem', color: '#5F6368' }}>{c.commission_type} commission</Typography>
                              </Box>
                            </Box>
                            <Chip label={c.commission_type === 'percentage' ? `${c.commission_value}%` : formatCurrency(c.commission_value)}
                              sx={{ fontWeight: 900, bgcolor: '#E6F4EA', color: '#1E8E3E', fontSize: '0.85rem' }} />
                          </Paper>
                        ))}
                      </Box>
                    ))}
                  </Box>
                )}

                {/* FORMS TAB */}
                {inspectorTab === 3 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {(hierarchy || []).map((item, idx) => (
                      (item.forms || []).length === 0 ? (
                        <Alert key={idx} severity="info" sx={{ borderRadius: 2.5 }}>No compliance forms added to this product.</Alert>
                      ) : item.forms.map(form => (
                        <Paper key={form.id} sx={{ borderRadius: 3, border: '1px solid #E8EAED', overflow: 'hidden', bgcolor: '#fff' }}>
                          <Box sx={{ px: 2.5, py: 1.8, bgcolor: '#F8F9FE', borderBottom: '1px solid #E8EAED', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem' }}>{form.name}</Typography>
                              {form.description && <Typography sx={{ fontSize: '0.72rem', color: '#5F6368', mt: 0.2 }}>{form.description}</Typography>}
                            </Box>
                            {form.is_required && <Chip label="REQUIRED" size="small" color="error" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }} />}
                          </Box>
                          <Box sx={{ p: 2.5 }}>
                            {(form.fields || []).map((field) => {
                              if (field.field_type === 'section') return (
                                <Typography key={field.id} sx={{ fontWeight: 900, fontSize: '0.72rem', color: '#1A237E', textTransform: 'uppercase', letterSpacing: 0.8, mt: 1.5, mb: 1, pt: 1.5, borderTop: '1px solid #E8EAED' }}>{field.label}</Typography>
                              )
                              if (field.field_type === 'table') return (
                                <Box key={field.id} sx={{ mb: 2 }}>
                                  <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', mb: 1 }}>{field.label}</Typography>
                                  <Box sx={{ overflow: 'auto', borderRadius: 2, border: '1px solid #E8EAED' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                                      <thead><tr style={{ background: '#F8F9FE' }}>
                                        {(field.columns || []).map(col => <th key={col.key} style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'left', borderBottom: '1px solid #E8EAED' }}>{col.label}</th>)}
                                      </tr></thead>
                                      <tbody>
                                        {(field.prefill_rows || []).map((row, ri) => (
                                          <tr key={ri}>{(field.columns || []).map(col => <td key={col.key} style={{ padding: '8px 12px' }}>{row[col.key] || '—'}</td>)}</tr>
                                        ))}
                                        {(field.prefill_rows || []).length === 0 && Array.from({ length: field.min_rows || 1 }).map((_, ri) => (
                                          <tr key={ri}>{(field.columns || []).map(col => <td key={col.key} style={{ padding: '8px 12px', color: '#BDC1C6', fontStyle: 'italic' }}>Enter {col.label}...</td>)}</tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </Box>
                                </Box>
                              )
                              return (
                                <Box key={field.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', py: 1, borderBottom: '1px solid #F1F3F4' }}>
                                  <Box>
                                    <Typography sx={{ fontSize: '0.83rem', fontWeight: 600 }}>{field.label}</Typography>
                                    {field.help_text && <Typography sx={{ fontSize: '0.72rem', color: '#9AA0A6' }}>{field.help_text}</Typography>}
                                  </Box>
                                  <Box sx={{ display: 'flex', gap: 0.8, ml: 2, flexShrink: 0 }}>
                                    <Chip label={field.field_type} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
                                    {field.is_required && <Chip label="req" size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem' }} />}
                                  </Box>
                                </Box>
                              )
                            })}
                          </Box>
                        </Paper>
                      ))
                    ))}
                  </Box>
                )}
              </Box>

              {/* Footer */}
              <Box sx={{ p: 2.5, borderTop: '1px solid #E8EAED', bgcolor: '#fff', display: 'flex', gap: 1.5 }}>
                <Button variant="outlined" startIcon={<EditIcon />} onClick={() => { setInspectorOpen(false); handleEditProduct(prod) }}
                  sx={{ flex: 1, borderRadius: 2.5, fontWeight: 700 }}>
                  Edit Product
                </Button>
                <Button variant="outlined" startIcon={<DuplicateIcon />} onClick={() => { setInspectorOpen(false); handleDuplicateProduct(prod) }}
                  sx={{ borderRadius: 2.5, fontWeight: 700 }}>
                  Clone
                </Button>
              </Box>
            </Box>
          )
        })()}
      </Drawer>

      """

src = src[:ii] + new_inspector + src[ie:]

with open(path, 'w') as f:
    f.write(src)
print("Inspector redesign done")
