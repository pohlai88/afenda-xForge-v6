'use client'

// React Imports
import type { ComponentProps } from 'react'

// Third-party Imports
import { EllipsisVerticalIcon, MoveIcon, PencilIcon, Trash2Icon } from 'lucide-react'

// Component Imports
import { KanbanAddItem, KanbanColumn, KanbanColumnContent, KanbanColumnHandle } from '@/components/ui/kanban'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { TaskCard } from './kanban-task-card'

// Util Imports
import { cn } from '@/lib/utils'
import type { Task } from '@/types/apps/kanban-types'

interface TaskColumnProps extends Omit<ComponentProps<typeof KanbanColumn>, 'children'> {
  title: string
  tasks: Task[]
  isOverlay?: boolean
  onEditColumn?: (columnId: string) => void
  onDeleteColumn: (columnId: string) => void
  onAddCard: (columnId: string, title: string) => void
  onEditCard?: (columnId: string, taskId: string) => void
  onDeleteCard: (columnId: string, taskId: string) => void
}

export function TaskColumn({
  value,
  title,
  tasks,
  isOverlay,
  onEditColumn,
  onDeleteColumn,
  onAddCard,
  onEditCard,
  onDeleteCard,
  ...props
}: TaskColumnProps) {
  return (
    <KanbanColumn value={value} {...props}>
      <Card className='bg-muted mb-2.5 w-72 shrink-0 py-4'>
        <CardHeader className='flex items-center justify-between px-4'>
          <div className='flex items-center gap-2.5'>
            <span className='line-clamp-1 max-w-25 overflow-hidden text-sm font-semibold text-ellipsis'>{title}</span>
            <Badge variant='outline'>{tasks.length}</Badge>
          </div>

          <div className='flex items-center gap-1'>
            <KanbanColumnHandle
              render={handleProps => (
                <Button {...handleProps} size='icon-xs' variant='ghost'>
                  <MoveIcon className='size-3.5' />
                </Button>
              )}
            />

            {!isOverlay && (
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button size='icon-xs' variant='ghost' />}>
                  <EllipsisVerticalIcon className='size-3.5' />
                  <span className='sr-only'>Column actions</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-40'>
                  {onEditColumn && (
                    <DropdownMenuItem onClick={() => onEditColumn(value)}>
                      <PencilIcon />
                      Edit column
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem variant='destructive' onClick={() => onDeleteColumn(value)}>
                    <Trash2Icon />
                    Delete column
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className='flex flex-col gap-2.5 px-4'>
          <KanbanColumnContent value={value} className={cn('flex flex-col gap-2.5', tasks.length === 0 && 'hidden')}>
            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                isOverlay={isOverlay}
                onEdit={!isOverlay && onEditCard ? () => onEditCard(value, task.id) : undefined}
                onDelete={!isOverlay ? taskId => onDeleteCard(value, taskId) : undefined}
              />
            ))}
          </KanbanColumnContent>

          {!isOverlay && <KanbanAddItem onAdd={cardTitle => onAddCard(value, cardTitle)} />}
        </CardContent>
      </Card>
    </KanbanColumn>
  )
}
