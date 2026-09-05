export type Assignee = {
  name: string
  avatar?: string
}

export type Task = {
  id: string
  title: string
  priority: 'low' | 'medium' | 'high'
  image?: string
  description?: string
  assignees?: Assignee[]
  dueDate?: string
}
