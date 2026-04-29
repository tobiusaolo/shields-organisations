import os

path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path, 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if '{ title:\'Product Identity\', color:\'#1A73E8\', items:[' in line:
        # Start of the identity block
        pass
    
    if '{ title:\'Commissions\',' in line:
        # We are at the Commissions block, let's insert the missing Pricing Model block before it
        new_lines.append("              { title:'Pricing Model', color:'#0F9D58', items: formData.pricingModel==='classes'\n")
        new_lines.append("                ? formData.pricingTiers.map(t=>({label:t.name, value:`Premium: UGX ${t.coverage_amount?.toLocaleString()}`}))\n")
        new_lines.append("                : [{label:'Formula', value:formData.formula},{label:'Premium', value:`UGX ${formData.limits.max?.toLocaleString()}`}]\n")
        new_lines.append("              },\n")
        new_lines.append(line)
        continue

    new_lines.append(line)

with open(path, 'w') as f:
    f.writelines(new_lines)

print("Review Step Fixed")
