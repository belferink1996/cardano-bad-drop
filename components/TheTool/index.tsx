import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import writeXlsxFile from 'write-excel-file'
import { Asset, Transaction } from '@martifylabs/mesh'
import {
  Button,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Popover,
  Radio,
  RadioGroup,
  Select,
  TextField,
} from '@mui/material'
import { Help as HelpIcon, Info as InfoIcon } from '@mui/icons-material'
import { useWallet } from '../../contexts/WalletContext'
import OnlineIndicator from '../OnlineIndicator'
import ConnectWallet from '../ConnectWallet'

const MILLION = 1000000

type Transcript = {
  timestamp: number
  msg: string
  key?: string
}

type FetchedAsset = {
  asset: string
  quantity: string
}

type FetchedOwner = {
  isContract: boolean
  stakeKey: string
  walletAddress: string
  assets: {
    unit: string
    quantity: string
  }[]
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

type TxStatus = {
  txHash: string
  submitted: boolean
}

type SpreadsheetObject = {
  value: string | number
  type?: StringConstructor | NumberConstructor
  fontWeight?: string
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(() => resolve(true), ms))

const TheTool = () => {
  const { connected, wallet } = useWallet()

  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [listedCount, setListedCount] = useState<number>(0)
  const [unlistedCount, setUnlistedCount] = useState<number>(0)

  const [tokens, setTokens] = useState<Asset[]>([])
  const [payoutWallets, setPayoutWallets] = useState<Payout[]>([])

  const [blockfrostKey, setBlockfrostKey] = useState<string>('')
  const [policyId, setPolicyId] = useState<string>('')
  const [selectedToken, setSelectedToken] = useState<'lovelace' | ''>('')
  const [tokenQuantity, setTokenQuantity] = useState<number>(0)
  const [tokenAmountType, setTokenAmountType] = useState<'Fixed' | 'Percent' | ''>('')
  const [tokenFixedAmount, setTokenFixedAmount] = useState<number>(0)
  const [tokenPercentAmount, setTokenPercentAmount] = useState<number>(0)

  const [loading, setLoading] = useState<boolean>(false)
  const [snapshotDone, setSnapshotDone] = useState<boolean>(false)
  const [payoutDone, setPayoutDone] = useState<boolean>(false)

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
    ;(async () => {
      if (connected && wallet?.getRewardAddresses) {
        try {
          const _balances = await wallet.getBalance()
          const _stakeKeys = await wallet.getRewardAddresses()

          setTokens(_balances)
          addTranscript('Connected', _stakeKeys[0])
          await sleep(100)
          addTranscript(
            'Enter the above settings ☝️',
            "We currently support ADA/Lovelace. Other FT's will be supported upon request."
          )
        } catch (error: any) {
          addTranscript('ERROR', error.message)
          console.error(error)
        }
      } else {
        addTranscript('Welcome', 'Please connect with the wallet you want to airdrop with.')
      }
    })()
  }, [connected, wallet])

  const isUserSettingsExist = useCallback(
    () =>
      !!(
        blockfrostKey &&
        policyId &&
        selectedToken &&
        tokenAmountType &&
        ((tokenAmountType === 'Fixed' && tokenFixedAmount) ||
          (tokenAmountType === 'Percent' && tokenPercentAmount))
      ),
    [blockfrostKey, policyId, selectedToken, tokenAmountType, tokenFixedAmount, tokenPercentAmount]
  )

  const fetchPolicyAssets = useCallback(
    async (_policyId: string): Promise<FetchedAsset[] | null> => {
      try {
        const {
          data,
        }: {
          data: FetchedAsset[]
        } = await axios.get(`/api/assets?blockfrostKey=${blockfrostKey}&policyId=${_policyId}`)

        return data
      } catch (error: any) {
        if (error?.response?.status === 401) {
          addTranscript('ERROR', 'Bad Blockfrost Key!')
          return null
        } else {
          addTranscript('ERROR', error.message)
          return await fetchPolicyAssets(_policyId)
        }
      }
    },
    [blockfrostKey]
  )

  const fetchOwningWallet = useCallback(
    async (_assetId: string): Promise<FetchedOwner | null> => {
      try {
        const {
          data,
        }: {
          data: FetchedOwner
        } = await axios.get(`/api/wallet?blockfrostKey=${blockfrostKey}&assetId=${_assetId}`)

        return data
      } catch (error: any) {
        if (error?.response?.status === 401) {
          addTranscript('ERROR', 'Bad Blockfrost Key!')
          return null
        } else {
          addTranscript('ERROR', error.message)
          return await fetchOwningWallet(_assetId)
        }
      }
    },
    [blockfrostKey]
  )

  const clickSnapshot = useCallback(async () => {
    setLoading(true)

    const holders: Holder[] = []
    const fetchedWallets: FetchedOwner[] = []
    let unlistedCountForPayoutCalculation = 0

    addTranscript('Processing policy', policyId)
    const policyAssets = await fetchPolicyAssets(policyId)
    if (!policyAssets) return // for managed error (like bad blockfrost key)

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

        const wallet = foundFetchedWallet || (await fetchOwningWallet(assetId))
        if (!wallet) return // for managed error (like bad blockfrost key)

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
      tokenAmountType === 'Fixed'
        ? tokenFixedAmount
        : tokenAmountType === 'Percent'
        ? tokenQuantity * (tokenPercentAmount / 100)
        : 0

    const sharePerAsset = Math.floor(totalPool / unlistedCountForPayoutCalculation)

    setPayoutWallets(
      holders
        .map(({ stakeKey, addresses, assets }) => ({
          stakeKey,
          address: addresses[0],
          payout: assets.length * sharePerAsset,
        }))
        .sort((a, b) => b.payout - a.payout)
    )

    addTranscript('Snapshot done!')
    setSnapshotDone(true)
    setLoading(false)
  }, [
    policyId,
    tokenQuantity,
    tokenAmountType,
    tokenFixedAmount,
    tokenPercentAmount,
    fetchPolicyAssets,
    fetchOwningWallet,
  ])

  // @ts-ignore
  const getTxWithHash = useCallback(
    async (_txHash: string): Promise<TxStatus> => {
      try {
        const {
          data,
        }: {
          data: TxStatus
        } = await axios.get(`/api/tx?blockfrostKey=${blockfrostKey}&txHash=${_txHash}`)

        if (data.submitted) {
          return data
        } else {
          await sleep(1000)
          return await getTxWithHash(_txHash)
        }
      } catch (error: any) {
        if (error?.response?.status === 401) {
          throw new Error('Bad Blockfrost Key!')
        } else {
          await sleep(1000)
          addTranscript('ERROR', error.message)
          return await getTxWithHash(_txHash)
        }
      }
    },
    [blockfrostKey]
  )

  const clickAirdrop = useCallback(
    async (difference?: number): Promise<any> => {
      setLoading(true)

      if (!difference) {
        addTranscript('Batching TXs', 'This may take a moment...')
      }

      const batchSize = difference ? Math.floor(difference * payoutWallets.length) : payoutWallets.length
      const batches: Payout[][] = []

      for (let i = 0; i < payoutWallets.length; i += batchSize) {
        batches.push(payoutWallets.slice(i, (i / batchSize + 1) * batchSize))
      }

      try {
        for await (const [idx, batch] of batches.entries()) {
          const tx = new Transaction({ initiator: wallet })

          for (const { address, payout } of batch) {
            if (selectedToken === 'lovelace') {
              if (payout < MILLION) {
                const str1 = 'Cardano requires at least 1 ADA per TX.'
                const str2 = `This wallet has only ${(payout / MILLION).toFixed(
                  2
                )} ADA assigned to it:\n${address}`
                const str3 = 'Click OK if you want to increase the payout for this wallet to 1 ADA.'
                const str4 = 'Click cancel to exclude this wallet from the airdrop.'
                const str5 = 'Note: accepting will increase the total pool size.'

                if (window.confirm(`${str1}\n\n${str2}\n\n${str3}\n${str4}\n\n${str5}`)) {
                  tx.sendLovelace(address, String(MILLION))
                }
              } else {
                tx.sendLovelace(address, String(payout))
              }
            }
          }

          const unsignedTx = await tx.build()
          addTranscript(`Building TX ${idx + 1} of ${batches.length}`)
          const signedTx = await wallet.signTx(unsignedTx)
          const txHash = await wallet.submitTx(signedTx)
          addTranscript('Awaiting network confirmation', 'This may take a moment...')
          await getTxWithHash(txHash)
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
        console.error(error)

        if ((error.message as string).indexOf('Maximum transaction size') !== -1) {
          // [Transaction] An error occurred during build: Maximum transaction size of 16384 exceeded. Found: 21861.
          const splitMessage: string[] = error.message.split(' ')
          const [max, curr] = splitMessage.filter((str) => !isNaN(Number(str))).map((str) => Number(str))
          // [16384, 21861]

          return await clickAirdrop((difference || 1) * (max / curr))
        } else {
          addTranscript('ERROR', error.message)
        }
      }

      setLoading(false)
    },
    [wallet, payoutWallets, selectedToken, getTxWithHash]
  )

  const clickDownloadReceipt = useCallback(async () => {
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
        {
          value: 'Transaction Hash',
          fontWeight: 'bold',
        },
      ],
    ]

    for (const { address, stakeKey, payout, txHash } of payoutWallets) {
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
          type: String,
          value: (selectedToken === 'lovelace' ? payout / MILLION : payout).toFixed(2),
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
    } catch (error: any) {
      addTranscript('ERROR', error.message)
      console.error(error)
    }

    setLoading(false)
  }, [payoutWallets, selectedToken])

  const [blockfrostKeyPopoverEl, setBlockfrostKeyPopoverEl] = useState<Element | null>(null)
  const [policyIdPopoverEl, setPolicyIdPopoverEl] = useState<Element | null>(null)

  const styles = useMemo(
    () => ({
      userSettings: {
        opacity: connected ? 1 : 0.4,
      },
      keyInpSection: {
        margin: '1rem 0',
        display: 'flex',
        flexDirection: 'column' as const,
      },
      keyInpWrap: {
        margin: '0.2rem 0',
        display: 'flex',
        alignItems: 'center',
      },
      tokenInpSection: {
        margin: '1rem 0',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
      },
      tokenAmountWrap: {
        margin: '0.2rem 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      inp: {
        borderRadius: '0.5rem',
      },
      transcripts: {
        width: '69vw',
        height: '42vh',
        margin: '1rem 0',
        padding: '0.5rem 1rem',
        backgroundColor: 'var(--grey-darker)',
        borderRadius: '1rem',
        border: '1px solid var(--grey)',
        display: 'flex',
        flexDirection: 'column-reverse' as const,
        overflowY: 'scroll' as const,
      },
    }),
    [connected]
  )

  return (
    <div>
      <div style={styles.userSettings}>
        <div style={styles.keyInpSection}>
          <div style={styles.keyInpWrap}>
            <IconButton onClick={(e) => setBlockfrostKeyPopoverEl(e.currentTarget)}>
              <HelpIcon />
            </IconButton>
            <Popover
              anchorEl={blockfrostKeyPopoverEl}
              open={!!blockfrostKeyPopoverEl}
              onClose={() => setBlockfrostKeyPopoverEl(null)}
              anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
              transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
              <div style={{ padding: '1rem', backgroundColor: 'var(--grey)' }}>
                <h4>How to get a Blockfrost API Key?</h4>
                <ol style={{ margin: '0.5rem 0 0 1rem', fontSize: '0.8rem' }}>
                  <li>
                    Go to{' '}
                    <a
                      href='https://blockfrost.io'
                      target='_blank'
                      rel='noopener noreferrer'
                      style={{ color: 'skyblue', cursor: 'pointer' }}
                    >
                      blockfrost.io
                    </a>
                  </li>
                  <li>Sign-in, or create a new account</li>
                  <li>Select a project, or add a new one (mainnet)</li>
                  <li>Copy your &quot;API Key&quot; / &quot;Project ID&quot;</li>
                </ol>
              </div>
            </Popover>
            <TextField
              label='Blockfrost API Key'
              type='password'
              variant='filled'
              size='small'
              fullWidth
              style={styles.inp}
              disabled={!connected}
              value={blockfrostKey}
              onChange={(e) => setBlockfrostKey(e.target.value)}
            />
          </div>

          <div style={styles.keyInpWrap}>
            <IconButton onClick={(e) => setPolicyIdPopoverEl(e.currentTarget)}>
              <InfoIcon />
            </IconButton>
            <Popover
              anchorEl={policyIdPopoverEl}
              open={!!policyIdPopoverEl}
              onClose={() => setPolicyIdPopoverEl(null)}
              anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
              transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
              <div style={{ padding: '1rem', backgroundColor: 'var(--grey)' }}>
                <h4>For your information!</h4>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem' }}>
                  The snapshot includes 100% of holders, unlisted assets only.
                  <br />
                  <br />
                  Formula: total amount / unlisted NFTs = pay per NFT
                  <br />
                  Example: 50,000 ADA / 2,500 NFTs = 20 ADA per NFT
                </p>
              </div>
            </Popover>
            <TextField
              label='Policy ID'
              variant='filled'
              size='small'
              fullWidth
              style={styles.inp}
              disabled={!connected}
              value={policyId}
              onChange={(e) => setPolicyId(e.target.value)}
            />
          </div>
        </div>

        <div style={styles.tokenInpSection}>
          <FormControl variant='filled' size='small' fullWidth style={styles.inp} disabled={!connected}>
            <InputLabel id='token-select-label'>{selectedToken ? 'Selected Token' : 'Select a Token'}</InputLabel>
            <Select
              labelId='token-select-label'
              label={selectedToken ? 'Selected Token' : 'Select a Token'}
              value={selectedToken}
              onChange={(e) => {
                const v = e.target.value

                setSelectedToken(v as 'lovelace')
                setTokenQuantity(Number(tokens.find(({ unit }) => unit === v)?.quantity || 0))
              }}
            >
              {tokens.map(({ unit, quantity }) =>
                unit === 'lovelace' ? (
                  <MenuItem key={`unit-${unit}`} value={unit}>
                    {unit} ({quantity})
                  </MenuItem>
                ) : null
              )}
            </Select>
          </FormControl>

          <div style={styles.tokenAmountWrap}>
            <FormControl disabled={!selectedToken}>
              <RadioGroup
                row
                name='token-amount-type'
                value={tokenAmountType}
                // @ts-ignore
                onChange={(e) => setTokenAmountType(e.target.value)}
              >
                <FormControlLabel label='Fixed Amount' value='Fixed' control={<Radio />} />
                <FormControlLabel label='Percent Amount' value='Percent' control={<Radio />} />
              </RadioGroup>
            </FormControl>

            <div style={{ width: '100%' }}>
              <TextField
                label='Value'
                variant='filled'
                size='small'
                fullWidth
                style={styles.inp}
                disabled={!tokenAmountType}
                focused={!!tokenAmountType}
                placeholder={
                  tokenAmountType === 'Fixed' ? '1,000,000' : tokenAmountType === 'Percent' ? '100%' : ''
                }
                value={
                  tokenAmountType === 'Fixed'
                    ? tokenFixedAmount || ''
                    : tokenAmountType === 'Percent'
                    ? tokenPercentAmount || ''
                    : ''
                }
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (!isNaN(v)) {
                    tokenAmountType === 'Fixed' && v >= 0 && v <= tokenQuantity
                      ? setTokenFixedAmount(v)
                      : tokenAmountType === 'Percent' && v >= 0 && v <= 100
                      ? setTokenPercentAmount(v)
                      : null
                  }
                }}
              />

              {selectedToken === 'lovelace' ? (
                <p style={{ marginTop: '0.1rem', fontSize: '0.9rem' }}>
                  Translates to:{' '}
                  {(tokenAmountType === 'Fixed'
                    ? tokenFixedAmount / MILLION
                    : tokenAmountType === 'Percent'
                    ? (tokenQuantity * (tokenPercentAmount / 100)) / MILLION
                    : 0
                  ).toFixed(2)}{' '}
                  ADA total
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div style={styles.transcripts}>
        {transcripts.map((item, idx) => {
          if (item) {
            const { timestamp, msg, key } = item

            return (
              <p key={`txt_${idx}_${timestamp}`} style={{ margin: 0 }}>
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
        <OnlineIndicator online={!connected}>
          <ConnectWallet addTranscript={addTranscript} />
        </OnlineIndicator>

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
            onClick={() => clickAirdrop()}
          >
            Airdrop
          </Button>
        </OnlineIndicator>

        <OnlineIndicator online={snapshotDone && payoutDone && !loading}>
          <Button
            variant='contained'
            color='secondary'
            disabled={!payoutDone || loading}
            onClick={clickDownloadReceipt}
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
              <th>Payout</th>
              <th>Stake Key</th>
              <th>TX Hash</th>
            </tr>
          </thead>
          <tbody>
            {payoutWallets.map(({ stakeKey, payout, txHash }) => (
              <tr key={stakeKey}>
                <td>{selectedToken === 'lovelace' ? `${(payout / MILLION).toFixed(2)} ADA` : payout}</td>
                <td style={{ margin: '0 0.5rem' }}>{stakeKey}</td>
                <td>{txHash || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  )
}

export default TheTool
