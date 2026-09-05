'use client'

// React Imports
import type { ComponentProps } from 'react'

// Third-party Imports
import { CalendarIcon, EllipsisVerticalIcon, PencilIcon, Trash2Icon } from 'lucide-react'

// Type Imports
import type { Assignee, Task } from '@/types/apps/kanban-types'

// Component Imports
import { KanbanItem } from '@/components/ui/kanban'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// Util Imports
import { cn } from '@/lib/utils'
import { getAssigneeInitials, MAX_VISIBLE_ASSIGNEES } from '@/utils/kanban-utils'

function TaskAssigneeAvatars({ assignees }: { assignees: Assignee[] }) {
  const visibleAssignees = assignees.slice(0, MAX_VISIBLE_ASSIGNEES)
  const hiddenCount = assignees.length - MAX_VISIBLE_ASSIGNEES

  return (
    <AvatarGroup className='*:data-[slot=avatar]:size-5 *:data-[slot=avatar]:ring-1'>
      {visibleAssignees.map(assignee => (
        <Tooltip key={assignee.name}>
          <TooltipTrigger
            render={
              <Avatar className='ring-background ring-2' data-size='sm'>
                <AvatarImage src={assignee.avatar} alt={assignee.name} />
                <AvatarFallback className='text-xs'>{getAssigneeInitials(assignee.name)}</AvatarFallback>
              </Avatar>
            }
          />
          <TooltipContent>{assignee.name}</TooltipContent>
        </Tooltip>
      ))}
      {hiddenCount > 0 && (
        <Tooltip>
          <TooltipTrigger
            render={<AvatarGroupCount className='size-5 text-xs ring-2'>+{hiddenCount}</AvatarGroupCount>}
          />
          <TooltipContent>+{hiddenCount} more</TooltipContent>
        </Tooltip>
      )}
    </AvatarGroup>
  )
}

interface TaskCardProps extends Omit<ComponentProps<typeof KanbanItem>, 'value' | 'children'> {
  task: Task
  isOverlay?: boolean
  onEdit?: () => void
  onDelete?: (taskId: string) => void
}

export function TaskCard({ task, isOverlay, onEdit, onDelete, className, ...props }: TaskCardProps) {
  const hasFooter = (task.assignees && task.assignees.length > 0) || task.dueDate

  return (
    <KanbanItem value={task.id} {...props} className={cn('rounded-lg', className)}>
      <Card className='group/card cursor-move py-3'>
        <CardContent className='px-3'>
          <div
            className={cn('min-w-0 flex-1 space-y-2', !isOverlay && onEdit && 'cursor-pointer')}
            onClick={!isOverlay && onEdit ? onEdit : undefined}
            onKeyDown={
              !isOverlay && onEdit
                ? e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onEdit()
                    }
                  }
                : undefined
            }
            role={!isOverlay && onEdit ? 'button' : undefined}
            tabIndex={!isOverlay && onEdit ? 0 : undefined}
          >
            <div className='flex items-start justify-between gap-2'>
              <Badge
                className={cn(
                  'capitalize',
                  task.priority === 'high'
                    ? 'bg-destructive/10 text-destructive'
                    : task.priority === 'medium'
                      ? 'bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400'
                      : 'bg-indigo-500/10 text-indigo-500'
                )}
              >
                {task.priority}
              </Badge>

              <div className='flex h-6 items-center gap-1'>
                {!isOverlay && (onEdit || onDelete) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          size='icon-xs'
                          variant='ghost'
                          className='shrink-0 opacity-100 transition-opacity group-hover/card:opacity-100 sm:opacity-0'
                          onClick={e => e.stopPropagation()}
                          onPointerDown={e => e.stopPropagation()}
                        />
                      }
                    >
                      <EllipsisVerticalIcon className='size-3.5' />
                      <span className='sr-only'>Card actions</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end' className='w-36'>
                      {onEdit && (
                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation()
                            onEdit()
                          }}
                        >
                          <PencilIcon />
                          Edit card
                        </DropdownMenuItem>
                      )}
                      {onEdit && onDelete && <DropdownMenuSeparator />}
                      {onDelete && (
                        <DropdownMenuItem
                          variant='destructive'
                          onClick={e => {
                            e.stopPropagation()
                            onDelete(task.id)
                          }}
                        >
                          <Trash2Icon />
                          Delete card
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {task.image && (
              <div className='overflow-hidden rounded-md'>
                <img src={task.image} alt='' className='aspect-[16/9] w-full object-cover' loading='lazy' />
              </div>
            )}

            <div className='space-y-1'>
              <p className='line-clamp-2 text-sm leading-snug font-medium'>{task.title}</p>
            </div>

            {hasFooter && (
              <div className='flex items-center justify-between gap-2 pt-0.5'>
                {task.assignees && task.assignees.length > 0 ? (
                  <TaskAssigneeAvatars assignees={task.assignees} />
                ) : (
                  <span />
                )}
                {task.dueDate && (
                  <div className='text-muted-foreground flex shrink-0 items-center gap-1 text-xs'>
                    <CalendarIcon className='size-3' />
                    <time>{task.dueDate}</time>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </KanbanItem>
  )
}
