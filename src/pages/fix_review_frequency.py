import os

path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path, 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if "{label:'Category', value:CATEGORIES.find(c=>c.value===formData.category)?.label}," in line:
        new_lines.append(line)
        new_lines.append("                {label:'Duration', value:formData.duration_years ? `${formData.duration_years} year(s)` : 'Not set'},\n")
        new_lines.append("                {label:'Frequency', value:formData.pricing_frequency},\n")
        skip = True
        continue
    
    if skip:
        if "]}," in line:
            skip = False
            new_lines.append(line)
        continue
    
    new_lines.append(line)

with open(path, 'w') as f:
    f.writelines(new_lines)

print("Review step fixed with frequency")
