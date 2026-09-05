'use client'

// React Imports
import React, { useState } from 'react'

// Third-party Imports
import { MailIcon, MonitorIcon, TabletSmartphoneIcon } from 'lucide-react'

// Component Imports
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type NotificationChannels = {
  email: boolean
  desktop: boolean
  app: boolean
}

type NotificationItem = {
  id: string
  title: string
  description?: string
  channels: NotificationChannels
}

type NotificationSection = {
  id: string
  title: string
  items: NotificationItem[]
}

const notificationSections: NotificationSection[] = [
  {
    id: 'users-team',
    title: 'Users & Team',
    items: [
      {
        id: 'new-user-registrations',
        title: 'New User Registrations',
        description: 'Be informed when a new user signs up.',
        channels: { email: true, desktop: false, app: true }
      },
      {
        id: 'role-permission-changes',
        title: 'Role & Permission Changes',
        description: 'Receive notifications when user roles or access levels are modified.',
        channels: { email: true, desktop: true, app: true }
      }
    ]
  },
  {
    id: 'api-integrations',
    title: 'API & Integrations',
    items: [
      {
        id: 'api-usage-limit',
        title: 'API Usage Limit',
        description: 'Get notified when API usage approaches your quota.',
        channels: { email: false, desktop: true, app: false }
      },
      {
        id: 'integration-failures',
        title: 'Integration Failures',
        description: 'Receive alerts when third-party integrations fail.',
        channels: { email: true, desktop: false, app: false }
      }
    ]
  },
  {
    id: 'projects',
    title: 'Projects',
    items: [
      {
        id: 'project-status-updates',
        title: 'Project Status Updates',
        description: 'Be notified when project stages or statuses are updated.',
        channels: { email: false, desktop: true, app: true }
      },
      {
        id: 'deadline-reminders',
        title: 'Deadline Reminders',
        description: 'Receive reminders before project or milestone deadlines.',
        channels: { email: true, desktop: true, app: true }
      },
      {
        id: 'project-comments',
        title: 'Project Comments',
        description: "Get notified when someone comments on a project you're part of.",
        channels: { email: true, desktop: true, app: true }
      }
    ]
  }
]

const Notifications = () => {
  const [sections, setSections] = useState<NotificationSection[]>(notificationSections)

  const setColumn = (column: keyof NotificationChannels, value: boolean) => {
    setSections(prev =>
      prev.map(section => ({
        ...section,
        items: section.items.map(item => ({
          ...item,
          channels: { ...item.channels, [column]: value }
        }))
      }))
    )
  }

  const setItemChannel = (sectionId: string, itemId: string, column: keyof NotificationChannels, value: boolean) => {
    setSections(prev =>
      prev.map(section => {
        if (section.id !== sectionId) return section

        return {
          ...section,
          items: section.items.map(item =>
            item.id === itemId ? { ...item, channels: { ...item.channels, [column]: value } } : item
          )
        }
      })
    )
  }

  const emailAll = sections.every(s => s.items.every(i => i.channels.email))
  const desktopAll = sections.every(s => s.items.every(i => i.channels.desktop))
  const appAll = sections.every(s => s.items.every(i => i.channels.app))

  return (
    <section className='py-3'>
      <div className='mb-6 space-y-1'>
        <h3 className='text-base font-semibold'>Notifications</h3>
        <p className='text-muted-foreground text-sm'>Manage your notification settings and preferences.</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow className='border-none hover:bg-transparent'>
            <TableHead className='bg-background sticky left-0 z-1 w-1/4 py-6! text-left text-base font-semibold'>
              Notify Me About
            </TableHead>
            <TableHead className='text-center'>
              <div className='flex flex-col items-center'>
                <MailIcon />
                <span className='text-xs font-medium'>Email</span>
                <div className='mt-2 mb-4 flex flex-col items-center text-xs'>
                  <button
                    type='button'
                    onClick={() => setColumn('email', !emailAll)}
                    aria-pressed={emailAll}
                    className='text-xs'
                  >
                    Toggle All
                  </button>
                </div>
              </div>
            </TableHead>
            <TableHead className='text-center'>
              <div className='flex flex-col items-center'>
                <div className='flex flex-col items-center'>
                  <MonitorIcon />
                  <span className='text-xs font-medium'>Desktop</span>
                  <div className='mt-2 mb-4 flex flex-col items-center text-xs'>
                    <button
                      type='button'
                      onClick={() => setColumn('desktop', !desktopAll)}
                      aria-pressed={desktopAll}
                      className='text-xs'
                    >
                      Toggle All
                    </button>
                  </div>
                </div>
              </div>
            </TableHead>
            <TableHead className='text-center'>
              <div className='flex flex-col items-center'>
                <div className='flex flex-col items-center'>
                  <TabletSmartphoneIcon />
                  <span className='text-xs font-medium'>App</span>
                  <div className='mt-2 mb-4 flex flex-col items-center text-xs'>
                    <button
                      type='button'
                      onClick={() => setColumn('app', !appAll)}
                      aria-pressed={appAll}
                      className='text-xs'
                    >
                      Toggle All
                    </button>
                  </div>
                </div>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sections.map(section => (
            <React.Fragment key={section.id}>
              <TableRow className='border-none hover:bg-transparent'>
                <TableCell className='bg-muted sticky left-0 rounded-l-md py-4 pr-0 pl-4 text-left text-sm font-semibold'>
                  {section.title}
                </TableCell>
                <TableCell className='bg-muted p-0' />
                <TableCell className='bg-muted p-0' />
                <TableCell className='bg-muted rounded-r-md p-0' />
              </TableRow>

              {section.items.map(item => (
                <TableRow className='border-none hover:bg-transparent' key={item.id}>
                  <TableCell className='bg-background sticky left-0 z-1'>
                    <div className='text-sm font-medium'>{item.title}</div>
                    {item.description && (
                      <div className='text-muted-foreground text-xs text-wrap'>{item.description}</div>
                    )}
                  </TableCell>
                  <TableCell className='align-middle'>
                    <div className='flex justify-center'>
                      <Checkbox
                        checked={item.channels.email}
                        onCheckedChange={checked => setItemChannel(section.id, item.id, 'email', !!checked)}
                        aria-label={`${item.id}-email`}
                      />
                    </div>
                  </TableCell>
                  <TableCell className='align-middle'>
                    <div className='flex justify-center'>
                      <Checkbox
                        checked={item.channels.desktop}
                        onCheckedChange={checked => setItemChannel(section.id, item.id, 'desktop', !!checked)}
                        aria-label={`${item.id}-desktop`}
                      />
                    </div>
                  </TableCell>
                  <TableCell className='align-middle'>
                    <div className='flex justify-center'>
                      <Checkbox
                        checked={item.channels.app}
                        onCheckedChange={checked => setItemChannel(section.id, item.id, 'app', !!checked)}
                        aria-label={`${item.id}-app`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </section>
  )
}

export default Notifications
