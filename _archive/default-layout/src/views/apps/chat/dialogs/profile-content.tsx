'use client'

// React Imports
import { useEffect, useState } from 'react'

// Third-party Imports
import {
  Building2Icon,
  GlobeIcon,
  LinkIcon,
  MailIcon,
  MapPinIcon,
  MonitorIcon,
  PhoneIcon,
  TagIcon,
  Trash2Icon,
  XIcon
} from 'lucide-react'
import { toast } from 'sonner'

// Type Imports
import type {
  ChatUser,
  ChatUserStatus,
  Conversation,
  OwnProfileFormState,
  OwnProfileUpdate
} from '@/types/apps/chat-types'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

// Config Imports
import { getInitialsFromName } from '@/configs/mailConfig'

// Util Imports
import { cn } from '@/lib/utils'

export type ProfileContentProps = {
  user: ChatUser
  onClose: () => void
  isOwnProfile: boolean
  contactConversation: Conversation | null
  onMuteConversation: (id: string) => void
  onPinConversation: (id: string) => void
  onFavouriteConversation: (id: string) => void
  onClearChat: (conversationId: string) => void
  onBlockContact: (contactId: string) => void
  onDeleteContact: (contactId: string) => void
  onUpdateOwnProfile: (updates: OwnProfileUpdate) => void
}

const STATUS_DOT_CLASSES: Record<ChatUserStatus, string> = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  offline: 'bg-muted-foreground'
}

const STATUS_OPTIONS: ChatUserStatus[] = ['online', 'away', 'busy', 'offline']

const buildOwnProfileForm = (user: ChatUser): OwnProfileFormState => ({
  name: user.name,
  role: user.role ?? '',
  avatar: user.avatar ?? '',
  status: user.status,
  about: user.about ?? '',
  email: user.email ?? '',
  phone: user.phone ?? '',
  company: user.company ?? '',
  country: user.country ?? '',
  website: user.website ?? '',
  timezone: user.timezone ?? '',
  location: user.location ?? '',
  availability: user.availability ?? ''
})

type DetailRowProps = {
  icon: React.ReactNode
  label: string
  value: string
}

const DetailRow = (props: DetailRowProps) => {
  // Props
  const { icon, label, value } = props

  return (
    <div className='flex items-center gap-2 text-sm'>
      <span className='text-muted-foreground shrink-0'>{icon}</span>
      <span className='text-muted-foreground shrink-0 text-sm'>{label}</span>
      <span className='ml-auto truncate text-sm'>{value}</span>
    </div>
  )
}

type FieldEditorProps = {
  label: string
  value: string
  multiline?: boolean
  onChange: (value: string) => void
}

const FieldEditor = (props: FieldEditorProps) => {
  // Props
  const { label, value, multiline, onChange } = props

  return (
    <div className='space-y-1.5'>
      <Label className='text-muted-foreground text-xs'>{label}</Label>
      {multiline ? (
        <Textarea
          value={value}
          onChange={event => onChange(event.target.value)}
          rows={3}
          className='resize-none text-sm'
        />
      ) : (
        <Input value={value} onChange={event => onChange(event.target.value)} className='text-sm' />
      )}
    </div>
  )
}

