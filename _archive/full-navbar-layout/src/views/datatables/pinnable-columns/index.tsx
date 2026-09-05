// Component Imports
import { Card } from '@/components/ui/card'
import PinnableColumnsDatatable, { type Item } from './datatable-pinnable-columns'

const employees: Item[] = [
  {
    id: '1',
    avatar: '/images/avatars/avatar-3.webp',
    fallback: 'KL',
    name: 'Keira Lawson',
    email: 'keira.lawson@company.com',
    department: 'engineering',
    role: 'Tech Lead',
    status: 'active'
  },
  {
    id: '2',
    avatar: '/images/avatars/avatar-7.webp',
    fallback: 'MR',
    name: 'Marco Reyes',
    email: 'marco.reyes@company.com',
    department: 'design',
    role: 'UI Designer',
    status: 'active'
  },
  {
    id: '3',
    avatar: '/images/avatars/avatar-9.webp',
    fallback: 'AN',
    name: 'Aisha Ndiaye',
    email: 'aisha.ndiaye@company.com',
    department: 'marketing',
    role: 'SEO Specialist',
    status: 'on leave'
  },
  {
    id: '4',
    avatar: '/images/avatars/avatar-11.webp',
    fallback: 'TC',
    name: 'Theo Chen',
    email: 'theo.chen@company.com',
    department: 'engineering',
    role: 'Developer',
    status: 'active'
  },
  {
    id: '5',
    avatar: '/images/avatars/avatar-13.webp',
    fallback: 'EV',
    name: 'Elena Vargas',
    email: 'elena.vargas@company.com',
    department: 'sales',
    role: 'Account Executive',
    status: 'active'
  },
  {
    id: '6',
    avatar: '/images/avatars/avatar-15.webp',
    fallback: 'JO',
    name: 'Jonah Okafor',
    email: 'jonah.okafor@company.com',
    department: 'hr',
    role: 'HR Manager',
    status: 'active'
  },
  {
    id: '7',
    avatar: '/images/avatars/avatar-17.webp',
    fallback: 'SP',
    name: 'Sienna Patel',
    email: 'sienna.patel@company.com',
    department: 'design',
    role: 'UX Designer',
    status: 'inactive'
  },
  {
    id: '8',
    avatar: '/images/avatars/avatar-19.webp',
    fallback: 'RH',
    name: 'Rhys Holloway',
    email: 'rhys.holloway@company.com',
    department: 'engineering',
    role: 'DevOps',
    status: 'active'
  },
  {
    id: '9',
    avatar: '/images/avatars/avatar-1.webp',
    fallback: 'LM',
    name: 'Lila Moreno',
    email: 'lila.moreno@company.com',
    department: 'marketing',
    role: 'Content Writer',
    status: 'active'
  },
  {
    id: '10',
    avatar: '/images/avatars/avatar-5.webp',
    fallback: 'DW',
    name: 'Declan Wu',
    email: 'declan.wu@company.com',
    department: 'sales',
    role: 'Sales Rep',
    status: 'on leave'
  },
  {
    id: '11',
    avatar: '/images/avatars/avatar-8.webp',
    fallback: 'NF',
    name: 'Nadia Fischer',
    email: 'nadia.fischer@company.com',
    department: 'engineering',
    role: 'Developer',
    status: 'active'
  },
  {
    id: '12',
    avatar: '/images/avatars/avatar-10.webp',
    fallback: 'CB',
    name: 'Caleb Brooks',
    email: 'caleb.brooks@company.com',
    department: 'design',
    role: 'Brand Designer',
    status: 'active'
  },
  {
    id: '13',
    avatar: '/images/avatars/avatar-12.webp',
    fallback: 'IG',
    name: 'Ingrid Gustafsson',
    email: 'ingrid.gustafsson@company.com',
    department: 'hr',
    role: 'Recruiter',
    status: 'inactive'
  },
  {
    id: '14',
    avatar: '/images/avatars/avatar-14.webp',
    fallback: 'OT',
    name: 'Omar Tate',
    email: 'omar.tate@company.com',
    department: 'marketing',
    role: 'Campaign Manager',
    status: 'active'
  },
  {
    id: '15',
    avatar: '/images/avatars/avatar-16.webp',
    fallback: 'YW',
    name: 'Yuki Watanabe',
    email: 'yuki.watanabe@company.com',
    department: 'engineering',
    role: 'Tech Lead',
    status: 'active'
  }
]

const DataTablePinnableColumns = () => (
  <Card className='py-0'>
    <PinnableColumnsDatatable data={employees} />
  </Card>
)

export default DataTablePinnableColumns
