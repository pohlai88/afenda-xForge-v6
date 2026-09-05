'use client'

// React Imports
import { useEffect, useRef, useState } from 'react'

// Third-party Imports
import { ImageIcon, Trash2Icon, UploadCloudIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { ButtonGroup, ButtonGroupText } from '@/components/ui/button-group'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const WorkspaceStep = () => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      const t = window.setTimeout(() => setPreview(null), 0)

      return () => clearTimeout(t)
    }

    const url = URL.createObjectURL(file)

    const t = window.setTimeout(() => setPreview(url), 0)

    return () => {
      clearTimeout(t)
      URL.revokeObjectURL(url)
    }
  }, [file])

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]

    if (!f) return

    if (!f.type.startsWith('image/')) {
      window.alert('Please select an image file')
      e.currentTarget.value = ''

      return
    }

    if (f.size > 1024 * 1024) {
      window.alert('File must be smaller than 1MB')
      e.currentTarget.value = ''

      return
    }

    setFile(f)
  }

  const openPicker = () => inputRef.current?.click()

  const remove = () => {
    setFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className='flex flex-col gap-5'>
      {/* Workspace logo */}
      <div className='w-full space-y-2'>
        <Label>Your Avatar</Label>
        <div className='flex items-center gap-4'>
          <div
            role='button'
            tabIndex={0}
            aria-label='Upload your avatar'
            onClick={openPicker}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                openPicker()
              }
            }}
            className='flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed hover:opacity-95'
          >
            {preview ? (
              <img src={preview} alt='avatar preview' className='h-full w-full object-cover' />
            ) : (
              <ImageIcon />
            )}
          </div>

          <div className='flex items-center gap-2'>
            <input ref={inputRef} type='file' accept='image/*' className='hidden' onChange={onSelect} />
            <Button type='button' variant='outline' onClick={openPicker} className='flex items-center gap-2'>
              <UploadCloudIcon />
              Upload avatar
            </Button>
            <Button
              type='button'
              variant='ghost'
              onClick={remove}
              disabled={!file}
              className='text-destructive hover:text-destructive'
            >
              <Trash2Icon />
            </Button>
          </div>
        </div>
        <p className='text-muted-foreground text-sm'>Pick a photo up to 1MB.</p>
      </div>

      {/* Workspace name */}
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='onboarding-workspace-name'>Workspace Name</Label>
        <Input id='onboarding-workspace-name' placeholder='Acme Inc.' />
      </div>

      {/* Team URL */}
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='onboarding-workspace-url'>Team URL</Label>
        <ButtonGroup className='w-full'>
          <ButtonGroupText>app.example.com/</ButtonGroupText>
          <Input id='onboarding-workspace-url' placeholder='acme' />
        </ButtonGroup>
      </div>

      {/* Description */}
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='onboarding-workspace-description'>
          Description <span className='text-muted-foreground font-normal'>(optional)</span>
        </Label>
        <Textarea
          id='onboarding-workspace-description'
          placeholder='What does your team work on?'
          className='min-h-24'
        />
      </div>

      {/* Invite emails */}
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='onboarding-invite-emails'>Invite Team Members</Label>
        <Input id='onboarding-invite-emails' placeholder='jane@acme.com, mark@acme.com' />
        <p className='text-muted-foreground text-xs'>Separate multiple emails with commas.</p>
      </div>
    </div>
  )
}

export default WorkspaceStep
