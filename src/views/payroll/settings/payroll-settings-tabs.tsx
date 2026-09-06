'use client'

// Third-party Imports
import { parseAsStringLiteral, useQueryState } from 'nuqs'

// Type Imports
import type { PayrollSettings } from '@/types/payroll/settings-types'
import type { FundingAccount } from '@/types/payroll/settlement-types'

// Component Imports
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AccessSettings from './access'
import AccountingSettings from './accounting'
import ApprovalSettingsSection from './approvals'
import BankingSettings from './banking'
import ComponentSettings from './components'
import GeneralSettings from './general'
import NotificationSettings from './notifications'
import PayGroupSettings from './pay-groups'
import ScheduleSettings from './schedules'
import StatutorySettings from './statutory'

const SECTIONS = [
  'general',
  'pay-groups',
  'schedules',
  'components',
  'statutory',
  'banking',
  'accounting',
  'approvals',
  'notifications',
  'access'
] as const

type Props = {
  settings: PayrollSettings
  fundingAccounts: FundingAccount[]
}

/**
 * Same shape as the account settings page: a line of tabs, the section in the URL so a link to
 * "banking settings" lands on banking settings.
 */
const PayrollSettingsTabs = ({ settings, fundingAccounts }: Props) => {
  const [section, setSection] = useQueryState(
    'section',
    parseAsStringLiteral(SECTIONS).withDefault('general').withOptions({ history: 'push', clearOnDefault: false })
  )

  const tabs: { value: (typeof SECTIONS)[number]; name: string; content: React.ReactNode }[] = [
    { value: 'general', name: 'General', content: <GeneralSettings settings={settings.general} /> },
    { value: 'pay-groups', name: 'Pay groups', content: <PayGroupSettings payGroups={settings.payGroups} /> },
    {
      value: 'schedules',
      name: 'Schedules',
      content: <ScheduleSettings schedules={settings.schedules} payGroups={settings.payGroups} />
    },
    { value: 'components', name: 'Components', content: <ComponentSettings components={settings.components} /> },
    { value: 'statutory', name: 'Statutory', content: <StatutorySettings rules={settings.statutory} /> },
    { value: 'banking', name: 'Banking', content: <BankingSettings accounts={fundingAccounts} /> },
    {
      value: 'accounting',
      name: 'Accounting',
      content: <AccountingSettings mappings={settings.accounting} components={settings.components} />
    },
    { value: 'approvals', name: 'Approvals', content: <ApprovalSettingsSection settings={settings.approvals} /> },
    {
      value: 'notifications',
      name: 'Notifications',
      content: <NotificationSettings preferences={settings.notifications} />
    },
    { value: 'access', name: 'Access', content: <AccessSettings roles={settings.access} /> }
  ]

  return (
    <Tabs value={section} onValueChange={value => setSection(value as (typeof SECTIONS)[number])} className='gap-6'>
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
        <TabsContent key={tab.value} value={tab.value} className='flex flex-col gap-6'>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}

export default PayrollSettingsTabs
