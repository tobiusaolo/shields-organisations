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
    
    # Fix the mess created by the previous regex
    # It replaced "borderRadius: 2" with "borderRadius: 0" but might have left bits behind if it was "borderRadius: 2,"
    
    # Let's find any borderRadius: 0 followed by strings or numbers before a comma or brace
    content = re.sub(r'borderRadius:\s*0\s*[\'"]?.*?[\'"]?(?=[,\s\}])', 'borderRadius: 0', content)
    
    # Also clean up any double definitions like "borderRadius: 0 '28px'"
    content = re.sub(r'borderRadius:\s*0\s+[\'"]\d+px[\'"]', 'borderRadius: 0', content)

    with open(path, 'w') as f:
        f.write(content)

print("Fixed syntax errors in borderRadius definitions")
