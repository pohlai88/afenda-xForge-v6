'use client'

// React Imports
import { useCallback, useEffect, useRef, useState } from 'react'

// Third-party Imports
import {
  BoldIcon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  MoreVerticalIcon,
  PaperclipIcon,
  SendIcon,
  Trash2Icon,
  UnderlineIcon,
  XIcon
} from 'lucide-react'

// Type Imports
import type { ComposeEmailPayload } from '@/types/apps/mail-types'

// Component Imports
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ComposeFieldRow } from './compose-field-row'
import { FormatButton } from './format-button'

// Config Imports
import { deriveRecipientEmailAddress } from '@/configs/mailConfig'

// Util Imports
import { cn } from '@/lib/utils'

export interface MailComposeProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSend: (payload: ComposeEmailPayload) => void
  onSaveDraft: (payload: ComposeEmailPayload) => void
}

export type ComposeFormState = {
  to: string
  cc: string
  bcc: string
  subject: string
  body: string
}

export const INITIAL_COMPOSE_FORM_STATE: ComposeFormState = {
  to: '',
  cc: '',
  bcc: '',
  subject: '',
  body: ''
}

export const MailCompose = ({ open, onOpenChange, onSend, onSaveDraft }: MailComposeProps) => {
  // Props

  // States
  const [composeForm, setComposeForm] = useState<ComposeFormState>(INITIAL_COMPOSE_FORM_STATE)
  const [isCcVisible, setIsCcVisible] = useState(false)
  const [isBccVisible, setIsBccVisible] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([])

  // Vars
  const hasComposeContent =
    composeForm.to.trim().length > 0 ||
    composeForm.cc.trim().length > 0 ||
    composeForm.bcc.trim().length > 0 ||
    composeForm.subject.trim().length > 0 ||
    composeForm.body.trim().length > 0 ||
    attachmentFiles.length > 0

  const isSendEnabled =
    composeForm.to.trim().length > 0 && composeForm.subject.trim().length > 0 && composeForm.body.trim().length > 0

  const minimizedWindowLabel = composeForm.subject.trim() || composeForm.to.trim() || 'New Message'

  // Refs
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const wasMinimizedRef = useRef(false)

  // Hooks
  const resetComposeForm = useCallback(() => {
    setComposeForm(INITIAL_COMPOSE_FORM_STATE)
    setIsCcVisible(false)
    setIsBccVisible(false)
    setIsMinimized(false)
    setAttachmentFiles([])

    if (editorRef.current) {
      editorRef.current.innerHTML = ''
    }
  }, [])

  const syncComposeBodyFromEditor = useCallback(() => {
    const messageBody = editorRef.current?.innerText ?? ''

    setComposeForm(currentForm => ({ ...currentForm, body: messageBody }))
  }, [])

  const handleClose = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        resetComposeForm()
      }

      onOpenChange(nextOpen)
    },
    [onOpenChange, resetComposeForm]
  )

  const buildComposePayload = useCallback((): ComposeEmailPayload => {
    syncComposeBodyFromEditor()

    return {
      to: composeForm.to.trim(),
      toEmail: deriveRecipientEmailAddress(composeForm.to.trim()),
      cc: composeForm.cc.trim() || undefined,
      bcc: composeForm.bcc.trim() || undefined,
      subject: composeForm.subject.trim(),
      body: editorRef.current?.innerText.trim() ?? composeForm.body.trim()
    }
  }, [composeForm, syncComposeBodyFromEditor])

  const handleSend = () => {
    const composePayload = buildComposePayload()

    if (!composePayload.to || !composePayload.subject || !composePayload.body) {
      return
    }

    onSend(composePayload)
    resetComposeForm()
  }

  const handleSaveDraft = () => {
    const composePayload = buildComposePayload()

    onSaveDraft(composePayload)
    resetComposeForm()
  }

  const handleDiscard = () => {
    handleClose(false)
  }

  const handleMinimize = () => {
    syncComposeBodyFromEditor()
    setIsMinimized(true)
  }

  const handleRestore = () => {
    setIsMinimized(false)
  }

  const applyFormat = (command: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false)
    syncComposeBodyFromEditor()
  }

  const handleAttachmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? [])

    if (selectedFiles.length > 0) {
      setAttachmentFiles(currentFiles => [...currentFiles, ...selectedFiles])
    }

    event.target.value = ''
  }

  const toggleRecipientFieldVisibility = (field: 'cc' | 'bcc') => {
    if (field === 'cc') {
      setIsCcVisible(currentValue => !currentValue)

      return
    }

    setIsBccVisible(currentValue => !currentValue)
  }

  useEffect(() => {
    if (wasMinimizedRef.current && !isMinimized && editorRef.current) {
      editorRef.current.innerText = composeForm.body
    }

    wasMinimizedRef.current = isMinimized
  }, [composeForm.body, isMinimized])

  return (
    <>
      <Dialog open={open && !isMinimized} onOpenChange={handleClose}>
        <DialogContent
          showCloseButton={false}
          className='gap-0 overflow-hidden rounded-lg p-0 shadow-xl ring-1 sm:top-auto sm:right-6 sm:bottom-6 sm:left-auto sm:max-w-xl sm:translate-x-0 sm:translate-y-0 lg:max-w-3xl'
        >
          <div className='bg-muted/40 border-border flex items-center justify-between border-b px-5 py-3.5'>
            <DialogTitle className='text-base font-medium'>Compose Mail</DialogTitle>
            <div className='flex items-center gap-0.5'>
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                className='text-muted-foreground hover:text-foreground'
                onClick={handleMinimize}
              >
                <MinusIcon className='size-4' />
                <span className='sr-only'>Minimize</span>
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                className='text-muted-foreground hover:text-foreground'
                onClick={handleDiscard}
              >
                <XIcon className='size-4' />
                <span className='sr-only'>Close</span>
              </Button>
            </div>
          </div>

          <div className='bg-background flex flex-col'>
            <ComposeFieldRow
              label='To:'
              id='compose-to'
              value={composeForm.to}
              placeholder='Recipients'
              onChange={value => setComposeForm(currentForm => ({ ...currentForm, to: value }))}
              trailing={
                <div className='text-muted-foreground flex shrink-0 items-center gap-1 text-sm'>
                  <button
                    type='button'
                    className={cn(
                      'hover:text-foreground transition-colors',
                      isCcVisible && 'text-foreground font-medium'
                    )}
                    onClick={() => toggleRecipientFieldVisibility('cc')}
                  >
                    Cc
                  </button>
                  <span>|</span>
                  <button
                    type='button'
                    className={cn(
                      'hover:text-foreground transition-colors',
                      isBccVisible && 'text-foreground font-medium'
                    )}
                    onClick={() => toggleRecipientFieldVisibility('bcc')}
                  >
                    Bcc
                  </button>
                </div>
              }
            />

            {isCcVisible && (
              <ComposeFieldRow
                label='Cc:'
                id='compose-cc'
                value={composeForm.cc}
                placeholder='Carbon copy recipients'
                onChange={value => setComposeForm(currentForm => ({ ...currentForm, cc: value }))}
              />
            )}

            {isBccVisible && (
              <ComposeFieldRow
                label='Bcc:'
                id='compose-bcc'
                value={composeForm.bcc}
                placeholder='Blind carbon copy recipients'
                onChange={value => setComposeForm(currentForm => ({ ...currentForm, bcc: value }))}
              />
            )}

            <ComposeFieldRow
              label='Subject:'
              id='compose-subject'
              value={composeForm.subject}
              placeholder='Email subject'
              onChange={value => setComposeForm(currentForm => ({ ...currentForm, subject: value }))}
            />

            <div className='border-border flex items-center gap-0.5 border-b px-3 py-1.5'>
              <FormatButton label='Bold' onClick={() => applyFormat('bold')}>
                <BoldIcon className='size-4' />
              </FormatButton>
              <FormatButton label='Italic' onClick={() => applyFormat('italic')}>
                <ItalicIcon className='size-4' />
              </FormatButton>
              <FormatButton label='Underline' onClick={() => applyFormat('underline')}>
                <UnderlineIcon className='size-4' />
              </FormatButton>
              <div className='bg-border mx-1 h-5 w-px' />
              <FormatButton label='Numbered list' onClick={() => applyFormat('insertOrderedList')}>
                <ListOrderedIcon className='size-4' />
              </FormatButton>
              <FormatButton label='Bulleted list' onClick={() => applyFormat('insertUnorderedList')}>
                <ListIcon className='size-4' />
              </FormatButton>
              <div className='bg-border mx-1 h-5 w-px' />
              <FormatButton label='Insert link' onClick={() => applyFormat('createLink')}>
                <LinkIcon className='size-4' />
              </FormatButton>
              <FormatButton label='Insert image' onClick={() => applyFormat('insertImage')}>
                <ImageIcon className='size-4' />
              </FormatButton>
            </div>

            <div
              ref={editorRef}
              contentEditable
              role='textbox'
              aria-multiline='true'
              aria-label='Message body'
              data-placeholder='Write your message...'
              onInput={syncComposeBodyFromEditor}
              onBlur={syncComposeBodyFromEditor}
              className='empty:before:text-muted-foreground min-h-72 px-5 py-4 text-sm leading-relaxed outline-none empty:before:italic empty:before:content-[attr(data-placeholder)]'
            />

            {attachmentFiles.length > 0 && (
              <div className='border-border flex flex-wrap gap-2 border-t px-5 py-3'>
                {attachmentFiles.map((attachmentFile, attachmentIndex) => (
                  <div
                    key={`${attachmentFile.name}-${attachmentIndex}`}
                    className='bg-muted text-muted-foreground flex items-center gap-2 rounded-md px-3 py-1.5 text-xs'
                  >
                    <PaperclipIcon className='size-3' />
                    <span className='max-w-40 truncate'>{attachmentFile.name}</span>
                    <button
                      type='button'
                      className='hover:text-foreground'
                      onClick={() =>
                        setAttachmentFiles(currentFiles =>
                          currentFiles.filter((_, fileIndex) => fileIndex !== attachmentIndex)
                        )
                      }
                    >
                      <XIcon className='size-3' />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className='border-border flex items-center justify-between border-t px-5 py-3.5'>
            <div className='flex items-center gap-2'>
              <Button type='button' disabled={!isSendEnabled} onClick={handleSend} className='gap-2 rounded-lg px-5'>
                Send
                <SendIcon className='size-4' />
              </Button>
              <input ref={fileInputRef} type='file' multiple className='hidden' onChange={handleAttachmentChange} />
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon-sm'
                      className='text-muted-foreground hover:text-foreground relative'
                      onClick={() => fileInputRef.current?.click()}
                    />
                  }
                >
                  <PaperclipIcon className='size-4' />
                  <span className='sr-only'>Attach files</span>
                  {attachmentFiles.length > 0 && (
                    <span className='bg-primary text-primary-foreground absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-[10px]'>
                      {attachmentFiles.length}
                    </span>
                  )}
                </TooltipTrigger>
                <TooltipContent>Attach files</TooltipContent>
              </Tooltip>
            </div>

            <div className='flex items-center gap-1'>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon-sm'
                      className='text-muted-foreground hover:text-foreground'
                    />
                  }
                >
                  <MoreVerticalIcon className='size-4' />
                  <span className='sr-only'>More options</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem onClick={handleSaveDraft} disabled={!hasComposeContent}>
                    Save draft
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleMinimize}>Minimize</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant='destructive' onClick={handleDiscard}>
                    Discard
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon-sm'
                      className='text-muted-foreground hover:text-foreground'
                      onClick={handleDiscard}
                    />
                  }
                >
                  <Trash2Icon className='size-4' />
                  <span className='sr-only'>Discard</span>
                </TooltipTrigger>
                <TooltipContent>Discard</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {open && isMinimized && (
        <div className='border-border bg-background fixed right-6 bottom-6 z-50 flex w-80 items-center justify-between rounded-lg border px-4 py-3 shadow-lg'>
          <button type='button' className='flex-1 truncate text-left text-sm font-medium' onClick={handleRestore}>
            Compose Mail — {minimizedWindowLabel}
          </button>
          <div className='flex items-center gap-0.5'>
            <Button type='button' variant='ghost' size='icon-sm' onClick={handleRestore}>
              <MinusIcon className='size-4 rotate-180' />
              <span className='sr-only'>Restore</span>
            </Button>
            <Button type='button' variant='ghost' size='icon-sm' onClick={handleDiscard}>
              <XIcon className='size-4' />
              <span className='sr-only'>Close</span>
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

export default MailCompose
