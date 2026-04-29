import os

path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/services/api.js'
with open(path, 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if line.strip() == 'createQuotation: (orgId, data) => api.post(`/policies/organizations/${orgId}/quotations`, data),':
        new_lines.append(line)
        new_lines.append("  // Policy Q&A\n")
        new_lines.append("  createPolicyQuestion: (policyId, data) => api.post(`/policies/${policyId}/questions`, data),\n")
        new_lines.append("  getPolicyQuestions: (policyId) => api.get(`/policies/${policyId}/questions`),\n")
        new_lines.append("  answerPolicyQuestion: (policyId, questionId, data) => api.post(`/policies/${policyId}/questions/${questionId}/answer`, data),\n")
        new_lines.append("  getOrganizationCustomerAccounts: (orgId) => api.get(`/policies/organizations/${orgId}/customer-accounts`),\n")
        new_lines.append("}\n")
        skip = True
        continue
    
    if skip:
        if line.strip() == 'export const claimAPI = {':
            skip = False
            new_lines.append("\n" + line)
        continue
    
    new_lines.append(line)

with open(path, 'w') as f:
    f.writelines(new_lines)

print("api.js fixed")
