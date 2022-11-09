import { Fragment, useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { Transaction } from '@martifylabs/mesh'
import writeXlsxFile from 'write-excel-file'
import { useWallet } from '../../contexts/WalletContext'
import OnlineIndicator from '../OnlineIndicator'

const MILLION = 1000000
const EXCLUDE_ADDRESSES: string[] = []

type Transcript = {
  timestamp: number
  msg: string
  key?: string
}

type FetchedOwner = {
  assetId: string
  stakeKey: string
  walletAddress: string
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
}

type SpreadsheetObject = {
  value: string | number
  type?: StringConstructor | NumberConstructor
  fontWeight?: string
}

const TheTool = () => {
  const { wallet } = useWallet()
  const [balance, setBalance] = useState(0)

  useEffect(() => {
    if (wallet?.getLovelace) {
      ;(async () => {
        const lovelace = await wallet?.getLovelace()

        if (lovelace) {
          setBalance(Math.floor(Number(lovelace) / MILLION))
        }
      })()
    }
  }, [wallet])

  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [loading, setLoading] = useState(false)
  const [snapshotDone, setSnapshotDone] = useState(false)
  const [payoutDone, setPayoutDone] = useState(false)
  const [listedCount, setListedCount] = useState(0)
  const [unlistedCount, setUnlistedCount] = useState(0)
  const [holdingWallets, setHoldingWallets] = useState<Holder[]>([])
  const [payoutWallets, setPayoutWallets] = useState<Payout[]>([])
  const [payoutTxHash, setPayoutTxHash] = useState('')

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
    addTranscript('Welcome Admin')
  }, [])

  const fetchOwningWallet = useCallback(async (assetId: string): Promise<FetchedOwner> => {
    try {
      const {
        data,
      }: {
        data: {
          assetId: string
          stakeKey: string
          walletAddress: string
        }
      } = await axios.get(`/api/walle?blockfrostKey=${''}&assetId=${assetId}`)

      return data
    } catch (error: any) {
      addTranscript('ERROR', error.message)
      return await fetchOwningWallet(assetId)
    }
  }, [])

  const runSnapshot = useCallback(async () => {
    setLoading(true)

    let unlistedCountForPayoutCalculation = 0
    const collectionAssets: { assetId: string }[] = []
    const holders: Holder[] = []

    for (let i = 0; i < collectionAssets.length; i++) {
      const { assetId } = collectionAssets[i]
      addTranscript(`Processing ${i + 1} / ${collectionAssets.length}`, assetId)

      const { stakeKey, walletAddress } = await fetchOwningWallet(assetId)

      if (!EXCLUDE_ADDRESSES.includes(walletAddress)) {
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
      } else {
        setListedCount((prev) => prev + 1)
      }
    }

    setHoldingWallets(holders)

    const holdersShare = balance * 0.8
    const adaPerAsset = holdersShare / unlistedCountForPayoutCalculation

    setPayoutWallets(
      holders
        .map(({ stakeKey, addresses, assets }) => ({
          stakeKey,
          address: addresses[0],
          payout: Math.floor(assets.length * adaPerAsset),
        }))
        .sort((a, b) => b.payout - a.payout)
    )

    addTranscript('Done!')
    setSnapshotDone(true)
    setLoading(false)
  }, [balance, fetchOwningWallet])

  const payEveryone = useCallback(async () => {
    setLoading(true)

    try {
      const tx = new Transaction({ initiator: wallet })

      for (const { address, payout } of payoutWallets) {
        tx.sendLovelace(address, String(payout * MILLION))
      }

      addTranscript('Building TX')
      const unsignedTx = await tx.build()
      addTranscript('Awaiting signature')
      const signedTx = await wallet.signTx(unsignedTx)
      addTranscript('Submitting TX')
      const txHash = await wallet.submitTx(signedTx)

      addTranscript('Done!', txHash)
      setPayoutTxHash(txHash)
      setPayoutDone(true)
    } catch (error: any) {
      addTranscript('ERROR', error.message)
      console.error(error)
    }

    setLoading(false)
  }, [wallet, payoutWallets])

  const downloadReceipt = useCallback(async () => {
    setLoading(true)

    const data: SpreadsheetObject[][] = [
      [
        {
          value: 'Wallet Address',
          fontWeight: 'bold',
        },
        {
          value: 'Stake Key',
          fontWeight: 'bold',
        },
        {
          value: 'Payout',
          fontWeight: 'bold',
        },
      ],
    ]

    for (const { address, stakeKey, payout } of payoutWallets) {
      data.push([
        {
          type: String,
          value: address,
        },
        {
          type: String,
          value: stakeKey,
        },
        {
          type: Number,
          value: payout,
        },
      ])
    }

    try {
      await writeXlsxFile<SpreadsheetObject>(data, {
        fileName: `BadFoxMC Royalty Distribution (${new Date().toLocaleString()}) TX[${payoutTxHash}].xlsx`,
        // @ts-ignore
        columns: [{ width: 100 }, { width: 60 }, { width: 25 }],
      })
    } catch (error: any) {
      addTranscript('ERROR', error.message)
      console.error(error)
    }

    setLoading(false)
  }, [payoutWallets, payoutTxHash])

  return (
    <main>
      <div>
        <p>Balance: {balance} ADA</p>
      </div>

      <div
        style={{
          width: '69vw',
          height: '42vh',
          margin: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: 'var(--grey-darker)',
          border: '1px solid var(--grey)',
          borderRadius: '1rem',
          display: 'flex',
          flexDirection: 'column-reverse',
          overflow: 'scroll',
        }}
      >
        {transcripts.map((item) => {
          if (item) {
            const { timestamp, msg, key } = item
            return (
              <p key={timestamp} style={{ margin: 0 }}>
                {new Date(timestamp).toLocaleTimeString()} - {msg}
                {key ? (
                  <Fragment>
                    <br />
                    <span style={{ fontSize: '0.8rem' }}>{key}</span>
                  </Fragment>
                ) : null}
              </p>
            )
          } else {
            return null
          }
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-evenly' }}>
        <OnlineIndicator online={!snapshotDone && !payoutDone && !loading}>
          <button onClick={runSnapshot} disabled={snapshotDone || payoutDone || loading}>
            Run Snapshot
          </button>
        </OnlineIndicator>

        <OnlineIndicator online={snapshotDone && !payoutDone && !loading}>
          <button onClick={payEveryone} disabled={!snapshotDone || payoutDone || loading}>
            Pay Everyone
          </button>
        </OnlineIndicator>

        <OnlineIndicator online={snapshotDone && payoutDone && !loading}>
          <button onClick={downloadReceipt} disabled={!payoutDone || loading}>
            Download Receipt
          </button>
        </OnlineIndicator>
      </div>

      <div style={{ margin: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ margin: 11 }}>Listed: {listedCount}</p>
        <p style={{ margin: 11 }}>Unlisted: {unlistedCount}</p>
      </div>

      {payoutWallets.length ? (
        <table style={{ margin: '0 auto' }}>
          <thead>
            <tr>
              <th style={{ width: 100 }}>Payout</th>
              <th>Stake Key</th>
            </tr>
          </thead>
          <tbody>
            {payoutWallets.map(({ stakeKey, payout }) => (
              <tr key={stakeKey}>
                <td>{payout} ADA</td>
                <td>{stakeKey}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </main>
  )
}

export default TheTool
