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
import LoadingOverlay from '@/components/ui/loading-overlay'
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

export default function AdminProfileManagement() {
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
      const data = await getCurrentUserProfile()
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

  if (isLoading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Admin Profile</CardTitle>
          <CardDescription>
            View and manage your personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[300px] relative">
          <LoadingOverlay message="Loading profile information..." />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="max-w-2xl mx-auto border-violet-100 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
          <CardTitle className="text-violet-700">Admin Profile</CardTitle>
          <CardDescription>
            View and manage your personal information
          </CardDescription>
        </CardHeader>

        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-violet-700">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder="Enter your first name"
                  className="border-violet-200 focus-visible:ring-violet-500"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-violet-700">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  placeholder="Enter your last name"
                  className="border-violet-200 focus-visible:ring-violet-500"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-violet-700">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="Enter phone number with country code (e.g., +14155552671)"
                  className="border-violet-200 focus-visible:ring-violet-500"
                  disabled={isSubmitting}
                />
                <p className="text-sm text-slate-500 mt-1">
                  Must start with + followed by country code and number (max 15
                  digits)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-violet-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  value={profile?.email || ''}
                  disabled
                  className="bg-slate-50 border-violet-100"
                />
                <p className="text-sm text-slate-500">
                  Email address cannot be changed
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end space-x-2 border-t border-violet-100 bg-violet-50/50 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isSubmitting}
                className="border-violet-200 text-violet-700 hover:bg-violet-100"
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
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">
                    First Name
                  </p>
                  <p className="text-lg font-medium text-violet-700">
                    {profile?.firstName || 'Not set'}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">
                    Last Name
                  </p>
                  <p className="text-lg font-medium text-violet-700">
                    {profile?.lastName || 'Not set'}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">
                  Phone Number
                </p>
                <p className="text-lg font-medium text-violet-700">
                  {profile?.phone || 'Not set'}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">
                  Email Address
                </p>
                <p className="text-lg font-medium text-violet-700">
                  {profile?.email || 'Not available'}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">Role</p>
                <div className="flex items-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-violet-100 text-violet-800">
                    Administrator
                  </span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end space-x-2 border-t border-violet-100 bg-violet-50/50 py-4">
              <Button
                variant="outline"
                onClick={() => setShowPasswordDialog(true)}
                className="border-violet-200 text-violet-700 hover:bg-violet-100"
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
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[425px]">
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
                <Label htmlFor="currentPassword" className="text-violet-700">
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
                  className="border-violet-200 focus-visible:ring-violet-500"
                  disabled={isChangingPassword}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-violet-700">
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
                  className="border-violet-200 focus-visible:ring-violet-500"
                  disabled={isChangingPassword}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-violet-700">
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
                  className="border-violet-200 focus-visible:ring-violet-500"
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
                className="border-violet-200 text-violet-700 hover:bg-violet-100"
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
    </>
  )
}
