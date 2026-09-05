//Component Imports
import { Switch } from '@/components/ui/switch'

const InboxPreference = () => {
  return (
    <div className='grid grid-cols-1 gap-10 lg:grid-cols-3'>
      {/* Vertical Tabs List */}
      <div className='flex flex-col space-y-1'>
        <h3 className='text-base font-semibold'>Inbox Preferences</h3>
        <p className='text-muted-foreground text-sm'>Manage your inbox settings and notification preferences.</p>
      </div>

      {/* Content */}
      <div className='space-y-4 lg:col-span-2'>
        <div className='flex items-center gap-4'>
          <Switch className='cursor-pointer' />
          <div className='flex flex-col'>
            <h3 className='text-sm font-medium'>Daily Summary</h3>
            <p className='text-muted-foreground text-sm'>Receive a daily summary of your inbox activity.</p>
          </div>
        </div>
        <div className='flex items-center gap-4'>
          <Switch className='cursor-pointer' />
          <div className='flex flex-col'>
            <h3 className='text-sm font-medium'>Product Updates</h3>
            <p className='text-muted-foreground text-sm'>
              Receive notifications about product updates and new features.
            </p>
          </div>
        </div>
        <div className='flex items-center gap-4'>
          <Switch className='cursor-pointer' />
          <div className='flex flex-col'>
            <h3 className='text-sm font-medium'>Exclusive Offers</h3>
            <p className='text-muted-foreground text-sm'>
              Receive promotional offers, partner deals, and event invitations.
            </p>
          </div>
        </div>
        <div className='flex items-center gap-4'>
          <Switch className='cursor-pointer' />
          <div className='flex flex-col'>
            <h3 className='text-sm font-medium'>Surveys & Feedback</h3>
            <p className='text-muted-foreground text-sm'>Participate in surveys and help us improve the platform.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InboxPreference
