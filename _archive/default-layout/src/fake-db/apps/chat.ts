// Type Imports
import type { ChatData } from '@/types/apps/chat-types'

const CURRENT_USER_ID = 'user-me'

export const db: ChatData = {
  currentUser: {
    id: CURRENT_USER_ID,
    name: 'John Admin',
    avatar: '/images/avatars/avatar-1.webp',
    role: 'Administrator',
    status: 'online',
    about: 'Building great admin experiences and leading the platform team at WebLabs Studio.',
    email: 'john.admin@example.com',
    phone: '+1 (555) 010-2000',
    company: 'WebLabs Studio',
    country: 'United States',
    website: 'https://weblabs.studio',
    timezone: 'EST (UTC-5)',
    location: 'New York, NY',
    availability: 'Mon – Fri, 9 AM – 6 PM',
    tags: ['Admin', 'Platform'],
    socialLinks: [
      { platform: 'linkedin', url: 'https://linkedin.com/in/johnadmin' },
      { platform: 'twitter', url: 'https://twitter.com/johnadmin' }
    ]
  },
  contacts: [
    {
      id: 'contact-1',
      name: 'Sarah Johnson',
      avatar: '/images/avatars/avatar-3.webp',
      role: 'Marketing Lead',
      status: 'online',
      about: 'Passionate about brand storytelling and growth.',
      email: 'sarah.johnson@example.com',
      phone: '+1 (555) 010-2001',
      company: 'WebLabs Studio',
      country: 'United States',
      website: 'https://weblabs.studio',
      timezone: 'EST (UTC-5)',
      location: 'New York, NY',
      availability: 'Mon – Fri, 9 AM – 6 PM',
      tags: ['Marketing', 'Enterprise'],
      socialLinks: [
        { platform: 'linkedin', url: 'https://linkedin.com/in/sarahjohnson' },
        { platform: 'twitter', url: 'https://twitter.com/sarahjohnson' }
      ]
    },
    {
      id: 'contact-2',
      name: 'Michael Chen',
      avatar: '/images/avatars/avatar-4.webp',
      role: 'Product Manager',
      status: 'away',
      about: 'Shipping products users love.',
      email: 'michael.chen@example.com',
      phone: '+1 (555) 010-2002',
      company: 'WebLabs Studio',
      country: 'United States',
      website: 'https://weblabs.studio/product',
      timezone: 'PST (UTC-8)',
      location: 'San Francisco, CA',
      availability: 'Mon – Fri, 10 AM – 7 PM',
      tags: ['Product', 'Roadmap'],
      socialLinks: [{ platform: 'linkedin', url: 'https://linkedin.com/in/michaelchen' }]
    },
    {
      id: 'contact-3',
      name: 'Emma Wilson',
      avatar: '/images/avatars/avatar-6.webp',
      role: 'UX Designer',
      status: 'busy',
      about: 'Design systems and delightful interfaces.',
      email: 'emma.wilson@example.com',
      phone: '+1 (555) 010-2003',
      company: 'WebLabs Studio',
      country: 'United Kingdom',
      website: 'https://emma.design',
      timezone: 'GMT (UTC+0)',
      location: 'London, UK',
      availability: 'Mon – Thu, 9 AM – 5 PM',
      tags: ['Design', 'UX'],
      socialLinks: [
        { platform: 'linkedin', url: 'https://linkedin.com/in/emmawilson' },
        { platform: 'instagram', url: 'https://instagram.com/emmawilson' }
      ]
    },
    {
      id: 'contact-4',
      name: 'David Park',
      avatar: '/images/avatars/avatar-7.webp',
      role: 'Senior Engineer',
      status: 'online',
      about: 'Full-stack developer, coffee enthusiast.',
      email: 'david.park@example.com',
      phone: '+1 (555) 010-2004',
      company: 'WebLabs Studio',
      country: 'Canada',
      website: 'https://github.com/davidpark',
      timezone: 'EST (UTC-5)',
      location: 'Toronto, ON',
      availability: 'Mon – Fri, 8 AM – 4 PM',
      tags: ['Engineering', 'Full-stack'],
      socialLinks: [{ platform: 'linkedin', url: 'https://linkedin.com/in/davidpark' }]
    },
    {
      id: 'contact-5',
      name: 'Jessica Martinez',
      avatar: '/images/avatars/avatar-8.webp',
      role: 'Finance Director',
      status: 'offline',
      about: 'Numbers, strategy, and quarterly planning.',
      email: 'jessica.martinez@example.com',
      phone: '+1 (555) 010-2005',
      company: 'WebLabs Studio',
      country: 'United States',
      website: 'https://weblabs.studio',
      timezone: 'CST (UTC-6)',
      location: 'Chicago, IL',
      availability: 'Mon – Fri, 9 AM – 5 PM',
      tags: ['Finance', 'Strategy'],
      socialLinks: [{ platform: 'linkedin', url: 'https://linkedin.com/in/jessicamartinez' }]
    },
    {
      id: 'contact-6',
      name: 'Alex Thompson',
      avatar: '/images/avatars/avatar-10.webp',
      role: 'IT Operations',
      status: 'away',
      about: 'Keeping systems running smoothly.',
      email: 'alex.thompson@example.com',
      phone: '+1 (555) 010-2006',
      company: 'WebLabs Studio',
      country: 'United States',
      website: 'https://weblabs.studio',
      timezone: 'MST (UTC-7)',
      location: 'Denver, CO',
      availability: 'Mon – Fri, 7 AM – 3 PM',
      tags: ['IT', 'Infrastructure'],
      socialLinks: [{ platform: 'linkedin', url: 'https://linkedin.com/in/alexthompson' }]
    },
    {
      id: 'contact-7',
      name: 'Lisa Nguyen',
      avatar: '/images/avatars/avatar-11.webp',
      role: 'HR Manager',
      status: 'online',
      about: 'People ops, hiring, and team culture.',
      email: 'lisa.nguyen@example.com',
      phone: '+1 (555) 010-2007',
      company: 'WebLabs Studio',
      country: 'United States',
      website: 'https://weblabs.studio/careers',
      timezone: 'EST (UTC-5)',
      location: 'Boston, MA',
      availability: 'Mon – Fri, 9 AM – 6 PM',
      tags: ['HR', 'Culture'],
      socialLinks: [{ platform: 'linkedin', url: 'https://linkedin.com/in/lisanguyen' }]
    },
    {
      id: 'contact-8',
      name: "Ryan O'Brien",
      avatar: '/images/avatars/avatar-12.webp',
      role: 'DevOps Engineer',
      status: 'online',
      about: 'CI/CD pipelines and cloud infrastructure.',
      email: 'ryan.obrien@example.com',
      phone: '+1 (555) 010-2008',
      company: 'WebLabs Studio',
      country: 'Ireland',
      website: 'https://weblabs.studio',
      timezone: 'GMT (UTC+0)',
      location: 'Dublin, Ireland',
      availability: 'Mon – Fri, 10 AM – 6 PM',
      tags: ['DevOps', 'Cloud'],
      socialLinks: [
        { platform: 'linkedin', url: 'https://linkedin.com/in/ryanobrien' },
        { platform: 'twitter', url: 'https://twitter.com/ryanobrien' }
      ]
    },
    {
      id: 'contact-9',
      name: 'Priya Patel',
      avatar: '/images/avatars/avatar-13.webp',
      role: 'Data Analyst',
      status: 'busy',
      about: 'Dashboards, SQL, and quarterly reporting.',
      email: 'priya.patel@example.com',
      phone: '+1 (555) 010-2009',
      company: 'WebLabs Studio',
      country: 'India',
      website: 'https://weblabs.studio/analytics',
      timezone: 'IST (UTC+5:30)',
      location: 'Mumbai, India',
      availability: 'Mon – Sat, 10 AM – 7 PM',
      tags: ['Data', 'Analytics'],
      socialLinks: [{ platform: 'linkedin', url: 'https://linkedin.com/in/priyapatel' }]
    },
    {
      id: 'contact-10',
      name: 'Marcus Webb',
      avatar: '/images/avatars/avatar-14.webp',
      role: 'Sales Lead',
      status: 'away',
      about: 'Enterprise deals and partner relationships.',
      email: 'marcus.webb@example.com',
      phone: '+1 (555) 010-2010',
      company: 'WebLabs Studio',
      country: 'United States',
      website: 'https://weblabs.studio/sales',
      timezone: 'PST (UTC-8)',
      location: 'Seattle, WA',
      availability: 'Mon – Fri, 8 AM – 6 PM',
      tags: ['Sales', 'Enterprise'],
      socialLinks: [
        { platform: 'linkedin', url: 'https://linkedin.com/in/marcuswebb' },
        { platform: 'twitter', url: 'https://twitter.com/marcuswebb' }
      ]
    },
    {
      id: 'contact-11',
      name: 'Nora Kim',
      avatar: '/images/avatars/avatar-15.webp',
      role: 'Customer Success',
      status: 'online',
      about: 'Onboarding, retention, and support escalations.',
      email: 'nora.kim@example.com',
      phone: '+1 (555) 010-2011',
      company: 'WebLabs Studio',
      country: 'South Korea',
      website: 'https://weblabs.studio/support',
      timezone: 'KST (UTC+9)',
      location: 'Seoul, South Korea',
      availability: 'Mon – Fri, 9 AM – 6 PM',
      tags: ['Support', 'CS'],
      socialLinks: [{ platform: 'linkedin', url: 'https://linkedin.com/in/norakim' }]
    },
    {
      id: 'contact-12',
      name: 'Tom Bradley',
      avatar: '/images/avatars/avatar-16.webp',
      role: 'Legal Counsel',
      status: 'offline',
      about: 'Contracts, compliance, and vendor reviews.',
      email: 'tom.bradley@example.com',
      phone: '+1 (555) 010-2012',
      company: 'WebLabs Studio',
      country: 'United States',
      website: 'https://weblabs.studio/legal',
      timezone: 'EST (UTC-5)',
      location: 'Washington, DC',
      availability: 'Mon – Fri, 9 AM – 5 PM',
      tags: ['Legal', 'Compliance'],
      socialLinks: [{ platform: 'linkedin', url: 'https://linkedin.com/in/tombradley' }]
    }
  ],
  conversations: [
    {
      id: 'conv-1',
      type: 'direct',
      contactId: 'contact-1',
      isPinned: true,
      isMuted: false,
      isFavourite: true,
      unreadCount: 2,
      suggestions: ['Sounds good!', 'Let me check and get back to you.', 'Can we schedule a call?'],
      autoReplies: [
        'Got it — I will review the deck today.',
        'Thanks for the update!',
        'Let us sync on Monday.',
        'I will share the metrics shortly.',
        'Appreciate the quick turnaround.'
      ],
      messages: [
        {
          id: 'msg-1-1',
          senderId: 'contact-1',
          content: 'Hi John, do you have a moment to review the Q1 marketing deck?',
          type: 'text',
          timestamp: '2026-06-09T09:15:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-1-2',
          senderId: CURRENT_USER_ID,
          content: 'Sure Sarah — send it over and I will take a look this afternoon.',
          type: 'text',
          timestamp: '2026-06-09T09:22:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-1-3',
          senderId: 'contact-1',
          content: 'Here is the latest version with your feedback incorporated.',
          type: 'file',
          timestamp: '2026-06-09T14:30:00.000Z',
          status: 'read',
          attachments: [
            {
              id: 'att-1-1',
              name: 'Q1-Marketing-Deck.pdf',
              size: '2.4 MB',
              type: 'file',
              url: '/files/q1-marketing-deck.pdf'
            }
          ]
        },
        {
          id: 'msg-1-4',
          senderId: CURRENT_USER_ID,
          content: 'Looks great — just one note on slide 12.',
          type: 'text',
          timestamp: '2026-06-09T16:45:00.000Z',
          status: 'read',
          replyToId: 'msg-1-3'
        },
        {
          id: 'msg-1-5',
          senderId: 'contact-1',
          content: 'Thanks! I updated slide 12 — let me know if it works now.',
          type: 'text',
          timestamp: '2026-06-10T08:10:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-1-6',
          senderId: 'contact-1',
          content: 'Also, the engagement numbers are up 35% — exciting news!',
          type: 'text',
          timestamp: '2026-06-11T07:30:00.000Z',
          status: 'delivered'
        },
        {
          id: 'msg-1-7',
          senderId: 'contact-1',
          content: 'Can we present this to leadership on Friday?',
          type: 'text',
          timestamp: '2026-06-11T07:32:00.000Z',
          status: 'delivered'
        }
      ]
    },
    {
      id: 'conv-2',
      type: 'direct',
      contactId: 'contact-2',
      isPinned: false,
      isMuted: false,
      isFavourite: false,
      unreadCount: 0,
      suggestions: ['On track for Phase 1.', 'Any blockers on your end?', 'Let us review tomorrow.'],
      autoReplies: [
        'Phase 1 is on schedule.',
        'I will send the timeline update shortly.',
        'No blockers from the product side.',
        'Let us align in standup tomorrow.',
        'Thanks for checking in!'
      ],
      messages: [
        {
          id: 'msg-2-1',
          senderId: 'contact-2',
          content: 'Quick update — dashboard Phase 1 is on track for end of month.',
          type: 'text',
          timestamp: '2026-06-08T11:00:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-2-2',
          senderId: CURRENT_USER_ID,
          content: 'Great to hear. How is the API integration going?',
          type: 'text',
          timestamp: '2026-06-08T11:15:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-2-3',
          senderId: 'contact-2',
          content: 'Backend team finished the auth endpoints last week.',
          type: 'text',
          timestamp: '2026-06-08T14:20:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-2-4',
          senderId: CURRENT_USER_ID,
          content: 'Perfect. Let me know if you need anything from my side.',
          type: 'text',
          timestamp: '2026-06-09T10:00:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-2-5',
          senderId: 'contact-2',
          content: 'Will do — I will share the full timeline doc tomorrow.',
          type: 'text',
          timestamp: '2026-06-10T09:30:00.000Z',
          status: 'read'
        }
      ]
    },
    {
      id: 'conv-3',
      type: 'direct',
      contactId: 'contact-3',
      isPinned: false,
      isMuted: true,
      isFavourite: true,
      unreadCount: 1,
      suggestions: ['Love the new mockups!', 'Can we iterate on the sidebar?', 'Looks ready for dev.'],
      autoReplies: [
        'Glad you like the direction!',
        'I will tweak the sidebar spacing.',
        'Figma link is in the thread.',
        'Happy to walk through the flows.',
        'Let me know which variant you prefer.'
      ],
      messages: [
        {
          id: 'msg-3-1',
          senderId: 'contact-3',
          content: 'Shared the updated chat UI mockups in Figma.',
          type: 'text',
          timestamp: '2026-06-07T15:00:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-3-2',
          senderId: CURRENT_USER_ID,
          content: 'The two-panel layout looks clean — nice work!',
          type: 'text',
          timestamp: '2026-06-07T16:30:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-3-3',
          senderId: 'contact-3',
          content: 'Here is a preview of the message bubble styles.',
          type: 'image',
          timestamp: '2026-06-08T10:00:00.000Z',
          status: 'read',
          attachments: [
            {
              id: 'att-3-1',
              name: 'dashboard-shell-01',
              size: '840 KB',
              type: 'image',
              url: '/images/misc/dashboard-shell-01.webp'
            }
          ]
        },
        {
          id: 'msg-3-4',
          senderId: CURRENT_USER_ID,
          content: 'Can we use softer corners on the sent bubbles?',
          type: 'text',
          timestamp: '2026-06-08T11:00:00.000Z',
          status: 'read',
          replyToId: 'msg-3-3'
        },
        {
          id: 'msg-3-5',
          senderId: 'contact-3',
          content: 'Done — updated in the latest Figma frame.',
          type: 'text',
          timestamp: '2026-06-09T09:00:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-3-6',
          senderId: 'contact-3',
          content: 'Ready for your final sign-off when you have a moment.',
          type: 'text',
          timestamp: '2026-06-11T06:00:00.000Z',
          status: 'delivered'
        }
      ]
    },
    {
      id: 'conv-4',
      type: 'direct',
      contactId: 'contact-4',
      isPinned: false,
      isMuted: false,
      isFavourite: false,
      unreadCount: 0,
      suggestions: ['Will review the PR today.', 'LGTM — merge when ready.', 'Left a few comments.'],
      autoReplies: [
        'PR is ready for another look.',
        'Fixed the failing test.',
        'OAuth flow is complete.',
        'Let me know if you need a walkthrough.',
        'Thanks for the review!'
      ],
      messages: [
        {
          id: 'msg-4-1',
          senderId: 'contact-4',
          content: 'Could you review my PR for the auth module?',
          type: 'text',
          timestamp: '2026-06-06T13:00:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-4-2',
          senderId: CURRENT_USER_ID,
          content: 'On it — I will check it after lunch.',
          type: 'text',
          timestamp: '2026-06-06T13:10:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-4-3',
          senderId: 'contact-4',
          content: 'OAuth2 flow + unit tests are in — link is in the PR description.',
          type: 'text',
          timestamp: '2026-06-06T14:00:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-4-4',
          senderId: CURRENT_USER_ID,
          content: 'Left a few comments — mostly nits. Great work overall.',
          type: 'text',
          timestamp: '2026-06-07T10:00:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-4-5',
          senderId: 'contact-4',
          content: 'Addressed all comments — ready to merge.',
          type: 'text',
          timestamp: '2026-06-08T16:00:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-4-6',
          senderId: CURRENT_USER_ID,
          content: 'Approved — go ahead and merge.',
          type: 'text',
          timestamp: '2026-06-08T16:30:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-4-7',
          senderId: 'contact-4',
          content: 'Merged. Deploying to staging now.',
          type: 'text',
          timestamp: '2026-06-09T08:00:00.000Z',
          status: 'read'
        }
      ]
    },
    {
      id: 'conv-5',
      type: 'group',
      groupName: 'Product Team',
      groupAvatar: '/images/avatars/avatar-5.webp',
      memberIds: [CURRENT_USER_ID, 'contact-1', 'contact-2', 'contact-3'],
      isPinned: true,
      isMuted: false,
      isFavourite: false,
      unreadCount: 3,
      suggestions: ['Agreed.', 'Let us discuss in standup.', 'I will update the doc.'],
      autoReplies: [
        'Sounds good to me.',
        'I will add that to the sprint.',
        'Can everyone review the roadmap?',
        'Standup at 10 AM tomorrow.',
        'Updated the shared doc.'
      ],
      messages: [
        {
          id: 'msg-5-1',
          senderId: 'contact-2',
          content: 'Team — sprint planning is tomorrow at 2 PM.',
          type: 'text',
          timestamp: '2026-06-05T10:00:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-5-2',
          senderId: 'contact-1',
          content: 'I will bring the marketing priorities list.',
          type: 'text',
          timestamp: '2026-06-05T10:15:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-5-3',
          senderId: CURRENT_USER_ID,
          content: 'I added the admin template milestones to the shared doc.',
          type: 'text',
          timestamp: '2026-06-05T11:00:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-5-4',
          senderId: 'contact-3',
          content: 'Design handoff for the chat module is ready.',
          type: 'text',
          timestamp: '2026-06-06T09:00:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-5-5',
          senderId: 'contact-2',
          content: 'Can we prioritize the chat app for this sprint?',
          type: 'text',
          timestamp: '2026-06-10T14:00:00.000Z',
          status: 'read',
          replyToId: 'msg-5-4'
        },
        {
          id: 'msg-5-6',
          senderId: 'contact-1',
          content: '+1 from marketing — we need it for the demo.',
          type: 'text',
          timestamp: '2026-06-11T08:00:00.000Z',
          status: 'delivered'
        },
        {
          id: 'msg-5-7',
          senderId: 'contact-3',
          content: 'I can support with final UI polish.',
          type: 'text',
          timestamp: '2026-06-11T08:05:00.000Z',
          status: 'delivered'
        },
        {
          id: 'msg-5-8',
          senderId: 'contact-2',
          content: 'Let us lock scope in tomorrow standup.',
          type: 'text',
          timestamp: '2026-06-11T08:10:00.000Z',
          status: 'delivered'
        }
      ]
    },
    {
      id: 'conv-6',
      type: 'group',
      groupName: 'Engineering',
      groupAvatar: '/images/avatars/avatar-9.webp',
      memberIds: [CURRENT_USER_ID, 'contact-4', 'contact-6'],
      isPinned: false,
      isMuted: false,
      isFavourite: true,
      unreadCount: 0,
      suggestions: ['Maintenance window works for me.', 'I will monitor the deploy.', 'Thanks for the heads up.'],
      autoReplies: [
        'Maintenance is scheduled as planned.',
        'All services restored.',
        'No issues during the window.',
        'Patch notes are in Confluence.',
        'Thanks for coordinating!'
      ],
      messages: [
        {
          id: 'msg-6-1',
          senderId: 'contact-6',
          content: 'Heads up — server maintenance this Saturday 2–6 AM.',
          type: 'text',
          timestamp: '2026-06-04T12:00:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-6-2',
          senderId: 'contact-4',
          content: 'I will pause the staging deploys during the window.',
          type: 'text',
          timestamp: '2026-06-04T12:30:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-6-3',
          senderId: CURRENT_USER_ID,
          content: 'Noted — I will notify the team.',
          type: 'text',
          timestamp: '2026-06-04T13:00:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-6-4',
          senderId: 'contact-6',
          content: 'Security patches and DB upgrades included in this release.',
          type: 'text',
          timestamp: '2026-06-05T09:00:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-6-5',
          senderId: 'contact-4',
          content: 'Post-maintenance checklist is ready.',
          type: 'file',
          timestamp: '2026-06-06T10:00:00.000Z',
          status: 'read',
          attachments: [
            {
              id: 'att-6-1',
              name: 'post-maintenance-checklist.docx',
              size: '128 KB',
              type: 'file',
              url: '/files/post-maintenance-checklist.docx'
            }
          ]
        },
        {
          id: 'msg-6-6',
          senderId: CURRENT_USER_ID,
          content: 'Thanks Alex — all set on our end.',
          type: 'text',
          timestamp: '2026-06-07T11:00:00.000Z',
          status: 'read'
        }
      ]
    },
    {
      id: 'conv-7',
      type: 'direct',
      contactId: 'contact-5',
      isPinned: false,
      isMuted: false,
      isFavourite: false,
      unreadCount: 1,
      suggestions: ['Numbers look good.', 'Can we review the forecast?', 'Approved from my side.'],
      autoReplies: [
        'I will send the updated forecast.',
        'Budget variance is within range.',
        'Q2 close is on track.',
        'Let me pull the latest numbers.',
        'Thanks for the sign-off.'
      ],
      messages: [
        {
          id: 'msg-7-1',
          senderId: 'contact-5',
          content: 'John, here is the revised Q2 budget spreadsheet.',
          type: 'file',
          timestamp: '2026-06-09T08:00:00.000Z',
          status: 'read',
          attachments: [
            {
              id: 'att-7-1',
              name: 'Q2-Budget-Forecast.xlsx',
              size: '1.8 MB',
              type: 'file',
              url: '/files/q2-budget-forecast.xlsx'
            }
          ]
        },
        {
          id: 'msg-7-2',
          senderId: CURRENT_USER_ID,
          content: 'Thanks Jessica — I will review the marketing line items today.',
          type: 'text',
          timestamp: '2026-06-09T10:30:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-7-3',
          senderId: 'contact-5',
          content: 'Also attached the board summary deck for Friday.',
          type: 'file',
          timestamp: '2026-06-10T14:00:00.000Z',
          status: 'read',
          attachments: [
            {
              id: 'att-7-2',
              name: 'Board-Summary-Q2.pdf',
              size: '3.1 MB',
              type: 'file',
              url: '/files/board-summary-q2.pdf'
            }
          ]
        },
        {
          id: 'msg-7-4',
          senderId: 'contact-5',
          content: 'Can you confirm the headcount assumptions on slide 8?',
          type: 'text',
          timestamp: '2026-06-11T09:15:00.000Z',
          status: 'delivered'
        }
      ]
    },
    {
      id: 'conv-8',
      type: 'direct',
      contactId: 'contact-6',
      isPinned: false,
      isMuted: false,
      isFavourite: false,
      unreadCount: 0,
      suggestions: ['All clear after deploy.', 'Monitoring looks stable.', 'Thanks for the update.'],
      autoReplies: [
        'Deploy completed successfully.',
        'No alerts in the last hour.',
        'Rollback plan is documented.',
        'I will watch the dashboards overnight.',
        'Patch applied to all nodes.'
      ],
      messages: [
        {
          id: 'msg-8-1',
          senderId: 'contact-6',
          content: 'Staging deploy finished — here is the dashboard screenshot.',
          type: 'image',
          timestamp: '2026-06-10T06:00:00.000Z',
          status: 'read',
          attachments: [
            {
              id: 'att-8-1',
              name: 'staging-metrics',
              size: '640 KB',
              type: 'image',
              url: '/images/misc/dashboard-shell-01.webp'
            }
          ]
        },
        {
          id: 'msg-8-2',
          senderId: CURRENT_USER_ID,
          content: 'Looks healthy — error rate is flat.',
          type: 'text',
          timestamp: '2026-06-10T06:45:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-8-3',
          senderId: 'contact-6',
          content: 'Production rollout is scheduled for tonight.',
          type: 'text',
          timestamp: '2026-06-10T12:00:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-8-4',
          senderId: 'contact-6',
          content: 'Runbook is attached if you need to reference steps.',
          type: 'file',
          timestamp: '2026-06-10T12:05:00.000Z',
          status: 'read',
          attachments: [
            {
              id: 'att-8-2',
              name: 'production-rollout-runbook.pdf',
              size: '420 KB',
              type: 'file',
              url: '/files/production-rollout-runbook.pdf'
            }
          ]
        }
      ]
    },
    {
      id: 'conv-9',
      type: 'direct',
      contactId: 'contact-7',
      isPinned: false,
      isMuted: false,
      isFavourite: true,
      unreadCount: 2,
      suggestions: ['Works for me.', 'I will share with the team.', 'Thanks for organizing.'],
      autoReplies: [
        'Onboarding docs are updated.',
        'I will send the calendar invite.',
        'New hire starts Monday.',
        'Policy draft is ready for review.',
        'Happy to schedule a sync.'
      ],
      messages: [
        {
          id: 'msg-9-1',
          senderId: 'contact-7',
          content: 'Hi John — updated the [employee handbook](#) with the remote work policy.',
          type: 'text',
          timestamp: '2026-06-08T09:00:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-9-2',
          senderId: CURRENT_USER_ID,
          content: '**Great timing** — we have three new hires starting next week.',
          type: 'text',
          timestamp: '2026-06-08T09:30:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-9-3',
          senderId: 'contact-7',
          content: 'Onboarding checklist for the admin team.',
          type: 'file',
          timestamp: '2026-06-09T11:00:00.000Z',
          status: 'read',
          attachments: [
            {
              id: 'att-9-1',
              name: 'onboarding-checklist.pdf',
              size: '256 KB',
              type: 'file',
              url: '/files/onboarding-checklist.pdf'
            }
          ]
        },
        {
          id: 'msg-9-4',
          senderId: 'contact-7',
          content: 'Can you review the offer letter template before I send it?',
          type: 'text',
          timestamp: '2026-06-11T08:20:00.000Z',
          status: 'delivered'
        },
        {
          id: 'msg-9-5',
          senderId: 'contact-7',
          content: 'Team offsite survey closes tomorrow — reminder to share with leads.',
          type: 'text',
          timestamp: '2026-06-11T08:22:00.000Z',
          status: 'delivered'
        }
      ]
    },
    {
      id: 'conv-10',
      type: 'direct',
      contactId: 'contact-8',
      isPinned: false,
      isMuted: true,
      isFavourite: false,
      unreadCount: 0,
      suggestions: ['Pipeline is green.', 'Will check the logs.', 'Approved to proceed.'],
      autoReplies: [
        'Pipeline passed all stages.',
        'I will rotate the secrets tonight.',
        'Terraform plan looks good.',
        'No drift detected in prod.',
        'Let me rerun the failed job.'
      ],
      messages: [
        {
          id: 'msg-10-1',
          senderId: 'contact-8',
          content: 'CI pipeline failed on the auth service build — logs attached.',
          type: 'file',
          timestamp: '2026-06-07T16:00:00.000Z',
          status: 'read',
          attachments: [
            {
              id: 'att-10-1',
              name: 'ci-build-log.txt',
              size: '84 KB',
              type: 'file',
              url: '/files/ci-build-log.txt'
            }
          ]
        },
        {
          id: 'msg-10-2',
          senderId: CURRENT_USER_ID,
          content: 'Looks like a missing env var — I will fix and push.',
          type: 'text',
          timestamp: '2026-06-07T16:30:00.000Z',
          status: 'read',
          replyToId: 'msg-10-1'
        },
        {
          id: 'msg-10-3',
          senderId: 'contact-8',
          content: 'Build is green again. Screenshot from Grafana:',
          type: 'image',
          timestamp: '2026-06-08T08:00:00.000Z',
          status: 'read',
          attachments: [
            {
              id: 'att-10-2',
              name: 'grafana-dashboard',
              size: '720 KB',
              type: 'image',
              url: '/images/misc/dashboard-shell-02.webp'
            }
          ]
        },
        {
          id: 'msg-10-4',
          senderId: CURRENT_USER_ID,
          content: 'Perfect — thanks for the quick turnaround Ryan.',
          type: 'text',
          timestamp: '2026-06-08T09:00:00.000Z',
          status: 'read'
        }
      ]
    },
    {
      id: 'conv-11',
      type: 'group',
      groupName: 'Design Review',
      groupAvatar: '/images/avatars/avatar-17.webp',
      memberIds: [CURRENT_USER_ID, 'contact-3', 'contact-7', 'contact-11'],
      isPinned: false,
      isMuted: false,
      isFavourite: true,
      unreadCount: 4,
      suggestions: ['Love this direction.', 'Small tweak on spacing.', 'Ready for handoff.'],
      autoReplies: [
        'Updated the Figma file.',
        'I prefer variant B.',
        'Spacing looks good now.',
        'Let us review in the call.',
        'Handoff notes are in Notion.'
      ],
      messages: [
        {
          id: 'msg-11-1',
          senderId: 'contact-3',
          content: 'Latest chat composer mockups — feedback welcome.',
          type: 'image',
          timestamp: '2026-06-09T13:00:00.000Z',
          status: 'read',
          attachments: [
            {
              id: 'att-11-1',
              name: 'composer-mockup',
              size: '920 KB',
              type: 'image',
              url: '/images/misc/dashboard-shell-02.webp'
            }
          ]
        },
        {
          id: 'msg-11-2',
          senderId: 'contact-11',
          content: 'Customers asked for clearer attachment previews — this helps.',
          type: 'text',
          timestamp: '2026-06-09T14:00:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-11-3',
          senderId: CURRENT_USER_ID,
          content: 'Can we align the toolbar icons with the mail compose pattern?',
          type: 'text',
          timestamp: '2026-06-09T15:00:00.000Z',
          status: 'read',
          replyToId: 'msg-11-1'
        },
        {
          id: 'msg-11-4',
          senderId: 'contact-3',
          content: 'Done — see updated frame with attachment strip.',
          type: 'image',
          timestamp: '2026-06-10T10:00:00.000Z',
          status: 'read',
          attachments: [
            {
              id: 'att-11-2',
              name: 'attachment-strip-v2',
              size: '880 KB',
              type: 'image',
              url: '/images/misc/dashboard-shell-03.webp'
            }
          ]
        },
        {
          id: 'msg-11-5',
          senderId: 'contact-7',
          content: 'Looks good for the onboarding walkthrough too.',
          type: 'text',
          timestamp: '2026-06-11T07:00:00.000Z',
          status: 'delivered'
        },
        {
          id: 'msg-11-6',
          senderId: 'contact-11',
          content: 'I will add this to the June release notes.',
          type: 'text',
          timestamp: '2026-06-11T07:05:00.000Z',
          status: 'delivered'
        },
        {
          id: 'msg-11-7',
          senderId: 'contact-3',
          content: 'Exporting assets to the shared drive now.',
          type: 'file',
          timestamp: '2026-06-11T07:10:00.000Z',
          status: 'delivered',
          attachments: [
            {
              id: 'att-11-3',
              name: 'chat-ui-assets.zip',
              size: '4.6 MB',
              type: 'file',
              url: '/files/chat-ui-assets.zip'
            }
          ]
        },
        {
          id: 'msg-11-8',
          senderId: 'contact-11',
          content: 'Thanks Emma — I will link this in the help center draft.',
          type: 'text',
          timestamp: '2026-06-11T07:12:00.000Z',
          status: 'delivered'
        }
      ]
    },
    {
      id: 'conv-12',
      type: 'group',
      groupName: 'Sales & Marketing',
      groupAvatar: '/images/avatars/avatar-18.webp',
      memberIds: [CURRENT_USER_ID, 'contact-1', 'contact-10', 'contact-11'],
      isPinned: false,
      isMuted: false,
      isFavourite: false,
      unreadCount: 1,
      suggestions: ['Let us sync on the demo.', 'I will update the deck.', 'Sounds good.'],
      autoReplies: [
        'Demo is booked for Thursday.',
        'I will refresh the one-pager.',
        'Lead list is in Salesforce.',
        'Campaign metrics are up 12%.',
        'Thanks for the intro!'
      ],
      messages: [
        {
          id: 'msg-12-1',
          senderId: 'contact-10',
          content: 'Enterprise prospect wants a live admin dashboard demo next week.',
          type: 'text',
          timestamp: '2026-06-06T11:00:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-12-2',
          senderId: 'contact-1',
          content: 'I can tailor the deck for their industry vertical.',
          type: 'text',
          timestamp: '2026-06-06T11:30:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-12-3',
          senderId: CURRENT_USER_ID,
          content: 'Sharing the [demo template](#) credentials in the vault.',
          type: 'text',
          timestamp: '2026-06-06T12:00:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-12-4',
          senderId: 'contact-10',
          content: 'One-pager and pricing sheet attached.',
          type: 'file',
          timestamp: '2026-06-07T09:00:00.000Z',
          status: 'read',
          attachments: [
            {
              id: 'att-12-1',
              name: 'enterprise-one-pager.pdf',
              size: '1.2 MB',
              type: 'file',
              url: '/files/enterprise-one-pager.pdf'
            },
            {
              id: 'att-12-2',
              name: 'pricing-matrix-2026.xlsx',
              size: '540 KB',
              type: 'file',
              url: '/files/pricing-matrix-2026.xlsx'
            }
          ]
        },
        {
          id: 'msg-12-5',
          senderId: 'contact-1',
          content: 'Campaign screenshot from last week — strong CTR on the chat feature highlight.',
          type: 'image',
          timestamp: '2026-06-09T16:00:00.000Z',
          status: 'read',
          attachments: [
            {
              id: 'att-12-3',
              name: 'campaign-performance',
              size: '760 KB',
              type: 'image',
              url: '/images/misc/dashboard-shell-03.webp'
            }
          ]
        },
        {
          id: 'msg-12-6',
          senderId: 'contact-10',
          content: 'Prospect confirmed Thursday 2 PM — calendar invite sent.',
          type: 'text',
          timestamp: '2026-06-11T10:00:00.000Z',
          status: 'delivered'
        }
      ]
    },
    {
      id: 'conv-13',
      type: 'direct',
      contactId: 'contact-9',
      isPinned: false,
      isMuted: false,
      isFavourite: false,
      unreadCount: 0,
      suggestions: ['Thanks for the export.', 'Can you add a weekly view?', 'Looks accurate.'],
      autoReplies: [
        'Export is ready in the shared folder.',
        'I will add the weekly breakdown.',
        'Data refreshed as of this morning.',
        'Let me validate those numbers.',
        'Dashboard link is in the thread.'
      ],
      messages: [
        {
          id: 'msg-13-1',
          senderId: 'contact-9',
          content: 'Monthly active users report — raw export attached.',
          type: 'file',
          timestamp: '2026-06-05T08:00:00.000Z',
          status: 'read',
          attachments: [
            {
              id: 'att-13-1',
              name: 'mau-report-june.csv',
              size: '2.1 MB',
              type: 'file',
              url: '/files/mau-report-june.csv'
            }
          ]
        },
        {
          id: 'msg-13-2',
          senderId: CURRENT_USER_ID,
          content: 'Can you slice this by plan tier for the board deck?',
          type: 'text',
          timestamp: '2026-06-05T09:00:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-13-3',
          senderId: 'contact-9',
          content: 'Here is the chart preview and segmented export.',
          type: 'image',
          timestamp: '2026-06-06T14:00:00.000Z',
          status: 'read',
          attachments: [
            {
              id: 'att-13-2',
              name: 'mau-by-tier-chart',
              size: '680 KB',
              type: 'image',
              url: '/images/misc/dashboard-shell-03.webp'
            }
          ]
        },
        {
          id: 'msg-13-4',
          senderId: 'contact-9',
          content: 'Segmented CSV is in the thread as well.',
          type: 'file',
          timestamp: '2026-06-06T14:05:00.000Z',
          status: 'read',
          attachments: [
            {
              id: 'att-13-3',
              name: 'mau-by-tier-june.csv',
              size: '1.4 MB',
              type: 'file',
              url: '/files/mau-by-tier-june.csv'
            }
          ]
        },
        {
          id: 'msg-13-5',
          senderId: CURRENT_USER_ID,
          content: '**Exactly what I needed** — thank you Priya.',
          type: 'text',
          timestamp: '2026-06-06T15:00:00.000Z',
          status: 'read'
        }
      ]
    },
    {
      id: 'conv-14',
      type: 'direct',
      contactId: 'contact-10',
      isPinned: false,
      isMuted: false,
      isFavourite: false,
      unreadCount: 0,
      suggestions: ['Let us loop in legal.', 'I will follow up.', 'Good to proceed.'],
      autoReplies: [
        'Contract is with legal now.',
        'Prospect signed the NDA.',
        'I will chase the signature today.',
        'Deal stage moved to negotiation.',
        'Thanks for the intro to Tom.'
      ],
      messages: [
        {
          id: 'msg-14-1',
          senderId: 'contact-10',
          content: 'Hi John — can you intro me to [legal](#) for the Acme contract review?',
          type: 'text',
          timestamp: '2026-06-08T10:00:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-14-2',
          senderId: CURRENT_USER_ID,
          content: 'Done — Tom is copied on the thread.',
          type: 'text',
          timestamp: '2026-06-08T10:30:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-14-3',
          senderId: 'contact-10',
          content: 'Signed MSA draft attached for your records.',
          type: 'file',
          timestamp: '2026-06-09T11:00:00.000Z',
          status: 'read',
          attachments: [
            {
              id: 'att-14-1',
              name: 'acme-msa-draft.pdf',
              size: '890 KB',
              type: 'file',
              url: '/files/acme-msa-draft.pdf'
            }
          ]
        },
        {
          id: 'msg-14-4',
          senderId: 'contact-10',
          content: 'They also asked for a product roadmap snapshot.',
          type: 'image',
          timestamp: '2026-06-10T09:00:00.000Z',
          status: 'read',
          attachments: [
            {
              id: 'att-14-2',
              name: 'roadmap-snapshot',
              size: '540 KB',
              type: 'image',
              url: '/images/misc/dashboard-shell-01.webp'
            }
          ]
        },
        {
          id: 'msg-14-5',
          senderId: CURRENT_USER_ID,
          content: 'Forwarded to product — Michael will send an updated version.',
          type: 'text',
          timestamp: '2026-06-10T11:00:00.000Z',
          status: 'read'
        }
      ]
    },
    {
      id: 'conv-15',
      type: 'group',
      groupName: 'Leadership',
      groupAvatar: '/images/avatars/avatar-19.webp',
      memberIds: [CURRENT_USER_ID, 'contact-2', 'contact-5', 'contact-12'],
      isPinned: true,
      isMuted: false,
      isFavourite: true,
      unreadCount: 0,
      suggestions: ['Agenda looks good.', 'I will prepare slides.', 'See you Monday.'],
      autoReplies: [
        'Agenda circulated to the team.',
        'Board prep is on track.',
        'Q2 review deck is ready.',
        'Let us align before the meeting.',
        'Minutes will go out tomorrow.'
      ],
      messages: [
        {
          id: 'msg-15-1',
          senderId: 'contact-2',
          content: 'Leadership sync agenda for Monday — please review.',
          type: 'file',
          timestamp: '2026-06-04T09:00:00.000Z',
          status: 'read',
          attachments: [
            {
              id: 'att-15-1',
              name: 'leadership-sync-agenda.pdf',
              size: '180 KB',
              type: 'file',
              url: '/files/leadership-sync-agenda.pdf'
            }
          ]
        },
        {
          id: 'msg-15-2',
          senderId: 'contact-5',
          content: 'Finance section is updated with latest actuals.',
          type: 'text',
          timestamp: '2026-06-04T10:00:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-15-3',
          senderId: 'contact-12',
          content: 'Legal review of vendor contracts is complete — summary attached.',
          type: 'file',
          timestamp: '2026-06-05T14:00:00.000Z',
          status: 'read',
          attachments: [
            {
              id: 'att-15-2',
              name: 'vendor-contract-summary.pdf',
              size: '320 KB',
              type: 'file',
              url: '/files/vendor-contract-summary.pdf'
            }
          ]
        },
        {
          id: 'msg-15-4',
          senderId: CURRENT_USER_ID,
          content: 'I will cover the admin template roadmap and chat module status.',
          type: 'text',
          timestamp: '2026-06-05T15:00:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-15-5',
          senderId: 'contact-2',
          content: 'Please keep the product section to **10 minutes** max.',
          type: 'text',
          timestamp: '2026-06-06T08:00:00.000Z',
          status: 'read'
        }
      ]
    },
    {
      id: 'conv-16',
      type: 'direct',
      contactId: 'contact-12',
      isPinned: false,
      isMuted: false,
      isFavourite: false,
      unreadCount: 0,
      suggestions: ['Reviewed — looks good.', 'One clause to tweak.', 'Approved to send.'],
      autoReplies: [
        'Redlines are in the shared folder.',
        'NDA template is approved.',
        'I will turn this around by EOD.',
        'Compliance sign-off is complete.',
        'Let me know if you need a call.'
      ],
      messages: [
        {
          id: 'msg-16-1',
          senderId: 'contact-12',
          content: 'Vendor SaaS agreement for your review — key terms highlighted.',
          type: 'file',
          timestamp: '2026-06-07T09:00:00.000Z',
          status: 'read',
          attachments: [
            {
              id: 'att-16-1',
              name: 'saas-vendor-agreement.pdf',
              size: '1.1 MB',
              type: 'file',
              url: '/files/saas-vendor-agreement.pdf'
            }
          ]
        },
        {
          id: 'msg-16-2',
          senderId: CURRENT_USER_ID,
          content: 'Question on the data processing addendum — is section 4 standard?',
          type: 'text',
          timestamp: '2026-06-07T11:00:00.000Z',
          status: 'read',
          replyToId: 'msg-16-1'
        },
        {
          id: 'msg-16-3',
          senderId: 'contact-12',
          content: 'Yes — it matches our [DPA template](#). No changes needed.',
          type: 'text',
          timestamp: '2026-06-07T14:00:00.000Z',
          status: 'read'
        },
        {
          id: 'msg-16-4',
          senderId: CURRENT_USER_ID,
          content: 'Approved — please countersign when ready.',
          type: 'text',
          timestamp: '2026-06-08T09:00:00.000Z',
          status: 'read'
        }
      ]
    }
  ]
}
