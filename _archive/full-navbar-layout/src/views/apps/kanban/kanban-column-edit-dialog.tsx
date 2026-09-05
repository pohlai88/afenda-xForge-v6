'use client'

// React Imports
import { useState } from 'react'

// Component Imports
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Util Imports
import { isDuplicateColumnTitle } from '@/utils/kanban-utils'

interface ColumnEditDialogProps {
  columnId: string
  title: string
  columnTitles: Record<string, string>
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (title: string) => void
}

function ColumnEditDialogContent({
  columnId,
  title,
  columnTitles,
  onOpenChange,
  onSave
}: {
  columnId: string
  title: string
  columnTitles: Record<string, string>
  onOpenChange: (open: boolean) => void
  onSave: (title: string) => void
}) {
  const [name, setName] = useState(title)

  const trimmed = name.trim()
  const isDuplicate = trimmed ? isDuplicateColumnTitle(trimmed, columnTitles, columnId) : false

  function handleSave() {
    if (!trimmed || isDuplicate) {
      return
    }

    onSave(trimmed)
    onOpenChange(false)
  }

  return (
    <DialogContent className='sm:max-w-sm'>
      <DialogHeader>
        <DialogTitle>Edit column</DialogTitle>
        <DialogDescription>Change the column name.</DialogDescription>
      </DialogHeader>

      <div className='grid gap-2 py-2'>
        <Label htmlFor='column-title'>Column name</Label>
        <Input
          id='column-title'
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder='Column title'
          aria-invalid={isDuplicate}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSave()
          }}
        />
        {isDuplicate && <p className='text-destructive text-xs'>A column with this name already exists.</p>}
      </div>

      <DialogFooter>
        <Button variant='outline' onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!trimmed || isDuplicate}>
          Save changes
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

export function ColumnEditDialog({ columnId, title, columnTitles, open, onOpenChange, onSave }: ColumnEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <ColumnEditDialogContent
          key={columnId}
          columnId={columnId}
          title={title}
          columnTitles={columnTitles}
          onOpenChange={onOpenChange}
          onSave={onSave}
        />
      )}
    </Dialog>
  )
}
