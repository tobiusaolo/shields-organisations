import os

path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Products.jsx'
with open(path, 'r') as f:
    content = f.read()

# Replace .isLoading with .isPending for the two mutations
# createProductMutation.isLoading -> createProductMutation.isPending
# deleteProductMutation.isLoading -> deleteProductMutation.isPending

content = content.replace('createProductMutation.isLoading', 'createProductMutation.isPending')
content = content.replace('deleteProductMutation.isLoading', 'deleteProductMutation.isPending')

with open(path, 'w') as f:
    f.write(content)

print("Mutations updated to use .isPending (React Query v5 compatibility)")
