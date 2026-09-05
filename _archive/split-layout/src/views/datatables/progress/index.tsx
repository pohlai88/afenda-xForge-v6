// Third-party Imports
import {
  CodeXmlIcon,
  LayoutPanelTopIcon,
  PenToolIcon,
  BrainCircuitIcon,
  AtomIcon,
  SmartphoneIcon,
  UsersIcon,
  CameraIcon,
  CloudCogIcon,
  LockKeyholeIcon,
  ServerIcon,
  DatabaseIcon,
  FileJsonIcon,
  FileCogIcon,
  NetworkIcon,
  LinkIcon,
  Gamepad2Icon,
  VideoIcon,
  NotebookPenIcon
} from 'lucide-react'

// Component Imports
import { Card } from '@/components/ui/card'
import CourseDatatable, { type Item } from '@/views/datatables/datatable-course'

// SVG Imports
import FacebookIcon from '@/assets/svg/facebook-icon'
import FigmaIcon from '@/assets/svg/figma-icon'

const courseData: Item[] = [
  {
    id: '1',
    course: 'UI/UX design',
    courseIcon: <FigmaIcon />,
    tutor: 'John cartal',
    tutorImage: '/images/avatars/avatar-1.webp',
    tutorFallback: 'JC',
    time: '19h 17m',
    stats: { users: 14, textMaterial: 23, videos: 26 },
    totalModules: 100,
    completedModules: 50
  },
  {
    id: '2',
    course: 'Web development',
    courseIcon: <CodeXmlIcon />,
    tutor: 'Sara Mitchell',
    tutorImage: '/images/avatars/avatar-2.webp',
    tutorFallback: 'SM',
    time: '20h 5m',
    stats: { users: 15, textMaterial: 24, videos: 27 },
    totalModules: 50,
    completedModules: 11
  },
  {
    id: '3',
    course: 'Product management',
    courseIcon: <LayoutPanelTopIcon />,
    tutor: 'Alex Johnson',
    tutorImage: '/images/avatars/avatar-3.webp',
    tutorFallback: 'AJ',
    time: '21h 38m',
    stats: { users: 16, textMaterial: 25, videos: 28 },
    totalModules: 10,
    completedModules: 1
  },
  {
    id: '4',
    course: 'Graphic design',
    courseIcon: <PenToolIcon />,
    tutor: 'Emily Chen',
    tutorImage: '/images/avatars/avatar-4.webp',
    tutorFallback: 'EC',
    time: '22h 12m',
    stats: { users: 17, textMaterial: 26, videos: 29 },
    totalModules: 50,
    completedModules: 26
  },
  {
    id: '5',
    course: 'Data analysis',
    courseIcon: <BrainCircuitIcon />,
    tutor: 'Mark Robinson',
    tutorImage: '/images/avatars/avatar-5.webp',
    tutorFallback: 'MR',
    time: '23h 45m',
    stats: { users: 18, textMaterial: 27, videos: 30 },
    totalModules: 100,
    completedModules: 76
  },
  {
    id: '6',
    course: 'Science of critical thinking',
    courseIcon: <AtomIcon />,
    tutor: 'Sophia Lee',
    tutorImage: '/images/avatars/avatar-6.webp',
    tutorFallback: 'SL',
    time: '24h 30m',
    stats: { users: 19, textMaterial: 28, videos: 31 },
    totalModules: 50,
    completedModules: 16
  },
  {
    id: '7',
    course: 'Frontend Development',
    courseIcon: <CodeXmlIcon />,
    tutor: 'David Kim',
    tutorImage: '/images/avatars/avatar-7.webp',
    tutorFallback: 'DK',
    time: '18h 22m',
    stats: { users: 22, textMaterial: 30, videos: 25 },
    totalModules: 30,
    completedModules: 12
  },
  {
    id: '8',
    course: 'Mobile App Design',
    courseIcon: <SmartphoneIcon />,
    tutor: 'Jessica Wong',
    tutorImage: '/images/avatars/avatar-8.webp',
    tutorFallback: 'JW',
    time: '16h 45m',
    stats: { users: 20, textMaterial: 18, videos: 22 },
    totalModules: 75,
    completedModules: 30
  },
  {
    id: '9',
    course: 'Digital Marketing',
    courseIcon: <UsersIcon />,
    tutor: 'Michael Brown',
    tutorImage: '/images/avatars/avatar-9.webp',
    tutorFallback: 'MB',
    time: '25h 15m',
    stats: { users: 35, textMaterial: 40, videos: 45 },
    totalModules: 100,
    completedModules: 40
  },
  {
    id: '10',
    course: 'Machine Learning',
    courseIcon: <BrainCircuitIcon />,
    tutor: 'Dr. Sarah Williams',
    tutorImage: '/images/avatars/avatar-10.webp',
    tutorFallback: 'SW',
    time: '35h 20m',
    stats: { users: 12, textMaterial: 55, videos: 40 },
    totalModules: 15,
    completedModules: 4
  },
  {
    id: '11',
    course: 'Photography Basics',
    courseIcon: <CameraIcon />,
    tutor: 'Anna Davis',
    tutorImage: '/images/avatars/avatar-11.webp',
    tutorFallback: 'AD',
    time: '12h 30m',
    stats: { users: 28, textMaterial: 15, videos: 35 },
    totalModules: 50,
    completedModules: 28
  },
  {
    id: '12',
    course: 'Backend Development',
    courseIcon: <CodeXmlIcon />,
    tutor: 'Robert Taylor',
    tutorImage: '/images/avatars/avatar-12.webp',
    tutorFallback: 'RT',
    time: '28h 40m',
    stats: { users: 18, textMaterial: 45, videos: 30 },
    totalModules: 75,
    completedModules: 30
  },
  {
    id: '13',
    course: 'Cloud Computing',
    courseIcon: <CloudCogIcon />,
    tutor: 'Lisa Anderson',
    tutorImage: '/images/avatars/avatar-13.webp',
    tutorFallback: 'LA',
    time: '32h 15m',
    stats: { users: 15, textMaterial: 50, videos: 25 },
    totalModules: 20,
    completedModules: 8
  },
  {
    id: '14',
    course: 'Cybersecurity Fundamentals',
    courseIcon: <LockKeyholeIcon />,
    tutor: 'James Wilson',
    tutorImage: '/images/avatars/avatar-14.webp',
    tutorFallback: 'JW',
    time: '40h 0m',
    stats: { users: 10, textMaterial: 60, videos: 20 },
    totalModules: 100,
    completedModules: 35
  },
  {
    id: '15',
    course: 'DevOps Practices',
    courseIcon: <ServerIcon />,
    tutor: 'Maria Garcia',
    tutorImage: '/images/avatars/avatar-15.webp',
    tutorFallback: 'MG',
    time: '30h 25m',
    stats: { users: 13, textMaterial: 35, videos: 28 },
    totalModules: 50,
    completedModules: 45
  },
  {
    id: '16',
    course: 'Database Design',
    courseIcon: <DatabaseIcon />,
    tutor: 'Kevin Martinez',
    tutorImage: '/images/avatars/avatar-16.webp',
    tutorFallback: 'KM',
    time: '26h 50m',
    stats: { users: 16, textMaterial: 42, videos: 18 },
    totalModules: 75,
    completedModules: 55
  },
  {
    id: '17',
    course: 'API Development',
    courseIcon: <FileJsonIcon />,
    tutor: 'Rachel Thompson',
    tutorImage: '/images/avatars/avatar-17.webp',
    tutorFallback: 'RT',
    time: '22h 35m',
    stats: { users: 19, textMaterial: 30, videos: 24 },
    totalModules: 50,
    completedModules: 32
  },
  {
    id: '18',
    course: 'Software Testing',
    courseIcon: <FileCogIcon />,
    tutor: 'Daniel Lee',
    tutorImage: '/images/avatars/avatar-18.webp',
    tutorFallback: 'DL',
    time: '20h 10m',
    stats: { users: 21, textMaterial: 25, videos: 30 },
    totalModules: 30,
    completedModules: 19
  },
  {
    id: '19',
    course: 'Agile Methodology',
    courseIcon: <NetworkIcon />,
    tutor: 'Jennifer White',
    tutorImage: '/images/avatars/avatar-19.webp',
    tutorFallback: 'JW',
    time: '15h 45m',
    stats: { users: 25, textMaterial: 20, videos: 15 },
    totalModules: 40,
    completedModules: 28
  },
  {
    id: '20',
    course: 'Blockchain Technology',
    courseIcon: <LinkIcon />,
    tutor: 'Christopher Moore',
    tutorImage: '/images/avatars/avatar-20.webp',
    tutorFallback: 'CM',
    time: '38h 20m',
    stats: { users: 8, textMaterial: 65, videos: 12 },
    totalModules: 100,
    completedModules: 50
  },
  {
    id: '21',
    course: 'Game Development',
    courseIcon: <Gamepad2Icon />,
    tutor: 'Amanda Johnson',
    tutorImage: '/images/avatars/avatar-6.webp',
    tutorFallback: 'AJ',
    time: '45h 30m',
    stats: { users: 30, textMaterial: 40, videos: 55 },
    totalModules: 75,
    completedModules: 35
  },
  {
    id: '22',
    course: 'AI Ethics',
    courseIcon: <BrainCircuitIcon />,
    tutor: 'Dr. Brian Clark',
    tutorImage: '/images/avatars/avatar-1.webp',
    tutorFallback: 'BC',
    time: '18h 15m',
    stats: { users: 14, textMaterial: 28, videos: 20 },
    totalModules: 40,
    completedModules: 30
  },
  {
    id: '23',
    course: 'Video Editing',
    courseIcon: <VideoIcon />,
    tutor: 'Nicole Rodriguez',
    tutorImage: '/images/avatars/avatar-2.webp',
    tutorFallback: 'NR',
    time: '24h 45m',
    stats: { users: 32, textMaterial: 15, videos: 45 },
    totalModules: 10,
    completedModules: 2
  },
  {
    id: '24',
    course: 'Content Writing',
    courseIcon: <NotebookPenIcon />,
    tutor: 'Steven Harris',
    tutorImage: '/images/avatars/avatar-3.webp',
    tutorFallback: 'SH',
    time: '16h 20m',
    stats: { users: 40, textMaterial: 35, videos: 10 },
    totalModules: 40,
    completedModules: 34
  },
  {
    id: '25',
    course: 'Social Media Strategy',
    courseIcon: <FacebookIcon />,
    tutor: 'Michelle Turner',
    tutorImage: '/images/avatars/avatar-4.webp',
    tutorFallback: 'MT',
    time: '14h 55m',
    stats: { users: 45, textMaterial: 22, videos: 18 },
    totalModules: 40,
    completedModules: 28
  }
]

const DataTableProgress = () => {
  return (
    <Card className='py-0'>
      <CourseDatatable data={courseData} />
    </Card>
  )
}

export default DataTableProgress
