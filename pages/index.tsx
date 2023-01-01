import type { NextPage } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import useScreenSize from '../hooks/useScreenSize'

const About = () => {
  return (
    <div className='my-4 mx-2 md:mx-10 max-w-2xl lg:max-w-lg text-gray-300'>
      <h2 className='text-xl mb-4'>About The Tool:</h2>
      <p className='my-4 text-sm'>
        Bad Drop is responsible for distributing rewards to holders of a given Policy ID. It supports ADA, and
        Cardano Native Fungible-Tokens (such as Hosky).
      </p>
      <p className='my-4 text-sm'>
        The way it does this, is simply by utilizing Cardano&apos;s Extended UTXO model. This model basicaly allows
        you to build a transaction that includes multiple recipients.
      </p>
      <p className='my-4 text-sm'>
        Bad Drop will manage everything for you: collection snapshot, payout calculations, transaction batching
        (within Cardano&apos;s max transaction size limit), and the submitting of batched transaction(s).
      </p>

      <Link
        href='/tool'
        className='w-full p-4 block text-center rounded-xl bg-green-900 hover:bg-green-700 bg-opacity-50 hover:bg-opacity-50 hover:text-gray-200 disabled:border border hover:border border-green-700 hover:border-green-700'
      >
        Let&apos;s Do This!
      </Link>
    </div>
  )
}

const Page: NextPage = () => {
  const { screenWidth } = useScreenSize()

  const [showFemale, setShowFemale] = useState(false)
  const [logoSize, setLogoSize] = useState(1)
  const [foxSize, setFoxSize] = useState(1)
  const [bikeSize, setBikeSize] = useState(1)

  useEffect(() => {
    setShowFemale(!!Math.round(Math.random()))
  }, [])

  useEffect(() => {
    setLogoSize((screenWidth / 100) * 30.5)
    setFoxSize((screenWidth / 100) * 42)
    setBikeSize((screenWidth / 100) * 50)
  }, [screenWidth])

  return (
    <div className='px-4 flex flex-col items-center'>
      <div id='home' className='relative w-screen h-[75vh] md:h-[90vh]'>
        <div className='absolute z-10'>
          <div className='hidden lg:block animate__animated animate__fadeInRight'>
            <About />
          </div>
        </div>

        <div className='absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10'>
          <div className='animate__animated animate__infinite animate__slower animate__pulse'>
            <Image
              src='https://badfoxmc.com/media/logo/white_alpha.png'
              alt='logo'
              width={logoSize}
              height={logoSize}
              className='drop-shadow-landinglogo'
            />
          </div>
        </div>

        <div className='absolute bottom-0 right-0'>
          <div className='animate__animated animate__fadeInDown'>
            <Image
              src={`https://badfoxmc.com/media/landing/${showFemale ? 'f_fox.png' : 'm_fox.png'}`}
              alt='fox'
              width={foxSize}
              height={foxSize}
            />
          </div>
        </div>

        <div className='absolute bottom-0 left-0'>
          <div className='animate__animated animate__fadeInDown'>
            <Image
              src={`https://badfoxmc.com/media/landing/${showFemale ? 'f_bike.png' : 'm_bike.png'}`}
              alt='motorcycle'
              width={bikeSize}
              height={bikeSize / 1.7647}
            />
          </div>
        </div>
      </div>

      <div className='lg:hidden animate__animated animate__fadeInRight'>
        <About />
      </div>
    </div>
  )
}

export default Page
