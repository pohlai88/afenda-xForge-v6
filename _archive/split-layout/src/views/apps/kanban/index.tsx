'use client'

// React Imports
import { useState } from 'react'

// Type Imports
import type { Task } from '@/types/apps/kanban-types'

// Component Imports
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Kanban, KanbanAddColumn, KanbanBoard, KanbanOverlay } from '@/components/ui/kanban'
import { ColumnEditDialog } from './kanban-column-edit-dialog'
import { TaskCard } from './kanban-task-card'
import { TaskColumn } from './kanban-task-column'
import { TaskEditDialog } from './kanban-task-edit-dialog'

// Store Imports
import { useKanbanStore } from '@/store/use-kanban-store'

export function KanbanView() {
  const columns = useKanbanStore(s => s.columns)
  const columnTitles = useKanbanStore(s => s.columnTitles)
  const setColumns = useKanbanStore(s => s.setColumns)
  const addColumn = useKanbanStore(s => s.addColumn)
  const deleteColumn = useKanbanStore(s => s.deleteColumn)
  const updateColumnTitle = useKanbanStore(s => s.updateColumnTitle)
  const validateNewColumnTitle = useKanbanStore(s => s.validateNewColumnTitle)
  const addCard = useKanbanStore(s => s.addCard)
  const deleteCard = useKanbanStore(s => s.deleteCard)
  const updateCard = useKanbanStore(s => s.updateCard)

  const [editingTask, setEditingTask] = useState<{ columnId: string; taskId: string } | null>(null)
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null)

  const orderedColumnIds = Object.keys(columns)
  const editingTaskData = editingTask && columns[editingTask.columnId]?.find(t => t.id === editingTask.taskId)

  return (
    <Kanban value={columns} onValueChange={setColumns} getItemValue={(item: Task) => item.id}>
      <ScrollArea className='h-full'>
        <div className='flex gap-2 p-1'>
          <KanbanBoard className='flex gap-4 p-0'>
            {orderedColumnIds.map(columnId => (
              <TaskColumn
                key={columnId}
                value={columnId}
                title={columnTitles[columnId] ?? columnId}
                tasks={columns[columnId] ?? []}
                onEditColumn={setEditingColumnId}
                onDeleteColumn={deleteColumn}
                onAddCard={addCard}
                onEditCard={(colId, taskId) => setEditingTask({ columnId: colId, taskId })}
                onDeleteCard={deleteCard}
              />
            ))}
          </KanbanBoard>

          <KanbanAddColumn onAdd={addColumn} validate={validateNewColumnTitle} />
        </div>
        <ScrollBar orientation='horizontal' />
      </ScrollArea>

      <KanbanOverlay>
        {({ value, variant }) => {
          if (variant === 'column') {
            const columnId = value as string

            return (
              <TaskColumn
                value={columnId}
                title={columnTitles[columnId] ?? columnId}
                tasks={columns[columnId] ?? []}
                isOverlay
                onDeleteColumn={() => {}}
                onAddCard={() => {}}
                onDeleteCard={() => {}}
              />
            )
          }

          const activeTask = Object.values(columns)
            .flat()
            .find(task => task.id === value)

          if (!activeTask) return null

          return <TaskCard task={activeTask} isOverlay className='w-72 rotate-1 shadow-xl' />
        }}
      </KanbanOverlay>

      <TaskEditDialog
        task={editingTaskData ?? null}
        open={!!editingTask && !!editingTaskData}
        onOpenChange={open => {
          if (!open) setEditingTask(null)
        }}
        onSave={updates => {
          if (editingTask) {
            updateCard(editingTask.columnId, editingTask.taskId, updates)
          }
        }}
      />

      <ColumnEditDialog
        columnId={editingColumnId ?? ''}
        title={editingColumnId ? (columnTitles[editingColumnId] ?? editingColumnId) : ''}
        columnTitles={columnTitles}
        open={!!editingColumnId}
        onOpenChange={open => {
          if (!open) setEditingColumnId(null)
        }}
        onSave={title => {
          if (editingColumnId) {
            updateColumnTitle(editingColumnId, title)
          }
        }}
      />
    </Kanban>
  )
}