const ProfileContent = (props: ProfileContentProps) => {
  // Props
  const {
    user,
    onClose,
    isOwnProfile,
    contactConversation,
    onMuteConversation,
    onPinConversation,
    onFavouriteConversation,
    onClearChat,
    onBlockContact,
    onDeleteContact,
    onUpdateOwnProfile
  } = props

  // States
  const [form, setForm] = useState<OwnProfileFormState>(() => buildOwnProfileForm(user))

  useEffect(() => {
    setTimeout(() => {
      setForm(buildOwnProfileForm(user))
    }, 0)
  }, [user])

  const handleSaveOwnProfile = () => {
    const updates: OwnProfileUpdate = {
      name: form.name.trim(),
      role: form.role.trim() || undefined,
      avatar: form.avatar.trim() || undefined,
      status: form.status,
      about: form.about.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      company: form.company.trim() || undefined,
      country: form.country.trim() || undefined,
      website: form.website.trim() || undefined,
      timezone: form.timezone.trim() || undefined,
      location: form.location.trim() || undefined,
      availability: form.availability.trim() || undefined
    }

    onUpdateOwnProfile(updates)
    toast.success('Profile updated.')
  }

  const updateField = <K extends keyof OwnProfileFormState>(key: K, value: OwnProfileFormState[K]) => {
    setForm(current => ({ ...current, [key]: value }))
  }

  // Vars
  const displayUser = isOwnProfile ? { ...user, ...form, avatar: form.avatar || user.avatar } : user

  return (
    <div className='relative h-full min-h-0 overflow-y-auto'>
      <div className='bg-background sticky top-0 z-10 flex items-start gap-3 px-4 py-4'>
        <div className='relative shrink-0'>
          <Avatar size='lg'>
            <AvatarImage src={displayUser.avatar} alt={displayUser.name} />
            <AvatarFallback>{getInitialsFromName(displayUser.name)}</AvatarFallback>
          </Avatar>
          <span
            className={cn(
              'ring-background absolute right-0 bottom-0 size-2.5 rounded-full ring-2',
              STATUS_DOT_CLASSES[isOwnProfile ? form.status : user.status]
            )}
          />
        </div>

        <div className='min-w-0 flex-1'>
          {isOwnProfile ? (
            <>
              <Input
                value={form.name}
                onChange={event => updateField('name', event.target.value)}
                className='h-auto truncate rounded-none border-none p-0 leading-5 font-medium shadow-none ring-0 focus-visible:ring-0'
                placeholder='Name'
              />
              <p className='text-muted-foreground truncate text-xs'>Admin</p>
            </>
          ) : (
            <>
              <p className='truncate leading-5 font-medium'>{user.name}</p>
              <p className='text-muted-foreground truncate text-xs'>{user.role ?? 'Contact'}</p>
            </>
          )}
        </div>

        <Button type='button' variant='ghost' size='icon-sm' aria-label='Close profile' onClick={onClose}>
          <XIcon className='size-4' />
        </Button>
      </div>

      <div className='flex flex-col gap-4 px-4 pb-4'>
        {!isOwnProfile && (user.email || user.phone || user.website) && (
          <div className='flex gap-2'>
            {user.email && (
              <Button
                size='icon-sm'
                variant='ghost'
                aria-label='Email'
                nativeButton={false}
                render={<a href={`mailto:${user.email}`} />}
              >
                <MailIcon className='size-3.5' />
              </Button>
            )}
            {user.phone && (
              <Button
                size='icon-sm'
                variant='ghost'
                aria-label='Call'
                nativeButton={false}
                render={<a href={`tel:${user.phone.replace(/\s/g, '')}`} />}
              >
                <PhoneIcon className='size-3.5' />
              </Button>
            )}
            {user.website && (
              <Button
                size='icon-sm'
                variant='ghost'
                aria-label='Website'
                nativeButton={false}
                render={<a href={user.website} target='_blank' rel='noopener noreferrer' />}
              >
                <LinkIcon className='size-3.5' />
              </Button>
            )}
          </div>
        )}
        {user.about && !isOwnProfile && <p className='text-muted-foreground text-sm leading-relaxed'>{user.about}</p>}
        {isOwnProfile ? (
          <div className='space-y-3'>
            <FieldEditor label='Avatar URL' value={form.avatar} onChange={value => updateField('avatar', value)} />
            <FieldEditor label='About' value={form.about} multiline onChange={value => updateField('about', value)} />
            <FieldEditor label='Email' value={form.email} onChange={value => updateField('email', value)} />
            <FieldEditor label='Phone' value={form.phone} onChange={value => updateField('phone', value)} />
            <FieldEditor label='Company' value={form.company} onChange={value => updateField('company', value)} />
            <FieldEditor label='Country' value={form.country} onChange={value => updateField('country', value)} />
            <FieldEditor label='Website' value={form.website} onChange={value => updateField('website', value)} />
            <FieldEditor label='Location' value={form.location} onChange={value => updateField('location', value)} />
            <FieldEditor label='Timezone' value={form.timezone} onChange={value => updateField('timezone', value)} />
            <FieldEditor
              label='Availability'
              value={form.availability}
              onChange={value => updateField('availability', value)}
            />
            <Separator />
            <div className='space-y-2'>
              <p className='text-muted-foreground text-xs font-medium'>Status</p>
              <div className='grid grid-cols-2 gap-2'>
                {STATUS_OPTIONS.map(status => (
                  <button
                    key={status}
                    type='button'
                    onClick={() => updateField('status', status)}
                    className={cn(
                      'rounded-lg border px-2 py-2 text-xs font-medium capitalize transition-colors',
                      form.status === status
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    )}
                  >
                    <span className='flex items-center justify-center gap-1.5'>
                      <span className={cn('size-2 rounded-full', STATUS_DOT_CLASSES[status])} />
                      {status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <Button type='button' className='w-full' onClick={handleSaveOwnProfile}>
              Save changes
            </Button>
          </div>
        ) : (
          <>
            <div className='flex flex-col gap-3'>
              {user.email && <DetailRow icon={<MailIcon className='size-4' />} label='Email' value={user.email} />}
              {user.phone && <DetailRow icon={<PhoneIcon className='size-4' />} label='Phone' value={user.phone} />}
              {user.website && (
                <DetailRow icon={<GlobeIcon className='size-4' />} label='Website' value={user.website} />
              )}
            </div>
            {(user.company || user.country || user.timezone) && (
              <>
                <Separator />
                <div className='flex flex-col gap-3'>
                  {user.company && (
                    <DetailRow icon={<Building2Icon className='size-4' />} label='Company' value={user.company} />
                  )}
                  {user.country && (
                    <DetailRow icon={<GlobeIcon className='size-4' />} label='Country' value={user.country} />
                  )}
                  {user.timezone && (
                    <DetailRow icon={<MonitorIcon className='size-4' />} label='Timezone' value={user.timezone} />
                  )}
                </div>
              </>
            )}
            {(user.location || user.availability) && (
              <>
                <Separator />
                <div className='flex flex-col gap-3'>
                  {user.location && (
                    <DetailRow icon={<MapPinIcon className='size-4' />} label='Location' value={user.location} />
                  )}
                  {user.availability && (
                    <DetailRow
                      icon={<MonitorIcon className='size-4' />}
                      label='Availability'
                      value={user.availability}
                    />
                  )}
                </div>
              </>
            )}
            {user.tags && user.tags.length > 0 && (
              <>
                <Separator />
                <div className='flex items-start gap-2 text-sm'>
                  <TagIcon className='text-muted-foreground size-4 shrink-0' />
                  <span className='text-muted-foreground shrink-0 text-sm'>Tags</span>
                  <div className='ml-auto flex flex-wrap justify-end gap-1'>
                    {user.tags.map(tag => (
                      <Badge key={tag} variant='outline'>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
            {contactConversation && (
              <>
                <Separator />
                <div className='flex flex-col gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    className='w-full justify-start'
                    onClick={() => onMuteConversation(contactConversation.id)}
                  >
                    {contactConversation.isMuted ? 'Unmute notifications' : 'Mute notifications'}
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    className='w-full justify-start'
                    onClick={() => onPinConversation(contactConversation.id)}
                  >
                    {contactConversation.isPinned ? 'Unpin conversation' : 'Pin to top'}
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    className='w-full justify-start'
                    onClick={() => onFavouriteConversation(contactConversation.id)}
                  >
                    {contactConversation.isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    className='w-full justify-start'
                    onClick={() => onClearChat(contactConversation.id)}
                  >
                    Clear chat
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    className='w-full justify-start'
                    onClick={() => onBlockContact(user.id)}
                  >
                    {user.isBlocked ? 'Unblock contact' : 'Block contact'}
                  </Button>
                </div>
              </>
            )}
            <div className='mt-auto pt-2'>
              <Button
                type='button'
                variant='destructive'
                className='w-full gap-2'
                onClick={() => {
                  onDeleteContact(user.id)
                  onClose()
                }}
              >
                <Trash2Icon className='size-4' />
                Delete contact
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ProfileContent
