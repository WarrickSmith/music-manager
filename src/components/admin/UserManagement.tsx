'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { Models } from 'appwrite'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface User extends Models.User<Models.Preferences> {
  selected?: boolean
  labels: string[]
}

// API functions
const fetchUsersList = async () => {
  const response = await fetch('/api/users/list')
  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }
  const data = await response.json()
  return data.users
}

const updateUserRole = async (userId: string, labels: string[]) => {
  const response = await fetch('/api/users/update-role', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, labels }),
  })
  if (!response.ok) {
    throw new Error('Failed to update user role')
  }
}

const deleteUserById = async (userId: string) => {
  const response = await fetch('/api/users/delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })
  if (!response.ok) {
    throw new Error('Failed to delete user')
  }
}

const bulkUpdateRoles = async (userIds: string[], labels: string[]) => {
  const response = await fetch('/api/users/bulk', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userIds, labels }),
  })
  if (!response.ok) {
    throw new Error('Failed to update user roles')
  }
}

const bulkDeleteUsers = async (userIds: string[]) => {
  const response = await fetch('/api/users/bulk', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userIds }),
  })
  if (!response.ok) {
    throw new Error('Failed to delete users')
  }
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const { user: currentUser } = useAuth()

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [userNameToDelete, setUserNameToDelete] = useState<string>('')

  // Bulk delete dialog state
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)

  // Function to fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const users = await fetchUsersList()
      setUsers(users)
    } catch (err) {
      setError('Failed to fetch users')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch users when component mounts
  useEffect(() => {
    fetchUsers()
  }, [])

  // Function to change user role
  const changeUserRole = async (userId: string, newRole: string) => {
    try {
      const labels = newRole === 'admin' ? ['admin'] : ['competitor']
      await updateUserRole(userId, labels)
      await fetchUsers()
    } catch (err) {
      setError('Failed to change user role')
      console.error(err)
    }
  }

  // Function to handle delete user confirmation
  const handleDeleteUser = (user: User) => {
    setUserToDelete(user.$id)
    setUserNameToDelete(user.name || user.email)
    setDeleteDialogOpen(true)
  }

  // Function to confirm user deletion
  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    try {
      await deleteUserById(userToDelete)
      await fetchUsers()
    } catch (err) {
      setError('Failed to delete user')
      console.error(err)
    } finally {
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  // Function to delete user - now just opens the dialog
  const deleteUser = (userId: string) => {
    const user = users.find((u) => u.$id === userId)
    if (user) {
      handleDeleteUser(user)
    }
  }

  // Function to handle bulk deletion dialog
  const handleBulkDelete = () => {
    setBulkDeleteDialogOpen(true)
  }

  // Function to confirm bulk deletion
  const confirmBulkDelete = async () => {
    try {
      await bulkDeleteUsers(selectedUsers)
      setSelectedUsers([])
      await fetchUsers()
    } catch (err) {
      setError('Failed to delete selected users')
      console.error(err)
    } finally {
      setBulkDeleteDialogOpen(false)
    }
  }

  // Function to handle bulk role changes
  const bulkChangeRole = async (newRole: string) => {
    try {
      const labels = newRole === 'admin' ? ['admin'] : ['competitor']
      await bulkUpdateRoles(selectedUsers, labels)
      setSelectedUsers([])
      await fetchUsers()
    } catch (err) {
      setError('Failed to change roles for selected users')
      console.error(err)
    }
  }

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    )
  }

  const toggleSelectAll = () => {
    setSelectedUsers((prev) =>
      prev.length === users.length ? [] : users.map((user) => user.$id)
    )
  }

  return (
    <div className="space-y-4">
      {/* Single user delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the user &quot;{userNameToDelete}
              &quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteUser}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk delete confirmation dialog */}
      <Dialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUsers.length} selected
              users? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmBulkDelete}>
              Delete Users
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="space-x-2">
          {selectedUsers.length > 0 && (
            <>
              <Button
                variant="secondary"
                onClick={() => bulkChangeRole('competitor')}
              >
                Set as Competitors
              </Button>
              <Button
                variant="secondary"
                onClick={() => bulkChangeRole('admin')}
              >
                Set as Admins
              </Button>
              <Button variant="destructive" onClick={handleBulkDelete}>
                Delete Selected
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length}
                  onChange={toggleSelectAll}
                  className="h-4 w-4"
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.$id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.$id)}
                      onChange={() => toggleSelectUser(user.$id)}
                      className="h-4 w-4"
                    />
                  </TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.labels?.includes('admin') ? 'Admin' : 'Competitor'}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {currentUser?.$id !== user.$id && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            changeUserRole(
                              user.$id,
                              user.labels?.includes('admin')
                                ? 'competitor'
                                : 'admin'
                            )
                          }
                        >
                          Toggle Role
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteUser(user.$id)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
