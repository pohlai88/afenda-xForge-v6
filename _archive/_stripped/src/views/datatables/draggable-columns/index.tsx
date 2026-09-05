// Component Imports
import { Card } from '@/components/ui/card'
import DraggableColumnsDatatable, { type Item } from './datatable-draggable-columns'

const vendorContracts: Item[] = [
  {
    id: 'CTR-4821',
    avatar: '/images/avatars/avatar-4.webp',
    fallback: 'AC',
    vendor: 'Atlas Cloud',
    contact: 'contracts@atlascloud.io',
    category: 'infrastructure',
    renewsOn: 'Apr 12, 2026',
    annualCost: 42800,
    status: 'active'
  },
  {
    id: 'CTR-4817',
    avatar: '/images/avatars/avatar-6.webp',
    fallback: 'NF',
    vendor: 'Northfield Analytics',
    contact: 'billing@northfield.io',
    category: 'software',
    renewsOn: 'Mar 28, 2026',
    annualCost: 18600,
    status: 'review due'
  },
  {
    id: 'CTR-4813',
    avatar: '/images/avatars/avatar-8.webp',
    fallback: 'LS',
    vendor: 'Lumen Security',
    contact: 'renewals@lumnsec.com',
    category: 'security',
    renewsOn: 'Jan 15, 2026',
    annualCost: 31200,
    status: 'expired'
  },
  {
    id: 'CTR-4809',
    avatar: '/images/avatars/avatar-10.webp',
    fallback: 'PB',
    vendor: 'Papertrail HR',
    contact: 'accounts@papertrail.co',
    category: 'hr platform',
    renewsOn: 'Jun 01, 2026',
    annualCost: 9400,
    status: 'negotiating'
  },
  {
    id: 'CTR-4805',
    avatar: '/images/avatars/avatar-12.webp',
    fallback: 'VG',
    vendor: 'Verdant Grid',
    contact: 'ops@verdantgrid.com',
    category: 'infrastructure',
    renewsOn: 'May 19, 2026',
    annualCost: 55700,
    status: 'active'
  },
  {
    id: 'CTR-4801',
    avatar: '/images/avatars/avatar-14.webp',
    fallback: 'SK',
    vendor: 'SignalKit',
    contact: 'legal@signalkit.dev',
    category: 'communications',
    renewsOn: 'Feb 08, 2026',
    annualCost: 7200,
    status: 'review due'
  },
  {
    id: 'CTR-4797',
    avatar: '/images/avatars/avatar-16.webp',
    fallback: 'RM',
    vendor: 'Riverstone Media',
    contact: 'partnerships@riverstone.co',
    category: 'marketing',
    renewsOn: 'Jul 22, 2026',
    annualCost: 15800,
    status: 'active'
  },
  {
    id: 'CTR-4793',
    avatar: '/images/avatars/avatar-18.webp',
    fallback: 'HF',
    vendor: 'Helix Forge',
    contact: 'procurement@helixforge.net',
    category: 'software',
    renewsOn: 'Dec 03, 2025',
    annualCost: 22400,
    status: 'expired'
  },
  {
    id: 'CTR-4789',
    avatar: '/images/avatars/avatar-20.webp',
    fallback: 'OC',
    vendor: 'OpenCircuit',
    contact: 'finance@opencircuit.ai',
    category: 'security',
    renewsOn: 'Aug 30, 2026',
    annualCost: 38900,
    status: 'negotiating'
  },
  {
    id: 'CTR-4785',
    avatar: '/images/avatars/avatar-2.webp',
    fallback: 'BL',
    vendor: 'Brightlane Logistics',
    contact: 'vendor@brightlane.io',
    category: 'operations',
    renewsOn: 'Apr 04, 2026',
    annualCost: 11300,
    status: 'active'
  },
  {
    id: 'CTR-4781',
    avatar: '/images/avatars/avatar-5.webp',
    fallback: 'DP',
    vendor: 'DataPulse EU',
    contact: 'contracts@datapulse.ch',
    category: 'software',
    renewsOn: 'Mar 11, 2026',
    annualCost: 26700,
    status: 'review due'
  },
  {
    id: 'CTR-4777',
    avatar: '/images/avatars/avatar-7.webp',
    fallback: 'MW',
    vendor: 'MarketGrid',
    contact: 'renewals@marketgrid.com',
    category: 'marketing',
    renewsOn: 'Sep 17, 2026',
    annualCost: 19200,
    status: 'active'
  },
  {
    id: 'CTR-4773',
    avatar: '/images/avatars/avatar-9.webp',
    fallback: 'TC',
    vendor: 'Terra Compliance',
    contact: 'support@terracompliance.co',
    category: 'legal',
    renewsOn: 'Nov 25, 2025',
    annualCost: 8600,
    status: 'expired'
  },
  {
    id: 'CTR-4769',
    avatar: '/images/avatars/avatar-11.webp',
    fallback: 'FP',
    vendor: 'ForgePay',
    contact: 'billing@forgepay.app',
    category: 'finance',
    renewsOn: 'Oct 06, 2026',
    annualCost: 14500,
    status: 'negotiating'
  },
  {
    id: 'CTR-4765',
    avatar: '/images/avatars/avatar-13.webp',
    fallback: 'CN',
    vendor: 'CloudNine Support',
    contact: 'vendors@cloudnine.ai',
    category: 'support',
    renewsOn: 'Jun 29, 2026',
    annualCost: 6800,
    status: 'active'
  }
]

const DataTableDraggableColumns = () => (
  <Card className='py-0'>
    <DraggableColumnsDatatable data={vendorContracts} />
  </Card>
)

export default DataTableDraggableColumns
