'use client'

import { useState, useEffect } from 'react'
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
import LocalLoadingCard from '@/components/ui/local-loading-card'
import ErrorNotice from '@/components/ui/error-notice'
import PageHeader from '@/components/layout/page-header'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
  const [loadError, setLoadError] = useState<string | null>(null)

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
              .includes(query),
        ),
      )
    }
  }, [searchQuery, users])

  const loadUsers = async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const data = await getAllUsers()
      setUsers(data)
      setFilteredUsers(data)
    } catch (error) {
      console.error('Failed to load users:', error)
      setLoadError(error instanceof Error ? error.message : String(error))
      toast.error(
        `Failed to load users: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
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
        }`,
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
        }`,
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
        }`,
      )
    }
  }

  const displayName = (user: User) =>
    user.name ||
    `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
    'N/A'

  const initials = (user: User) =>
    displayName(user)
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

  const isActive = (user: User) =>
    user.status === true || user.status === 'active'

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Users"
        description="Everyone with an account. Change a role, switch an account off, or remove an account and its files."
      />

      <div className="relative max-w-md">
        <Search
          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          aria-label="Search users"
          placeholder="Search by name, email or ID"
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <LocalLoadingCard message="Loading users..." minHeight="300px" />
      ) : loadError ? (
        <ErrorNotice
          title="Could not load users"
          message="The user list could not be loaded. Check that the API key has the users.read scope, then try again."
          details={loadError}
          onRetry={loadUsers}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  {searchQuery
                    ? 'No users match your search'
                    : 'No users found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.$id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-accent font-display text-xs font-bold text-accent-foreground">
                        {initials(user)}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold">{displayName(user)}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {user.phone || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={user.isAdmin ? 'accent' : 'outline'}
                        className="w-24 justify-center"
                      >
                        {user.isAdmin ? 'Admin' : 'Competitor'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => handleRoleToggle(user.$id, user.isAdmin)}
                        title={`Change to ${user.isAdmin ? 'competitor' : 'admin'}`}
                        aria-label={`Change to ${user.isAdmin ? 'competitor' : 'admin'}`}
                      >
                        {user.isAdmin ? <Shield /> : <ShieldAlert />}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={isActive(user)}
                      onCheckedChange={() =>
                        handleStatusToggle(user.$id, isActive(user))
                      }
                      aria-label={`User ${isActive(user) ? 'active' : 'inactive'}`}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Delete user"
                          title="Delete user"
                        >
                          <Trash />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete user</AlertDialogTitle>
                          <AlertDialogDescription>
                            Delete {displayName(user)}? This permanently removes
                            the account and every music file they uploaded. It
                            cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className={cn(
                              buttonVariants({ variant: 'destructive' }),
                            )}
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
    </div>
  )
}
