// Next Imports
import Link from 'next/link'

// Third-party imports
import { ChevronLeftIcon } from 'lucide-react'

// Component Imports
import Logo from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ResetPasswordV1Form from '@/views/pages/auth/reset-password/reset-password-v1/reset-password-v1-form'

// SVG Imports
import AuthBackgroundShape from '@/assets/svg/auth-background-shape'

const ResetPasswordV1 = () => {
  return (
    <div className='relative flex h-auto min-h-screen items-center justify-center overflow-x-hidden px-4 py-10 sm:px-6 lg:px-8'>
      <div className='absolute'>
        <AuthBackgroundShape />
      </div>

      <Card className='z-1 w-full gap-6 py-6 sm:max-w-md'>
        <CardHeader className='gap-6 px-6'>
          <Link href='/'>
            <Logo className='gap-3' />
          </Link>

          <div>
            <CardTitle className='mb-2 text-2xl font-semibold'>Reset Password</CardTitle>
            <CardDescription className='text-base'>
              Please enter your current password and choose a new password to update your account security.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className='space-y-4 px-6'>
          {/* ResetPassword Form */}
          <ResetPasswordV1Form />

          <Button
            variant='ghost'
            className='group w-full'
            render={<Link href='/pages/auth/login-v1' />}
            nativeButton={false}
          >
            <ChevronLeftIcon className='size-5 transition-transform duration-200 group-hover:-translate-x-0.5' />
            Back to login
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default ResetPasswordV1
