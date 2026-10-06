import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { I18nProvider } from '../i18n/I18nContext'
import { TenderProvider } from '../store/TenderContext'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Tender Document Package Builder' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootComponent() {
  return (
    <I18nProvider>
      <TenderProvider>
        <Outlet />
      </TenderProvider>
    </I18nProvider>
  )
}
