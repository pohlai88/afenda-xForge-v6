// Third-party Imports
import { PlusIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function EmptyStateProject() {
  return (
    <Card className='w-full'>
      <CardHeader className='gap-0'>
        <CardTitle>Project</CardTitle>
        <CardDescription>View and analyze current stats about your business</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue='overview' className='gap-4'>
          <TabsList>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='details'>Details</TabsTrigger>
          </TabsList>
          <TabsContent value='overview' className='grid grid-cols-2 gap-4 max-sm:grid-cols-1 md:grid-cols-3'>
            <div className='border-card-foreground/10 h-30 w-full rounded-md border bg-[repeating-linear-gradient(45deg,color-mix(in_oklab,var(--card-foreground)10%,transparent),color-mix(in_oklab,var(--card-foreground)10%,transparent)_1px,var(--card)_2px,var(--card)_15px)] max-md:col-span-full md:row-span-2 md:h-64' />
            <div className='border-card-foreground/10 h-30 w-full rounded-md border bg-[repeating-linear-gradient(45deg,color-mix(in_oklab,var(--card-foreground)10%,transparent),color-mix(in_oklab,var(--card-foreground)10%,transparent)_1px,var(--card)_2px,var(--card)_15px)] md:col-span-2' />
            <div className='border-card-foreground/10 h-30 w-full rounded-md border bg-[repeating-linear-gradient(45deg,color-mix(in_oklab,var(--card-foreground)10%,transparent),color-mix(in_oklab,var(--card-foreground)10%,transparent)_1px,var(--card)_2px,var(--card)_15px)]' />
            <div className='border-card-foreground/10 h-30 w-full rounded-md border bg-[repeating-linear-gradient(45deg,color-mix(in_oklab,var(--card-foreground)10%,transparent),color-mix(in_oklab,var(--card-foreground)10%,transparent)_1px,var(--card)_2px,var(--card)_15px)] max-sm:hidden' />
            <div className='border-card-foreground/10 h-30 w-full rounded-md border bg-[repeating-linear-gradient(45deg,color-mix(in_oklab,var(--card-foreground)10%,transparent),color-mix(in_oklab,var(--card-foreground)10%,transparent)_1px,var(--card)_2px,var(--card)_15px)] max-sm:hidden' />
            <div className='border-card-foreground/10 h-30 w-full rounded-md border bg-[repeating-linear-gradient(45deg,color-mix(in_oklab,var(--card-foreground)10%,transparent),color-mix(in_oklab,var(--card-foreground)10%,transparent)_1px,var(--card)_2px,var(--card)_15px)] max-sm:hidden' />
            <div className='border-card-foreground/10 h-30 w-full rounded-md border bg-[repeating-linear-gradient(45deg,color-mix(in_oklab,var(--card-foreground)10%,transparent),color-mix(in_oklab,var(--card-foreground)10%,transparent)_1px,var(--card)_2px,var(--card)_15px)] max-sm:hidden' />
          </TabsContent>
          <TabsContent value='details' className='grid grid-cols-2 gap-4 max-sm:grid-cols-1 md:grid-cols-3'>
            <div className='border-card-foreground/10 h-30 w-full rounded-md border bg-[repeating-linear-gradient(45deg,color-mix(in_oklab,var(--card-foreground)10%,transparent),color-mix(in_oklab,var(--card-foreground)10%,transparent)_1px,var(--card)_2px,var(--card)_15px)]' />
            <div className='border-card-foreground/10 h-30 w-full rounded-md border bg-[repeating-linear-gradient(45deg,color-mix(in_oklab,var(--card-foreground)10%,transparent),color-mix(in_oklab,var(--card-foreground)10%,transparent)_1px,var(--card)_2px,var(--card)_15px)]' />
            <div className='border-card-foreground/10 h-30 w-full rounded-md border bg-[repeating-linear-gradient(45deg,color-mix(in_oklab,var(--card-foreground)10%,transparent),color-mix(in_oklab,var(--card-foreground)10%,transparent)_1px,var(--card)_2px,var(--card)_15px)] md:row-span-2 md:h-64' />
            <div className='border-card-foreground/10 h-30 w-full rounded-md border bg-[repeating-linear-gradient(45deg,color-mix(in_oklab,var(--card-foreground)10%,transparent),color-mix(in_oklab,var(--card-foreground)10%,transparent)_1px,var(--card)_2px,var(--card)_15px)] max-sm:hidden md:col-span-2' />
            <div className='border-card-foreground/10 h-30 w-full rounded-md border bg-[repeating-linear-gradient(45deg,color-mix(in_oklab,var(--card-foreground)10%,transparent),color-mix(in_oklab,var(--card-foreground)10%,transparent)_1px,var(--card)_2px,var(--card)_15px)] max-sm:hidden' />
            <div className='border-card-foreground/10 h-30 w-full rounded-md border bg-[repeating-linear-gradient(45deg,color-mix(in_oklab,var(--card-foreground)10%,transparent),color-mix(in_oklab,var(--card-foreground)10%,transparent)_1px,var(--card)_2px,var(--card)_15px)] max-sm:hidden' />
            <div className='border-card-foreground/10 h-30 w-full rounded-md border bg-[repeating-linear-gradient(45deg,color-mix(in_oklab,var(--card-foreground)10%,transparent),color-mix(in_oklab,var(--card-foreground)10%,transparent)_1px,var(--card)_2px,var(--card)_15px)] max-md:col-span-full max-sm:hidden' />
          </TabsContent>
        </Tabs>
        <div className='relative'>
          <div className='relative z-2 flex flex-col items-center justify-center'>
            <p className='text-center font-medium'>No reports created yet</p>
            <p className='text-muted-foreground text-center'>Create a new report to visualize your data</p>
            <Button className='mt-4' size='sm'>
              <PlusIcon /> New Project
            </Button>
          </div>
          <div className='from-background absolute bottom-9 z-1 h-90 w-full rounded-b-xl bg-linear-to-t to-transparent' />
        </div>
      </CardContent>
    </Card>
  )
}

export default EmptyStateProject
