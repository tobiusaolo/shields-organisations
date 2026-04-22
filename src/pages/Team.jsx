import React, { useState } from 'react'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Chip, Avatar, Skeleton,
  IconButton, Tooltip, Alert
} from '@mui/material'
import {
  Add as AddIcon,
  Security as SecurityIcon,
  Mail as MailIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material'
import { Menu, MenuItem as MuiMenuItem } from '@mui/material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { tenancyAPI } from '../services/api'

const ROLES = [
  { value: 'organization_admin', label: 'Organization Admin', color: '#1A73E8', bg: '#E8F0FE' },
  { value: 'underwriter', label: 'Underwriter', color: '#1E8E3E', bg: '#E6F4EA' },
  { value: 'agent', label: 'Agent', color: '#E37400', bg: '#FEF3E2' },
  { value: 'broker', label: 'Broker', color: '#7B61FF', bg: '#F0EDFF' },
  { value: 'claims_officer', label: 'Claims Officer', color: '#D93025', bg: '#FCE8E6' },
  { value: 'read_only', label: 'Read Only', color: '#5F6368', bg: '#F1F3F4' }
]

function RoleBadge({ roleCode }) {
  const cfg = ROLES.find(r => r.value === roleCode) || ROLES[5]
  return (
    <Chip
      size="small"
      label={cfg.label}
      sx={{
        height: 22, fontSize: '0.7rem', fontWeight: 600,
        bgcolor: cfg.bg, color: cfg.color
      }}
    />
  )
}

export default function Team() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', role: 'agent' })
  const [error, setError] = useState('')

  // Action Menu State
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [updateRoleDialogOpen, setUpdateRoleDialogOpen] = useState(false)
  const [newRole, setNewRole] = useState('')

  const handleMenuOpen = (event, member) => {
    setAnchorEl(event.currentTarget)
    setSelectedMember(member)
    setNewRole(member.roles?.[0] || 'agent')
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedMember(null)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['memberships', user?.organization_id],
    queryFn: async () => {
      // In a real implementation this endpoint might also join against the user records
      // to return their email and name. For this mockup we'll format the membership directly.
      const res = await tenancyAPI.getOrganizationMemberships(user?.organization_id, { limit: 100 })
      return res.data
    },
    enabled: !!user?.organization_id
  })

  const addMemberMutation = useMutation({
    mutationFn: async (newData) => {
      // 1. Create User
      const newUserData = {
        ...newData,
        password: 'ChangeMe123!', // Standard generated password for phase 1 prototype
      }
      const userRes = await tenancyAPI.createUser(newUserData)
      const createdUser = userRes.data

      // 2. Attach User to Organization via Membership
      await tenancyAPI.createMembership({
        user_id: createdUser.id,
        organization_id: user.organization_id,
        role_codes: [newData.role]
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['memberships', user?.organization_id])
      setOpen(false)
      setForm({ first_name: '', last_name: '', email: '', role: 'agent' })
      setError('')
    },
    onError: (err) => {
      setError(err.response?.data?.detail || 'Failed to add team member.')
    }
  })

  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      await tenancyAPI.updateMembership(id, user.organization_id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['memberships', user?.organization_id])
      setUpdateRoleDialogOpen(false)
      handleMenuClose()
    }
  })

  const deleteMemberMutation = useMutation({
    mutationFn: async (id) => {
      await tenancyAPI.deleteMembership(id, user.organization_id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['memberships', user?.organization_id])
      setDeleteDialogOpen(false)
      handleMenuClose()
    }
  })

  const handleAddMember = async () => {
    setError('')
    if (!form.email || !form.first_name || !form.last_name) {
      setError('Please fill out all fields.')
      return
    }
    addMemberMutation.mutate(form)
  }

  const members = data?.items || []

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#202124', mb: 0.5 }}>Team Directory</Typography>
          <Typography sx={{ color: '#5F6368', fontSize: '0.9rem' }}>Manage organizational access and roles</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
          sx={{ borderRadius: 2.5, fontWeight: 700, px: 3 }}
        >
          Invite Member
        </Button>
      </Box>

      <Paper elevation={1} sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#F8F9FE' }}>
              <TableRow>
                <TableCell sx={{ color: '#5F6368', fontWeight: 600 }}>Member</TableCell>
                <TableCell sx={{ color: '#5F6368', fontWeight: 600 }}>Role Context</TableCell>
                <TableCell sx={{ color: '#5F6368', fontWeight: 600 }}>Joined</TableCell>
                <TableCell align="right" sx={{ color: '#5F6368', fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <TableRow key={i}>
                    <TableCell><Skeleton width="180px" /></TableCell>
                    <TableCell><Skeleton width="100px" /></TableCell>
                    <TableCell><Skeleton width="120px" /></TableCell>
                    <TableCell align="right"><Skeleton width="30px" sx={{ ml: 'auto' }} /></TableCell>
                  </TableRow>
                ))
              ) : members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <Typography sx={{ color: '#9AA0A6' }}>No external members configured yet.</Typography>
                  </TableCell>
                </TableRow>
              ) : members.map((m) => {
                const primaryRole = m.roles?.[0] || 'read_only'
                return (
                  <TableRow key={m.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ 
                          width: 38, height: 38, 
                          bgcolor: '#E8F0FE', color: '#1A73E8', 
                          fontSize: '0.85rem', fontWeight: 700 
                        }}>
                          {m.user_first_name ? `${m.user_first_name[0]}${m.user_last_name?.[0] || ''}`.toUpperCase() : '??'}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#202124', lineHeight: 1.2 }}>
                            {m.user_first_name ? `${m.user_first_name} ${m.user_last_name || ''}` : `UserID: ${m.user_id?.substring(0, 8)}`}
                          </Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: '#5F6368' }}>
                            {m.user_email || 'No email provided'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <RoleBadge roleCode={primaryRole} />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.82rem', color: '#5F6368' }}>
                        {m.joined_at ? new Date(m.joined_at).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Manage Access">
                        <span>
                          <IconButton 
                            size="small" 
                            onClick={(e) => handleMenuOpen(e, m)}
                            disabled={m.user_id === user?.id} // Prevent self-removal/edit in this view
                          >
                            <MoreIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Invite Modal */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#202124' }}>Invite Member</Typography>
          <Typography sx={{ fontSize: '0.8rem', color: '#5F6368' }}>Provision a new system account</Typography>
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
          
          <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
            <TextField
              label="First Name"
              size="small"
              fullWidth
              margin="dense"
              value={form.first_name}
              onChange={e => setForm({ ...form, first_name: e.target.value })}
            />
            <TextField
              label="Last Name"
              size="small"
              fullWidth
              margin="dense"
              value={form.last_name}
              onChange={e => setForm({ ...form, last_name: e.target.value })}
            />
          </Box>
          <TextField
            label="Email Address"
            type="email"
            size="small"
            fullWidth
            margin="dense"
            sx={{ mt: 1.5 }}
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
          <TextField
            select
            label="System Role"
            size="small"
            fullWidth
            margin="dense"
            sx={{ mt: 2.5 }}
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
          >
            {ROLES.map((r) => (
              <MenuItem key={r.value} value={r.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <SecurityIcon sx={{ fontSize: 16, color: r.color }} />
                  {r.label}
                </Box>
              </MenuItem>
            ))}
          </TextField>
          <Alert severity="info" sx={{ mt: 3, '& .MuiAlert-message': { fontSize: '0.78rem' } }}>
            The new user will be provisioned instantly. They must use the password <b>ChangeMe123!</b> to login initially.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
          <Button onClick={() => setOpen(false)} sx={{ fontWeight: 600, color: '#5F6368' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddMember}
            disabled={addMemberMutation.isLoading}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            {addMemberMutation.isLoading ? 'Provisioning...' : 'Provision Access'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 160, mt: 1, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' } }}
      >
        <MuiMenuItem onClick={() => setUpdateRoleDialogOpen(true)} sx={{ py: 1, fontSize: '0.85rem' }}>
          <EditIcon sx={{ mr: 1.5, fontSize: 18, color: '#5F6368' }} />
          Update Role
        </MuiMenuItem>
        <MuiMenuItem onClick={() => setDeleteDialogOpen(true)} sx={{ py: 1, fontSize: '0.85rem', color: '#D93025' }}>
          <DeleteIcon sx={{ mr: 1.5, fontSize: 18, color: '#D93025' }} />
          Remove Member
        </MuiMenuItem>
      </Menu>

      {/* Update Role Dialog */}
      <Dialog open={updateRoleDialogOpen} onClose={() => setUpdateRoleDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Update Member Role</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, fontSize: '0.85rem', color: '#5F6368' }}>
            Change permissions for <b>{selectedMember?.user_first_name} {selectedMember?.user_last_name}</b>.
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
          >
            {ROLES.map((r) => (
              <MuiMenuItem key={r.value} value={r.value}>
                {r.label}
              </MuiMenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setUpdateRoleDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => updateMemberMutation.mutate({ id: selectedMember.id, data: { role_codes: [newRole] } })}
            disabled={updateMemberMutation.isLoading}
          >
            {updateMemberMutation.isLoading ? 'Updating...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#D93025' }}>Remove Member?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.85rem' }}>
            Are you sure you want to remove <b>{selectedMember?.user_first_name} {selectedMember?.user_last_name}</b> from the organization? They will lose all access immediately.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={() => deleteMemberMutation.mutate(selectedMember.id)}
            disabled={deleteMemberMutation.isLoading}
          >
            {deleteMemberMutation.isLoading ? 'Removing...' : 'Confirm Removal'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
