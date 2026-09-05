// Component Imports
import { Separator } from '@/components/ui/separator'

import type { IntegrationsData } from '@/types/pages/user-settings-types'

import Communication from '@/views/pages/user-settings/integrations/integrations-communication'
import Planning from '@/views/pages/user-settings/integrations/integrations-planning'
import Tools from '@/views/pages/user-settings/integrations/integrations-tools'

type IntegrationsProps = {
  integrationsData: IntegrationsData
}

const Integrations = ({ integrationsData }: IntegrationsProps) => {
  return (
    <section className='py-3'>
      <Communication apps={integrationsData.communication} />
      <Separator className='my-10' />
      <Planning apps={integrationsData.planning} />
      <Separator className='my-10' />
      <Tools apps={integrationsData.tools} />
    </section>
  )
}

export default Integrations
