'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { EllipsisVerticalIcon, MailIcon, PlusIcon } from 'lucide-react'

// SVG Import
import BadgeCheck from '@/assets/svg/badge-check'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

import type { MembersData } from '@/types/pages/user-settings-types'

type MembersProps = {
  membersData: MembersData
}

const Members = ({ membersData }: MembersProps) => {
  const [role, setRole] = useState<string | null>('')

  const [members, setMembers] = useState(() => membersData.members)

  const [pending, setPending] = useState(() => membersData.pending)

  const removeMember = (id: number) => setMembers(prev => prev.filter(m => m.id !== id))

  const revokeInvite = (id: string) => setPending(prev => prev.filter(p => p.id !== id))

  return (
    <section className='py-3'>
      <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
        <div className='space-y-1'>
          <h3 className='text-base font-semibold'>Members</h3>
          <p className='text-muted-foreground text-sm'>Manage your team members and their permissions.</p>
        </div>
        <Dialog>
          <DialogTrigger render={<Button className='max-sm:w-full' />}>
            <PlusIcon />
            Invite Member
          </DialogTrigger>
          <DialogContent className='sm:max-w-lg [&>[data-slot=dialog-close]>svg]:size-5'>
            <DialogHeader>
              <div className='space-y-1'>
                <DialogTitle className='m-0 text-lg'>Invite people to your workspace</DialogTitle>
                <DialogDescription className='text-sm'>
                  With free plan, you can add up to 10 users to each workspace.
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className='mt-4 grid grid-cols-1 gap-4'>
              <div className='w-full space-y-2'>
                <Label htmlFor='email' className='gap-1'>
                  Email<span className='text-destructive'>*</span>
                </Label>
                <InputGroup>
                  <InputGroupInput id='email' type='email' placeholder='Email address' required />
                  <InputGroupAddon align='inline-end'>
                    <MailIcon className='size-4' />
                    <span className='sr-only'>Email</span>
                  </InputGroupAddon>
                </InputGroup>
              </div>

              <div className='w-full space-y-2'>
                <Label htmlFor='invite-role'>Select role</Label>
                <Select value={role} onValueChange={val => setRole(val)}>
                  <SelectTrigger id='invite-role' className='w-full'>
                    <SelectValue placeholder='Select role...' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value='Admin'>Admin</SelectItem>
                      <SelectItem value='Contributor'>Contributor</SelectItem>
                      <SelectItem value='Viewer'>Viewer</SelectItem>
                      <SelectItem value='Member'>Member</SelectItem>
                      <SelectItem value='No Access'>No Access</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='flex flex-col-reverse gap-4 sm:flex-row sm:justify-end'>
              <DialogClose render={<Button variant='outline' />}>Cancel</DialogClose>
              <DialogClose render={<Button />}>Add user</DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {members.map((member, idx) => {
        const isAdmin = member.role === 'Admin'

        return (
          <div key={member.id}>
            <div className='flex items-center justify-between gap-3 py-1'>
              <div className='flex items-center gap-3'>
                <div className='relative w-fit'>
                  <Avatar className='size-9.5'>
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>OP</AvatarFallback>
                  </Avatar>
                  {isAdmin && (
                    <span className='absolute -top-1.5 -right-1.5'>
                      <span className='sr-only'>Verified</span>
                      <BadgeCheck className='text-background size-5 fill-sky-500' />
                    </span>
                  )}
                </div>
                <div className='flex flex-col items-start max-sm:max-w-30'>
                  <p className='text-sm font-medium'>{member.name}</p>
                  <p className='text-muted-foreground text-xs'>{member.email}</p>
                </div>
              </div>

              <div
                className={
                  isAdmin ? 'flex cursor-not-allowed items-center gap-2 opacity-60' : 'flex items-center gap-2'
                }
              >
                <Select defaultValue={member.role} disabled={isAdmin}>
                  <SelectTrigger className='w-30 px-2 py-1 max-sm:w-20'>
                    <SelectValue placeholder='Select a access' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value='Contributor'>Contributor</SelectItem>
                      <SelectItem value='Admin'>Admin</SelectItem>
                      <SelectItem value='Viewer'>Viewer</SelectItem>
                      <SelectItem value='Member'>Member</SelectItem>
                      <SelectItem value='No Access'>No Access</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button variant='ghost' size='icon' className='rounded-full' disabled={isAdmin} />}
                  >
                    <EllipsisVerticalIcon /> <span className='sr-only'>Edit menu</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className='w-20' align='end'>
                    <DropdownMenuGroup>
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem
                        className='text-destructive hover:bg-destructive/10! hover:text-destructive! transition-colors duration-300'
                        onClick={() => removeMember(member.id)}
                      >
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {idx !== members.length - 1 && <Separator className='my-2' />}
          </div>
        )
      })}

      <div className='mt-10'>
        <h3 className='text-base font-medium'>Pending invitations</h3>
        <div className='mt-6'>
          {pending.map((invite, idx) => (
            <div key={invite.id}>
              <div className='flex items-center justify-between gap-3 py-1'>
                <div className='flex items-center gap-3'>
                  <Avatar className='border-primary size-9.5 border border-dashed'>
                    <AvatarImage src={invite.avatar} />
                    <AvatarFallback>OP</AvatarFallback>
                  </Avatar>
                  <div className='flex flex-col items-start max-sm:max-w-30'>
                    <p className='text-sm font-medium'>{invite.name}</p>
                    <p className='text-muted-foreground text-xs'>{invite.email}</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Select defaultValue={invite.role}>
                    <SelectTrigger className='w-30 px-2 py-1 max-sm:w-20'>
                      <SelectValue placeholder='Select a access' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value='Contributor'>Contributor</SelectItem>
                        <SelectItem value='Admin'>Admin</SelectItem>
                        <SelectItem value='Viewer'>Viewer</SelectItem>
                        <SelectItem value='Member'>Member</SelectItem>
                        <SelectItem value='No Access'>No Access</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant='ghost' size='icon' className='rounded-full' />}>
                      <EllipsisVerticalIcon />
                      <span className='sr-only'>Edit menu</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className='w-20' align='end'>
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          className='text-destructive hover:bg-destructive/10! hover:text-destructive! transition-colors duration-300'
                          onClick={() => revokeInvite(invite.id)}
                        >
                          Revoke
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              {idx !== pending.length - 1 && <Separator className='my-2' />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Members
