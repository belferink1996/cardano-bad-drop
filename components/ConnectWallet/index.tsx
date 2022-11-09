import { useRouter } from 'next/router'
import { Fragment, useState } from 'react'
import { useScreenSize } from '../../contexts/ScreenSizeContext'
import { useWallet } from '../../contexts/WalletContext'
import Modal from '../Modal'
import Loader from '../Loader'
import Image from 'next/image'
import { Button } from '@mui/material'

export default function ConnectWallet() {
  const router = useRouter()
  const { isMobile } = useScreenSize()
  const { availableWallets, connectWallet, connecting, connected, connectedName } = useWallet()
  const [openModal, setOpenModal] = useState<boolean>(false)

  return (
    <Fragment>
      <Button
        variant='contained'
        color='primary'
        onClick={() => {
          if (connected) {
            router.push('/wallet')
          } else {
            setOpenModal(true)
          }
        }}
      >
        {connected ? 'To App' : 'Connect'}
      </Button>

      <Modal
        title={connected ? 'Wallet Connected' : 'Connect a Wallet'}
        open={openModal}
        onClose={() => setOpenModal(false)}
        style={{ maxWidth: '690px', padding: '1rem 2rem' }}
      >
        {connected ? (
          <p style={{ textAlign: 'center' }}>
            You&apos;ve succesfully connected with your <strong>{connectedName}</strong> wallet!
          </p>
        ) : (
          <Fragment>
            {availableWallets.length == 0 ? (
              <p>No wallets installed... 🥲</p>
            ) : (
              <Fragment>
                <div style={{ marginTop: '1rem', minWidth: '250px', width: '85%' }}>
                  {availableWallets.map((wallet, idx) => (
                    <Button
                      key={`Connect_Wallet_${wallet.name}`}
                      variant='text'
                      disabled={connected || connecting}
                      onClick={() => connectWallet(wallet.name)}
                      fullWidth
                      style={{
                        margin: '0.15rem auto',
                        padding: '0.5rem 1rem',
                        backgroundColor: 'var(--grey',
                        color: 'white',
                        border: '1px solid black',
                        borderRadius:
                          idx === 0 && idx === availableWallets.length - 1
                            ? '1rem'
                            : idx === 0
                            ? '1rem 1rem 0 0'
                            : idx === availableWallets.length - 1
                            ? '0 0 1rem 1rem'
                            : '0',
                        justifyContent: 'center',
                      }}
                    >
                      <Image src={wallet.icon} alt={wallet.name} width={35} height={35} />
                      &nbsp;{wallet.name}
                    </Button>
                  ))}
                </div>

                <p style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
                  <u>Disclaimer</u>: Connecting your wallet does not require a password, signature, or interaction
                  with smart contracts of any kind. It&apos;s a read-only process, your balance & assets are safe.
                  However, using this tool you may choose to build a transaction, that will require your
                  authorization. Signatures are not exposed to us, or the web, they are processed only on the
                  client side, for consumer protection.
                </p>
              </Fragment>
            )}
          </Fragment>
        )}
      </Modal>

      <Modal open={connecting} onClose={() => {}} style={{ backgroundColor: 'transparent', outline: 'none' }}>
        <Loader />
      </Modal>
    </Fragment>
  )
}
