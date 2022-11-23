import { Fragment, useState } from 'react'
import { useWallet } from '../../contexts/WalletContext'
import Modal from '../Modal'
import Image from 'next/image'
import { Button } from '@mui/material'

export default function ConnectWallet({ addTranscript }: { addTranscript: (msg: string, key?: string) => void }) {
  const { availableWallets, connectWallet, connecting, connected } = useWallet()
  const [openModal, setOpenModal] = useState<boolean>(false)

  return (
    <Fragment>
      <Button
        variant='contained'
        color='secondary'
        size='large'
        disabled={connected}
        onClick={() => setOpenModal(true)}
      >
        Connect
      </Button>

      <Modal
        title={connected ? 'Wallet Connected' : 'Connect a Wallet'}
        open={openModal}
        onClose={() => setOpenModal(false)}
      >
        {availableWallets.length == 0 ? (
          <p>No wallets installed... 🥲</p>
        ) : (
          <div style={{ marginTop: '1rem', minWidth: '250px', width: '85%' }}>
            {availableWallets.map((wallet) => (
              <Button
                key={`Connect_Wallet_${wallet.name}`}
                variant='contained'
                color='secondary'
                fullWidth
                disabled={connected || connecting}
                onClick={() =>
                  connectWallet(wallet.name, (err) => {
                    addTranscript('ERROR', err)
                    setOpenModal(false)
                  })
                }
              >
                <Image src={wallet.icon} alt={wallet.name} width={35} height={35} />
                &nbsp;{wallet.name}
              </Button>
            ))}
          </div>
        )}
      </Modal>
    </Fragment>
  )
}
