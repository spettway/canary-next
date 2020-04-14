import { useEffect } from 'react'
import Router from 'next/router'
import Head from 'next/head'

export default () => {
  useEffect(() => {
    const { pathname } = Router
    Router.replace('/submit/[section]', '/submit/about-you', { })
  });
  return <div>
    <Head>
      <title>Canary | Submit</title>
    </Head>
  </div>
} 