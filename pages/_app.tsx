import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { ScreenSizeProvider } from '../contexts/ScreenSizeContext'
import { WalletProvider } from '../contexts/WalletContext'
import { createTheme, ThemeProvider } from '@mui/material'

const theme = createTheme({
  palette: {
    mode: 'dark',
    secondary: {
      main: '#5A5A5A',
      contrastText: '#F5F5F5',
    },
  },
})

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ScreenSizeProvider>
      <WalletProvider>
        <ThemeProvider theme={theme}>
          <Component {...pageProps} />
        </ThemeProvider>
      </WalletProvider>
    </ScreenSizeProvider>
  )
}

export default MyApp
