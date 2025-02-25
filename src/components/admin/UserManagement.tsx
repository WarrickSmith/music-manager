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

  // Fetch users when component mounts
  useEffect(() => {
    fetchUsers()
  }, [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const { user: currentUser } = useAuth()

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

  // Function to delete user
  const deleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUserById(userId)
        await fetchUsers()
      } catch (err) {
        setError('Failed to delete user')
        console.error(err)
      }
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

  // Function to handle bulk deletion
  const bulkDelete = async () => {
    if (window.confirm('Are you sure you want to delete all selected users?')) {
      try {
        await bulkDeleteUsers(selectedUsers)
        setSelectedUsers([])
        await fetchUsers()
      } catch (err) {
        setError('Failed to delete selected users')
        console.error(err)
      }
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
              <Button variant="destructive" onClick={bulkDelete}>
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
