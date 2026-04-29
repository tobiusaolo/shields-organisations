import sys
path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/services/api.js'
with open(path, 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'submitUserKyc: (data) => api.post' in line:
        new_lines = [
            '  approveUser: (userId) => api.post(`/tenancy/users/${userId}/approve`),\n',
            '  getGlobalUsers: () => api.get("/tenancy/users"),\n',
            '  resetUserPassword: (userId, data) => api.put("/tenancy/users/" + str(userId) + "/password/reset", data),\n',
            '\n'
        ]
        # Insert after line i
        lines[i+1:i+2] = new_lines
        break

with open(path, 'w') as f:
    f.writelines(lines)
print("Success")
