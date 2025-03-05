'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Trash, Shield, ShieldAlert, Search } from 'lucide-react'
import { toast } from 'sonner'
import {
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser,
} from '@/app/actions/user-actions'
import LoadingOverlay from '@/components/ui/loading-overlay'

// Define interface for user object
interface User {
  $id: string
  name?: string
  email: string
  phone?: string
  status: string | boolean
  labels?: string[]
  isAdmin: boolean
  firstName?: string
  lastName?: string
  // Add any other properties that might be in the Appwrite user object
  $createdAt?: string
  $updatedAt?: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredUsers(
        users.filter(
          (user) =>
            user.name?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query) ||
            user.$id?.toLowerCase().includes(query) ||
            `${user.firstName || ''} ${user.lastName || ''}`
              .toLowerCase()
              .includes(query)
        )
      )
    }
  }, [searchQuery, users])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const data = await getAllUsers()
      setUsers(data)
      setFilteredUsers(data)
    } catch (error) {
      toast.error(
        `Failed to load users: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleToggle = async (userId: string, isAdmin: boolean) => {
    try {
      await updateUserRole(userId, isAdmin ? 'competitor' : 'admin')
      toast.success(`User role updated to ${isAdmin ? 'competitor' : 'admin'}`)
      loadUsers()
    } catch (error) {
      toast.error(
        `Failed to update user role: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  const handleStatusToggle = async (userId: string, isActive: boolean) => {
    try {
      await updateUserStatus(userId, !isActive)
      toast.success(`User ${isActive ? 'disabled' : 'enabled'}`)
      loadUsers()
    } catch (error) {
      toast.error(
        `Failed to update user status: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId)
      toast.success('User deleted successfully')
      loadUsers()
    } catch (error) {
      toast.error(
        `Failed to delete user: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  return (
    <>
      <Card className="border-blue-100">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-400">
            User Management
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingOverlay message="Loading users..." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-blue-500 font-medium">
                    Name
                  </TableHead>
                  <TableHead className="text-blue-500 font-medium">
                    Email
                  </TableHead>
                  <TableHead className="text-blue-500 font-medium">
                    Phone
                  </TableHead>
                  <TableHead className="text-blue-500 font-medium">
                    Role
                  </TableHead>
                  <TableHead className="text-blue-500 font-medium">
                    Status
                  </TableHead>
                  <TableHead className="text-blue-500 font-medium text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center h-24 text-blue-500"
                    >
                      {searchQuery
                        ? 'No users matching your search'
                        : 'No users found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.$id}>
                      <TableCell className="font-medium text-blue-600">
                        {user.name ||
                          `${user.firstName || ''} ${
                            user.lastName || ''
                          }`.trim() ||
                          'N/A'}
                      </TableCell>
                      <TableCell className="text-blue-600">
                        {user.email}
                      </TableCell>
                      <TableCell className="text-blue-600">
                        {user.phone || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={user.isAdmin ? 'default' : 'outline'}
                            className={`w-24 justify-center ${
                              user.isAdmin
                                ? 'bg-blue-500 hover:bg-blue-600'
                                : ''
                            }`}
                          >
                            {user.isAdmin ? 'Admin' : 'Competitor'}
                          </Badge>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              handleRoleToggle(user.$id, user.isAdmin)
                            }
                            title={`Change to ${
                              user.isAdmin ? 'competitor' : 'admin'
                            }`}
                            className="border-blue-200 hover:bg-blue-50"
                          >
                            {user.isAdmin ? (
                              <Shield className="h-4 w-4 text-blue-500" />
                            ) : (
                              <ShieldAlert className="h-4 w-4 text-blue-500" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={user.status === 'active'}
                          onCheckedChange={() =>
                            handleStatusToggle(
                              user.$id,
                              user.status === 'active'
                            )
                          }
                          aria-label={`User ${
                            user.status === 'active' ? 'active' : 'inactive'
                          }`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this user? This
                                action cannot be undone and will permanently
                                delete the user account and all associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-white font-medium hover:bg-destructive/90"
                                onClick={() => handleDeleteUser(user.$id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}
