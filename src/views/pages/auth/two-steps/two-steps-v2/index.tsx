// Next Imports
import Link from 'next/link'

// Components Imports
import Logo from '@/components/shared/Logo'
import { BorderBeam } from '@/components/ui/border-beam'
import TwoStepsV2Form from '@/views/pages/auth/two-steps/two-steps-v2/two-steps-v2-form'

// SVG Imports
import AuthFullBackgroundShape from '@/assets/svg/auth-full-background-shape'

const TwoStepsV2 = () => {
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

      {/* TwoSteps Form */}
      <div className='flex h-full flex-col items-center justify-center py-10 sm:px-5 lg:col-span-3 xl:col-span-2'>
        <div className='w-full max-w-md px-6'>
          <div className='flex flex-col gap-6'>
            <Link href='/'>
              <Logo className='gap-3' />
            </Link>

            <div>
              <h2 className='mb-2 text-2xl font-semibold'>Two Steps Verification</h2>
              <p className='text-muted-foreground'>
                Please confirm access to your account by entering the code provided by your authenticator application
              </p>
            </div>

            {/* Form */}
            <TwoStepsV2Form />
          </div>
        </div>
      </div>
    </div>
  )
}

export default TwoStepsV2
