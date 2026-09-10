// Config Imports
import themeConfig from '@/configs/themeConfig'

const Footer = () => {
  return (
    <footer className='text-muted-foreground flex items-center px-4 py-3 max-lg:justify-center sm:px-6'>
      <p className='text-sm text-balance max-lg:text-center'>
        {`©${new Date().getFullYear()} ${themeConfig.templateName}`}
      </p>
    </footer>
  )
}

export default Footer
