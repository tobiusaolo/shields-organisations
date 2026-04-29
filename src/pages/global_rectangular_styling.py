import os
import re

directory = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages'

for filename in os.listdir(directory):
    if not filename.endswith('.jsx'):
        continue
        
    path = os.path.join(directory, filename)
    with open(path, 'r') as f:
        content = f.read()
    
    # 1. First, replace any borderRadius: <anything> with borderRadius: 0
    # We use a non-greedy match and lookahead for a comma, newline, or brace
    content = re.sub(r'borderRadius:\s*?[\'"]?.*?[\'"]?(?=[,\s\}])', 'borderRadius: 0', content)
    
    # 2. Fix the syntax errors I made before (double values)
    content = re.sub(r'borderRadius:\s*0\s*[\'"]?.*?[\'"]?(?=[,\s\}])', 'borderRadius: 0', content)
    content = re.sub(r'borderRadius:\s*0\s+[\'"]\d+px[\'"]', 'borderRadius: 0', content)

    with open(path, 'w') as f:
        f.write(content)

print("Applied rectangular styling (borderRadius: 0) to all pages")
