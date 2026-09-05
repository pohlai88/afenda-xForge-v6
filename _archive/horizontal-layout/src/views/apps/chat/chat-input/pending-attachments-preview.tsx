// Third-party Imports
import { FileIcon, XIcon } from 'lucide-react'

// Type Imports
import type { PendingAttachment } from '@/types/apps/chat-types'

// Util Imports
import { cn } from '@/lib/utils'
import { formatFileSize } from './composer-utils'

export type PendingAttachmentsPreviewProps = {
  attachments: PendingAttachment[]
  onRemove: (attachmentId: string) => void
}

const PendingAttachmentsPreview = (props: PendingAttachmentsPreviewProps) => {
  // Props
  const { attachments, onRemove } = props

  if (attachments.length === 0) {
    return null
  }

  return (
    <div className='border-border bg-muted/30 rounded-lg border p-2 pt-2'>
      <p className='text-muted-foreground mb-2 px-1 text-[11px] font-medium tracking-wide uppercase'>
        Attachments ({attachments.length})
      </p>
      <div className='flex gap-2 overflow-x-auto pb-1'>
        {attachments.map(attachment => (
          <div
            key={attachment.id}
            className={cn(
              'group relative shrink-0 overflow-hidden rounded-lg border shadow-sm',
              attachment.type === 'image' ? 'w-36' : 'w-52'
            )}
          >
            {attachment.type === 'image' ? (
              <img src={attachment.previewUrl} alt={attachment.file.name} className='h-28 w-full object-cover' />
            ) : (
              <div className='bg-background flex items-center gap-3 p-3'>
                <div className='bg-muted flex size-10 shrink-0 items-center justify-center rounded-md'>
                  <FileIcon className='text-muted-foreground size-5' />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-xs font-medium'>{attachment.file.name}</p>
                  <p className='text-muted-foreground text-[10px]'>{formatFileSize(attachment.file.size)}</p>
                </div>
              </div>
            )}

            <button
              type='button'
              onClick={() => onRemove(attachment.id)}
              className='bg-background/90 text-foreground hover:bg-background absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full border shadow-sm transition-colors'
              aria-label={`Remove ${attachment.file.name}`}
            >
              <XIcon className='size-3.5' />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PendingAttachmentsPreview
