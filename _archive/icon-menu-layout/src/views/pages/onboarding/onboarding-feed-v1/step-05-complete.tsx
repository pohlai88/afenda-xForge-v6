const CompleteStep = () => {
  return (
    <div className='relative flex flex-col gap-6'>
      {/* Summary list */}
      <div className='bg-card flex max-h-130 items-center justify-center rounded-xl max-lg:overflow-hidden'>
        <img src='/images/auth-dashboard-image.webp' alt='dashboard' className='rounded-xl dark:hidden' />
        <img
          src='/images/auth-dashboard-image-dark.webp'
          alt='dashboard'
          className='hidden rounded-xl dark:inline-block'
        />
      </div>

      {/* Encouraging note */}
      <div className='from-background absolute bottom-0 z-1 h-1/2 w-full bg-linear-to-t to-transparent' />
      <p className='text-muted-foreground z-2 text-center text-sm'>
        Hit <span className='text-foreground font-semibold'>Go to Dashboard</span> on the left to start exploring.
      </p>
    </div>
  )
}

export default CompleteStep
