import React, { createContext, useState, useContext, useMemo, useEffect, ReactNode } from 'react'
import { BrowserWallet, Wallet } from '@meshsdk/core'

type ConnectFunc = (walletName: string, callback: (mainStr: string, subStr?: string) => void) => Promise<void>

const ctxInit: {
  availableWallets: Wallet[]
  connectWallet: ConnectFunc
  connecting: boolean
  connected: boolean
  hasNoKey: boolean
  wallet: BrowserWallet
} = {
  availableWallets: [],
  connectWallet: async (walletName, callback) => {},
  connecting: false,
  connected: false,
  hasNoKey: false,
  wallet: {} as BrowserWallet,
}

const WalletContext = createContext(ctxInit)

export const useWallet = () => {
  return useContext(WalletContext)
}

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [availableWallets, setAvailableWallets] = useState<Wallet[]>(ctxInit.availableWallets)

  useEffect(() => {
    setAvailableWallets(
      BrowserWallet.getInstalledWallets().filter((wallet) => wallet.name.toLowerCase() === 'nami')
    )
  }, [])

  const [connecting, setConnecting] = useState(ctxInit.connecting)
  const [connected, setConnected] = useState(ctxInit.connected)
  const [hasNoKey, setHasNoKey] = useState(ctxInit.hasNoKey)
  const [wallet, setWallet] = useState<BrowserWallet>(ctxInit.wallet)

  const connectWallet: ConnectFunc = async (_walletName, _cb) => {
    if (connecting) return
    setConnecting(true)

    try {
      const _wallet = await BrowserWallet.enable(_walletName)

      if (_wallet) {
        const netId = await _wallet.getNetworkId()
        // 0 = testnet
        // 1 = mainnet

        if (netId) {
          const pIds = await _wallet.getPolicyIds()

          // Bad Key Policy ID
          if (pIds.includes('80e3ccc66f4dfeff6bc7d906eb166a984a1fc6d314e33721ad6add14')) {
            setWallet(_wallet)
            setConnected(true)
          } else {
            _cb("Wallet doesn't have a Bad Key 🔐", 'https://jpg.store/collection/badkey')
            setHasNoKey(true)
          }
        } else {
          _cb("Wallet isn't connected to mainnet")
        }
      } else {
        _cb('Wallet not defined')
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
      hasNoKey,
      wallet,
    }),
    [availableWallets, connecting, connected, hasNoKey, wallet]
  )

  return <WalletContext.Provider value={memoedValue}>{children}</WalletContext.Provider>
}
