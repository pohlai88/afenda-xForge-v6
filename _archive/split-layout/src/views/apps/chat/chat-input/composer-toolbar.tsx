// Third-party Imports
import { LinkIcon, PaperclipIcon, SendIcon, SmileIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// Data Imports
import { COMMON_EMOJIS } from './composer-constants'

export type ComposerToolbarProps = {
  canSend: boolean
  isEmojiOpen: boolean
  onEmojiOpenChange: (open: boolean) => void
  onInsertEmoji: (emoji: string) => void
  onFormatBold: () => void
  onInsertLink: () => void
  onAttachClick: () => void
  onSend: () => void
}

const ComposerToolbar = (props: ComposerToolbarProps) => {
  // Props
  const { canSend, isEmojiOpen, onEmojiOpenChange, onInsertEmoji, onFormatBold, onInsertLink, onAttachClick, onSend } =
    props

  return (
    <div className='flex items-center justify-between'>
      <div className='flex items-center gap-1'>
        <Button type='button' variant='ghost' size='icon-sm' aria-label='Bold' onClick={onFormatBold}>
          <span className='text-base leading-none font-medium'>B</span>
        </Button>

        <Popover open={isEmojiOpen} onOpenChange={onEmojiOpenChange}>
          <PopoverTrigger
            render={
              <Button type='button' variant='ghost' size='icon-sm' aria-label='Insert emoji'>
                <SmileIcon className='size-4' />
              </Button>
            }
          />
          <PopoverContent align='start' className='w-64 p-2'>
            <div className='grid grid-cols-5 gap-1'>
              {COMMON_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  type='button'
                  className='hover:bg-muted rounded-md p-2 text-lg transition-colors'
                  onClick={() => onInsertEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Button type='button' variant='ghost' size='icon-sm' aria-label='Attach file' onClick={onAttachClick}>
          <PaperclipIcon className='size-4' />
        </Button>

        <Button type='button' variant='ghost' size='icon-sm' aria-label='Insert link' onClick={onInsertLink}>
          <LinkIcon className='size-4' />
        </Button>
      </div>

      <Button type='button' size='icon-sm' disabled={!canSend} onClick={onSend} aria-label='Send message'>
        <SendIcon className='size-4' />
      </Button>
    </div>
  )
}

export default ComposerToolbar
