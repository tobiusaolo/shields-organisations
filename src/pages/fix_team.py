import sys
path = '/Users/user/Documents/PHOSAI_GALLEY/Insurance/frontend/src/pages/Team.jsx'
with open(path, 'r') as f:
    lines = f.readlines()

# 1. Fix Icons (Restore lost ones and add ResetIcon)
# We need to find where the icons block is.
# Since replace_file_content keeps deleting lines, I'll search for the imports.
start_icons = -1
for i, line in enumerate(lines):
    if 'Edit as EditIcon,' in line:
        start_icons = i
        break

if start_icons != -1:
    icon_lines = [
        '  Visibility as ViewIcon,\n',
        '  Close as CloseIcon,\n',
        '  CalendarMonth as CalendarIcon,\n',
        '  Badge as BadgeIcon,\n',
        '  LockReset as ResetIcon\n',
        '} from \"@mui/icons-material\"\n'
    ]
    # Check if the block is empty or messed up
    # We'll just replace from start_icons+1 to the next import
    end_icons = -1
    for j in range(start_icons+1, start_icons+10):
        if '} from' in lines[j]:
            end_icons = j
            break
    if end_icons != -1:
        lines[start_icons+1:end_icons+1] = icon_lines
    else:
        # If the closing tag was deleted
        lines[start_icons+1:start_icons+5] = icon_lines

# 2. Add State
for i, line in enumerate(lines):
    if 'const [viewDrawerOpen' in line:
        lines.insert(i+1, '  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false)\n')
        lines.insert(i+2, '  const [newPassword, setNewPassword] = useState(\"ChangeMe123!\")\n')
        break

# 3. Add Mutation
for i, line in enumerate(lines):
    if 'const deleteMemberMutation = useMutation({' in line:
        end_mut = -1
        for j in range(i, i+30):
            if '  })' in lines[j]:
                end_mut = j
                break
        if end_mut != -1:
            mut_code = [
                '\n',
                '  const resetPasswordMutation = useMutation({\n',
                '    mutationFn: async ({ userId, password }) => {\n',
                '      await tenancyAPI.resetUserPassword(userId, { password })\n',
                '    },\n',
                '    onSuccess: () => {\n',
                '      alert(\"Password reset successfully.\")\n',
                '      setResetPasswordDialogOpen(false)\n',
                '      handleMenuClose()\n',
                '    },\n',
                '    onError: (err) => {\n',
                '      alert(err.response?.data?.detail || \"Failed to reset password.\")\n',
                '    }\n',
                '  })\n'
            ]
            lines[end_mut+1:end_mut+1] = mut_code
        break

# 4. Add Menu Item
for i, line in enumerate(lines):
    if 'Update Role' in line:
        menu_item_idx = -1
        for j in range(i, i-10, -1):
            if '<MuiMenuItem onClick={() => setUpdateRoleDialogOpen(true)}' in lines[j]:
                menu_item_idx = j
                break
        if menu_item_idx != -1:
            lines.insert(menu_item_idx, '        <MuiMenuItem onClick={() => setResetPasswordDialogOpen(true)} sx={{ py: 1, fontSize: \"0.85rem\" }}>\n')
            lines.insert(menu_item_idx+1, '          <ResetIcon sx={{ mr: 1.5, fontSize: 18, color: \"#5F6368\" }} />\n')
            lines.insert(menu_item_idx+2, '          Reset Password\n')
            lines.insert(menu_item_idx+3, '        </MuiMenuItem>\n')
        break

# 5. Add Dialog
for i, line in enumerate(lines):
    if '{/* Delete Confirmation */}' in line:
        dialog_code = [
            '      {/* Reset Password Dialog */}\n',
            '      <Dialog open={resetPasswordDialogOpen} onClose={() => { setResetPasswordDialogOpen(false); setSelectedMember(null); }} maxWidth=\"xs\" fullWidth>\n',
            '        <DialogTitle sx={{ fontWeight: 800 }}>Reset Password</DialogTitle>\n',
            '        <DialogContent>\n',
            '          <Typography sx={{ mb: 2, fontSize: \"0.85rem\", color: \"#5F6368\" }}>\n',
            '            Set a new temporary password for <b>{selectedMember?.user_first_name} {selectedMember?.user_last_name}</b>.\n',
            '          </Typography>\n',
            '          <TextField\n',
            '            fullWidth\n',
            '            label=\"New Password\"\n',
            '            size=\"small\"\n',
            '            value={newPassword}\n',
            '            onChange={(e) => setNewPassword(e.target.value)}\n',
            '          />\n',
            '        </DialogContent>\n',
            '        <DialogActions sx={{ px: 3, pb: 3 }}>\n',
            '          <Button onClick={() => setResetPasswordDialogOpen(false)}>Cancel</Button>\n',
            '          <Button \n',
            '            variant=\"contained\" \n',
            '            onClick={() => resetPasswordMutation.mutate({ userId: selectedMember.user_id, password: newPassword })}\n',
            '            disabled={resetPasswordMutation.isLoading}\n',
            '          >\n',
            '            {resetPasswordMutation.isLoading ? \"Resetting...\" : \"Reset Password\"}\n',
            '          </Button>\n',
            '        </DialogActions>\n',
            '      </Dialog>\n',
            '\n'
        ]
        lines[i:i] = dialog_code
        break

with open(path, 'w') as f:
    f.writelines(lines)
print("Success")
