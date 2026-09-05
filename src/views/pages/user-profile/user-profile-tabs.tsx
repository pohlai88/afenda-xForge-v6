'use client'

// React Imports
import { useEffect } from 'react'

// Third-party Imports
import { parseAsString, useQueryState } from 'nuqs'

// Component Imports
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import ConnectionsCard from '@/views/pages/user-profile/connections'
import Profile from '@/views/pages/user-profile/profile'
import TeamsCard from '@/views/pages/user-profile/teams'
import ProjectsCard from './projects'

const UserProfileTabs = () => {
  const [activeView, setActiveView] = useQueryState(
    'view',
    parseAsString.withDefault('profile').withOptions({
      history: 'push',
      shallow: true,
      clearOnDefault: false
    })
  )

  useEffect(() => {
    setActiveView(activeView)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tabs = [
    {
      name: 'Profile',
      value: 'profile',
      content: <Profile />
    },
    {
      name: 'Teams',
      value: 'teams',
      content: <TeamsCard />
    },
    {
      name: 'Projects',
      value: 'projects',
      content: <ProjectsCard />
    },
    {
      name: 'Connections',
      value: 'connections',
      content: <ConnectionsCard />
    }
  ]

  return (
    <div className='w-full'>
      <Tabs
        className='gap-4'
        value={activeView}
        onValueChange={value => {
          setActiveView(value)
        }}
      >
        <TabsList className='max-sm:w-full'>
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default UserProfileTabs
