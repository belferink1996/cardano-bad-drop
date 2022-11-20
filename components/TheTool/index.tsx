import { Fragment, useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import writeXlsxFile from 'write-excel-file'
import { Asset, Transaction } from '@martifylabs/mesh'
import { Autocomplete, Button, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material'
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

  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [listedCount, setListedCount] = useState<number>(0)
  const [unlistedCount, setUnlistedCount] = useState<number>(0)

  const [blockfrostKey, setBlockfrostKey] = useState<string>('')
  const [policyId, setPolicyId] = useState<string>('')

  const [balances, setBalances] = useState<Asset[]>([])
  const [selectedBalance, setSelectedBalance] = useState<string>('')

  const [loading, setLoading] = useState<boolean>(false)
  const [snapshotDone, setSnapshotDone] = useState<boolean>(false)
  const [payoutDone, setPayoutDone] = useState<boolean>(false)

  const [holdingWallets, setHoldingWallets] = useState<Holder[]>([])
  const [payoutWallets, setPayoutWallets] = useState<Payout[]>([])
  const [payoutTxHash, setPayoutTxHash] = useState<string>('')

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
    if (wallet?.getRewardAddresses) {
      ;(async () => {
        try {
          const _balances = await wallet.getBalance()
          const _stakeKeys = await wallet.getRewardAddresses()

          setBalances(_balances)
          addTranscript('Connected', _stakeKeys[0])
        } catch (error: any) {
          addTranscript('ERROR', error.message)
          console.error(error)
        }
      })()
    }
  }, [])

  const isUserSettingsExist = useCallback(
    () => !!(blockfrostKey && policyId && selectedBalance),
    [blockfrostKey, policyId, selectedBalance]
  )

  const fetchOwningWallet = useCallback(
    async (assetId: string): Promise<FetchedOwner | null> => {
      try {
        const {
          data,
        }: {
          data: {
            assetId: string
            stakeKey: string
            walletAddress: string
          }
        } = await axios.get(`/api/wallet?blockfrostKey=${blockfrostKey}&assetId=${assetId}`)

        return data
      } catch (error: any) {
        if (error?.response?.status === 401) {
          addTranscript('ERROR', 'Bad Blockfrost Key!')
          return null
        } else {
          addTranscript('ERROR', error.message)
          return await fetchOwningWallet(assetId)
        }
      }
    },
    [blockfrostKey]
  )

  const clickSnapshot = useCallback(async () => {
    setLoading(true)

    let unlistedCountForPayoutCalculation = 0
    const collectionAssets: { assetId: string }[] = []
    const holders: Holder[] = []

    for (let i = 0; i < collectionAssets.length; i++) {
      const { assetId } = collectionAssets[i]
      addTranscript(`Processing ${i + 1} / ${collectionAssets.length}`, assetId)

      const wallet = await fetchOwningWallet(assetId)
      if (!wallet) return // for managed error (like bad blockfrost key)

      const { stakeKey, walletAddress } = wallet

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

    const holdersShare = Number(balances.find(({ unit }) => unit === selectedBalance)?.quantity || 0) * 0.8
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
  }, [selectedBalance, fetchOwningWallet])

  // const clickAirdrop = useCallback(async () => {
  //   setLoading(true)

  //   try {
  //     const tx = new Transaction({ initiator: wallet })

  //     for (const { address, payout } of payoutWallets) {
  //       tx.sendLovelace(address, String(payout * MILLION))
  //     }

  //     addTranscript('Building TX')
  //     const unsignedTx = await tx.build()
  //     addTranscript('Awaiting signature')
  //     const signedTx = await wallet.signTx(unsignedTx)
  //     addTranscript('Submitting TX')
  //     const txHash = await wallet.submitTx(signedTx)

  //     addTranscript('Done!', txHash)
  //     setPayoutTxHash(txHash)
  //     setPayoutDone(true)
  //   } catch (error: any) {
  //     addTranscript('ERROR', error.message)
  //     console.error(error)
  //   }

  //   setLoading(false)
  // }, [wallet, payoutWallets])

  // const clickDownloadReceipt = useCallback(async () => {
  //   setLoading(true)

  //   const data: SpreadsheetObject[][] = [
  //     [
  //       {
  //         value: 'Wallet Address',
  //         fontWeight: 'bold',
  //       },
  //       {
  //         value: 'Stake Key',
  //         fontWeight: 'bold',
  //       },
  //       {
  //         value: 'Payout',
  //         fontWeight: 'bold',
  //       },
  //     ],
  //   ]

  //   for (const { address, stakeKey, payout } of payoutWallets) {
  //     data.push([
  //       {
  //         type: String,
  //         value: address,
  //       },
  //       {
  //         type: String,
  //         value: stakeKey,
  //       },
  //       {
  //         type: Number,
  //         value: payout,
  //       },
  //     ])
  //   }

  //   try {
  //     await writeXlsxFile<SpreadsheetObject>(data, {
  //       fileName: `Bad Drop (${new Date().toLocaleString()}) TX[${payoutTxHash}].xlsx`,
  //       // @ts-ignore
  //       columns: [{ width: 100 }, { width: 60 }, { width: 25 }],
  //     })
  //   } catch (error: any) {
  //     addTranscript('ERROR', error.message)
  //     console.error(error)
  //   }

  //   setLoading(false)
  // }, [payoutWallets, payoutTxHash])

  const styles = {
    inpWrap: {
      maxWidth: '420px',
      margin: '0.5rem auto',
    },
    inp: {
      borderRadius: '0.5rem',
    },
  }

  return (
    <div>
      <div>
        <div style={styles.inpWrap}>
          <TextField
            label='Blockfrost Key'
            variant='filled'
            size='small'
            fullWidth
            style={styles.inp}
            value={blockfrostKey}
            onChange={(e) => setBlockfrostKey(e.target.value)}
          />
          {/* How to get key */}
        </div>

        <div style={styles.inpWrap}>
          <TextField
            label='Policy ID'
            variant='filled'
            size='small'
            fullWidth
            style={styles.inp}
            value={policyId}
            onChange={(e) => setPolicyId(e.target.value)}
          />
          {/* Disclaimer: 100% unlisted holders */}
        </div>

        <div style={styles.inpWrap}>
          <FormControl variant='filled' size='small' fullWidth style={styles.inp}>
            <InputLabel id='select-balance-label'>Balance</InputLabel>
            <Select
              labelId='select-balance-label'
              label='Balance'
              value={selectedBalance}
              onChange={(e) => setSelectedBalance(e.target.value)}
            >
              {balances.map(({ unit, quantity }) =>
                unit === 'lovelace' ? (
                  <MenuItem key={`unit-${unit}`} value={unit}>
                    {unit} ({quantity})
                  </MenuItem>
                ) : null
              )}
            </Select>
          </FormControl>

          {/* 
        
          Fixed amount   OR   percent
        
          */}
        </div>
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

      <div style={{ display: 'flex', flexFlow: 'row wrap', alignItems: 'center', justifyContent: 'space-evenly' }}>
        <OnlineIndicator online={!snapshotDone && !payoutDone && !loading && isUserSettingsExist()}>
          <Button
            variant='contained'
            color='secondary'
            disabled={snapshotDone || payoutDone || loading || !isUserSettingsExist()}
            onClick={clickSnapshot}
          >
            Snapshot
          </Button>
        </OnlineIndicator>

        <OnlineIndicator online={snapshotDone && !payoutDone && !loading}>
          <Button
            variant='contained'
            color='secondary'
            disabled={!snapshotDone || payoutDone || loading}
            // onClick={clickAirdrop}
          >
            Airdrop
          </Button>
        </OnlineIndicator>

        <OnlineIndicator online={snapshotDone && payoutDone && !loading}>
          <Button
            variant='contained'
            color='secondary'
            disabled={!payoutDone || loading}
            // onClick={clickDownloadReceipt}
          >
            Download Receipt
          </Button>
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
    </div>
  )
}

export default TheTool
