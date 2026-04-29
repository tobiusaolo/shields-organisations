import os

path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path, 'r') as f:
    content = f.read()

# Replace col.key with (col.key || col.label?.toLowerCase().replace(/\s+/g,'_'))
content = content.replace('row[col.key]', 'row[col.key || col.label?.toLowerCase().replace(/\\s+/g,\'_\')]')
content = content.replace('ri][col.key]', 'ri][col.key || col.label?.toLowerCase().replace(/\\s+/g,\'_\')]')
content = content.replace('if(c.key) newRow[c.key] = \'\';', 'const k = c.key || c.label?.toLowerCase().replace(/\\s+/g,\'_\'); if(k) newRow[k] = \'\';')

with open(path, 'w') as f:
    f.write(content)

print("Prefill Rows Keys Handled")
