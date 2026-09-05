// Server Actions Imports
import { getIntegrationsData, getMembersData, getSessionsData } from '@/app/server/actions'

import UserSettingsTabs from '@/views/pages/user-settings/user-settings-tabs'

const UserSettings = async () => {
  const membersData = await getMembersData()
  const sessionsData = await getSessionsData()
  const integrationsData = await getIntegrationsData()

  return (
    <div>
      <div className='mb-4 md:mb-6 lg:mb-10'>
        <h1 className='text-xl font-bold'>Account & User Management</h1>
        <p className='text-muted-foreground'>Manage your account settings and user preferences.</p>
      </div>
      <UserSettingsTabs membersData={membersData} sessionsData={sessionsData} integrationsData={integrationsData} />
    </div>
  )
}

export default UserSettings
