// Next Imports
import Link from 'next/link'

const Footer = () => {
  return (
    <footer className='text-muted-foreground flex items-center justify-between gap-3 px-4 py-3 max-lg:flex-col sm:px-6 lg:gap-6'>
      <p className='text-sm text-balance max-lg:text-center'>
        {`©${new Date().getFullYear()}`}{' '}
        <Link href='https://shadcnstudio.com' target='_blank' className='text-primary hover:underline'>
          shadcn/studio
        </Link>
        , Made for better web design
      </p>
      <div className='*:hover:text-primary flex items-center gap-3 text-sm whitespace-nowrap max-sm:flex-wrap max-sm:justify-center sm:gap-4'>
        <Link href='https://shadcnstudio.com/license' target='_blank'>
          License
        </Link>
        <Link href='https://shadcnstudio.com/templates/admin-dashboard' target='_blank'>
          More Dashboards
        </Link>
        <Link href='https://shadcnstudio.com/docs/documentation-admin/getting-started' target='_blank'>
          Documentation
        </Link>
        <Link href='https://shadcnstudio.com/support' target='_blank'>
          Support
        </Link>
      </div>
    </footer>
  )
}

export default Footer
