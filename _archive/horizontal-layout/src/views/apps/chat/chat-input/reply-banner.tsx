// Third-party Imports
import { XIcon } from 'lucide-react'

// Type Imports
import type { Message } from '@/types/apps/chat-types'

// Util Imports
import { getMessagePreview } from '@/utils/chat-utils'

export type ReplyBannerProps = {
  replyToMessage: Message
  onClearReplyTo: () => void
}

const ReplyBanner = (props: ReplyBannerProps) => {
  // Props
  const { replyToMessage, onClearReplyTo } = props

  return (
    <div className='border-primary bg-muted/50 flex items-center gap-2 rounded-lg border-l-2 px-3 py-2'>
      <div className='min-w-0 flex-1'>
        <p className='text-primary text-xs font-medium'>Replying to</p>
        <p className='text-muted-foreground truncate text-xs'>{getMessagePreview(replyToMessage)}</p>
      </div>
      <button
        type='button'
        onClick={onClearReplyTo}
        className='text-muted-foreground hover:text-foreground shrink-0'
        aria-label='Clear reply'
      >
        <XIcon className='size-4' />
      </button>
    </div>
  )
}

export default ReplyBanner
