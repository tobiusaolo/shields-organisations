import os
import re

files = [
    '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx',
    '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/PaymentCallback.jsx'
]

for path in files:
    if not os.path.exists(path):
        continue
        
    with open(path, 'r') as f:
        content = f.read()
    
    # Replace borderRadius: <number> or borderRadius: <string> with borderRadius: 0
    # Also handle borderRadius: '...'
    
    # Regex to find borderRadius: followed by any value until a comma, space, or closing brace
    # We'll specifically target values that aren't already 0
    
    pattern = r'borderRadius:\s*?[\'"]?.*?[0-9\.]+.*?[\'"]?'
    # Actually, simpler: replace any borderRadius: <val> with borderRadius: 0
    
    # We want to keep borderRadius: 0 if it's already there
    # But replace anything like 2, 3, 2.5, '50%', etc.
    
    # Exception: if the user said "sections and cards", maybe keep the 50% for tiny status dots?
    # No, "rectangular" means 0 radius.
    
    content = re.sub(r'borderRadius:\s*?[\'"]?.*?[\'"]?(?=[,\s\}])', 'borderRadius: 0', content)
    
    # Special case for Mui's default rounding on Buttons/TextFields if applied via theme?
    # But here we are mostly using sx.
    
    with open(path, 'w') as f:
        f.write(content)

print("Standardized all components to rectangular styling (borderRadius: 0)")
