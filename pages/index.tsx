import { Button } from '@mui/material'
import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useState } from 'react'
import Modal from '../components/Modal'
import TheTool from '../components/TheTool'

const Home: NextPage = () => {
  const [showVid, setShowVid] = useState(false)

  return (
    <div className='App'>
      <Head>
        <title>Bad Drop | Cardano Airdrop Tool</title>
        <meta
          name='description'
          content='A tool designed to make airdrops on Cardano easy and accesible for everyone!'
        />
        <link rel='icon' href='https://badfoxmc.com/media/logo/white_filled.png' />
      </Head>

      <header>
        <h1>Bad Drop 🪂</h1>

        <div style={{ display: 'flex' }}>
          <Button variant='contained' color='primary' style={{ margin: 2 }} onClick={() => setShowVid(true)}>
            Tutorial
          </Button>
          <Button
            variant='contained'
            color='primary'
            style={{ margin: 2 }}
            onClick={() => window.open('https://github.com/belferink1996/cardano-bad-drop', '_blank')}
          >
            Source Code
          </Button>
        </div>
      </header>

      <main>
        <TheTool />
      </main>

      <Modal open={showVid} onClose={() => setShowVid(false)} style={{ padding: '3rem' }}>
        <iframe
          width='560'
          height='315'
          src='https://www.youtube.com/embed/JteReIm9Sv8'
          title='YouTube video player'
          frameBorder='0'
          allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
          allowFullScreen
        ></iframe>
      </Modal>

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
