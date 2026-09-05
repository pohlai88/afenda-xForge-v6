'use client'

// React Imports
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'

const notifications = [
  {
    id: 'notif-email-updates',
    label: 'Email Updates',
    description: 'Receive weekly digests and product updates.',
    defaultChecked: true
  },
  {
    id: 'notif-activity',
    label: 'Activity Notifications',
    description: "Get notified when there's activity in your workspace.",
    defaultChecked: true
  },
  {
    id: 'notif-mentions',
    label: 'Mention Alerts',
    description: 'Be alerted when someone mentions you in a comment.',
    defaultChecked: true
  },
  {
    id: 'notif-reports',
    label: 'Report Summaries',
    description: 'Receive monthly performance and analytics summaries.',
    defaultChecked: false
  },
  {
    id: 'feature-announcements',
    label: 'New Feature Announcements',
    description: 'Be the first to know when new features are released.',
    defaultChecked: true
  },
  {
    id: 'feature-tips',
    label: 'Product Tips & Best Practices',
    description: 'Helpful tips to get more out of the platform.',
    defaultChecked: false
  },
  {
    id: 'notif-marketing',
    label: 'Marketing & Promotions',
    description: 'Tips, feature announcements, and special offers.',
    defaultChecked: false
  },
  {
    id: 'notif-security',
    label: 'Security Alerts',
    description: 'Important alerts about your account security.',
    defaultChecked: true
  }
]

const NotificationsStep = () => {
  return (
    <div className='bg-background overflow-hidden rounded-2xl border'>
      {notifications.map((notif, index) => (
        <div key={notif.id}>
          <div className='flex items-start justify-between gap-4 p-4'>
            <div className='flex flex-col gap-0.5'>
              <Label htmlFor={notif.id} className='font-medium'>
                {notif.label}
              </Label>
              <p className='text-muted-foreground text-sm'>{notif.description}</p>
            </div>
            <Switch id={notif.id} defaultChecked={notif.defaultChecked} className='mt-0.5 shrink-0' />
          </div>
          {index < notifications.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  )
}

export default NotificationsStep
