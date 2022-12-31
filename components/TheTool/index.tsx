import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import writeXlsxFile from 'write-excel-file'
import { Asset, Transaction } from '@meshsdk/core'
import { useWallet } from '../../contexts/WalletContext'
import fromHex from '../../functions/hex/fromHex'
import ConnectWallet from '../ConnectWallet'
import TranscriptsViewer, { Transcript } from './TranscriptsViewer'
import Settings, { SettingsObject } from './Settings'
import Results from './Results'
import { PolicyAssetsResponse } from '../../pages/api/policy/[policy_id]'
import { FetchedOwnerResponse } from '../../pages/api/wallet'
import { FetchedTxResponse } from '../../pages/api/tx-status'
import { FetchedAssetResponse } from '../../pages/api/asset/[asset_id]'
import { ONE_MILLION } from '../../constants'

interface Balance extends Asset {
  name?: string
}

type Holder = {
  stakeKey: string
  addresses: string[]
  assets: string[]
}

type Payout = {
  stakeKey: string
  address: string
  payout: number
  txHash?: string
}

type SpreadsheetObject = {
  value: string | number
  type?: StringConstructor | NumberConstructor
  fontWeight?: string
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(() => resolve(true), ms))

const TheTool = () => {
  const { connected, connectedName, hasNoKey, wallet } = useWallet()

  const [transcripts, setTranscripts] = useState<Transcript[]>([])

  const addTranscript = (msg: string, key?: string) => {
    setTranscripts((prev) => {
      const prevCopy = [...prev]
      if (prevCopy.length >= 50) prevCopy.pop()

      return [
        {
          timestamp: new Date().getTime(),
          msg,
          key,
        },
        ...prevCopy,
      ]
    })
  }

  useEffect(() => {
    addTranscript('Welcome, please connect your wallet.', 'You have to hold a Bad Key 🔑 to access the tool 🔒')
  }, [])

  const [connectedStakeKey, setConnectedStakeKey] = useState('')
  const [tokens, setTokens] = useState<Balance[]>([])
  const [settings, setSettings] = useState<SettingsObject | null>(null)
  const [payoutWallets, setPayoutWallets] = useState<Payout[]>([])

  const [listedCount, setListedCount] = useState(0)
  const [unlistedCount, setUnlistedCount] = useState(0)

  const [loading, setLoading] = useState(false)
  const [txError, setTxError] = useState('')
  const [sessionId, setSessionId] = useState('')

  const [snapshotStarted, setSnapshotStarted] = useState(false)
  const [snapshotDone, setSnapshotDone] = useState(false)
  const [payoutStarted, setPayoutStarted] = useState(false)
  const [payoutDone, setPayoutDone] = useState(false)
  const [receiptStarted, setReceiptStarted] = useState(false)
  const [receiptDone, setReceiptDone] = useState(false)

  const isUserSettingsExist = useCallback(
    () =>
      !!(
        settings &&
        settings.policyId &&
        settings.tokenId &&
        settings.tokenBalance &&
        settings.amountType &&
        ((settings.amountType === 'Fixed' && settings.fixedAmount) ||
          (settings.amountType === 'Percent' && settings.percentAmount)) &&
        settings.splitType
      ),
    [settings]
  )

  const recordSession = useCallback(async () => {
    if (connectedStakeKey && (hasNoKey || snapshotStarted)) {
      const payload = {
        stakeKey: connectedStakeKey,
        snapshotStarted,
        snapshotDone,
        payoutStarted,
        payoutDone,
        receiptStarted,
        receiptDone,
        txError,
        settings,
      }

      try {
        if (!sessionId) {
          const { data } = await axios.post('/main-api/sessions/bad-drop', payload)
          setSessionId(data.sessionId)
        } else {
          await axios.patch(`/main-api/sessions/bad-drop?sessionId=${sessionId}`, payload)
        }
      } catch (error) {
        console.error(error)
      }
    }
  }, [
    connectedStakeKey,
    hasNoKey,
    sessionId,
    snapshotStarted,
    snapshotDone,
    payoutStarted,
    payoutDone,
    receiptStarted,
    receiptDone,
    txError,
    settings,
  ])

  useEffect(() => {
    recordSession()
  }, [recordSession])

  const fetchPolicyAssets = useCallback(
    async (_policyId: string, _allAssets?: boolean): Promise<PolicyAssetsResponse> => {
      try {
        const { data } = await axios.get<PolicyAssetsResponse>(
          `/api/policy/${_policyId}?allAssets=${!!_allAssets}`
        )

        return data
      } catch (error: any) {
        console.error(error)

        const errMsg = error.response.data || error.message
        setTxError(errMsg)
        addTranscript('ERROR', errMsg)

        if (error.response.status !== 500 && error.response.status !== 400) {
          return await fetchPolicyAssets(_policyId, _allAssets)
        } else {
          return []
        }
      }
    },
    []
  )

  const fetchOwningWallet = useCallback(
    async (_assetId: string, _policyId: string): Promise<FetchedOwnerResponse> => {
      try {
        const { data } = await axios.get<FetchedOwnerResponse>(
          `/api/wallet?assetId=${_assetId}&policyId=${_policyId}`
        )

        return data
      } catch (error: any) {
        console.error(error)
        setTxError(error.message)
        addTranscript('ERROR', error.message)
        return await fetchOwningWallet(_assetId, _policyId)
      }
    },
    []
  )

  const fetchTxConfirmation = useCallback(async (_txHash: string): Promise<FetchedTxResponse> => {
    try {
      const { data } = await axios.get<FetchedTxResponse>(`/api/tx-status?txHash=${_txHash}`)

      if (data.submitted) {
        return data
      } else {
        await sleep(1000)
        return await fetchTxConfirmation(_txHash)
      }
    } catch (error: any) {
      console.error(error)
      setTxError(error.message)
      addTranscript('ERROR', error.message)
      await sleep(1000)
      return await fetchTxConfirmation(_txHash)
    }
  }, [])

  const loadWallet = useCallback(async () => {
    setLoading(true)

    if (connected && wallet.getRewardAddresses) {
      try {
        const sKeys = await wallet.getRewardAddresses()
        addTranscript('Connected', sKeys[0])
        setConnectedStakeKey(sKeys[0])

        const pIds = await wallet.getPolicyIds()
        const fungiblePolicyIds: typeof pIds = []

        for await (const [idx, pId] of pIds.entries()) {
          addTranscript(`Processing policy ${idx + 1} / ${pIds.length}`, pId)
          const pAssets = await fetchPolicyAssets(pId)

          if (pAssets) {
            for (const { quantity } of pAssets) {
              if (Number(quantity) > 5 && !fungiblePolicyIds.find((str) => str === pId)) {
                fungiblePolicyIds.push(pId)
                addTranscript(`Fungible Token detected, total: ${fungiblePolicyIds.length}`, pId)
              }
            }
          }
        }

        if (fungiblePolicyIds.length) {
          const balances = await wallet.getBalance()

          for (const pId of fungiblePolicyIds) {
            for (const balance of balances) {
              const assetId = balance.unit

              if (assetId === 'lovelace') {
                setTokens((prev) => {
                  if (prev.find((_x) => _x.unit === assetId)) {
                    return prev
                  }

                  balance.name = 'ADA'

                  return [...prev, balance]
                })
              }

              if (Number(balance.quantity) > 1) {
                if (assetId.indexOf(pId) === 0) {
                  const { data } = await axios.get<FetchedAssetResponse>(`/api/asset/${assetId}`)

                  balance.name =
                    data.metadata?.name || data.onchain_metadata?.name || fromHex(data?.asset_name || '')

                  setTokens((prev) => [...prev, balance])
                }
              }
            }
          }
        } else {
          const lovelace = await wallet.getLovelace()
          setTokens([{ unit: 'lovelace', name: 'ADA', quantity: lovelace }])
        }

        addTranscript(
          'Define your settings below',
          "Once the snapshot's initiated, the settings can't be altered."
        )
      } catch (error: any) {
        console.error(error)
        setTxError(error.message)
        addTranscript('ERROR', error.message)
      }
    }

    setLoading(false)
  }, [connected, wallet, fetchPolicyAssets])

  useEffect(() => {
    if (!loading) loadWallet()
  }, [loadWallet])

  const clickSnapshot = useCallback(async () => {
    if (!settings) return
    setLoading(true)
    setSnapshotStarted(true)

    const holders: Holder[] = []
    const fetchedWallets: FetchedOwnerResponse[] = []
    let unlistedCountForPayoutCalculation = 0

    addTranscript('Processing policy', settings.policyId)
    const policyAssets = await fetchPolicyAssets(settings.policyId, true)

    if (!policyAssets || !policyAssets.length) {
      setLoading(false)
      setSnapshotStarted(false)
      return // for managed error (like blockfrost bad policy id)
    }

    for (let i = 0; i < policyAssets.length; i++) {
      const { asset: assetId, quantity } = policyAssets[i]

      if (quantity === '0') {
        addTranscript(`Asset ${i + 1} / ${policyAssets.length} is burned`, assetId)
      } else {
        addTranscript(`Processing asset ${i + 1} / ${policyAssets.length}`, assetId)

        // this is to improve speed, reduce backend calls
        const foundFetchedWallet = fetchedWallets.find(
          ({ assets }) => !!assets.find(({ unit }) => unit === assetId)
        )

        const wallet = foundFetchedWallet || (await fetchOwningWallet(assetId, settings.policyId))
        if (!wallet) return // for managed error (like bad blockfrost request)

        // this is to improve speed, reduce backend calls
        if (!foundFetchedWallet) {
          fetchedWallets.push(wallet)
        }

        const { isContract, stakeKey, walletAddress } = wallet

        if (isContract) {
          setListedCount((prev) => prev + 1)
        } else {
          const holderIndex = holders.findIndex((item) => item.stakeKey === stakeKey)

          if (holderIndex === -1) {
            holders.push({
              stakeKey,
              addresses: [walletAddress],
              assets: [assetId],
            })
          } else {
            if (!holders.find((item) => item.addresses.includes(walletAddress))) {
              holders[holderIndex].addresses.push(walletAddress)
            }

            holders[holderIndex].assets.push(assetId)
          }

          setUnlistedCount((prev) => prev + 1)
          unlistedCountForPayoutCalculation++
        }
      }
    }

    const totalPool =
      settings.amountType === 'Fixed'
        ? settings.fixedAmount
        : settings.amountType === 'Percent'
        ? settings.tokenBalance * (settings.percentAmount / 100)
        : 0

    const sharePerAsset = Math.floor(totalPool / unlistedCountForPayoutCalculation)

    setPayoutWallets(
      holders
        .map(({ stakeKey, addresses, assets }) => ({
          stakeKey,
          address: addresses[0],
          payout: settings.splitType === 'Equal' ? assets.length * sharePerAsset : 0,
          txHash: '',
        }))
        .sort((a, b) => b.payout - a.payout)
    )

    addTranscript('Snapshot done!')
    setSnapshotDone(true)
    setLoading(false)
  }, [settings, fetchPolicyAssets, fetchOwningWallet])

  const clickAirdrop = useCallback(
    async (difference?: number): Promise<any> => {
      setLoading(true)
      setPayoutStarted(true)

      if (!difference) {
        addTranscript('Batching TXs', 'This may take a moment...')
      }

      if (settings?.tokenId !== 'lovelace') {
        const minAdaPerHolder = 1.2
        const adaNeeded = Math.round(payoutWallets.length / minAdaPerHolder)
        const adaInWallet = Number(await wallet.getLovelace()) / ONE_MILLION

        if (adaInWallet < adaNeeded) {
          addTranscript(
            'Insufficient ADA',
            `Please acquire at least ${adaNeeded} ADA (not including UTXOs) and try again`
          )
          setLoading(false)
          return
        }
      }

      const unpayedWallets = payoutWallets.filter(({ txHash }) => !txHash)

      const batchSize = difference ? Math.floor(difference * unpayedWallets.length) : unpayedWallets.length
      const batches: Payout[][] = []

      for (let i = 0; i < unpayedWallets.length; i += batchSize) {
        batches.push(unpayedWallets.slice(i, (i / batchSize + 1) * batchSize))
      }

      try {
        for await (const [idx, batch] of batches.entries()) {
          const tx = new Transaction({ initiator: wallet })

          for (const { address, payout } of batch) {
            if (settings?.tokenId === 'lovelace') {
              if (payout < ONE_MILLION) {
                const str1 = 'Cardano requires at least 1 ADA per TX.'
                const str2 = `This wallet has only ${(payout / ONE_MILLION).toFixed(
                  2
                )} ADA assigned to it:\n${address}`
                const str3 = 'Click OK if you want to increase the payout for this wallet to 1 ADA.'
                const str4 = 'Click cancel to exclude this wallet from the airdrop.'
                const str5 = 'Note: accepting will increase the total pool size.'

                if (window.confirm(`${str1}\n\n${str2}\n\n${str3}\n${str4}\n\n${str5}`)) {
                  tx.sendLovelace({ address }, String(ONE_MILLION))
                }
              } else {
                tx.sendLovelace({ address }, String(payout))
              }
            } else {
              tx.sendAssets({ address }, [
                {
                  unit: settings?.tokenId,
                  quantity: String(payout),
                },
              ])
            }
          }

          // this may throw an error if TX size is over the limit
          const unsignedTx = await tx.build()

          addTranscript(`Building TX ${idx + 1} of ${batches.length}`)
          const signedTx = await wallet.signTx(unsignedTx)
          const txHash = await wallet.submitTx(signedTx)
          addTranscript('Awaiting network confirmation', 'This may take a moment...')
          await fetchTxConfirmation(txHash)
          addTranscript('Confirmed!', txHash)

          setPayoutWallets((prev) =>
            prev.map((prevItem) =>
              batch.some(({ stakeKey }) => stakeKey === prevItem.stakeKey)
                ? {
                    ...prevItem,
                    txHash,
                  }
                : prevItem
            )
          )
        }

        addTranscript('Airdrop done!', "You can now leave the app, don't forget to download the receipt 👍")
        setPayoutDone(true)
      } catch (error: any) {
        console.error(error?.message || error)

        if (error?.message?.indexOf('Maximum transaction size') !== -1) {
          // [Transaction] An error occurred during build: Maximum transaction size of 16384 exceeded. Found: 21861.
          const splitMessage: string[] = error.message.split(' ')
          const [max, curr] = splitMessage.filter((str) => !isNaN(Number(str))).map((str) => Number(str))
          // [16384, 21861]

          console.log('prev difference', difference)
          console.log('new difference', (difference || 1) * (max / curr))
          return await clickAirdrop((difference || 1) * (max / curr))
        } else {
          addTranscript('ERROR', error.message)
          setTxError(error.message)
        }
      }

      setLoading(false)
    },
    [wallet, settings, payoutWallets, fetchTxConfirmation]
  )

  const clickDownloadReceipt = useCallback(async () => {
    setLoading(true)
    setReceiptStarted(true)

    const data: SpreadsheetObject[][] = [
      [
        {
          value: 'Payout',
          fontWeight: 'bold',
        },
        {
          value: 'Stake Key',
          fontWeight: 'bold',
        },
        {
          value: 'Transaction Hash',
          fontWeight: 'bold',
        },
      ],
    ]

    for (const { stakeKey, payout, txHash } of payoutWallets) {
      data.push([
        {
          type: String,
          value: (settings?.tokenId === 'lovelace' ? payout / ONE_MILLION : payout).toFixed(2),
        },
        {
          type: String,
          value: stakeKey,
        },
        {
          type: String,
          value: txHash || '',
        },
      ])
    }

    try {
      await writeXlsxFile<SpreadsheetObject>(data, {
        fileName: `Bad Drop (${new Date().toLocaleDateString()}).xlsx`,
        // @ts-ignore
        columns: [{ width: 100 }, { width: 60 }, { width: 25 }, { width: 60 }],
      })
      setReceiptDone(true)
    } catch (error: any) {
      console.error(error)
      setTxError(error.message)
      addTranscript('ERROR', error.message)
    }

    setLoading(false)
  }, [settings, payoutWallets])

  return (
    <div className='w-3/4 mx-auto flex flex-col items-center'>
      <TranscriptsViewer transcripts={transcripts} />

      <div className='w-full my-4'>
        <div className='flex flex-wrap items-center justify-evenly'>
          <ConnectWallet addTranscript={addTranscript} />

          <button
            type='button'
            disabled={!connected || !isUserSettingsExist() || snapshotDone || loading}
            onClick={clickSnapshot}
            className='grow m-1 p-4 disabled:cursor-not-allowed disabled:bg-gray-900 disabled:bg-opacity-50 disabled:border-gray-800 disabled:text-gray-700 rounded-xl bg-green-900 hover:bg-green-700 bg-opacity-50 hover:bg-opacity-50 hover:text-gray-200 disabled:border border hover:border border-green-700 hover:border-green-700 hover:cursor-pointer'
          >
            Snapshot Holders
          </button>

          <button
            type='button'
            disabled={!connected || !snapshotDone || payoutDone || loading}
            onClick={() => clickAirdrop()}
            className='grow m-1 p-4 disabled:cursor-not-allowed disabled:bg-gray-900 disabled:bg-opacity-50 disabled:border-gray-800 disabled:text-gray-700 rounded-xl bg-green-900 hover:bg-green-700 bg-opacity-50 hover:bg-opacity-50 hover:text-gray-200 disabled:border border hover:border border-green-700 hover:border-green-700 hover:cursor-pointer'
          >
            Airdrop Tokens
          </button>

          <button
            type='button'
            disabled={!payoutDone || loading}
            onClick={clickDownloadReceipt}
            className='grow m-1 p-4 disabled:cursor-not-allowed disabled:bg-gray-900 disabled:bg-opacity-50 disabled:border-gray-800 disabled:text-gray-700 rounded-xl bg-green-900 hover:bg-green-700 bg-opacity-50 hover:bg-opacity-50 hover:text-gray-200 disabled:border border hover:border border-green-700 hover:border-green-700 hover:cursor-pointer'
          >
            Download Receipt
          </button>
        </div>

        {connectedName.toLowerCase() === 'eternl' ? (
          <p className='text-center text-lg text-[var(--pink)]'>
            Eternl is known to cause problems, please consider using a single-address wallet.
          </p>
        ) : null}
      </div>

      <Settings
        tokens={tokens}
        disabled={!connected || snapshotDone || loading}
        callbackSettings={(payload) => setSettings(payload)}
      />

      {snapshotStarted ? (
        <Results
          isLovelace={settings?.tokenId === 'lovelace'}
          unlisted={unlistedCount}
          listed={listedCount}
          payoutWallets={payoutWallets}
        />
      ) : null}
    </div>
  )
}

export default TheTool
