// Component Import
import { Separator } from '@/components/ui/separator'

import type { Session } from '@/types/pages/user-settings-types'

import Sessions from '@/views/pages/user-settings/security/all-sessions'
import ApiKey from '@/views/pages/user-settings/security/api-key'
import TwoFactor from '@/views/pages/user-settings/security/two-factor'

type SecurityProps = {
  sessionsData: Session[]
}

function Security({ sessionsData }: SecurityProps) {
  return (
    <section className='py-3'>
      <TwoFactor />
      <Separator className='my-10' />
      <ApiKey />
      <Separator className='my-10' />
      <Sessions initialSessions={sessionsData} />
    </section>
  )
}

export default Security
