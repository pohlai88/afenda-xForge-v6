'use client'
import type { ReactElement } from 'react'

import {
  BookOpenIcon,
  BriefcaseBusinessIcon,
  ChevronRightIcon,
  CreditCardIcon,
  HeadphonesIcon,
  LockKeyholeIcon,
  MessagesSquareIcon,
  PhoneIcon
} from 'lucide-react'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { FaqData, FaqIconKey, FaqSupportCardIconKey } from '@/types/pages/faq'

const faqIconMap: Record<FaqIconKey, ReactElement> = {
  general: <BriefcaseBusinessIcon />,
  security: <LockKeyholeIcon />,
  billing: <CreditCardIcon />,
  support: <HeadphonesIcon />
}

const supportCardIconMap: Record<FaqSupportCardIconKey, ReactElement> = {
  support: <MessagesSquareIcon />,
  call: <PhoneIcon />,
  docs: <BookOpenIcon />
}

const FAQ = ({ data }: { data: FaqData }) => {
  const defaultCategory = data.categories[0]?.id

  return (
    <section>
      <div className='space-y-6 md:space-y-8 lg:space-y-10'>
        {/* Header */}
        <div className='bg-muted space-y-4 rounded-md px-6 py-12 text-center'>
          <Badge className='h-auto text-sm font-normal' variant='outline'>
            FAQs
          </Badge>
          <h2 className='text-2xl font-semibold md:text-3xl lg:text-4xl'>Frequently Inquired Queries</h2>
          <p className='text-muted-foreground mb-8 text-lg'>
            Find answers about analytics, permissions, billing, and operational support for your team.
          </p>
          <div className='mx-auto flex max-w-sm gap-3 max-sm:flex-col max-sm:items-center'>
            <Input type='text' placeholder='Search for an admin question' className='input-lg bg-background flex-1' />
            <Button className='text-base max-sm:w-full sm:h-10'>Search</Button>
          </div>
        </div>
        {/* FAQ List */}
        <Tabs defaultValue={defaultCategory} orientation='vertical'>
          <div className='grid w-full grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3'>
            {/* Vertical Tabs List */}
            <div className='flex flex-col items-center justify-between'>
              <TabsList className='h-max w-full flex-col gap-2 bg-transparent p-0'>
                {data.categories.map(category => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className='border-border bg-background text-foreground data-active:border-primary/20 data-active:bg-muted data-active:text-primary dark:data-active:border-primary/20 dark:data-active:bg-primary/10 dark:data-active:text-primary w-full gap-2 rounded-lg px-6 py-2.5 data-active:shadow-none!'
                  >
                    {faqIconMap[category.icon]}
                    <span className='flex-1 text-start text-base'>{category.title}</span>
                    <ChevronRightIcon className='size-4 rtl:rotate-180' />
                  </TabsTrigger>
                ))}
              </TabsList>
              <img
                src='/images/misc/faq-illustration.webp'
                alt='FAQ Illustration'
                className='hidden transition-transform duration-300 hover:scale-110 lg:block'
              />
            </div>
            {/* Tab Content */}
            <div className='lg:col-span-2'>
              {data.categories.map(category => (
                <TabsContent key={category.id} value={category.id} className='mt-0 space-y-4'>
                  <div className='flex min-h-10 items-center justify-start gap-4'>
                    <Avatar size='lg' className='bg-primary/10 rounded-md border shadow-none after:border-0'>
                      <AvatarFallback className='text-foreground rounded-md [&>svg]:size-5'>
                        {faqIconMap[category.icon]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className='font-medium'>{category.title}</h2>
                      <p className='text-muted-foreground text-sm'>{category.description}</p>
                    </div>
                  </div>
                  <Accordion
                    className='w-full overflow-hidden rounded-lg border [&>*>[data-slot="accordion-content"]]:px-0'
                    defaultValue={['item-1']}
                  >
                    {category.questions.map((item, index) => (
                      <AccordionItem key={index} value={`item-${index + 1}`}>
                        <AccordionTrigger className='px-2.5 text-base'>{item.question}</AccordionTrigger>
                        <AccordionContent className='text-muted-foreground px-2.5 text-base'>
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </TabsContent>
              ))}
            </div>
          </div>
        </Tabs>
      </div>

      {/* Contact Section */}
      <div className='mt-16 lg:mt-24'>
        <div className='space-y-4 text-center'>
          <Badge className='h-auto text-sm font-normal' variant='outline'>
            Still have questions?
          </Badge>
          <h2 className='text-2xl font-semibold md:text-3xl lg:text-4xl'>Need More Admin Help?</h2>
          <p className='text-muted-foreground text-lg'>
            Choose the best support channel for your team and get assistance from the right specialists.
          </p>
        </div>
        <div className='mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {data.supportCards.map(card => (
            <Card key={card.title} className='border-primary mx-auto h-max w-full gap-4 max-lg:last:col-span-full'>
              <Avatar className='bg-primary/10 mx-auto size-10 rounded-md border shadow-none after:border-0'>
                <AvatarFallback className='text-foreground rounded-md'>{supportCardIconMap[card.icon]}</AvatarFallback>
              </Avatar>
              <CardContent className='flex flex-col gap-4 text-center'>
                <h3 className='text-base font-medium'>{card.title}</h3>
                <p className='text-muted-foreground'>{card.description}</p>
                <Button size='lg' variant='outline' className='w-full'>
                  {card.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FAQ
