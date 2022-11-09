import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useWallet } from '../contexts/WalletContext'
import ConnectWallet from '../components/ConnectWallet'
import TheTool from '../components/TheTool'

const Home: NextPage = () => {
  const { connected } = useWallet()

  return (
    <div className='App'>
      <Head>
        <title>Bad Drop | Cardano</title>
        <meta name='description' content='A tool to make airdrops on Cardano' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <header>
        <h1>Bad Drop</h1>
      </header>

      {connected ? (
        <TheTool />
      ) : (
        <main>
          <ConnectWallet />
        </main>
      )}

      <footer>
        <a
          href='https://badfoxmc.com'
          target='_blank'
          rel='noopener noreferrer'
          style={{ display: 'flex', alignItems: 'center' }}
        >
          Developed by{' '}
          <span style={{ margin: '0 0.4rem' }}>
            <Image
              src='https://badfoxmc.com/media/logo/white_alpha.png'
              alt='Bad Fox MC Logo'
              width={42}
              height={42}
            />
          </span>{' '}
          Bad Fox Motorcycle Club™️
        </a>
      </footer>
    </div>
  )
}

export default Home
