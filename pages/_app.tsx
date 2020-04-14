// import UserProvider from '../context/userContext'
import 'antd/dist/antd.css'
import { CacheProvider } from '@emotion/core'
import { cache } from 'emotion'
import { globalStyles } from '../shared/styles'

import Router from 'next/router'
import 'nprogress/nprogress.css'
import NProgress from 'nprogress'

Router.events.on('routeChangeStart', url => {
  NProgress.start()
})
Router.events.on('routeChangeComplete', () => NProgress.done())
Router.events.on('routeChangeError', () => NProgress.done())

// Custom App to wrap it with context provider
export default ({ Component, pageProps }) => (
  // <UserProvider>
  <CacheProvider value = { cache } >
    { globalStyles }
    < Component {...pageProps } />
  </CacheProvider >
  // </UserProvider>
)
