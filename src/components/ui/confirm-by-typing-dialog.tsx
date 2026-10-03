'use client'

import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Confirmation for actions that cannot be undone and remove a lot, such as
 * deleting a user or a competition. The person must type the name of the
 * thing, so a stray click or a quick "OK" cannot do it by accident.
 */
export default function ConfirmByTypingDialog({
  trigger,
  title,
  description,
  confirmText,
  confirmLabel = 'Delete',
  onConfirm,
}: {
  /** The button that opens the dialog */
  trigger: ReactNode
  title: string
  description: ReactNode
  /** What must be typed, e.g. the competition name or the user's email */
  confirmText: string
  confirmLabel?: string
  onConfirm: () => void | Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)

  const matches =
    typed.trim().toLowerCase() === confirmText.trim().toLowerCase()

  const confirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setTyped('')
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">
            {title}
          </DialogTitle>
          <DialogDescription asChild>
            <div>{description}</div>
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (matches && !busy) confirm()
          }}
          className="space-y-2"
        >
          <Label htmlFor="confirm-typed" className="font-medium">
            Type{' '}
            <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-sm break-all">
              {confirmText}
            </span>{' '}
            to confirm
          </Label>
          <Input
            id="confirm-typed"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            disabled={busy}
          />
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={confirm}
            disabled={!matches || busy}
          >
            {busy ? 'Working...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
