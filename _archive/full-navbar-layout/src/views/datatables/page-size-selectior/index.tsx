// Component Imports
import { Card } from '@/components/ui/card'
import InvoiceDatatable, { type Item } from '@/views/datatables/datatable-invoice'

const invoiceData: Item[] = [
  {
    id: '5099',
    status: 'draft',
    avatar: '/images/avatars/avatar-1.webp',
    fallback: 'JA',
    client: 'Jack Alfredo',
    field: 'UI/UX designer',
    total: 3120,
    issuedDate: new Date('2025-04-03'),
    balance: 0
  },
  {
    id: '5008',
    status: 'paid',
    avatar: '/images/avatars/avatar-2.webp',
    fallback: 'MG',
    client: 'Maria Gonzalez',
    field: 'Frontend developer',
    total: 1450,
    issuedDate: new Date('2025-05-12'),
    balance: 0
  },
  {
    id: '5101',
    status: 'paid',
    avatar: '/images/avatars/avatar-3.webp',
    fallback: 'JD',
    client: 'John Doe',
    field: 'Graphic designer',
    total: 1200,
    issuedDate: new Date('2025-06-26'),
    balance: 0
  },
  {
    id: '4586',
    status: 'downloaded',
    avatar: '/images/avatars/avatar-4.webp',
    fallback: 'EC',
    client: 'Emily Carter',
    field: 'UI/UX designer',
    total: 2680,
    issuedDate: new Date('2025-07-05'),
    balance: -78
  },
  {
    id: '4360',
    status: 'draft',
    avatar: '/images/avatars/avatar-5.webp',
    fallback: 'DL',
    client: 'David Lee',
    field: 'Backend developer',
    total: 3120,
    issuedDate: new Date('2025-08-07'),
    balance: 0
  },
  {
    id: '5104',
    status: 'past due',
    avatar: '/images/avatars/avatar-6.webp',
    fallback: 'SP',
    client: 'Sophia Patel',
    field: 'Product manager',
    total: 1600,
    issuedDate: new Date('2025-08-26'),
    balance: 86
  },
  {
    id: '5201',
    status: 'paid',
    avatar: '/images/avatars/avatar-7.webp',
    fallback: 'MW',
    client: 'Michael Williams',
    field: 'Full Stack Developer',
    total: 2850,
    issuedDate: new Date('2025-01-15'),
    balance: 0
  },
  {
    id: '4987',
    status: 'draft',
    avatar: '/images/avatars/avatar-8.webp',
    fallback: 'AB',
    client: 'Amanda Brown',
    field: 'Marketing Specialist',
    total: 1750,
    issuedDate: new Date('2025-02-20'),
    balance: 0
  },
  {
    id: '5342',
    status: 'downloaded',
    avatar: '/images/avatars/avatar-9.webp',
    fallback: 'RJ',
    client: 'Robert Johnson',
    field: 'DevOps Engineer',
    total: 3500,
    issuedDate: new Date('2025-03-10'),
    balance: -120
  },
  {
    id: '4723',
    status: 'past due',
    avatar: '/images/avatars/avatar-10.webp',
    fallback: 'LM',
    client: 'Lisa Miller',
    field: 'Data Analyst',
    total: 2200,
    issuedDate: new Date('2025-04-18'),
    balance: 250
  },
  {
    id: '5445',
    status: 'paid',
    avatar: '/images/avatars/avatar-11.webp',
    fallback: 'TD',
    client: 'Thomas Davis',
    field: 'Mobile Developer',
    total: 4200,
    issuedDate: new Date('2025-05-22'),
    balance: 0
  },
  {
    id: '4892',
    status: 'draft',
    avatar: '/images/avatars/avatar-12.webp',
    fallback: 'JW',
    client: 'Jennifer Wilson',
    field: 'UX Researcher',
    total: 1950,
    issuedDate: new Date('2025-06-14'),
    balance: 0
  },
  {
    id: '5667',
    status: 'downloaded',
    avatar: '/images/avatars/avatar-13.webp',
    fallback: 'CM',
    client: 'Christopher Moore',
    field: 'System Administrator',
    total: 2750,
    issuedDate: new Date('2025-07-08'),
    balance: -95
  },
  {
    id: '4534',
    status: 'past due',
    avatar: '/images/avatars/avatar-14.webp',
    fallback: 'ST',
    client: 'Sarah Taylor',
    field: 'Content Writer',
    total: 1380,
    issuedDate: new Date('2025-01-28'),
    balance: 180
  },
  {
    id: '5789',
    status: 'paid',
    avatar: '/images/avatars/avatar-15.webp',
    fallback: 'MA',
    client: 'Matthew Anderson',
    field: 'Cloud Architect',
    total: 5600,
    issuedDate: new Date('2025-02-12'),
    balance: 0
  },
  {
    id: '4398',
    status: 'draft',
    avatar: '/images/avatars/avatar-16.webp',
    fallback: 'KT',
    client: 'Karen Thompson',
    field: 'Business Analyst',
    total: 2100,
    issuedDate: new Date('2025-03-25'),
    balance: 0
  },
  {
    id: '5923',
    status: 'downloaded',
    avatar: '/images/avatars/avatar-17.webp',
    fallback: 'JG',
    client: 'James Garcia',
    field: 'Security Engineer',
    total: 3800,
    issuedDate: new Date('2025-04-30'),
    balance: -200
  },
  {
    id: '4672',
    status: 'past due',
    avatar: '/images/avatars/avatar-18.webp',
    fallback: 'NH',
    client: 'Nancy Harris',
    field: 'QA Engineer',
    total: 1850,
    issuedDate: new Date('2025-05-16'),
    balance: 320
  },
  {
    id: '5234',
    status: 'paid',
    avatar: '/images/avatars/avatar-19.webp',
    fallback: 'DM',
    client: 'Daniel Martinez',
    field: 'Software Architect',
    total: 4800,
    issuedDate: new Date('2025-06-09'),
    balance: 0
  },
  {
    id: '4756',
    status: 'draft',
    avatar: '/images/avatars/avatar-20.webp',
    fallback: 'ER',
    client: 'Elizabeth Rodriguez',
    field: 'Product Designer',
    total: 2650,
    issuedDate: new Date('2025-07-21'),
    balance: 0
  },
  {
    id: '5456',
    status: 'downloaded',
    avatar: '/images/avatars/avatar-1.webp',
    fallback: 'AL',
    client: 'Andrew Lopez',
    field: 'Technical Lead',
    total: 5200,
    issuedDate: new Date('2025-08-03'),
    balance: -150
  },
  {
    id: '4823',
    status: 'past due',
    avatar: '/images/avatars/avatar-2.webp',
    fallback: 'MH',
    client: 'Michelle Hill',
    field: 'Scrum Master',
    total: 2400,
    issuedDate: new Date('2025-01-11'),
    balance: 400
  },
  {
    id: '5678',
    status: 'paid',
    avatar: '/images/avatars/avatar-3.webp',
    fallback: 'KS',
    client: 'Kevin Scott',
    field: 'Database Administrator',
    total: 3200,
    issuedDate: new Date('2025-02-07'),
    balance: 0
  },
  {
    id: '4945',
    status: 'draft',
    avatar: '/images/avatars/avatar-4.webp',
    fallback: 'RG',
    client: 'Rachel Green',
    field: 'Digital Marketing Manager',
    total: 1820,
    issuedDate: new Date('2025-03-19'),
    balance: 0
  },
  {
    id: '5812',
    status: 'downloaded',
    avatar: '/images/avatars/avatar-5.webp',
    fallback: 'BW',
    client: 'Brian White',
    field: 'AI/ML Engineer',
    total: 6200,
    issuedDate: new Date('2025-04-26'),
    balance: -300
  }
]

const DataTablePageSizeSelector = () => {
  return (
    <Card className='py-0'>
      <InvoiceDatatable data={invoiceData} />
    </Card>
  )
}

export default DataTablePageSizeSelector
