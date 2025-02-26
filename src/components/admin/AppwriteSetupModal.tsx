'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import Spinner from '@/components/ui/Spinner'

interface AppwriteSetupModalProps {
  open: boolean
  onClose: () => void
  onSwitchTab: (tab: 'users' | 'competitions') => void
}

export function AppwriteSetupModal({
  open,
  onClose,
  onSwitchTab,
}: AppwriteSetupModalProps) {
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const handleSetupAppwrite = async () => {
    try {
      setIsSettingUp(true)
      setError(null)

      const response = await fetch('/api/setup-appwrite', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to setup Appwrite')
      }

      onClose()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to setup Appwrite'
      setError(message)
      console.error('Error setting up Appwrite:', error)
    } finally {
      setIsSettingUp(false)
    }
  }

  const handleCancel = () => {
    onSwitchTab('users')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Setup Required</DialogTitle>
          <DialogDescription>
            The Music Manager Database needs to be set up before you can manage
            competitions.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4">
          {error && (
            <div className="bg-destructive/15 text-destructive p-4 rounded-md">
              {error}
            </div>
          )}
          {isSettingUp ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-4">
              <Spinner message="Setting up Appwrite Database & Storage..." />
              <p className="text-sm text-muted-foreground">
                Setting up Appwrite Database & Storage...
              </p>
            </div>
          ) : (
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSetupAppwrite}>
                Create Appwrite Database & Storage
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
