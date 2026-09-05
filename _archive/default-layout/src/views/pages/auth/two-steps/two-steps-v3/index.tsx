// Next Imports
import Link from 'next/link'

// Components Imports
import Logo from '@/components/shared/Logo'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Silk from '@/components/ui/bg-silk'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import TwoStepsV3Form from '@/views/pages/auth/two-steps/two-steps-v2/two-steps-v2-form'

// SVG Imports
import LogoVector from '@/assets/svg/logo-vector'

const avatars = [
  {
    src: '/images/avatars/avatar-3.webp',
    fallback: 'OS',
    name: 'Olivia Sparks'
  },
  {
    src: '/images/avatars/avatar-6.webp',
    fallback: 'HL',
    name: 'Howard Lloyd'
  },
  {
    src: '/images/avatars/avatar-5.webp',
    fallback: 'HR',
    name: 'Hallie Richards'
  }
]

const TwoStepsV3 = () => {
  return (
    <div className='h-dvh lg:grid lg:grid-cols-2'>
      <div className='flex h-full items-center justify-center space-y-6 sm:px-6 md:px-8'>
        <div className='flex w-full flex-col gap-6 p-6 sm:max-w-lg'>
          <Link href='/'>
            <Logo className='gap-3' />
          </Link>

          <div>
            <h2 className='mb-2 text-2xl font-semibold'>Password reset</h2>
            <p className='text-muted-foreground'>
              We sent a code to your mobile number <span className='font-semibold'>*******1234</span>
            </p>
          </div>

          <div className='space-y-4'>
            {/* Two Steps V3 Form */}
            <TwoStepsV3Form />

            <p className='text-muted-foreground text-center'>
              Didn&apos;t get the code?{' '}
              <Link href='#' className='text-foreground hover:underline'>
                Resend
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className='bg-muted h-screen p-5 max-lg:hidden'>
        <Card className='relative h-full justify-between overflow-hidden border-none py-8'>
          <div className='pointer-events-none absolute inset-0 z-0'>
            <Silk speed={10} scale={1} color='#7B7481' noiseIntensity={0} rotation={8} />
          </div>

          <div className='pointer-events-none absolute inset-0 z-1' />

          <CardHeader className='relative z-10 gap-6 px-8'>
            <CardTitle className='text-4xl font-bold text-white xl:text-5xl/15.5'>
              Enable Two-Factor Authentication (2FA)
            </CardTitle>
            <p className='text-xl text-white'>
              Enhance the security of your account by enabling Two-Factor Authentication (2FA). With 2FA, you&apos;ll
              add an extra layer of protection.
            </p>
          </CardHeader>

          <CardContent className='relative z-10 mx-8 h-62 overflow-hidden rounded-2xl px-0'>
            <svg
              width='1094'
              height='249'
              viewBox='0 0 1094 249'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
              className='pointer-events-none absolute right-0 -z-1 select-none'
            >
              <path
                d='M0.263672 16.8809C0.263672 8.0443 7.42712 0.880859 16.2637 0.880859H786.394H999.115C1012.37 0.880859 1023.12 11.626 1023.12 24.8808L1023.12 47.3809C1023.12 60.6357 1033.86 71.3809 1047.12 71.3809H1069.6C1082.85 71.3809 1093.6 82.126 1093.6 95.3809L1093.6 232.881C1093.6 241.717 1086.43 248.881 1077.6 248.881H16.2637C7.42716 248.881 0.263672 241.717 0.263672 232.881V16.8809Z'
                fill='#ffff'
              />
            </svg>

            <div className='absolute top-0 right-0 flex size-15 items-center justify-center rounded-2xl bg-[#F5F5F5]'>
              <LogoVector className='size-15 text-black' />
            </div>

            <div className='flex flex-col gap-5 p-6 text-black'>
              <p className='line-clamp-2 pr-12 text-3xl font-bold'>Keeps your information safe</p>
              <p className='line-clamp-2 text-lg'>
                To get started, choose your preferred verification method and follow the instructions.
              </p>

              <div className='flex -space-x-4 self-end'>
                {avatars.map((avatar, index) => (
                  <Avatar key={index} className='size-12 ring-2 ring-white'>
                    <AvatarImage src={avatar.src} alt={avatar.name} />
                    <AvatarFallback className='text-xs'>{avatar.fallback}</AvatarFallback>
                  </Avatar>
                ))}
                <Avatar className='size-12 ring-2 ring-white'>
                  <AvatarFallback className='bg-[#F5F5F5] text-xs'>+3695</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default TwoStepsV3
