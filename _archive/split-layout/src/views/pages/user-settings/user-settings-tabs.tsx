'use client'

// React Imports
import { useEffect } from 'react'

// Third-party Imports
import { parseAsString, useQueryState } from 'nuqs'

// Type Imports
import type { IntegrationsData, MembersData, Session } from '@/types/pages/user-settings-types'

// Component Imports
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import BillingUsage from '@/views/pages/user-settings/billing'
import UserGeneral from '@/views/pages/user-settings/general'
import Integrations from '@/views/pages/user-settings/integrations'
import Members from '@/views/pages/user-settings/members'
import Notifications from '@/views/pages/user-settings/notifications'
import Security from '@/views/pages/user-settings/security'
import Workspace from '@/views/pages/user-settings/workspace'

type UserSettingsTabsProps = {
  membersData: MembersData
  sessionsData: Session[]
  integrationsData: IntegrationsData
}

const UserSettingsTabs = ({ membersData, sessionsData, integrationsData }: UserSettingsTabsProps) => {
  const [activeSetting, setActiveSetting] = useQueryState(
    'setting',
    parseAsString.withDefault('general').withOptions({
      history: 'push',
      shallow: true,
      clearOnDefault: false
    })
  )

  useEffect(() => {
    setActiveSetting(activeSetting)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tabs = [
    {
      name: 'General',
      value: 'general',
      content: <UserGeneral />
    },
    {
      name: 'Notifications',
      value: 'notifications',
      content: <Notifications />
    },
    {
      name: 'Workspace',
      value: 'workspace',
      content: <Workspace />
    },
    {
      name: 'Integrations',
      value: 'integrations',
      content: <Integrations integrationsData={integrationsData} />
    },
    {
      name: 'Members',
      value: 'members',
      content: <Members membersData={membersData} />
    },
    {
      name: 'Security',
      value: 'security',
      content: <Security sessionsData={sessionsData} />
    },
    {
      name: 'Billing & Usage',
      value: 'billing',
      content: <BillingUsage />
    }
  ]

  return (
    <div className='w-full'>
      <Tabs
        value={activeSetting}
        onValueChange={value => {
          setActiveSetting(value)
        }}
      >
        <div className='overflow-x-auto sm:overflow-visible'>
          <TabsList
            variant='line'
            className='h-fit! w-max min-w-full flex-nowrap justify-start gap-0 rounded-none border-b p-0 sm:w-full sm:flex-wrap'
          >
            {tabs.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className='not-data-active:hover:group-data-horizontal/tabs:after:bg-muted-foreground/30 shrink-0 border-0 group-data-horizontal/tabs:after:bottom-[-0.5px] not-data-active:hover:group-data-horizontal/tabs:after:opacity-100 sm:flex-0'
              >
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default UserSettingsTabs
