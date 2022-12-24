import { Bars3Icon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import useScreenSize from '../hooks/useScreenSize'
import Modal from './layout/Modal'

const Navigation = () => {
  const router = useRouter()
  const { screenWidth } = useScreenSize()

  const [openNav, setOpenNav] = useState(false)
  const [openModal, setOpenModal] = useState(false)

  return (
    <nav>
      <button
        type='button'
        onClick={() => setOpenNav((prev) => !prev)}
        className='md:hidden flex items-center p-1 mx-1 rounded-lg text-sm hover:bg-gray-700 focus:outline-none focus:ring-gray-600 focus:ring-2'
      >
        <Bars3Icon className='w-7 h-7' />
      </button>

      <div className={(openNav ? 'block' : 'hidden') + ' md:block'}>
        <ul className='flex flex-col md:flex-row absolute right-0 md:static overflow-auto md:overflow-visible max-h-[80vh] md:max-h-auto w-9/12 md:w-auto mt-6 md:mt-0 p-4 bg-gray-900 border md:border-0 rounded-lg border-gray-700 md:space-x-8'>
          <li onClick={() => setOpenNav(false)}>
            <Link
              href='/'
              className={
                router.pathname === '/'
                  ? 'block py-2 px-3 md:p-0 w-full md:w-auto text-start md:text-center text-sm rounded text-white'
                  : 'block py-2 px-3 md:p-0 w-full md:w-auto text-start md:text-center text-sm rounded md:border-0 hover:bg-gray-700 md:hover:bg-transparent hover:text-white'
              }
            >
              Home
            </Link>
          </li>
          <li onClick={() => setOpenNav(false)}>
            <Link
              href='/tool'
              className={
                router.pathname === '/tool'
                  ? 'block py-2 px-3 md:p-0 w-full md:w-auto text-start md:text-center text-sm rounded text-white'
                  : 'block py-2 px-3 md:p-0 w-full md:w-auto text-start md:text-center text-sm rounded md:border-0 hover:bg-gray-700 md:hover:bg-transparent hover:text-white'
              }
            >
              Tool
            </Link>
          </li>
          <li onClick={() => setOpenNav(false)}>
            <button
              type='button'
              onClick={() => setOpenModal(true)}
              className='block py-2 px-3 md:p-0 w-full md:w-auto text-start md:text-center text-sm rounded md:border-0 hover:bg-gray-700 md:hover:bg-transparent hover:text-white'
            >
              Help
            </button>
          </li>
        </ul>
      </div>

      <Modal
        title='This tutorial is a bit old, but the approach is almost the same.'
        open={openModal}
        onClose={() => setOpenModal(false)}
      >
        <iframe
          className='rounded-xl'
          width={screenWidth * 0.55}
          height={screenWidth * 0.55 * 0.5625}
          allowFullScreen
          frameBorder='0'
          allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
          src='https://www.youtube.com/embed/JteReIm9Sv8'
          title='YouTube video player'
        ></iframe>
      </Modal>
    </nav>
  )
}

export default Navigation
