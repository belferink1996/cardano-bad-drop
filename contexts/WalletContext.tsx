import React, { createContext, useState, useContext, useMemo, useEffect, ReactNode } from 'react'
import { BrowserWallet, Wallet } from '@martifylabs/mesh'

const WalletContext = createContext({
  availableWallets: [] as Wallet[],
  connectWallet: async (walletName: string) => {},
  connecting: false,
  connected: false,
  connectedName: '',
  wallet: {} as BrowserWallet,
})

export const useWallet = () => {
  return useContext(WalletContext)
}

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [availableWallets, setAvailableWallets] = useState<Wallet[]>([])

  useEffect(() => {
    setAvailableWallets(BrowserWallet.getInstalledWallets())
  }, [])

  const [connecting, setConnecting] = useState<boolean>(false)
  const [connected, setConnected] = useState<boolean>(false)
  const [connectedName, setConnectedName] = useState<string>('')
  const [wallet, setWallet] = useState<BrowserWallet>({} as BrowserWallet)

  const connectWallet = async (_walletName: string) => {
    if (connecting) return
    setConnecting(true)

    try {
      const _wallet = await BrowserWallet.enable(_walletName)

      if (_wallet) {
        setWallet(_wallet)
        setConnected(true)
        setConnectedName(_walletName)
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
      connectedName,
      wallet,
    }),
    [availableWallets, connecting, connected, connectedName, wallet]
  )

  return <WalletContext.Provider value={memoedValue}>{children}</WalletContext.Provider>
}
