'use client'

// React imports
import { useEffect, useState } from 'react'

// Third-party imports
import { CalendarIcon, MailIcon, MapPinIcon, PhoneIcon, UserRoundPlusIcon, XIcon } from 'lucide-react'

// Type imports
import type { Label as ContactLabel, CreateContactInput } from '@/types/apps/contact-types'

// Component imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

// Store imports
import { useContactStore } from '@/store/use-contact-store'

// Hook imports
import { useFileUpload } from '@/hooks/use-file-upload'

// Utils imports
import { cn } from '@/lib/utils'
import { fileToDataUrl, sanitizePhoneInput, validateEmail, validatePhoneNumber } from '@/utils/contact-utils'

const labelOptions: ContactLabel[] = ['lead', 'partner', 'customer', 'vip', 'freelancer', 'supplier']

const emptyForm: CreateContactInput = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  city: '',
  notes: '',
  labels: []
}

const CreateContactForm = () => {
  const closeCreateContact = useContactStore(state => state.closeCreateContact)
  const addContact = useContactStore(state => state.addContact)

  const [form, setForm] = useState<CreateContactInput>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [{ files, errors: uploadErrors, isDragging }, { openFileDialog, getInputProps, clearFiles }] = useFileUpload({
    accept: 'image/*',
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    maxFiles: 1
  })

  const uploadedAvatar = files[0]?.preview
  const hasImage = !!uploadedAvatar

  const handleRemoveImage = () => {
    clearFiles()
  }

  useEffect(() => {
    return () => clearFiles()
  }, [clearFiles])

  const updateField = <K extends keyof CreateContactInput>(key: K, value: CreateContactInput[K]) => {
    setForm(current => ({ ...current, [key]: value }))
    setError(null)

    if (key === 'phone') {
      setPhoneError(null)
    }

    if (key === 'email') {
      setEmailError(null)
    }
  }

  const updatePhone = (value: string) => {
    updateField('phone', sanitizePhoneInput(value))
  }

  const toggleLabel = (label: ContactLabel) => {
    setForm(current => ({
      ...current,
      labels: current.labels.includes(label)
        ? current.labels.filter(item => item !== label)
        : [...current.labels, label]
    }))
  }

  const handleSubmit = async () => {
    setIsSaving(true)
    setError(null)
    setPhoneError(null)
    setEmailError(null)

    const phoneValidationError = validatePhoneNumber(form.phone)
    const emailValidationError = validateEmail(form.email)

    if (phoneValidationError) {
      setPhoneError(phoneValidationError)
      setIsSaving(false)

      return
    }

    if (emailValidationError) {
      setEmailError(emailValidationError)
      setIsSaving(false)

      return
    }

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('First name and last name are required.')
      setIsSaving(false)

      return
    }

    try {
      const uploadedFile = files[0]?.file
      let image: string | undefined

      if (uploadedFile instanceof File) {
        image = await fileToDataUrl(uploadedFile)
      }

      const result = addContact({
        ...form,
        image
      })

      if (!result) {
        setError('This phone number is already in use.')

        return
      }

      clearFiles()
      setForm(emptyForm)
    } catch {
      setError('Failed to read the uploaded image.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className='flex h-full min-h-0 flex-col gap-4'>
      <div className='relative flex h-60 shrink-0 items-center justify-center gap-2 p-4'>
        <img
          src='/images/contacts/contact-details-bg.webp'
          alt='Contact Details Background'
          className='absolute top-0 left-0 h-full w-full object-cover dark:invert'
        />
        <Button
          variant='outline'
          size='icon-xs'
          className='absolute top-4 left-4 z-1 rounded-full'
          onClick={closeCreateContact}
        >
          <XIcon />
        </Button>
        <div className='flex items-center gap-2'>
          <div className='relative shrink-0'>
            <button
              type='button'
              className={cn(
                'group focus-visible:ring-ring relative shrink-0 overflow-hidden rounded-full outline-none focus-visible:ring-2',
                isDragging && 'ring-primary ring-2 ring-offset-2'
              )}
              onClick={openFileDialog}
              aria-label='Upload contact avatar'
            >
              <Avatar className='after:border-primary/20 size-25 rounded-full'>
                {uploadedAvatar && <AvatarImage src={uploadedAvatar} alt='New contact avatar' />}
                <AvatarFallback className='bg-muted'>
                  <UserRoundPlusIcon className='text-muted-foreground size-8' />
                </AvatarFallback>
              </Avatar>
              <span className='absolute right-0 bottom-0 left-0 rounded-b-full bg-black/40 py-0.75 text-center text-xs font-medium text-white'>
                {hasImage ? 'Edit' : 'Add'}
              </span>
            </button>
            {hasImage && (
              <Button
                type='button'
                size='icon-xs'
                className='absolute top-1 right-1 z-1 size-5 rounded-full bg-black/60 text-white hover:bg-black'
                onClick={handleRemoveImage}
                aria-label='Remove avatar'
              >
                <XIcon className='text-white' />
              </Button>
            )}
          </div>
          <input {...getInputProps({ className: 'sr-only', 'aria-hidden': true })} />
          <div className='z-1 flex w-full max-w-56 flex-col gap-2'>
            <Input
              placeholder='First name'
              value={form.firstName}
              onChange={event => updateField('firstName', event.target.value)}
              className='bg-background/90'
            />
            <Input
              placeholder='Last name'
              value={form.lastName}
              onChange={event => updateField('lastName', event.target.value)}
              className='bg-background/90'
            />
          </div>
        </div>
      </div>

      <ScrollArea className='min-h-0 flex-1'>
        <div className='flex h-full flex-col justify-between gap-4 px-4'>
          <div className='flex flex-col gap-4'>
            {error && <p className='text-destructive text-sm'>{error}</p>}
            {uploadErrors.map(uploadError => (
              <p key={uploadError} className='text-destructive text-sm'>
                {uploadError}
              </p>
            ))}

            <div className='flex flex-col gap-3'>
              <h3 className='font-semibold'>Contact Info</h3>
              <div className='grid grid-cols-2 gap-3'>
                <div className='flex flex-col gap-1.5'>
                  <Label htmlFor='contact-phone' className='text-muted-foreground text-xs'>
                    Phone
                  </Label>
                  <div className='bg-muted flex items-center gap-2 rounded-md px-2 py-1.5'>
                    <PhoneIcon className='text-muted-foreground size-4 shrink-0' />
                    <Input
                      id='contact-phone'
                      placeholder='Phone number'
                      inputMode='numeric'
                      maxLength={10}
                      value={form.phone}
                      onChange={event => updatePhone(event.target.value)}
                      className='h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent'
                      aria-invalid={!!phoneError}
                    />
                  </div>
                  {phoneError && <p className='text-destructive text-xs'>{phoneError}</p>}
                </div>
                <div className='flex flex-col gap-1.5'>
                  <Label htmlFor='contact-email' className='text-muted-foreground text-xs'>
                    Email
                  </Label>
                  <div className='bg-muted flex items-center gap-2 rounded-md px-2 py-1.5'>
                    <MailIcon className='text-muted-foreground size-4 shrink-0' />
                    <Input
                      id='contact-email'
                      placeholder='Email address'
                      type='email'
                      value={form.email}
                      onChange={event => updateField('email', event.target.value)}
                      className='h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent'
                      aria-invalid={!!emailError}
                    />
                  </div>
                  {emailError && <p className='text-destructive text-xs'>{emailError}</p>}
                </div>
                <div className='flex flex-col gap-1.5'>
                  <Label htmlFor='contact-city' className='text-muted-foreground text-xs'>
                    City
                  </Label>
                  <div className='bg-muted flex items-center gap-2 rounded-md px-2 py-1.5'>
                    <MapPinIcon className='text-muted-foreground size-4 shrink-0' />
                    <Input
                      id='contact-city'
                      placeholder='City'
                      value={form.city}
                      onChange={event => updateField('city', event.target.value)}
                      className='h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent'
                    />
                  </div>
                </div>
                <div className='flex flex-col gap-1.5'>
                  <Label className='text-muted-foreground text-xs'>Added on</Label>
                  <div className='text-muted-foreground bg-muted flex items-center gap-2 rounded-md px-2 py-3 text-sm'>
                    <CalendarIcon className='size-4' />
                    <span>
                      {new Date().toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className='flex flex-col gap-3'>
              <h3 className='font-semibold'>Note</h3>
              <Textarea
                placeholder='Add a note'
                value={form.notes}
                onChange={event => updateField('notes', event.target.value)}
                className='bg-muted min-h-24 resize-none'
              />
            </div>

            <Separator />

            <div className='flex flex-col gap-3'>
              <h3 className='font-semibold'>Labels</h3>
              <div className='flex flex-wrap gap-2'>
                {labelOptions.map(label => (
                  <Badge
                    key={label}
                    variant='outline'
                    className={cn(
                      'cursor-pointer capitalize',
                      form.labels.includes(label) && 'border-primary bg-primary/10 text-primary'
                    )}
                    onClick={() => toggleLabel(label)}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className='flex items-center justify-end gap-2 pb-4'>
            <Button variant='secondary' className='w-fit' onClick={closeCreateContact} disabled={isSaving}>
              Cancel
            </Button>
            <Button className='w-fit' onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Contact'}
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

export default CreateContactForm
