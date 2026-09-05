'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { CheckIcon, CopyIcon, EllipsisVerticalIcon, PlusIcon } from 'lucide-react'

// Component Imports
import { Badge } from '@/components/ui/badge'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Util Imports
import { cn } from '@/lib/utils'

type ApiKeyData = {
  id: string
  name: string
  status: 'active' | 'inactive'
  secretKey: string
  createdDate: string
}

const sampleApiKeys: ApiKeyData[] = [
  {
    id: '1',
    name: 'Production API Key',
    status: 'active',
    secretKey: 'sk_a8f3d9c2b1e4f7g6h5j8k9m0n3p2q5r8t',
    createdDate: '15 January 2026'
  },
  {
    id: '2',
    name: 'Development Key',
    status: 'active',
    secretKey: 'sk_x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4j',
    createdDate: '3 February 2026'
  },
  {
    id: '3',
    name: 'Testing Environment',
    status: 'inactive',
    secretKey: 'sk_b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s',
    createdDate: '28 December 2025'
  }
]

const ApiKey = () => {
  const [open, setOpen] = useState(false)
  const [keyName, setKeyName] = useState('')
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>(sampleApiKeys)
  const [newKeyVisible, setNewKeyVisible] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copiedNewKey, setCopiedNewKey] = useState(false)

  const generateRandomKey = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    const length = Math.floor(Math.random() * 9) + 25
    let key = ''

    for (let i = 0; i < length; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    return `sk_${key}`
  }

  const handleCreateKey = () => {
    if (!keyName.trim()) return

    const newKey: ApiKeyData = {
      id: Date.now().toString(),
      name: keyName,
      status: 'active',
      secretKey: generateRandomKey(),
      createdDate: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    }

    setApiKeys(prev => [newKey, ...prev])
    setKeyName('')
    setOpen(false)
    setNewKey(newKey.secretKey)
    setNewKeyVisible(true)
  }

  const truncateKey = (key: string) => {
    if (key.length <= 10) return key

    return `${key.slice(0, 9)}...${key.slice(-4)}`
  }

  const copyFullKey = async (key: string | null) => {
    if (!key) return

    try {
      await navigator.clipboard.writeText(key)
      setCopiedNewKey(true)
      setTimeout(() => setCopiedNewKey(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const toggleKeyStatus = (id: string) => {
    setApiKeys(prev =>
      prev.map(key => (key.id === id ? { ...key, status: key.status === 'active' ? 'inactive' : 'active' } : key))
    )
  }

  const deleteKey = (id: string) => {
    setApiKeys(prev => prev.filter(key => key.id !== id))
  }

  return (
    <div className='grid grid-cols-1 gap-10 lg:grid-cols-3'>
      {/* Vertical Tabs List */}
      <div className='flex flex-col space-y-1'>
        <h3 className='text-base font-semibold'>Generate API Key</h3>
        <p className='text-muted-foreground text-sm'>Manage your API keys and access tokens.</p>
      </div>

      {/* Content */}
      <div className='space-y-6 lg:col-span-2'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div>
            <h2 className='text-lg font-semibold'>Your API Keys</h2>
            <p className='text-muted-foreground max-w-md text-sm'>
              Do not share your API key with others or expose it in the browser. To protect your account&apos;s
              security.
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger onClick={() => setOpen(true)} render={<Button className='max-sm:w-full' />}>
              <PlusIcon />
              Create new secret key
            </DialogTrigger>

            <DialogContent className={cn('sm:max-w-lg [&>[data-slot=dialog-close]>svg]:size-5')}>
              <DialogHeader>
                <div className='space-y-1'>
                  <DialogTitle className='m-0 text-lg'>Create New Secret Key</DialogTitle>
                  <DialogDescription className='text-sm'>
                    Generate a new API key to access our services. Keep this key secure and never share it publicly.
                  </DialogDescription>
                </div>
              </DialogHeader>

              <div className='mt-4 space-y-2'>
                <Label htmlFor='key-name' className='gap-1'>
                  Name<span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='key-name'
                  type='text'
                  placeholder='Enter key name'
                  value={keyName}
                  onChange={e => setKeyName(e.target.value)}
                  required
                />
              </div>

              <div className='flex flex-col-reverse gap-4 sm:flex-row sm:justify-end'>
                <DialogClose render={<Button variant='outline' />}>Cancel</DialogClose>
                <Button onClick={handleCreateKey} disabled={!keyName.trim()}>
                  Create secret key
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          {/* Show the full secret once immediately after creation */}
          <Dialog open={newKeyVisible} onOpenChange={setNewKeyVisible}>
            <DialogContent className={cn('sm:max-w-lg [&>[data-slot=dialog-close]>svg]:size-5')}>
              <DialogHeader>
                <div className='space-y-1'>
                  <DialogTitle className='m-0 text-lg'>Your New Secret Key</DialogTitle>
                  <DialogDescription className='text-sm'>
                    This is the only time the full secret key will be shown. Copy and store it securely now.
                  </DialogDescription>
                </div>
              </DialogHeader>

              <div className='mt-4 space-y-2'>
                <Label className='gap-1'>Secret Key</Label>
                <div className='flex items-center gap-2'>
                  <code className='bg-muted rounded px-3 py-2 text-sm break-all'>{newKey}</code>
                  <Button onClick={() => copyFullKey(newKey)} className='h-9'>
                    {copiedNewKey ? <CheckIcon className='size-3.5' /> : <CopyIcon className='size-3.5' />}
                    <span className='ml-2'>{copiedNewKey ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>
              </div>

              <div className='flex flex-col-reverse gap-4 sm:flex-row sm:justify-end'>
                <DialogClose render={<Button variant='outline' />}>Close</DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className='overflow-hidden rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow className='bg-muted'>
                <TableHead className='px-4'>Name</TableHead>
                <TableHead className='px-4'>Status</TableHead>
                <TableHead className='px-4'>Secret Key</TableHead>
                <TableHead className='px-4'>Created Date</TableHead>
                <TableHead className='px-4'>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {apiKeys.map(apiKey => (
                <TableRow key={apiKey.id}>
                  <TableCell className='px-4 font-medium'>{apiKey.name}</TableCell>

                  <TableCell className='px-4'>
                    <Badge
                      variant={apiKey.status === 'active' ? 'default' : 'secondary'}
                      className={
                        apiKey.status === 'active'
                          ? 'bg-green-600/10 text-green-600'
                          : 'bg-destructive/10 text-destructive'
                      }
                    >
                      {apiKey.status}
                    </Badge>
                  </TableCell>

                  <TableCell className='px-4'>
                    <div className='flex items-center gap-2'>
                      <code className='text-muted-foreground text-sm'>{truncateKey(apiKey.secretKey)}</code>
                    </div>
                  </TableCell>

                  <TableCell className='px-4 text-sm'>{apiKey.createdDate}</TableCell>
                  <TableCell className='px-4'>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant='ghost' size='icon' className='rounded-full' />}>
                        <EllipsisVerticalIcon />
                        <span className='sr-only'>Edit menu</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className='w-20' align='end'>
                        <DropdownMenuGroup>
                          <DropdownMenuItem onClick={() => toggleKeyStatus(apiKey.id)}>
                            {apiKey.status === 'active' ? 'Disable Key' : 'Enable Key'}
                          </DropdownMenuItem>

                          <DropdownMenuItem className='text-destructive!' onClick={() => deleteKey(apiKey.id)}>
                            Delete Key
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

export default ApiKey
