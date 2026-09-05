// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ChevronLeftIcon } from 'lucide-react'

// Component Import
import Logo from '@/components/shared/Logo'
import { BorderBeam } from '@/components/ui/border-beam'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import RegisterV2Form from '@/views/pages/auth/register/register-v2/register-v2-form'

// SVG Import
import AuthFullBackgroundShape from '@/assets/svg/auth-full-background-shape'

const RegisterV2 = () => {
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

      {/* Register Form */}
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
              <h2 className='mb-1.5 text-2xl font-semibold'>Sign Up to Shadcn Studio</h2>
              <p className='text-muted-foreground'>Ship Faster and Focus on Growth.</p>
            </div>

            {/* Form */}
            <RegisterV2Form />

            <div className='space-y-4'>
              <p className='text-muted-foreground text-center'>
                Already have an account?{' '}
                <Link href='/pages/auth/login-v2' className='text-foreground hover:underline'>
                  Sign in instead
                </Link>
              </p>

              <div className='flex items-center gap-4'>
                <Separator className='flex-1' />
                <p>or</p>
                <Separator className='flex-1' />
              </div>

              <Button variant='ghost' className='w-full'>
                Sign in with google
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterV2
