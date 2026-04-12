'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  getCurrentUserProfile,
  updateUserProfile,
  changePassword,
} from '@/app/actions/user-actions'
import LocalLoadingCard from '@/components/ui/local-loading-card'

interface UserProfile {
  $id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  name?: string
  labels?: string[]
}

interface PasswordChangeData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function ProfileManagement({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userId,
}: {
  userId: string
}) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  })
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setIsLoading(true)
    try {
      // Use the userId parameter passed to the component
      const data = await getCurrentUserProfile() // Using current user profile for now
      setProfile(data)
      setFormData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || '',
      })
    } catch (error: Error | unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`Failed to load profile: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await updateUserProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      })
      toast.success('Profile updated successfully')
      setIsEditing(false)
      loadProfile()
    } catch (error: Error | unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`Failed to update profile: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    // Validate password length
    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long')
      return
    }

    setIsChangingPassword(true)

    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })

      toast.success('Password changed successfully')
      setShowPasswordDialog(false)

      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error: Error | unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`Failed to change password: ${errorMessage}`)
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div>
      <Card className="relative mx-auto max-w-2xl border-violet-100 shadow-sm dark:border-violet-500/20 dark:bg-slate-950/60">
        {isLoading ? (
          <LocalLoadingCard message="Loading profile..." minHeight="200px" />
        ) : (
          <>
            <CardHeader className="border-b border-violet-100 bg-gradient-to-r from-violet-50 to-purple-50 py-6 dark:border-violet-500/20 dark:from-violet-950/45 dark:to-slate-950">
              <CardTitle className="text-violet-700 dark:text-violet-100">
                My Profile
              </CardTitle>
              <CardDescription>
                View and manage your personal information
              </CardDescription>
            </CardHeader>

            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-violet-700 dark:text-violet-200">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      placeholder="Enter your first name"
                      className="border-violet-200 focus-visible:ring-violet-500 dark:border-violet-500/30 dark:focus-visible:ring-violet-400"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-violet-700 dark:text-violet-200">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      placeholder="Enter your last name"
                      className="border-violet-200 focus-visible:ring-violet-500 dark:border-violet-500/30 dark:focus-visible:ring-violet-400"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-violet-700 dark:text-violet-200">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="Enter phone number with country code (e.g., +14155552671)"
                      className="border-violet-200 focus-visible:ring-violet-500 dark:border-violet-500/30 dark:focus-visible:ring-violet-400"
                      disabled={isSubmitting}
                    />
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Must start with + followed by country code and number (max
                      15 digits)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-violet-700 dark:text-violet-200">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      value={profile?.email || ''}
                      disabled
                      className="border-violet-100 bg-slate-50 dark:border-violet-500/20 dark:bg-slate-900/70"
                    />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Email address cannot be changed
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="flex justify-end space-x-2 border-t border-violet-100 bg-violet-50/50 py-4 dark:border-violet-500/20 dark:bg-violet-950/10">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isSubmitting}
                    className="border-violet-200 text-violet-700 hover:bg-violet-100 dark:border-violet-500/30 dark:text-violet-200 dark:hover:bg-violet-500/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardFooter>
              </form>
            ) : (
              <>
                <CardContent className="space-y-6 pt-6">
                  {/* Show local loading spinner when submitting */}
                  {isSubmitting && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                      <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-500">Role</p>
                    <span className="inline-flex items-center rounded-full border border-green-200 bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:border-green-500/30 dark:bg-green-500/15 dark:text-green-100">
                      Competitor
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-500">
                        First Name
                      </p>
                      <p className="text-lg font-medium text-violet-700 dark:text-violet-100">
                        {profile?.firstName || 'Not set'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-500">
                        Last Name
                      </p>
                      <p className="text-lg font-medium text-violet-700 dark:text-violet-100">
                        {profile?.lastName || 'Not set'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-500">
                        Phone Number
                      </p>
                      <p className="text-lg font-medium text-violet-700 dark:text-violet-100">
                        {profile?.phone || 'Not set'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-500">
                        Email Address
                      </p>
                      <p className="text-lg font-medium text-violet-700 dark:text-violet-100">
                        {profile?.email || 'Not available'}
                      </p>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex justify-end space-x-2 border-t border-violet-100 bg-violet-50/50 py-4 dark:border-violet-500/20 dark:bg-violet-950/10">
                  <Button
                    variant="outline"
                    onClick={() => setShowPasswordDialog(true)}
                    className="border-violet-200 text-violet-700 hover:bg-violet-100 dark:border-violet-500/30 dark:text-violet-200 dark:hover:bg-violet-500/10"
                  >
                    Change Password
                  </Button>
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                  >
                    Edit Profile
                  </Button>
                </CardFooter>
              </>
            )}
          </>
        )}
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[425px] dark:border-violet-500/20">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new password to update your
              credentials.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordChange}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-violet-700 dark:text-violet-200">
                  Current Password
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  className="border-violet-200 focus-visible:ring-violet-500 dark:border-violet-500/30 dark:focus-visible:ring-violet-400"
                  disabled={isChangingPassword}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-violet-700 dark:text-violet-200">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  className="border-violet-200 focus-visible:ring-violet-500 dark:border-violet-500/30 dark:focus-visible:ring-violet-400"
                  disabled={isChangingPassword}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-violet-700 dark:text-violet-200">
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="border-violet-200 focus-visible:ring-violet-500 dark:border-violet-500/30 dark:focus-visible:ring-violet-400"
                  disabled={isChangingPassword}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPasswordDialog(false)}
                disabled={isChangingPassword}
                className="border-violet-200 text-violet-700 hover:bg-violet-100 dark:border-violet-500/30 dark:text-violet-200 dark:hover:bg-violet-500/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isChangingPassword}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              >
                {isChangingPassword ? 'Changing...' : 'Change Password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
