'use client'

// React Imports
import type { ReactNode } from 'react'

// Util Imports
import { cn } from '@/lib/utils'

const FORMAT_TOKEN_REGEX = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g

type MessageContentProps = {
  content: string
  isFromMe?: boolean
  className?: string
}

const renderToken = (token: string, index: number, isFromMe: boolean) => {
  const boldMatch = token.match(/^\*\*(.+)\*\*$/)

  if (boldMatch) {
    return (
      <strong key={index} className='font-semibold'>
        {boldMatch[1]}
      </strong>
    )
  }

  const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)

  if (linkMatch) {
    return (
      <a
        key={index}
        href={linkMatch[2]}
        target='_blank'
        rel='noopener noreferrer'
        className={cn(
          'font-medium underline underline-offset-2',
          isFromMe ? 'text-primary-foreground' : 'text-primary'
        )}
      >
        {linkMatch[1]}
      </a>
    )
  }

  return <span key={index}>{token}</span>
}

const parseMessageContent = (content: string, isFromMe: boolean): ReactNode[] => {
  const parts = content.split(FORMAT_TOKEN_REGEX).filter(part => part.length > 0)

  return parts.map((part, index) => renderToken(part, index, isFromMe))
}

const MessageContent = (props: MessageContentProps) => {
  // Props
  const { content, isFromMe = false, className } = props

  return <span className={className}>{parseMessageContent(content, isFromMe)}</span>
}

export default MessageContent
