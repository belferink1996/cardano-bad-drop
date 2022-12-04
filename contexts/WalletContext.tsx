import React, { createContext, useState, useContext, useMemo, useEffect, ReactNode } from 'react'
import { BrowserWallet, Wallet } from '@martifylabs/mesh'

const WalletContext = createContext({
  availableWallets: [] as Wallet[],
  connectWallet: async (walletName: string, callback: (err: string) => void) => {},
  connecting: false,
  connected: false,
  wallet: {} as BrowserWallet,
})

export const useWallet = () => {
  return useContext(WalletContext)
}

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [availableWallets, setAvailableWallets] = useState<Wallet[]>([])

  useEffect(() => {
    setAvailableWallets(
      BrowserWallet.getInstalledWallets().filter((wallet) => wallet.name.toLowerCase() === 'nami')
    )
  }, [])

  const [connecting, setConnecting] = useState<boolean>(false)
  const [connected, setConnected] = useState<boolean>(false)
  const [wallet, setWallet] = useState<BrowserWallet>({} as BrowserWallet)

  const connectWallet = async (_walletName: string, cb: (err: string) => void) => {
    if (connecting) return
    setConnecting(true)

    try {
      const _wallet = await BrowserWallet.enable(_walletName)

      if (_wallet) {
        const netId = await _wallet.getNetworkId()
        // 0 = testnet
        // 1 = mainnet

        if (netId) {
          setWallet(_wallet)
          setConnected(true)
        } else {
          cb("Wallet isn't connected to mainnet")
        }
      } else {
        cb('Wallet not defined')
      }
    } catch (error) {
      console.error(error)
    }

    setConnecting(false)
  }

  const memoedValue = useMemo(
    () => ({
      availableWallets,
      connectWallet,
      connecting,
      connected,
      wallet,
    }),
    [availableWallets, connecting, connected, wallet]
  )

  return <WalletContext.Provider value={memoedValue}>{children}</WalletContext.Provider>
}
