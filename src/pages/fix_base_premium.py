import os
import re

path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path, 'r') as f:
    content = f.read()

# Fix the first label that became " (UGX)"
content = content.replace(
    '<TextField label=" (UGX)" type="number" fullWidth value={formData.basePremium}',
    '<TextField label="Base Premium (UGX)" type="number" fullWidth value={formData.basePremium}'
)

# Fix the missing section in Review step
replacement = '''              ]},
              { title:'Pricing Model', color:'#0F9D58', items: formData.pricingModel==='classes'
                ? formData.pricingTiers.map(t=>({label:t.name, value:`UGX ${t.premium?.toLocaleString()} / Coverage: ${t.coverage_amount?.toLocaleString()}`}))
                : [{label:'Formula', value:formData.formula},{label:'Base Premium', value:`UGX ${formData.basePremium?.toLocaleString()}`}]
              },
              { title:'Commissions', color:'#F4B400', items: formData.commissions.length ? formData.commissions.map(c=>({label:SYSTEM_ROLES.find(r=>r.value===c.role_code)?.label||c.role_code, value:`${c.commission_value}${c.commission_type==='percentage'?'%':' UGX (flat)'}`})) : [{label:'', value:'No commissions configured'}]},'''

content = content.replace(
    '''              ]},\n\n              { title:'Commissions', color:'#F4B400', items: formData.commissions.length ? formData.commissions.map(c=>({label:SYSTEM_ROLES.find(r=>r.value===c.role_code)?.label||c.role_code, value:`${c.commission_value}${c.commission_type==='percentage'?'%':' UGX (flat)'}`})) : [{label:'', value:'No commissions configured'}]},''',
    replacement
)

with open(path, 'w') as f:
    f.write(content)

print("Base Premium fixed")
