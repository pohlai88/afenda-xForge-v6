// Component Imports
import { Card } from '@/components/ui/card'
import ResizableColumnsDatatable, { type Item } from './datatable-resizable-columns'

const supportTickets: Item[] = [
  {
    id: 'TK-4821',
    avatar: '/images/avatars/avatar-8.webp',
    fallback: 'MW',
    requester: 'Morgan Walsh',
    email: 'morgan.walsh@helixcorp.com',
    subject: 'SSO login redirect loop on staging',
    department: 'engineering',
    priority: 'urgent',
    status: 'in progress'
  },
  {
    id: 'TK-4819',
    avatar: '/images/avatars/avatar-12.webp',
    fallback: 'AR',
    requester: 'Aiden Reyes',
    email: 'aiden.reyes@northwind.io',
    subject: 'Invoice PDF missing tax breakdown',
    department: 'billing',
    priority: 'high',
    status: 'open'
  },
  {
    id: 'TK-4815',
    avatar: '/images/avatars/avatar-14.webp',
    fallback: 'SK',
    requester: 'Sofia Kaur',
    email: 'sofia.kaur@brightlane.co',
    subject: 'Request role change for finance workspace',
    department: 'operations',
    priority: 'medium',
    status: 'resolved'
  },
  {
    id: 'TK-4812',
    avatar: '/images/avatars/avatar-16.webp',
    fallback: 'JT',
    requester: 'Jonah Tate',
    email: 'jonah.tate@pixelops.dev',
    subject: 'Webhook retries failing after deploy',
    department: 'engineering',
    priority: 'high',
    status: 'in progress'
  },
  {
    id: 'TK-4808',
    avatar: '/images/avatars/avatar-18.webp',
    fallback: 'LC',
    requester: 'Lena Cho',
    email: 'lena.cho@marketgrid.com',
    subject: 'Export CSV truncates long product names',
    department: 'product',
    priority: 'low',
    status: 'closed'
  },
  {
    id: 'TK-4804',
    avatar: '/images/avatars/avatar-20.webp',
    fallback: 'BP',
    requester: 'Benicio Pena',
    email: 'benicio.pena@stackflow.app',
    subject: 'Two-factor reset for locked account',
    department: 'support',
    priority: 'medium',
    status: 'resolved'
  },
  {
    id: 'TK-4801',
    avatar: '/images/avatars/avatar-4.webp',
    fallback: 'NH',
    requester: 'Nora Huang',
    email: 'nora.huang@cloudnine.ai',
    subject: 'Dashboard widgets not loading in Safari',
    department: 'engineering',
    priority: 'high',
    status: 'open'
  },
  {
    id: 'TK-4797',
    avatar: '/images/avatars/avatar-6.webp',
    fallback: 'DM',
    requester: 'Declan Moore',
    email: 'declan.moore@riverstone.co',
    subject: 'Annual plan upgrade proration question',
    department: 'billing',
    priority: 'low',
    status: 'closed'
  },
  {
    id: 'TK-4793',
    avatar: '/images/avatars/avatar-10.webp',
    fallback: 'IV',
    requester: 'Isla Voss',
    email: 'isla.voss@luminary.studio',
    subject: 'Bulk user import validation errors',
    department: 'operations',
    priority: 'medium',
    status: 'in progress'
  },
  {
    id: 'TK-4789',
    avatar: '/images/avatars/avatar-2.webp',
    fallback: 'CR',
    requester: 'Cameron Ross',
    email: 'cameron.ross@atlasware.net',
    subject: 'API rate limit increase for production key',
    department: 'engineering',
    priority: 'urgent',
    status: 'open'
  },
  {
    id: 'TK-4785',
    avatar: '/images/avatars/avatar-15.webp',
    fallback: 'EP',
    requester: 'Elise Porter',
    email: 'elise.porter@openfield.io',
    subject: 'Missing receipt for March workspace charge',
    department: 'billing',
    priority: 'medium',
    status: 'resolved'
  },
  {
    id: 'TK-4781',
    avatar: '/images/avatars/avatar-17.webp',
    fallback: 'TK',
    requester: 'Tomas Klein',
    email: 'tomas.klein@forgebase.de',
    subject: 'Dark mode contrast issue on settings page',
    department: 'product',
    priority: 'low',
    status: 'in progress'
  },
  {
    id: 'TK-4778',
    avatar: '/images/avatars/avatar-19.webp',
    fallback: 'RM',
    requester: 'Ruby Mendez',
    email: 'ruby.mendez@summitlogistics.com',
    subject: 'Unable to revoke expired team invite links',
    department: 'support',
    priority: 'high',
    status: 'open'
  },
  {
    id: 'TK-4774',
    avatar: '/images/avatars/avatar-11.webp',
    fallback: 'HF',
    requester: 'Hugo Fischer',
    email: 'hugo.fischer@datapulse.ch',
    subject: 'Scheduled report emailed empty attachment',
    department: 'operations',
    priority: 'urgent',
    status: 'in progress'
  },
  {
    id: 'TK-4770',
    avatar: '/images/avatars/avatar-13.webp',
    fallback: 'AW',
    requester: 'Amelia Wright',
    email: 'amelia.wright@verdant.co',
    subject: 'Clarification on data retention policy',
    department: 'legal',
    priority: 'low',
    status: 'closed'
  }
]

const DataTableResizableColumns = () => (
  <Card className='w-fit max-w-240 py-0 max-xl:max-w-full'>
    <ResizableColumnsDatatable data={supportTickets} />
  </Card>
)

export default DataTableResizableColumns
