'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import ErrorNotice from '@/components/ui/error-notice'
import PageHeader from '@/components/layout/page-header'

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

const describe = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error occurred'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="label-mono">{label}</p>
      <p className="text-lg font-medium break-words">{value}</p>
    </div>
  )
}

/**
 * The profile screen for both roles. Admins and competitors edit the same
 * details, so they share one component and differ only in the role shown.
 */
export default function ProfileManagement({
  role,
}: {
  role: 'admin' | 'competitor'
}) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
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

  const loadProfile = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const data = await getCurrentUserProfile()
      setProfile(data)
      setFormData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || '',
      })
    } catch (error) {
      console.error('Failed to load profile:', error)
      setLoadError(describe(error))
      toast.error(`Failed to load profile: ${describe(error)}`)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

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
    } catch (error) {
      toast.error(`Failed to update profile: ${describe(error)}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
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
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error) {
      toast.error(`Failed to change password: ${describe(error)}`)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const isAdmin = role === 'admin'

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="My Profile"
        description={`Your name and contact details as shown to ${isAdmin ? 'competitors' : 'club admins'}.`}
        actions={
          !isLoading &&
          !loadError &&
          !isEditing && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowPasswordDialog(true)}
              >
                Change password
              </Button>
              <Button onClick={() => setIsEditing(true)}>Edit profile</Button>
            </>
          )
        }
      />

      {isLoading ? (
        <LocalLoadingCard message="Loading profile..." minHeight="200px" />
      ) : loadError ? (
        <ErrorNotice
          title="Could not load your profile"
          message="Your profile could not be loaded. Try again in a moment."
          details={loadError}
          onRetry={loadProfile}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="rounded-lg border bg-card p-5">
            <h3 className="mb-4 font-display text-lg font-bold">Account</h3>
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="label-mono">
                      First name
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      placeholder="Enter your first name"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="label-mono">
                      Last name
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      placeholder="Enter your last name"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="label-mono">
                    Phone number
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Include the country code, e.g. +64211234567"
                    disabled={isSubmitting}
                  />
                  <p className="text-sm text-muted-foreground">
                    Must start with + followed by country code and number (max
                    15 digits)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="label-mono">
                    Email address
                  </Label>
                  <Input id="email" value={profile?.email || ''} disabled />
                  <p className="text-sm text-muted-foreground">
                    Email address cannot be changed
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                <Field
                  label="First name"
                  value={profile?.firstName || 'Not set'}
                />
                <Field
                  label="Last name"
                  value={profile?.lastName || 'Not set'}
                />
                <Field
                  label="Phone number"
                  value={profile?.phone || 'Not set'}
                />
                <Field
                  label="Email address"
                  value={profile?.email || 'Not available'}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 self-start rounded-lg border bg-card p-5">
            <h3 className="font-display text-lg font-bold">Role</h3>
            <Badge variant="accent" className="self-start">
              {isAdmin ? 'Admin' : 'Competitor'}
            </Badge>
            <p className="text-muted-foreground">
              {isAdmin
                ? 'You can manage competitions, users and every uploaded file.'
                : 'You can upload and manage your own music files.'}
            </p>
          </div>
        </div>
      )}

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold">
              Change password
            </DialogTitle>
            <DialogDescription>
              Enter your current password and a new password to update your
              credentials.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordChange}>
            <div className="grid gap-4 py-4">
              {(
                [
                  ['currentPassword', 'Current password'],
                  ['newPassword', 'New password'],
                  ['confirmPassword', 'Confirm new password'],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key} className="label-mono">
                    {label}
                  </Label>
                  <Input
                    id={key}
                    type="password"
                    value={passwordData[key]}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        [key]: e.target.value,
                      })
                    }
                    disabled={isChangingPassword}
                    required
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPasswordDialog(false)}
                disabled={isChangingPassword}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? 'Changing...' : 'Change password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
