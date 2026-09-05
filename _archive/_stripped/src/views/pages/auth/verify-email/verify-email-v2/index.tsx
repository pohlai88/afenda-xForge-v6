// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ChevronLeftIcon } from 'lucide-react'

// Component Import
import Logo from '@/components/shared/Logo'
import { BorderBeam } from '@/components/ui/border-beam'
import { Button } from '@/components/ui/button'

// SVG Import
import AuthFullBackgroundShape from '@/assets/svg/auth-full-background-shape'

const VerifyEmailV2 = () => {
  return (
    <div className='h-dvh lg:grid lg:grid-cols-6'>
      {/* Dashboard Preview */}
      <div className='max-lg:hidden lg:col-span-3 xl:col-span-4'>
        <div className='bg-muted relative z-1 flex h-full items-center justify-center px-6'>
          <div className='outline-border relative shrink rounded-[20px] p-2.5 outline-2 -outline-offset-2'>
            <img
              src='/images/auth-dashboard-image.webp'
              className='max-h-111 w-full rounded-lg object-contain dark:hidden'
              alt='Dashboards'
            />
            <img
              src='/images/auth-dashboard-image-dark.webp'
              className='hidden max-h-111 w-full rounded-lg object-contain dark:inline-block'
              alt='Dashboards'
            />

            <BorderBeam duration={8} borderWidth={2} size={100} />
          </div>

          <div className='absolute -z-1'>
            <AuthFullBackgroundShape />
          </div>
        </div>
      </div>

      {/* Verify Email Form */}
      <div className='flex h-full flex-col items-center justify-center py-10 sm:px-5 lg:col-span-3 xl:col-span-2'>
        <div className='w-full max-w-md px-6'>
          <Link href='/' className='text-muted-foreground group mb-12 flex items-center gap-2 sm:mb-16 lg:mb-24'>
            <ChevronLeftIcon className='transition-transform duration-200 group-hover:-translate-x-0.5' />
            <p>Back to the website</p>
          </Link>

          <div className='flex flex-col gap-6'>
            <Link href='/'>
              <Logo className='gap-3' />
            </Link>

            <div>
              <h2 className='mb-2 text-2xl font-semibold'>Verify your email</h2>
              <p className='text-muted-foreground'>
                An activation link has been sent to your email address: hello@example.comello. Please check your inbox
                and click on the link to complete the activation process.
              </p>
            </div>

            <div className='space-y-4'>
              <Button className='w-full' render={<Link href='#' />} nativeButton={false}>
                Skip for now
              </Button>

              <p className='text-muted-foreground text-center'>
                Didn&apos;t get the mail?{' '}
                <Link href='#' className='text-card-foreground hover:underline'>
                  Resend
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmailV2
