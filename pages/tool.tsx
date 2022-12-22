import type { NextPage } from 'next'
import { WalletProvider } from '../contexts/WalletContext'
import TheTool from '../components/TheTool'

const Page: NextPage = () => {
  return (
    <WalletProvider>
      <TheTool />
    </WalletProvider>
  )
}

export default Page
