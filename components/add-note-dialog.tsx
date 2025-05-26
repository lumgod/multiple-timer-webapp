"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface AddNoteDialogProps {
  onSave: (note: string) => void
  onCancel: () => void
}

export function AddNoteDialog({ onSave, onCancel }: AddNoteDialogProps) {
  const [note, setNote] = useState("")

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>What did you work on?</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Add notes about what you worked on during this time..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[100px]"
            autoFocus
          />
        </div>
        <DialogFooter className="flex space-x-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Skip
          </Button>
          <Button onClick={() => onSave(note)}>Save Notes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
