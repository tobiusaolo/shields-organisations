path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Policies.jsx'
with open(path) as f:
    src = f.read()

# Find and replace the Policy Details & Q&A Drawer block
old_drawer_start = "      {/* Policy Details & Q&A Drawer */}"
old_drawer_end = "    </Box>\n  )\n}"

# Find positions
start_idx = src.index(old_drawer_start)
end_idx = src.rindex(old_drawer_end)

new_drawer = r"""      {/* Policy Details Drawer - Tabbed */}
      <Drawer
        anchor="right"
        open={detailsOpen}
        onClose={() => { setDetailsOpen(false); setDetailsTab(0); }}
        PaperProps={{ sx: { width: { xs: '100%', sm: 680 }, border: 'none', boxShadow: '-12px 0 40px rgba(0,0,0,0.12)' } }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#F8F9FE' }}>

          {/* Header */}
          <Box sx={{ background: 'linear-gradient(135deg, #1A237E 0%, #283593 100%)', p: 3, color: '#fff' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', p: 1.5, borderRadius: 2, display: 'flex' }}>
                  <PolicyIcon sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: 0.5 }}>
                    {selectedPolicy?.policy_number}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Typography sx={{ fontSize: '0.78rem', opacity: 0.7 }}>
                      {selectedPolicy?.product_info?.name || 'Insurance Policy'}
                    </Typography>
                    <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.5)' }} />
                    <Typography sx={{ fontSize: '0.78rem', opacity: 0.7 }}>
                      {selectedPolicy?.sales_channel?.replace(/_/g, ' ')}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <IconButton onClick={() => { setDetailsOpen(false); setDetailsTab(0); }} sx={{ color: 'rgba(255,255,255,0.7)', mt: -0.5 }}>
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Quick stats row */}
            <Box sx={{ display: 'flex', gap: 3, mt: 3 }}>
              {[
                { label: 'Premium', value: formatCurrency(selectedPolicy?.premium, selectedPolicy?.currency) },
                { label: 'Start', value: selectedPolicy?.start_date || 'N/A' },
                { label: 'End', value: selectedPolicy?.end_date || 'N/A' },
              ].map((s, i) => (
                <Box key={i}>
                  <Typography sx={{ fontSize: '0.68rem', opacity: 0.6, fontWeight: 700, textTransform: 'uppercase', mb: 0.3 }}>{s.label}</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.88rem' }}>{s.value}</Typography>
                </Box>
              ))}
              <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                <StatusBadge status={selectedPolicy?.status ? selectedPolicy.status.charAt(0).toUpperCase() + selectedPolicy.status.slice(1) : 'Unknown'} />
              </Box>
            </Box>
          </Box>

          {/* Tabs */}
          <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #E8EAED' }}>
            <Tabs value={detailsTab} onChange={(_, v) => setDetailsTab(v)} sx={{ '& .MuiTab-root': { fontWeight: 700, fontSize: '0.82rem', minHeight: 48, textTransform: 'none' } }}>
              <Tab icon={<PersonIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Overview" />
              <Tab icon={<FormIcon2 sx={{ fontSize: 16 }} />} iconPosition="start" label={`Forms (${templateForms.length})`} />
              <Tab icon={<QAIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Q&A" />
            </Tabs>
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, overflowY: 'auto' }}>

            {/* TAB 0: OVERVIEW */}
            {detailsTab === 0 && (
              <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>

                {/* Policyholder */}
                {selectedPolicy?.holder_info && (
                  <Box sx={{ bgcolor: '#fff', borderRadius: 3, border: '1px solid #E8EAED', overflow: 'hidden' }}>
                    <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#F8F9FE', borderBottom: '1px solid #E8EAED' }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.78rem', color: '#1A237E', textTransform: 'uppercase', letterSpacing: 0.8 }}>Policyholder</Typography>
                    </Box>
                    <Box sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ width: 52, height: 52, bgcolor: '#E8F0FE', color: '#1A73E8', fontWeight: 800, fontSize: '1.2rem' }}>
                          {selectedPolicy.holder_info.first_name?.[0]?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 800, fontSize: '1rem' }}>
                            {selectedPolicy.holder_info.first_name} {selectedPolicy.holder_info.last_name}
                          </Typography>
                          <Typography sx={{ fontSize: '0.8rem', color: '#5F6368' }}>{selectedPolicy.holder_info.email}</Typography>
                        </Box>
                        <Chip label={selectedPolicy.holder_info.kyc_status?.toUpperCase() || 'N/A'}
                          size="small" color={selectedPolicy.holder_info.kyc_status === 'approved' ? 'success' : 'warning'}
                          sx={{ ml: 'auto', fontWeight: 800, borderRadius: 1.5, height: 22, fontSize: '0.68rem' }} />
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography sx={{ fontSize: '0.68rem', color: '#9AA0A6', fontWeight: 700, textTransform: 'uppercase', mb: 0.3 }}>NIN</Typography>
                          <Typography sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.88rem' }}>
                            {selectedPolicy.holder_info.kyc_details?.nin || 'Not Provided'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography sx={{ fontSize: '0.68rem', color: '#9AA0A6', fontWeight: 700, textTransform: 'uppercase', mb: 0.3 }}>Phone</Typography>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.88rem' }}>
                            {selectedPolicy.holder_info.phone || 'N/A'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                )}

                {/* Policy Details */}
                <Box sx={{ bgcolor: '#fff', borderRadius: 3, border: '1px solid #E8EAED', overflow: 'hidden' }}>
                  <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#F8F9FE', borderBottom: '1px solid #E8EAED' }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.78rem', color: '#1A237E', textTransform: 'uppercase', letterSpacing: 0.8 }}>Policy Details</Typography>
                  </Box>
                  <Box sx={{ p: 2.5 }}>
                    <Grid container spacing={2}>
                      {[
                        { label: 'Policy Number', value: selectedPolicy?.policy_number, mono: true },
                        { label: 'Sales Channel', value: selectedPolicy?.sales_channel?.replace(/_/g, ' ') },
                        { label: 'Product', value: selectedPolicy?.product_info?.name || 'N/A' },
                        { label: 'Template', value: selectedPolicy?.template_info?.name || 'Standard' },
                        { label: 'Effective From', value: selectedPolicy?.start_date || 'N/A' },
                        { label: 'Termination', value: selectedPolicy?.end_date || 'N/A' },
                      ].map((item, i) => (
                        <Grid item xs={6} key={i}>
                          <Typography sx={{ fontSize: '0.68rem', color: '#9AA0A6', fontWeight: 700, textTransform: 'uppercase', mb: 0.3 }}>{item.label}</Typography>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', fontFamily: item.mono ? 'monospace' : 'inherit' }}>{item.value}</Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Box>

                {/* Payment Progress */}
                <Box sx={{ bgcolor: '#fff', borderRadius: 3, border: '1px solid #E8EAED', overflow: 'hidden' }}>
                  <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#F8F9FE', borderBottom: '1px solid #E8EAED' }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.78rem', color: '#1A237E', textTransform: 'uppercase', letterSpacing: 0.8 }}>Payment Progress</Typography>
                  </Box>
                  <Box sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        {selectedPolicy?.installments_paid || 0} of {selectedPolicy?.total_installments || 1} installments paid
                      </Typography>
                      <Typography sx={{ fontWeight: 800, color: '#1A73E8', fontSize: '0.85rem' }}>
                        {Math.round(((selectedPolicy?.installments_paid || 0) / (selectedPolicy?.total_installments || 1)) * 100)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={((selectedPolicy?.installments_paid || 0) / (selectedPolicy?.total_installments || 1)) * 100}
                      sx={{ height: 8, borderRadius: 4, bgcolor: '#E8EAED', '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: '#1A73E8' } }}
                    />
                    {selectedPolicy?.next_payment_date && (
                      <Typography sx={{ fontSize: '0.75rem', color: '#5F6368', mt: 1 }}>
                        Next payment: <b>{new Date(selectedPolicy.next_payment_date).toLocaleDateString('en-GB', { dateStyle: 'long' })}</b>
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            )}

            {/* TAB 1: COMPLIANCE FORMS */}
            {detailsTab === 1 && (
              <Box sx={{ p: 3 }}>
                {templateForms.length === 0 ? (
                  <Alert severity="info" sx={{ borderRadius: 2.5 }}>No compliance forms are linked to this policy's product template.</Alert>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {templateForms.map((form, fi) => (
                      <Accordion key={form.id || fi} defaultExpanded={fi === 0} sx={{ borderRadius: '12px !important', border: '1px solid #E8EAED', boxShadow: 'none', '&:before': { display: 'none' } }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#F8F9FE', borderRadius: '12px 12px 0 0', px: 2.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                            <FormIcon2 sx={{ fontSize: 18, color: '#1A73E8' }} />
                            <Typography sx={{ fontWeight: 800, fontSize: '0.88rem' }}>{form.name}</Typography>
                            {form.is_required && <Chip label="Required" size="small" color="error" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, borderRadius: 1 }} />}
                            <Chip label={`${(form.fields || []).length} fields`} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, borderRadius: 1, ml: 'auto', bgcolor: '#E8F0FE', color: '#1A73E8' }} />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 2.5, bgcolor: '#fff' }}>
                          {form.description && (
                            <Typography sx={{ fontSize: '0.8rem', color: '#5F6368', mb: 2, pb: 2, borderBottom: '1px dashed #E8EAED' }}>{form.description}</Typography>
                          )}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {(form.fields || []).map((field, fli) => {
                              if (field.field_type === 'section') return (
                                <Typography key={fli} sx={{ fontWeight: 900, fontSize: '0.78rem', color: '#1A237E', textTransform: 'uppercase', letterSpacing: 0.8, mt: 1, pt: 1, borderTop: '1px solid #E8EAED' }}>{field.label}</Typography>
                              )
                              if (field.field_type === 'table') return (
                                <Box key={fli}>
                                  <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', mb: 1, color: '#202124' }}>{field.label}</Typography>
                                  <Box sx={{ overflow: 'auto', borderRadius: 2, border: '1px solid #E8EAED' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                                      <thead>
                                        <tr style={{ background: '#F8F9FE' }}>
                                          {(field.columns || []).map((col, ci) => (
                                            <th key={ci} style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'left', borderBottom: '1px solid #E8EAED', color: '#5F6368' }}>{col.label}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(field.prefill_rows || []).map((row, ri) => (
                                          <tr key={ri} style={{ borderBottom: '1px solid #F1F3F4' }}>
                                            {(field.columns || []).map((col, ci) => (
                                              <td key={ci} style={{ padding: '8px 12px' }}>{row[col.key] || <span style={{ color: '#BDC1C6' }}>—</span>}</td>
                                            ))}
                                          </tr>
                                        ))}
                                        {(field.prefill_rows || []).length === 0 && Array.from({ length: field.min_rows || 1 }).map((_, ri) => (
                                          <tr key={ri}>
                                            {(field.columns || []).map((col, ci) => (
                                              <td key={ci} style={{ padding: '8px 12px', color: '#BDC1C6', fontStyle: 'italic' }}>Enter {col.label}...</td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </Box>
                                </Box>
                              )
                              if (field.field_type === 'checkbox') return (
                                <Box key={fli} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #F1F3F4' }}>
                                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{field.label}</Typography>
                                  <Chip label={field.is_required ? 'Required' : 'Optional'} size="small" sx={{ height: 18, fontSize: '0.65rem' }} color={field.is_required ? 'warning' : 'default'} />
                                </Box>
                              )
                              return (
                                <Box key={fli} sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #F1F3F4' }}>
                                  <Box>
                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#202124' }}>{field.label}</Typography>
                                    {field.help_text && <Typography sx={{ fontSize: '0.72rem', color: '#9AA0A6', mt: 0.3 }}>{field.help_text}</Typography>}
                                  </Box>
                                  <Box sx={{ display: 'flex', gap: 0.8, flexShrink: 0, ml: 2 }}>
                                    <Chip label={field.field_type} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#F1F3F4', color: '#5F6368' }} />
                                    {field.is_required && <Chip label="Required" size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />}
                                  </Box>
                                </Box>
                              )
                            })}
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {/* TAB 2: Q&A */}
            {detailsTab === 2 && (
              <Box sx={{ p: 3 }}>
                <Box sx={{ mb: 3, p: 2.5, bgcolor: '#fff', borderRadius: 3, border: '1px solid #E8EAED' }}>
                  <TextField
                    fullWidth multiline rows={2}
                    placeholder="Ask clarifying questions about this policy..."
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    disabled={createQuestionMutation.isPending}
                    sx={{ bgcolor: '#F8F9FE', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
                    <Button variant="contained" onClick={() => createQuestionMutation.mutate(newQuestion)}
                      disabled={!newQuestion.trim() || createQuestionMutation.isPending}
                      startIcon={createQuestionMutation.isPending ? <Spinner size={16} color="inherit" /> : <SendIcon />}
                      sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}>
                      Post Question
                    </Button>
                  </Box>
                </Box>

                {questionsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><Spinner size={32} /></Box>
                ) : (
                  <List sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, p: 0 }}>
                    {(questions || []).length === 0 && (
                      <Alert severity="info" variant="outlined" sx={{ borderRadius: 2.5, borderStyle: 'dashed' }}>
                        No expert discussions found for this policy yet.
                      </Alert>
                    )}
                    {(questions || []).map((q) => (
                      <Box key={q.id} sx={{ bgcolor: '#fff', borderRadius: 3, border: '1px solid #E8EAED', p: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                          <Avatar sx={{ width: 30, height: 30, bgcolor: '#E8F0FE', color: '#1A73E8', fontWeight: 800, fontSize: '0.78rem' }}>
                            {q.user_name?.charAt(0) || 'U'}
                          </Avatar>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{q.user_name || 'System User'}</Typography>
                          <Typography sx={{ fontSize: '0.72rem', color: '#9AA0A6', ml: 'auto' }}>{new Date(q.created_at).toLocaleDateString()}</Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.85rem', color: '#202124', lineHeight: 1.5, mb: 1.5, pl: 5 }}>{q.question}</Typography>

                        {q.answer && (
                          <Box sx={{ ml: 5, p: 2, bgcolor: '#E6F4EA', borderRadius: 2, borderLeft: '4px solid #34A853' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
                              <Avatar sx={{ width: 22, height: 22, bgcolor: '#1A73E8', color: 'white', fontSize: '0.65rem' }}>
                                {q.answered_by_name?.charAt(0) || 'A'}
                              </Avatar>
                              <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#137333' }}>
                                {q.answered_by_name} <Typography component="span" sx={{ fontSize: '0.68rem', fontWeight: 400 }}>({q.answered_by_role})</Typography>
                              </Typography>
                            </Box>
                            <Typography sx={{ fontSize: '0.83rem', color: '#137333', lineHeight: 1.5 }}>{q.answer}</Typography>
                          </Box>
                        )}

                        {!q.answer && (user?.role === 'organization_admin' || user?.role === 'underwriter' || user?.role === 'agent') && (
                          <Box sx={{ ml: 5, mt: 1.5 }}>
                            <TextField fullWidth multiline rows={2} size="small"
                              placeholder="Type official response..."
                              value={answerInputs[q.id] || ''}
                              onChange={(e) => setAnswerInputs(prev => ({ ...prev, [q.id]: e.target.value }))}
                              disabled={answerQuestionMutation.isPending}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                              <Button size="small" variant="contained"
                                onClick={() => answerQuestionMutation.mutate({ questionId: q.id, answer: answerInputs[q.id] })}
                                disabled={!answerInputs[q.id]?.trim() || answerQuestionMutation.isPending}
                                sx={{ borderRadius: 1.5, fontWeight: 700 }}>
                                {answerQuestionMutation.isPending ? 'Saving...' : 'Submit Answer'}
                              </Button>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    ))}
                  </List>
                )}
              </Box>
            )}
          </Box>

          {/* Footer */}
          <Box sx={{ p: 2.5, borderTop: '1px solid #E8EAED', bgcolor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {(selectedPolicy?.status === 'pending' || selectedPolicy?.status === 'documentation_review') && (
              <Button variant="outlined" color="primary" startIcon={<DocsIcon />}
                onClick={() => { setDetailsOpen(false); handleOpenDocGate(selectedPolicy); }}
                sx={{ borderRadius: 2, fontWeight: 700 }}>
                Manage Documents
              </Button>
            )}
            <Box sx={{ ml: 'auto' }}>
              <Button variant="outlined" onClick={() => { setDetailsOpen(false); setDetailsTab(0); }} sx={{ borderRadius: 2, fontWeight: 700, px: 4 }}>
                Close
              </Button>
            </Box>
          </Box>
        </Box>
      </Drawer>"""

new_tail = new_drawer + "\n    </Box>\n  )\n}"

src = src[:start_idx] + new_tail

with open(path, 'w') as f:
    f.write(src)
print("Phase 2 done - drawer replaced")
