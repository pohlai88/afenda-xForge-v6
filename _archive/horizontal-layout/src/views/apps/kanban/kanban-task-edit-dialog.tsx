'use client'

// React Imports
import { type MouseEvent, useId, useState } from 'react'

// Third-party Imports
import { format } from 'date-fns'
import { CalendarIcon, ChevronDownIcon } from 'lucide-react'

// Type Imports
import type { Task } from '@/types/apps/kanban-types'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor
} from '@/components/ui/combobox'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

// Data Imports
import { teamMembers } from '@/fake-db/apps/kanban'

// Store Imports
import { resolveAssignees } from '@/store/use-kanban-store'

// Util Imports
import { getAssigneeInitials, parseDueDate, priorityItems } from '@/utils/kanban-utils'

interface TaskEditDialogProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (updates: Partial<Task>) => void
}

const MAX_VISIBLE_CHIPS = 2

function TaskEditDialogContent({
  task,
  onOpenChange,
  onSave
}: {
  task: Task
  onOpenChange: (open: boolean) => void
  onSave: (updates: Partial<Task>) => void
}) {
  const assigneeComboboxId = useId()
  const assigneeAnchor = useComboboxAnchor()
  const teamMemberNames = teamMembers.map(member => member.name)

  const [expanded, setExpanded] = useState(false)
  const [datePopoverOpen, setDatePopoverOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(() => parseDueDate(task.dueDate))
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [priority, setPriority] = useState(task.priority)

  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(
    task.assignees?.map(assignee => assignee.name) ?? []
  )

  function handleSave() {
    const trimmedTitle = title.trim()

    if (!trimmedTitle) return

    const assignees = resolveAssignees(selectedAssignees)

    onSave({
      title: trimmedTitle,
      description: description.trim() || undefined,
      priority,
      assignees: assignees.length > 0 ? assignees : undefined,
      dueDate: date ? format(date, 'MMM d, yyyy') : undefined
    })
    onOpenChange(false)
  }

  return (
    <DialogContent className='sm:max-w-md'>
      <DialogHeader>
        <DialogTitle>Edit card</DialogTitle>
        <DialogDescription>Update the card details below.</DialogDescription>
      </DialogHeader>

      <div className='grid gap-4 py-2'>
        <div className='grid gap-2'>
          <Label htmlFor='task-title'>Title</Label>
          <Input id='task-title' value={title} onChange={e => setTitle(e.target.value)} placeholder='Card title' />
        </div>

        <div className='grid gap-2'>
          <Label htmlFor='task-description'>Description</Label>
          <Textarea
            id='task-description'
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder='Add a description...'
            rows={3}
          />
        </div>

        <div className='grid gap-2'>
          <Label htmlFor='task-priority'>Priority</Label>
          <Select
            items={priorityItems}
            value={priority}
            onValueChange={value => setPriority(value as Task['priority'])}
          >
            <SelectTrigger id='task-priority' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {priorityItems.map(item => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className='grid gap-2'>
          <Label htmlFor='task-image'>Card image</Label>
          <Input id='task-image' type='file' accept='image/*' />
        </div>

        <div className='grid gap-2'>
          <Label htmlFor={assigneeComboboxId}>Assignees</Label>
          <Combobox
            multiple
            autoHighlight
            id={assigneeComboboxId}
            items={teamMemberNames}
            value={selectedAssignees}
            onValueChange={setSelectedAssignees}
          >
            <ComboboxChips ref={assigneeAnchor}>
              <ComboboxValue>
                {(values: string[]) => {
                  const visibleValues = expanded ? values : values.slice(0, MAX_VISIBLE_CHIPS)
                  const hiddenCount = values.length - MAX_VISIBLE_CHIPS

                  return (
                    <>
                      {visibleValues.map((value: string) => (
                        <ComboboxChip key={value}>{value}</ComboboxChip>
                      ))}
                      {values.length > MAX_VISIBLE_CHIPS && (
                        <ComboboxChip
                          key='toggle'
                          showRemove={false}
                          className='cursor-pointer'
                          onClick={(e: MouseEvent) => {
                            e.stopPropagation()
                            setExpanded(prev => !prev)
                          }}
                        >
                          {expanded ? 'Show Less' : `+${hiddenCount} more`}
                        </ComboboxChip>
                      )}
                      {values.length === 0 && <span className='text-muted-foreground'>Select assignees...</span>}
                      <ComboboxChipsInput />
                    </>
                  )
                }}
              </ComboboxValue>
            </ComboboxChips>
            <ComboboxContent anchor={assigneeAnchor}>
              <ComboboxEmpty>No team members found.</ComboboxEmpty>
              <ComboboxList>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    <Avatar className='size-5' data-size='sm'>
                      <AvatarImage src={teamMembers.find(member => member.name === item)?.avatar} alt={item} />
                      <AvatarFallback className='text-xs'>{getAssigneeInitials(item)}</AvatarFallback>
                    </Avatar>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        <div className='flex flex-col gap-2'>
          <Label htmlFor='task-due-date'>Due date</Label>
          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger
              render={<Button variant='outline' id='task-due-date' className='w-full justify-between font-normal' />}
            >
              <span className='flex items-center gap-2'>
                <CalendarIcon className='size-4' />
                {date ? format(date, 'MMM d, yyyy') : <span className='text-muted-foreground'>Pick a due date</span>}
              </span>
              <ChevronDownIcon className='size-4 opacity-50' />
            </PopoverTrigger>
            <PopoverContent className='w-auto overflow-hidden p-0' align='start'>
              <Calendar
                mode='single'
                selected={date}
                onSelect={selectedDate => {
                  setDate(selectedDate)
                  setDatePopoverOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <DialogFooter>
        <Button variant='outline' onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!title.trim()}>
          Save changes
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

export function TaskEditDialog({ task, open, onOpenChange, onSave }: TaskEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {task && <TaskEditDialogContent key={task.id} task={task} onOpenChange={onOpenChange} onSave={onSave} />}
    </Dialog>
  )
}
