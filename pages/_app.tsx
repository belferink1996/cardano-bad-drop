import Head from 'next/head'
import { Fragment } from 'react'
import type { AppProps } from 'next/app'
import '../styles/globals.css'
import 'animate.css'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Fragment>
      <Head>
        <title>Bad Drop | Cardano Airdrop Tool</title>
        <meta
          name='description'
          content='A tool designed to make airdrops on Cardano easy and accesible for everyone!'
        />
        <link rel='icon' href='https://badfoxmc.com/media/logo/white_filled.png' />
      </Head>

      <Header />
      <main className='w-screen min-h-screen bg-black bg-opacity-50'>
        <Component {...pageProps} />
      </main>
      <Footer />
    </Fragment>
  )
}

export default MyApp
