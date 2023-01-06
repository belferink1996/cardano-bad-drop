import { Bars3Icon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

const Navigation = () => {
  const router = useRouter()

  const [openNav, setOpenNav] = useState(false)

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
        </ul>
      </div>
    </nav>
  )
}

export default Navigation
