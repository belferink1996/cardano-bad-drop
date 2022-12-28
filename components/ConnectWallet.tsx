import Image from 'next/image'
import { Fragment, useState } from 'react'
import { useWallet } from '../contexts/WalletContext'
import Modal from './layout/Modal'

const ConnectWallet = ({ addTranscript }: { addTranscript: (msg: string, key?: string) => void }) => {
  const { availableWallets, connectWallet, connecting, connected, hasNoKey } = useWallet()
  const [openModal, setOpenModal] = useState<boolean>(false)

  return (
    <Fragment>
      <button
        type='button'
        disabled={connecting || connected || hasNoKey}
        onClick={() => setOpenModal(true)}
        className='grow m-1 p-4 rounded-xl disabled:bg-gray-900 bg-green-900 hover:bg-green-700 disabled:bg-opacity-50 bg-opacity-50 hover:bg-opacity-50 disabled:text-gray-700 hover:text-gray-200 disabled:border border hover:border disabled:border-gray-800 border-green-700 hover:border-green-700 disabled:cursor-not-allowed hover:cursor-pointer'
      >
        Connect Wallet
      </button>

      <Modal
        title={connected ? 'Wallet Connected' : 'Connect a Wallet'}
        open={!!openModal && !connecting && !connected}
        onClose={() => setOpenModal(false)}
        className='text-center'
      >
        {availableWallets.length == 0 ? (
          <p className='my-2'>Nami not installed...</p>
        ) : (
          <div className='flex flex-col min-w-[280px] w-[85%] md:w-[75%] '>
            {availableWallets.map((wallet, idx) => (
              <button
                key={`connect-wallet-${wallet.name}`}
                onClick={() =>
                  connectWallet(wallet.name, (str1, str2) => {
                    if (!str2) {
                      addTranscript('ERROR', str1)
                    } else {
                      addTranscript(str1, str2)
                    }

                    setOpenModal(false)
                  })
                }
                disabled={connecting || connected}
                className='w-full mt-1 mx-auto py-2 px-4 flex items-center justify-start bg-gray-700 border border-gray-600'
                style={{
                  borderRadius:
                    idx === 0 && idx === availableWallets.length - 1
                      ? '1rem'
                      : idx === 0
                      ? '1rem 1rem 0 0'
                      : idx === availableWallets.length - 1
                      ? '0 0 1rem 1rem'
                      : '0',
                }}
              >
                <Image src={wallet.icon} alt={wallet.name} unoptimized width={35} height={35} className='mr-2' />
                {wallet.name}
              </button>
            ))}

            <p className='w-full my-2 px-1 text-xs text-start'>
              <u>Disclaimer</u>: Connecting your wallet does not require a password. It&apos;s a read-only process.
              You will be asked to sign your transactions at the end of the process.
            </p>
          </div>
        )}
      </Modal>
    </Fragment>
  )
}

export default ConnectWallet
