// Next Imports
import Link from 'next/link'

// Config Imports
import themeConfig from '@/configs/themeConfig'

// Point these at real destinations once they exist.
const footerLinks = [
  { label: 'Support', href: '#' },
  { label: 'Docs', href: '#' }
]

const Footer = () => {
  return (
    <footer className='text-muted-foreground flex items-center justify-between gap-3 px-4 py-3 max-lg:flex-col sm:px-6 lg:gap-6'>
      <p className='text-sm text-balance max-lg:text-center'>
        {`©${new Date().getFullYear()} ${themeConfig.templateName}`}
      </p>
      <div className='*:hover:text-primary flex items-center gap-3 text-sm whitespace-nowrap max-sm:flex-wrap max-sm:justify-center sm:gap-4'>
        {footerLinks.map(link => (
          <Link key={link.label} href={link.href}>
            {link.label}
          </Link>
        ))}
      </div>
    </footer>
  )
}

export default Footer
