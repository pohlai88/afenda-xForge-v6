// Component Imports
import { Card } from '@/components/ui/card'
import ExpandableRowsDatatable, { type Item } from './datatable-expandable-rows'

const productLaunches: Item[] = [
  {
    id: 'LNH-2401',
    name: 'NovaPay Wallet',
    avatar: '/images/avatars/avatar-3.webp',
    fallback: 'KL',
    lead: 'Keira Lawson',
    email: 'keira.lawson@northpeak.co',
    market: 'north america',
    launchDate: 'Apr 18, 2026',
    status: 'on track',
    tasks: [
      {
        id: 'TSK-901',
        avatar: '/images/avatars/avatar-4.webp',
        fallback: 'AR',
        assignee: 'Aiden Reyes',
        task: 'Finalize compliance review',
        dueDate: 'Mar 28, 2026',
        status: 'in progress'
      },
      {
        id: 'TSK-902',
        avatar: '/images/avatars/avatar-6.webp',
        fallback: 'SK',
        assignee: 'Sofia Kaur',
        task: 'Publish onboarding docs',
        dueDate: 'Apr 02, 2026',
        status: 'pending'
      },
      {
        id: 'TSK-903',
        avatar: '/images/avatars/avatar-8.webp',
        fallback: 'JT',
        assignee: 'Jonah Tate',
        task: 'Load test payment gateway',
        dueDate: 'Apr 10, 2026',
        status: 'complete'
      }
    ]
  },
  {
    id: 'LNH-2397',
    name: 'Helix Analytics Suite',
    avatar: '/images/avatars/avatar-7.webp',
    fallback: 'MR',
    lead: 'Marco Reyes',
    email: 'marco.reyes@brightfield.io',
    market: 'europe',
    launchDate: 'May 06, 2026',
    status: 'at risk',
    tasks: [
      {
        id: 'TSK-894',
        avatar: '/images/avatars/avatar-10.webp',
        fallback: 'LC',
        assignee: 'Lena Cho',
        task: 'Resolve chart rendering bug',
        dueDate: 'Mar 22, 2026',
        status: 'blocked'
      },
      {
        id: 'TSK-895',
        avatar: '/images/avatars/avatar-12.webp',
        fallback: 'BP',
        assignee: 'Benicio Pena',
        task: 'Localize dashboard strings',
        dueDate: 'Apr 14, 2026',
        status: 'in progress'
      },
      {
        id: 'TSK-896',
        avatar: '/images/avatars/avatar-14.webp',
        fallback: 'NH',
        assignee: 'Nora Huang',
        task: 'Sign EU data processor agreement',
        dueDate: 'Apr 01, 2026',
        status: 'pending'
      }
    ]
  },
  {
    id: 'LNH-2393',
    name: 'Summit CRM Mobile',
    avatar: '/images/avatars/avatar-9.webp',
    fallback: 'AN',
    lead: 'Aisha Ndiaye',
    email: 'aisha.ndiaye@lumora.health',
    market: 'global',
    launchDate: 'Mar 30, 2026',
    status: 'launched',
    tasks: [
      {
        id: 'TSK-887',
        avatar: '/images/avatars/avatar-16.webp',
        fallback: 'DM',
        assignee: 'Declan Moore',
        task: 'Submit app store listing',
        dueDate: 'Mar 12, 2026',
        status: 'complete'
      },
      {
        id: 'TSK-888',
        avatar: '/images/avatars/avatar-18.webp',
        fallback: 'IV',
        assignee: 'Isla Voss',
        task: 'Enable push notification service',
        dueDate: 'Mar 18, 2026',
        status: 'complete'
      },
      {
        id: 'TSK-889',
        avatar: '/images/avatars/avatar-20.webp',
        fallback: 'CR',
        assignee: 'Cameron Ross',
        task: 'Monitor crash-free sessions',
        dueDate: 'Mar 30, 2026',
        status: 'in progress'
      }
    ]
  },
  {
    id: 'LNH-2389',
    name: 'Verdant Inventory Hub',
    avatar: '/images/avatars/avatar-11.webp',
    fallback: 'TC',
    lead: 'Theo Chen',
    email: 'theo.chen@stacklane.dev',
    market: 'apac',
    launchDate: 'Jun 12, 2026',
    status: 'on track',
    tasks: [
      {
        id: 'TSK-880',
        avatar: '/images/avatars/avatar-2.webp',
        fallback: 'EP',
        assignee: 'Elise Porter',
        task: 'Configure warehouse sync jobs',
        dueDate: 'May 04, 2026',
        status: 'pending'
      },
      {
        id: 'TSK-881',
        avatar: '/images/avatars/avatar-5.webp',
        fallback: 'TK',
        assignee: 'Tomas Klein',
        task: 'Validate barcode scanner flow',
        dueDate: 'May 20, 2026',
        status: 'in progress'
      },
      {
        id: 'TSK-882',
        avatar: '/images/avatars/avatar-13.webp',
        fallback: 'RM',
        assignee: 'Ruby Mendez',
        task: 'Train regional ops leads',
        dueDate: 'Jun 01, 2026',
        status: 'pending'
      }
    ]
  },
  {
    id: 'LNH-2385',
    name: 'Atlas Identity Portal',
    avatar: '/images/avatars/avatar-15.webp',
    fallback: 'EV',
    lead: 'Elena Vargas',
    email: 'elena.vargas@verdant.co',
    market: 'north america',
    launchDate: 'Apr 25, 2026',
    status: 'delayed',
    tasks: [
      {
        id: 'TSK-873',
        avatar: '/images/avatars/avatar-17.webp',
        fallback: 'HF',
        assignee: 'Hugo Fischer',
        task: 'Fix SAML metadata export',
        dueDate: 'Mar 15, 2026',
        status: 'blocked'
      },
      {
        id: 'TSK-874',
        avatar: '/images/avatars/avatar-19.webp',
        fallback: 'AW',
        assignee: 'Amelia Wright',
        task: 'Complete penetration test fixes',
        dueDate: 'Apr 08, 2026',
        status: 'in progress'
      },
      {
        id: 'TSK-875',
        avatar: '/images/avatars/avatar-1.webp',
        fallback: 'DW',
        assignee: 'Declan Wu',
        task: 'Update SSO rollout playbook',
        dueDate: 'Apr 20, 2026',
        status: 'pending'
      }
    ]
  },
  {
    id: 'LNH-2381',
    name: 'ForgeBase DevTools',
    avatar: '/images/avatars/avatar-4.webp',
    fallback: 'NF',
    lead: 'Nadia Fischer',
    email: 'nadia.fischer@forgebase.de',
    market: 'global',
    launchDate: 'May 22, 2026',
    status: 'on track',
    tasks: [
      {
        id: 'TSK-866',
        avatar: '/images/avatars/avatar-6.webp',
        fallback: 'CB',
        assignee: 'Caleb Brooks',
        task: 'Ship CLI plugin marketplace',
        dueDate: 'May 01, 2026',
        status: 'in progress'
      },
      {
        id: 'TSK-867',
        avatar: '/images/avatars/avatar-8.webp',
        fallback: 'IG',
        assignee: 'Ingrid Gustafsson',
        task: 'Record launch demo videos',
        dueDate: 'May 12, 2026',
        status: 'pending'
      },
      {
        id: 'TSK-868',
        avatar: '/images/avatars/avatar-10.webp',
        fallback: 'OT',
        assignee: 'Omar Tate',
        task: 'Publish API migration guide',
        dueDate: 'May 18, 2026',
        status: 'complete'
      }
    ]
  },
  {
    id: 'LNH-2377',
    name: 'Riverstone Billing v3',
    avatar: '/images/avatars/avatar-12.webp',
    fallback: 'RH',
    lead: 'Rhys Holloway',
    email: 'rhys.holloway@riverstone.co',
    market: 'europe',
    launchDate: 'Jul 03, 2026',
    status: 'at risk',
    tasks: [
      {
        id: 'TSK-859',
        avatar: '/images/avatars/avatar-14.webp',
        fallback: 'LM',
        assignee: 'Lila Moreno',
        task: 'Reconcile tax engine outputs',
        dueDate: 'Jun 05, 2026',
        status: 'blocked'
      },
      {
        id: 'TSK-860',
        avatar: '/images/avatars/avatar-16.webp',
        fallback: 'YW',
        assignee: 'Yuki Watanabe',
        task: 'Migrate legacy invoice templates',
        dueDate: 'Jun 18, 2026',
        status: 'in progress'
      },
      {
        id: 'TSK-861',
        avatar: '/images/avatars/avatar-18.webp',
        fallback: 'MW',
        assignee: 'Morgan Walsh',
        task: 'Run finance UAT sessions',
        dueDate: 'Jun 26, 2026',
        status: 'pending'
      }
    ]
  },
  {
    id: 'LNH-2373',
    name: 'CloudNine Support AI',
    avatar: '/images/avatars/avatar-2.webp',
    fallback: 'JO',
    lead: 'Jonah Okafor',
    email: 'jonah.okafor@atlasware.net',
    market: 'north america',
    launchDate: 'Apr 09, 2026',
    status: 'launched',
    tasks: [
      {
        id: 'TSK-852',
        avatar: '/images/avatars/avatar-5.webp',
        fallback: 'SP',
        assignee: 'Sienna Patel',
        task: 'Enable agent copilot beta',
        dueDate: 'Mar 20, 2026',
        status: 'complete'
      },
      {
        id: 'TSK-853',
        avatar: '/images/avatars/avatar-7.webp',
        fallback: 'BL',
        assignee: 'Caleb Brooks',
        task: 'Tune response safety filters',
        dueDate: 'Mar 26, 2026',
        status: 'complete'
      },
      {
        id: 'TSK-854',
        avatar: '/images/avatars/avatar-9.webp',
        fallback: 'DP',
        assignee: 'Declan Moore',
        task: 'Track deflection rate KPIs',
        dueDate: 'Apr 09, 2026',
        status: 'in progress'
      }
    ]
  },
  {
    id: 'LNH-2369',
    name: 'MarketGrid Campaign Studio',
    avatar: '/images/avatars/avatar-13.webp',
    fallback: 'SP',
    lead: 'Sienna Patel',
    email: 'sienna.patel@openfield.io',
    market: 'global',
    launchDate: 'May 15, 2026',
    status: 'on track',
    tasks: [
      {
        id: 'TSK-845',
        avatar: '/images/avatars/avatar-15.webp',
        fallback: 'VG',
        assignee: 'Marco Reyes',
        task: 'Integrate Meta ads connector',
        dueDate: 'Apr 22, 2026',
        status: 'in progress'
      },
      {
        id: 'TSK-846',
        avatar: '/images/avatars/avatar-17.webp',
        fallback: 'TC',
        assignee: 'Theo Chen',
        task: 'Build creative approval workflow',
        dueDate: 'May 01, 2026',
        status: 'pending'
      },
      {
        id: 'TSK-847',
        avatar: '/images/avatars/avatar-19.webp',
        fallback: 'AN',
        assignee: 'Aisha Ndiaye',
        task: 'Finalize pricing page assets',
        dueDate: 'May 08, 2026',
        status: 'pending'
      }
    ]
  },
  {
    id: 'LNH-2365',
    name: 'PixelOps Design System',
    avatar: '/images/avatars/avatar-20.webp',
    fallback: 'IG',
    lead: 'Ingrid Gustafsson',
    email: 'ingrid.gustafsson@datapulse.ch',
    market: 'global',
    launchDate: 'Jun 28, 2026',
    status: 'on track',
    tasks: [
      {
        id: 'TSK-838',
        avatar: '/images/avatars/avatar-3.webp',
        fallback: 'KL',
        assignee: 'Keira Lawson',
        task: 'Ship token migration script',
        dueDate: 'Jun 02, 2026',
        status: 'pending'
      },
      {
        id: 'TSK-839',
        avatar: '/images/avatars/avatar-11.webp',
        fallback: 'EV',
        assignee: 'Elena Vargas',
        task: 'Publish Figma component library',
        dueDate: 'Jun 12, 2026',
        status: 'in progress'
      },
      {
        id: 'TSK-840',
        avatar: '/images/avatars/avatar-1.webp',
        fallback: 'HF',
        assignee: 'Hugo Fischer',
        task: 'Audit accessibility contrast ratios',
        dueDate: 'Jun 20, 2026',
        status: 'pending'
      }
    ]
  },
  {
    id: 'LNH-2361',
    name: 'OpenField HR Core',
    avatar: '/images/avatars/avatar-6.webp',
    fallback: 'OT',
    lead: 'Omar Tate',
    email: 'omar.tate@marketgrid.com',
    market: 'latam',
    launchDate: 'Aug 04, 2026',
    status: 'delayed',
    tasks: [
      {
        id: 'TSK-831',
        avatar: '/images/avatars/avatar-8.webp',
        fallback: 'RM',
        assignee: 'Ruby Mendez',
        task: 'Localize payroll rules engine',
        dueDate: 'Jul 01, 2026',
        status: 'blocked'
      },
      {
        id: 'TSK-832',
        avatar: '/images/avatars/avatar-10.webp',
        fallback: 'AW',
        assignee: 'Amelia Wright',
        task: 'Validate benefits enrollment flow',
        dueDate: 'Jul 14, 2026',
        status: 'in progress'
      },
      {
        id: 'TSK-833',
        avatar: '/images/avatars/avatar-12.webp',
        fallback: 'CR',
        assignee: 'Cameron Ross',
        task: 'Prepare HR admin training kit',
        dueDate: 'Jul 25, 2026',
        status: 'pending'
      }
    ]
  },
  {
    id: 'LNH-2357',
    name: 'DataPulse Observability',
    avatar: '/images/avatars/avatar-16.webp',
    fallback: 'YW',
    lead: 'Yuki Watanabe',
    email: 'yuki.watanabe@helixcorp.com',
    market: 'apac',
    launchDate: 'May 29, 2026',
    status: 'at risk',
    tasks: [
      {
        id: 'TSK-824',
        avatar: '/images/avatars/avatar-18.webp',
        fallback: 'BP',
        assignee: 'Benicio Pena',
        task: 'Fix alert routing latency',
        dueDate: 'May 05, 2026',
        status: 'blocked'
      },
      {
        id: 'TSK-825',
        avatar: '/images/avatars/avatar-4.webp',
        fallback: 'NH',
        assignee: 'Nora Huang',
        task: 'Deploy Tokyo telemetry cluster',
        dueDate: 'May 16, 2026',
        status: 'in progress'
      },
      {
        id: 'TSK-826',
        avatar: '/images/avatars/avatar-14.webp',
        fallback: 'LC',
        assignee: 'Lena Cho',
        task: 'Draft SRE runbook updates',
        dueDate: 'May 22, 2026',
        status: 'pending'
      }
    ]
  },
  {
    id: 'LNH-2353',
    name: 'Brightlane Partner API',
    avatar: '/images/avatars/avatar-5.webp',
    fallback: 'BL',
    lead: 'Caleb Brooks',
    email: 'caleb.brooks@summitlogistics.com',
    market: 'north america',
    launchDate: 'Jul 17, 2026',
    status: 'on track',
    tasks: [
      {
        id: 'TSK-817',
        avatar: '/images/avatars/avatar-7.webp',
        fallback: 'IV',
        assignee: 'Isla Voss',
        task: 'Publish OpenAPI spec v2',
        dueDate: 'Jun 24, 2026',
        status: 'in progress'
      },
      {
        id: 'TSK-818',
        avatar: '/images/avatars/avatar-9.webp',
        fallback: 'TK',
        assignee: 'Tomas Klein',
        task: 'Onboard pilot integration partners',
        dueDate: 'Jul 02, 2026',
        status: 'pending'
      },
      {
        id: 'TSK-819',
        avatar: '/images/avatars/avatar-11.webp',
        fallback: 'EP',
        assignee: 'Elise Porter',
        task: 'Set up sandbox rate limits',
        dueDate: 'Jul 10, 2026',
        status: 'complete'
      }
    ]
  },
  {
    id: 'LNH-2349',
    name: 'Lumora Patient Portal',
    avatar: '/images/avatars/avatar-17.webp',
    fallback: 'LM',
    lead: 'Lila Moreno',
    email: 'lila.moreno@pixelops.dev',
    market: 'north america',
    launchDate: 'Jun 06, 2026',
    status: 'on track',
    tasks: [
      {
        id: 'TSK-810',
        avatar: '/images/avatars/avatar-19.webp',
        fallback: 'DM',
        assignee: 'Declan Moore',
        task: 'Complete HIPAA audit checklist',
        dueDate: 'May 18, 2026',
        status: 'in progress'
      },
      {
        id: 'TSK-811',
        avatar: '/images/avatars/avatar-1.webp',
        fallback: 'MW',
        assignee: 'Morgan Walsh',
        task: 'Enable appointment reminders',
        dueDate: 'May 27, 2026',
        status: 'pending'
      },
      {
        id: 'TSK-812',
        avatar: '/images/avatars/avatar-13.webp',
        fallback: 'AR',
        assignee: 'Aiden Reyes',
        task: 'Validate insurance card upload',
        dueDate: 'Jun 01, 2026',
        status: 'pending'
      }
    ]
  },
  {
    id: 'LNH-2345',
    name: 'Stacklane Workflow Engine',
    avatar: '/images/avatars/avatar-8.webp',
    fallback: 'DW',
    lead: 'Declan Wu',
    email: 'declan.wu@cloudnine.ai',
    market: 'global',
    launchDate: 'Aug 21, 2026',
    status: 'on track',
    tasks: [
      {
        id: 'TSK-803',
        avatar: '/images/avatars/avatar-10.webp',
        fallback: 'SK',
        assignee: 'Sofia Kaur',
        task: 'Ship visual workflow builder',
        dueDate: 'Jul 28, 2026',
        status: 'pending'
      },
      {
        id: 'TSK-804',
        avatar: '/images/avatars/avatar-12.webp',
        fallback: 'JT',
        assignee: 'Jonah Tate',
        task: 'Add retry policy templates',
        dueDate: 'Aug 05, 2026',
        status: 'pending'
      },
      {
        id: 'TSK-805',
        avatar: '/images/avatars/avatar-15.webp',
        fallback: 'NF',
        assignee: 'Nadia Fischer',
        task: 'Benchmark orchestration throughput',
        dueDate: 'Aug 12, 2026',
        status: 'in progress'
      }
    ]
  }
]

const DataTableExpandableRows = () => (
  <Card className='py-0'>
    <ExpandableRowsDatatable data={productLaunches} />
  </Card>
)

export default DataTableExpandableRows
