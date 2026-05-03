import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Box, Typography, Grid, CircularProgress } from '@mui/material';
import { formatCurrency } from '../utils/formatters';
import { publicAPI } from '../services/api';

const PolicyCertificateGenerator = forwardRef(({ policy, user }, ref) => {
  const certificateRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [certificateData, setCertificateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggerGeneration, setTriggerGeneration] = useState(false);

  // Fetch comprehensive certificate data from new endpoint
  useEffect(() => {
    if (policy?.id) {
      setLoading(true);
      publicAPI.getPolicyCertificateData(policy.id)
        .then(res => {
          setCertificateData(res.data);
        })
        .catch(err => {
          console.error("[Certificate] Failed to fetch certificate data:", err);
          setCertificateData({
            policy: policy,
            organization: {
              name: user?.organization_name || "Insurance Provider",
              address: user?.organization_address || "",
              phone: user?.organization_contact_phone || "",
              email: user?.email || "",
              logo: user?.logo || null
            },
            holder: policy?.holder_info || {},
            product: policy?.product_info || {},
            template: policy?.template_info || {},
            forms: [],
            pricing_tier: {}
          });
        })
        .finally(() => setLoading(false));
    }
  }, [policy?.id]);

  // Effect to handle generation once loading is done
  useEffect(() => {
    if (triggerGeneration && !loading) {
      performGeneration();
    }
  }, [triggerGeneration, loading]);

  const performGeneration = async () => {
    setIsGenerating(true);
    setTriggerGeneration(false);
    
    try {
      // Small delay to ensure DOM is fully updated with new data
      await new Promise(r => setTimeout(r, 500));
      
      const element = certificateRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      const canvasHeightInMm = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = canvasHeightInMm;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, canvasHeightInMm);
      heightLeft -= pdfPageHeight;

      while (heightLeft > 0) {
        position = heightLeft - canvasHeightInMm;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, canvasHeightInMm);
        heightLeft -= pdfPageHeight;
      }

      pdf.save(`${policy.policy_number || 'certificate'}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate certificate.");
    } finally {
      setIsGenerating(false);
    }
  };

  useImperativeHandle(ref, () => ({
    generate: () => {
      if (!policy || !user) return;
      setTriggerGeneration(true);
      setIsGenerating(true);
    }
  }));

  if (!policy || !user) return null;

  const certPolicy = certificateData?.policy || policy || {};
  const certOrg = certificateData?.organization || {};
  const certHolder = certificateData?.holder || {};
  const certProduct = certificateData?.product || {};
  const certTemplate = certificateData?.template || {};
  const certPricingTier = certificateData?.pricing_tier || {};
  const certForms = certificateData?.forms || [];

  const terms = certTemplate?.terms_and_conditions || "Standard terms and conditions apply as per the policy agreement.";
  const orgName = certOrg?.name || "Insurance Provider";
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
  
  const getHolderName = () => {
    if (certHolder?.first_name) return `${certHolder.first_name} ${certHolder.last_name || ''}`;
    if (policy?.holder_info?.first_name) return `${policy.holder_info.first_name} ${policy.holder_info.last_name || ''}`;
    return user?.first_name ? `${user.first_name} ${user.last_name || ''}` : "Valued Client";
  };

  const getHolderEmail = () => certHolder?.email || policy?.holder_info?.email || user?.email || "N/A";
  const contextData = certPolicy?.context || policy?.context || {};
  const sumInsured = certPolicy?.coverage_amount || contextData?.sum_insured || 0;
  const currency = certPolicy?.currency || policy?.currency || "UGX";

  return (
    <>
      {isGenerating && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(255,255,255,0.8)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={60} sx={{ color: '#1A237E', mb: 2 }} />
          <Typography sx={{ fontWeight: 800, color: '#1A237E' }}>
            {loading ? "Preparing Certificate Data..." : "Generating Certificate PDF..."}
          </Typography>
        </Box>
      )}

      <Box sx={{ 
        position: 'absolute', 
        top: '-9999px', 
        left: '-9999px', 
        width: '800px', 
        bgcolor: '#ffffff', 
        p: 0, 
        boxSizing: 'border-box', 
        color: '#1A1A1A', 
        fontFamily: '"Inter", "Roboto", "Helvetica", Arial, sans-serif' 
      }}>
        <div ref={certificateRef} style={{ width: '100%', position: 'relative', display: 'flex', flexDirection: 'column', backgroundColor: '#fff', border: '20px solid #f8f9fa' }}>
          
          {/* Decorative Border Layer */}
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '2px solid #D4AF37', m: '5px', zIndex: 2, pointerEvents: 'none' }} />

          {/* Watermark Logo */}
          {certOrg?.logo && (
            <Box sx={{ position: 'absolute', top: '55%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.03, width: '450px', height: '450px', backgroundImage: `url(${certOrg.logo})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', zIndex: 0 }} />
          )}

          <Box sx={{ position: 'relative', zIndex: 1, p: '40px 60px' }}>
            {/* Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, borderBottom: '2px solid #1A237E', pb: 3 }}>
              <Box sx={{ flex: 1 }}>
                {certOrg?.logo ? (
                  <img src={certOrg.logo} alt="Logo" style={{ maxHeight: '85px', maxWidth: '180px', objectFit: 'contain', marginBottom: '15px' }} crossOrigin="anonymous" />
                ) : (
                  <Box sx={{ width: 60, height: 60, bgcolor: '#1A237E', borderRadius: '4px', mb: 2 }} />
                )}
                <Typography sx={{ fontWeight: 900, fontSize: '24px', color: '#1A237E', letterSpacing: '-0.5px', textTransform: 'uppercase' }}>{orgName}</Typography>
              </Box>
              
              <Box sx={{ textAlign: 'right', pt: 1 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '12px', color: '#D4AF37', textTransform: 'uppercase', mb: 1, letterSpacing: '1px' }}>Corporate Headquarters</Typography>
                <Box sx={{ fontSize: '10pt', lineHeight: 1.6, color: '#444' }}>
                  <Typography sx={{ fontSize: '10pt' }}><strong>Address:</strong> {certOrg?.address || '......................................................'}</Typography>
                  <Typography sx={{ fontSize: '10pt' }}><strong>Phone:</strong> {certOrg?.phone || '................................'}</Typography>
                  <Typography sx={{ fontSize: '10pt' }}><strong>Email:</strong> {certOrg?.email || '................................'}</Typography>
                  <Typography sx={{ fontSize: '10pt' }}><strong>Website:</strong> {certOrg?.website || '................................'}</Typography>
                </Box>
              </Box>
            </Box>

            {/* Document Title & Policy Number Banner */}
            <Box sx={{ textAlign: 'center', mb: 6, position: 'relative' }}>
              <Typography sx={{ fontWeight: 900, fontSize: '32px', color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '4px', mb: 1 }}>Certificate of Insurance</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 2 }}>
                <Box sx={{ height: '1px', flex: 1, bgcolor: '#D4AF37' }} />
                <Box sx={{ bgcolor: '#1A237E', color: '#fff', px: 3, py: 0.8, borderRadius: '2px' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '11pt', letterSpacing: '1px' }}>POLICY NO: {certPolicy?.policy_number || policy?.policy_number}</Typography>
                </Box>
                <Box sx={{ height: '1px', flex: 1, bgcolor: '#D4AF37' }} />
              </Box>
            </Box>

            {/* Verification Statement */}
            <Box sx={{ mb: 6, textAlign: 'center', maxWidth: '600px', mx: 'auto' }}>
              <Typography sx={{ fontSize: '10pt', color: '#555', lineHeight: 1.7, fontStyle: 'italic' }}>
                "This document serves as an official confirmation of insurance coverage. We hereby certify that the individual named below is duly insured under the terms and conditions of the policy issued by <strong>{orgName}</strong>, as detailed in the sections below."
              </Typography>
            </Box>

            {/* Section 1: Insured Details */}
            <Box sx={{ mb: 5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography sx={{ fontWeight: 900, fontSize: '12pt', color: '#1A237E', textTransform: 'uppercase', mr: 2 }}>01. The Insured Party</Typography>
                <Box sx={{ height: '2px', flex: 1, bgcolor: '#f0f0f0' }} />
              </Box>
              
              <Grid container spacing={4}>
                <Grid item xs={7}>
                  <Box sx={{ p: 3, bgcolor: '#fcfcfc', border: '1px solid #eee', borderLeft: '5px solid #1A237E', borderRadius: '4px' }}>
                    <Typography sx={{ fontWeight: 900, fontSize: '14pt', color: '#1A237E', mb: 0.5 }}>{getHolderName()}</Typography>
                    <Typography sx={{ fontSize: '10pt', color: '#666', mb: 1 }}>{getHolderEmail()}</Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      <Box>
                        <Typography sx={{ fontSize: '8pt', color: '#999', textTransform: 'uppercase', fontWeight: 800 }}>Account Status</Typography>
                        <Typography sx={{ fontSize: '10pt', fontWeight: 800, color: '#1E8E3E' }}>{(certPolicy?.status || policy?.status || 'Active').toUpperCase()}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '8pt', color: '#999', textTransform: 'uppercase', fontWeight: 800 }}>Member Since</Typography>
                        <Typography sx={{ fontSize: '10pt', fontWeight: 800 }}>{formatDate(certPolicy?.created_at)}</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={5}>
                  <Box sx={{ p: 3, bgcolor: '#1A237E', color: '#fff', borderRadius: '4px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                    <Typography sx={{ fontSize: '9pt', fontWeight: 700, textTransform: 'uppercase', opacity: 0.8, mb: 1.5 }}>Coverage Period</Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography sx={{ fontSize: '8pt', opacity: 0.7 }}>EFFECTIVE FROM</Typography>
                      <Typography sx={{ fontSize: '11pt', fontWeight: 900 }}>{formatDate(certPolicy?.start_date)}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '8pt', opacity: 0.7 }}>EXPIRING ON</Typography>
                      <Typography sx={{ fontSize: '11pt', fontWeight: 900, color: '#D4AF37' }}>{formatDate(certPolicy?.end_date)}</Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Section 2: Assessment Details */}
            <Box sx={{ mb: 5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography sx={{ fontWeight: 900, fontSize: '12pt', color: '#1A237E', textTransform: 'uppercase', mr: 2 }}>02. Assessment & Declarations</Typography>
                <Box sx={{ height: '2px', flex: 1, bgcolor: '#f0f0f0' }} />
              </Box>
              
              <Box sx={{ border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }}>
                {certForms.length > 0 ? certForms.map((form, fi) => (
                  <Box key={fi} sx={{ mb: 0, borderBottom: fi < certForms.length - 1 ? '1px solid #eee' : 'none' }}>
                    <Box sx={{ bgcolor: '#f8f9fa', px: 3, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '10pt', color: '#1A237E' }}>{form.name}</Typography>
                      <Typography sx={{ fontSize: '8pt', color: '#999', fontWeight: 700 }}>VERIFIED DECLARATION</Typography>
                    </Box>
                    
                    <Box sx={{ p: 3 }}>
                      {(form.fields || []).map((field, fli) => {
                        if (field.field_type === 'section') return (
                          <Typography key={fli} sx={{ fontWeight: 900, fontSize: '9pt', color: '#D4AF37', textTransform: 'uppercase', mt: 3, mb: 1, borderBottom: '1px solid #eee', pb: 0.5 }}>{field.label}</Typography>
                        );
                        
                        if (field.field_type === 'table') {
                          const tableData = field.filled_value || field.prefill_rows || [];
                          return (
                            <Box key={fli} sx={{ mb: 3, mt: 2 }}>
                              <Typography sx={{ fontWeight: 800, fontSize: '10pt', mb: 1.5, color: '#444' }}>{field.label}</Typography>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
                                <thead>
                                  <tr style={{ background: '#1A237E', color: '#fff' }}>
                                    {(field.columns || []).map((col, ci) => (
                                      <th key={ci} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>{col.label}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {tableData.length > 0 ? tableData.map((row, ri) => (
                                    <tr key={ri} style={{ borderBottom: '1px solid #eee', backgroundColor: ri % 2 === 0 ? '#fff' : '#fafafa' }}>
                                      {(field.columns || []).map((col, ci) => {
                                        const val = row[col.key] || row[col.key?.toLowerCase()] || row[col.label] || '—';
                                        return <td key={ci} style={{ padding: '10px 12px', color: '#333' }}>{val}</td>;
                                      })}
                                    </tr>
                                  )) : (
                                    <tr><td colSpan={field.columns?.length} style={{ padding: '20px', textAlign: 'center', fontStyle: 'italic', color: '#999' }}>No data records available for this section</td></tr>
                                  )}
                                </tbody>
                              </table>
                            </Box>
                          );
                        }

                        const val = (field.filled_value !== undefined && field.filled_value !== null) ? field.filled_value : '................................................................';
                        return (
                          <Box key={fli} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #f5f5f5' }}>
                            <Typography sx={{ fontSize: '10pt', fontWeight: 600, color: '#555' }}>{field.label}</Typography>
                            <Typography sx={{ fontSize: '10pt', fontWeight: 700, color: '#1A1A1A' }}>{String(val)}</Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )) : (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '10pt', color: '#999', fontStyle: 'italic' }}>Standard policy assessment applied. No additional forms attached.</Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Section 3: Benefits & Terms */}
            <Grid container spacing={4} sx={{ mb: 6 }}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography sx={{ fontWeight: 900, fontSize: '12pt', color: '#1A237E', textTransform: 'uppercase', mr: 2 }}>03. Plan Benefits</Typography>
                  <Box sx={{ height: '2px', flex: 1, bgcolor: '#f0f0f0' }} />
                </Box>
                <Box sx={{ p: 3, bgcolor: '#f8f9fa', borderRadius: '4px', border: '1px solid #eee' }}>
                  <Typography sx={{ fontWeight: 900, fontSize: '11pt', mb: 1 }}>{certProduct?.name || 'Standard Plan'}</Typography>
                  <Typography sx={{ fontSize: '10pt', color: '#1E8E3E', fontWeight: 800, mb: 2 }}>SUM INSURED: {formatCurrency(sumInsured, currency)}</Typography>
                  <Box>
                    {(certPricingTier.benefits || []).slice(0, 8).map((b, i) => (
                      <Typography key={i} sx={{ fontSize: '9pt', display: 'flex', alignItems: 'center', mb: 0.8, color: '#444' }}>
                        <Box sx={{ width: 6, height: 6, bgcolor: '#D4AF37', borderRadius: '50%', mr: 1.5 }} /> {b}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography sx={{ fontWeight: 900, fontSize: '12pt', color: '#1A237E', textTransform: 'uppercase', mr: 2 }}>04. Legal Terms</Typography>
                  <Box sx={{ height: '2px', flex: 1, bgcolor: '#f0f0f0' }} />
                </Box>
                <Box sx={{ p: 3, bgcolor: '#fff', border: '1px solid #eee', borderRadius: '4px', minHeight: '180px' }}>
                  <Typography sx={{ fontSize: '9pt', color: '#555', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {terms.length > 500 ? terms.substring(0, 500) + '...' : terms}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Signatures & Stamps */}
            <Box sx={{ mt: 'auto', pt: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ width: 100, height: 100, border: '3px double #D4AF37', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', m: '0 auto', opacity: 0.6 }}>
                  <Typography sx={{ fontSize: '8pt', fontWeight: 900, color: '#D4AF37' }}>OFFICIAL</Typography>
                  <Typography sx={{ fontSize: '10pt', fontWeight: 900, color: '#1A237E' }}>SEAL</Typography>
                </Box>
                <Typography sx={{ fontSize: '9pt', fontWeight: 800, color: '#1A237E', mt: 1, textTransform: 'uppercase' }}>Uganda Insurers<br/>Association</Typography>
              </Box>

              <Box sx={{ textAlign: 'center', px: 2 }}>
                <Typography sx={{ fontSize: '9pt', color: '#999', mb: 0.5 }}>DATE OF ISSUANCE</Typography>
                <Typography sx={{ fontWeight: 900, fontSize: '12pt', color: '#1A237E' }}>{formatDate(certPolicy?.created_at)}</Typography>
              </Box>

              <Box sx={{ textAlign: 'center', minWidth: '220px' }}>
                <Typography sx={{ fontFamily: '"Brush Script MT", cursive', fontSize: '36px', color: '#1A237E', mb: -1.5, opacity: 0.9 }}>
                  {orgName.split(' ')[0]} Auth
                </Typography>
                <Box sx={{ borderTop: '2px solid #1A1A1A', pt: 1.5, mt: 2 }}>
                  <Typography sx={{ fontWeight: 900, fontSize: '10pt', textTransform: 'uppercase', letterSpacing: '1px' }}>Authorized Signatory</Typography>
                  <Typography sx={{ fontSize: '9pt', color: '#666' }}>{orgName} Underwriting</Typography>
                </Box>
              </Box>
            </Box>

            <Typography sx={{ textAlign: 'center', fontSize: '8pt', color: '#999', mt: 8, letterSpacing: '0.5px' }}>
              This certificate is a legal summary of coverage. For full policy wording, exclusions, and detailed benefits, please refer to the master policy document available at our head office or online portal.
            </Typography>
          </Box>
        </div>
      </Box>
    </>
  );
});

export default PolicyCertificateGenerator;
