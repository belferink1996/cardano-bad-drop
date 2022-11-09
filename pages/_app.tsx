import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { ScreenSizeProvider } from '../contexts/ScreenSizeContext'
import { WalletProvider } from '../contexts/WalletContext'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ScreenSizeProvider>
      <WalletProvider>
        <Component {...pageProps} />
      </WalletProvider>
    </ScreenSizeProvider>
  )
}

export default MyApp
