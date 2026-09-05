/*
 * If you change the following items in the config object, you will not see any effect in the local development server
 * as these are stored in the cookie (cookie has the highest priority over the themeConfig):
 * 1. mode
 * 2. skin
 * 3. semiDark
 * 4. layout
 * 5. navbar.contentWidth
 * 6. contentWidth
 * 7. footer.contentWidth
 *
 * To see the effect of the above items, you can click on the reset button from the Customizer
 * which is on the top-right corner of the customizer besides the close button.
 * This will reset the cookie to the values provided in the config object below.
 *
 * Another way is to clear the cookie from the browser's Application/Storage tab and then reload the page.
 */

const themeConfig = {
  templateName: 'AdminCN',
  homePageUrl: '/dashboard/sales',
  settingsCookieName: 'shadcn-next-admin-settings',
  mode: 'system', // 'system' | 'light' | 'dark'
  themePreset: 'default', // 'default' | 'caffeine' | 'claude' | 'corporate' | 'ghibli-studio' | 'marvel' | 'material-design' | 'modern-minimal' | 'nature' | 'perplexity' | 'slack' | 'pastel-dreams'
  font: 'geist', // 'geist' | 'inter' | 'roboto' | 'nunito-sans' | 'lora' | 'geist-mono' | 'space-grotesk' | 'josefin-sans' | 'poppins' | 'open-sans' | 'montserrat' | 'raleway' | 'ubuntu' | 'noto-sans' | 'archivo' | 'archivo-narrow' | 'archivo-black' | 'archivo-condensed' | 'archivo-expanded' | 'archivo-italic' | 'archivo-light' | 'archivo-medium' | 'archivo-semibold' | 'archivo-bold' | 'archivo-extrabold' | 'archivo-black' | 'archivo-condensed' | 'archivo-expanded' | 'archivo-italic' | 'archivo-light' | 'archivo-medium' | 'archivo-semibold' | 'archivo-bold' | 'archivo-extrabold'
  radius: 'md', // 'none' | 'sm' | 'md' | 'lg'
  scale: 'md', // 'sm' | 'md' | 'lg'
  layout: 'compact', // 'compact' | 'full'
  sidebarVariant: 'default', // 'default' | 'inset' | 'floating'
  sidebarCollapsible: 'icon', // 'offcanvas' | 'icon' | 'none'
  sidebarOpen: true
} as const

export default themeConfig
