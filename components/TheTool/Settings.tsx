import { ChevronDownIcon, PlusCircleIcon, TrashIcon } from '@heroicons/react/24/solid'
import { Asset } from '@meshsdk/core'
import { useEffect, useState } from 'react'
import { ONE_MILLION } from '../../constants'
import formatBigNumber from '../../functions/formatBigNumber'

export interface PolicySettingsObject {
  policyId: string
  weight: number
}
export interface TraitSettingsObject {
  category: string
  trait: string
  amount: number
}

export type AmountType = 'Fixed' | 'Percent' | ''
export type SplitType = 'Equal' | 'EqualPlusTraits' | ''
export interface SettingsObject {
  policyIds: PolicySettingsObject[]

  tokenId: string
  tokenName: string
  tokenBalance: number

  amountType: AmountType
  fixedAmount: number
  percentAmount: number

  splitType: SplitType
  rewardingTraits: TraitSettingsObject[]
}

interface Balance extends Asset {
  name?: string
}
export interface SettingsProps {
  disabled: boolean
  tokens: Balance[]
  callbackSettings: (_payload: SettingsObject) => void
}

const Settings = (props: SettingsProps) => {
  const { disabled, tokens, callbackSettings } = props

  const [policyIds, setPolicyIds] = useState<PolicySettingsObject[]>([
    {
      policyId: '',
      weight: 1,
    },
  ])
  const [rewardingTraits, setRewardingTraits] = useState<TraitSettingsObject[]>([
    {
      category: '',
      trait: '',
      amount: 0,
    },
  ])

  const [openTokenSelection, setOpenTokenSelection] = useState(false)
  const [tokenId, setSelectedId] = useState('')
  const [tokenName, setSelectedName] = useState('')
  const [tokenBalance, setTokenBalance] = useState(0)

  const [amountType, setAmountType] = useState<AmountType>('')
  const [fixedAmount, setTokenFixedAmount] = useState(0)
  const [percentAmount, setTokenPercentAmount] = useState(0)

  const [splitType, setSplitType] = useState<SplitType>('')

  useEffect(() => {
    callbackSettings({
      policyIds: policyIds.filter((str) => !!str),
      tokenId,
      tokenName,
      tokenBalance,
      amountType,
      fixedAmount,
      percentAmount,
      splitType,
      rewardingTraits: rewardingTraits.filter((obj) => !!obj.category && !!obj.trait && !!obj.amount),
    })
  }, [
    policyIds,
    tokenId,
    tokenName,
    tokenBalance,
    amountType,
    fixedAmount,
    percentAmount,
    splitType,
    rewardingTraits,
  ])

  return (
    <div className='w-full px-1 flex flex-row items-start justify-between'>
      <div className='max-w-[500px] w-full mr-2'>
        <h3 className={'text-lg ' + (disabled ? 'text-gray-700' : '')}>
          Add the Policy IDs, which the holders thereof, would be included in this airdrop&apos;s snapshot.
        </h3>

        {policyIds.map(({ policyId, weight }, idx) => (
          <div key={`pid-${idx}-${policyIds.length}`} className='my-2'>
            <div className='flex items-center'>
              <input
                placeholder='Policy ID'
                disabled={disabled}
                value={policyId}
                onChange={(e) =>
                  setPolicyIds((prev) => {
                    const payload = [...prev]
                    payload[idx] = { policyId: e.target.value, weight: payload[idx].weight }
                    return payload
                  })
                }
                className='w-full my-0.5 p-3 disabled:cursor-not-allowed disabled:bg-gray-900 disabled:bg-opacity-50 disabled:border-gray-800 disabled:text-gray-700 disabled:placeholder:text-gray-700 rounded-lg bg-gray-900 border border-gray-700 text-sm hover:bg-gray-700 hover:border-gray-500 hover:text-white hover:placeholder:text-white'
              />
              {policyIds.length > 1 ? (
                <button
                  onClick={() => setPolicyIds((prev) => prev.filter((_item, _idx) => _idx !== idx))}
                  className={
                    'w-8 h-8 p-1.5 ml-1 text-sm text-red-400 rounded-full border bg-red-900 border-red-400 hover:text-red-200 hover:bg-red-700 hover:border-red-200 ' +
                    (disabled ? 'hidden' : '')
                  }
                >
                  <TrashIcon />
                </button>
              ) : null}
            </div>
            <div className='flex items-center'>
              <label className={'mr-2 ml-4 ' + (disabled ? 'text-gray-700' : '')}>Weight:</label>
              <input
                disabled={disabled}
                value={String(weight)}
                onChange={(e) =>
                  setPolicyIds((prev) => {
                    const payload = [...prev]
                    const v = Number(e.target.value)
                    if (isNaN(v)) return payload
                    payload[idx] = { policyId: payload[idx].policyId, weight: v }
                    return payload
                  })
                }
                className='w-20 my-0.5 p-3 disabled:cursor-not-allowed disabled:bg-gray-900 disabled:bg-opacity-50 disabled:border-gray-800 disabled:text-gray-700 disabled:placeholder:text-gray-700 rounded-lg bg-gray-900 border border-gray-700 text-sm hover:bg-gray-700 hover:border-gray-500 hover:text-white hover:placeholder:text-white'
              />
            </div>
          </div>
        ))}

        <button
          type='button'
          disabled={disabled}
          onClick={() =>
            setPolicyIds((prev) => {
              const payload = [...prev]
              payload.push({ policyId: '', weight: 1 })
              return payload
            })
          }
          className='w-fit my-1 p-3 flex items-center justify-between disabled:cursor-not-allowed disabled:bg-gray-900 disabled:bg-opacity-50 disabled:border-gray-800 disabled:text-gray-700 rounded-lg bg-gray-900 hover:bg-gray-700 text-sm hover:text-white border border-gray-700 hover:border-gray-500'
        >
          <PlusCircleIcon className='w-6 h-6 mr-2' />
          Add another Policy ID
        </button>
        <p className={'text-xs ' + (disabled ? 'text-gray-700' : '')}>
          * Weight is the multiplier of that Policy ID. Default is 1.
          <br />
          (For example: you might want to give pass holders 2x the amount than pfp holders)
        </p>
      </div>

      <div className='max-w-[500px] w-full ml-2'>
        <h3 className={'text-lg ' + (disabled ? 'text-gray-700' : '')}>
          Choose one of your balances (ADA / FTs), and determine how you want to split the payout.
        </h3>

        <div className='w-full my-1 relative'>
          <button
            type='button'
            disabled={disabled}
            onClick={() => setOpenTokenSelection((prev) => !prev)}
            className='w-full p-3 flex items-center justify-between disabled:cursor-not-allowed disabled:bg-gray-900 disabled:bg-opacity-50 disabled:border-gray-800 disabled:text-gray-700 rounded-lg bg-gray-900 hover:bg-gray-700 text-sm hover:text-white border border-gray-700 hover:border-gray-500'
          >
            <span>{!!tokenId ? `Selected: ${tokenName}` : 'Select a Token'}</span>
            <ChevronDownIcon className={(openTokenSelection ? 'rotate-180' : 'rotate-0') + ' ml-1 w-4 h-4'} />
          </button>

          <div
            className={
              (openTokenSelection ? 'flex' : 'hidden') +
              ' flex-col items-center max-h-56 overflow-y-auto absolute top-14 z-20 w-full p-3 rounded-lg bg-gray-900 border border-gray-700'
            }
          >
            {tokens.map(({ name, unit, quantity }) => (
              <button
                key={`unit-${unit}`}
                type='button'
                disabled={disabled}
                onClick={() => {
                  setSelectedId(unit)
                  setSelectedName(name || unit)
                  setTokenBalance(Number(quantity))
                  setOpenTokenSelection(false)
                }}
                className={
                  'flex items-center justify-between w-full py-1 rounded-xl text-sm hover:text-white ' +
                  (tokenId === unit ? 'text-white' : '')
                }
              >
                <span className='mr-1'>{name || unit}</span>
                {unit === 'lovelace' ? (
                  <span className='ml-1'>[{(Number(quantity) / ONE_MILLION).toFixed(2)}]</span>
                ) : (
                  <span className='ml-1'>[{quantity}]</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className='my-1'>
          <p className={'text-sm ' + (disabled || !tokenId ? 'text-gray-700' : '')}>
            How would you like to determine the payout pool size?
          </p>

          <div className='flex flex-wrap items-center'>
            <label
              className={
                'mr-4 flex items-center ' +
                (disabled || !tokenId ? 'text-gray-700 cursor-not-allowed' : 'hover:text-white cursor-pointer')
              }
            >
              <input
                type='radio'
                name='amount-type'
                value='Fixed'
                disabled={disabled || !tokenId}
                onChange={(e) => setAmountType(e.target.value as 'Fixed')}
                checked={amountType === 'Fixed'}
                className='disabled:opacity-50'
              />
              <span className='ml-2 text-sm'>Fixed Amount</span>
            </label>

            <label
              className={
                'mr-4 flex items-center ' +
                (disabled || !tokenId ? 'text-gray-700 cursor-not-allowed' : 'hover:text-white cursor-pointer')
              }
            >
              <input
                type='radio'
                name='amount-type'
                value='Percent'
                disabled={disabled || !tokenId}
                onChange={(e) => setAmountType(e.target.value as 'Percent')}
                checked={amountType === 'Percent'}
                className='disabled:opacity-50'
              />
              <span className='ml-2 text-sm'>Percent Amount</span>
            </label>
          </div>

          <div>
            <input
              placeholder='Amount Value'
              disabled={disabled || !amountType}
              value={
                amountType === 'Fixed'
                  ? tokenId === 'lovelace' && fixedAmount
                    ? fixedAmount / ONE_MILLION
                    : fixedAmount || ''
                  : amountType === 'Percent'
                  ? percentAmount || ''
                  : ''
              }
              onChange={(e) => {
                let v = Number(e.target.value)

                if (!isNaN(v)) {
                  if (tokenId === 'lovelace' && amountType === 'Fixed') {
                    v *= ONE_MILLION
                  }

                  v = Math.floor(v)

                  amountType === 'Fixed' && v >= 0 && v <= tokenBalance
                    ? setTokenFixedAmount(v)
                    : amountType === 'Percent' && v >= 0 && v <= 100
                    ? setTokenPercentAmount(v)
                    : null
                }
              }}
              className='w-full p-3 disabled:cursor-not-allowed disabled:bg-gray-900 disabled:bg-opacity-50 disabled:border-gray-800 disabled:text-gray-700 disabled:placeholder:text-gray-700 rounded-lg bg-gray-900 border border-gray-700 text-sm hover:bg-gray-700 hover:border-gray-500 hover:text-white hover:placeholder:text-white'
            />
            {!!amountType ? (
              <p className={'text-sm ' + (disabled || !tokenId ? 'text-gray-700' : '')}>
                Translates to:{' '}
                {formatBigNumber(
                  amountType === 'Fixed'
                    ? fixedAmount / (tokenId === 'lovelace' ? ONE_MILLION : 1)
                    : amountType === 'Percent'
                    ? (tokenBalance * (percentAmount / 100)) / (tokenId === 'lovelace' ? ONE_MILLION : 1)
                    : 0
                )}
              </p>
            ) : null}
          </div>
        </div>

        <div
          className={'w-full h-0.5 my-2 rounded-full ' + (disabled || !tokenId ? 'bg-gray-700' : 'bg-gray-400')}
        />

        <div className='w-full'>
          <p className={'text-sm ' + (disabled || !tokenId ? 'text-gray-700' : '')}>
            How would you like to split the payout pool between holders?
          </p>

          <div className='flex flex-wrap items-center'>
            <label
              className={
                'mr-4 flex items-center ' +
                (disabled || !tokenId ? 'text-gray-700 cursor-not-allowed' : 'hover:text-white cursor-pointer')
              }
            >
              <input
                type='radio'
                name='split-type'
                value='Equal'
                disabled={disabled || !tokenId}
                onChange={(e) => setSplitType(e.target.value as 'Equal')}
                checked={splitType === 'Equal'}
                className='disabled:opacity-50'
              />
              <span className='ml-2 text-sm'>Equal Splits</span>
            </label>
            <label
              className={
                'mr-4 flex items-center ' +
                (disabled || !tokenId ? 'text-gray-700 cursor-not-allowed' : 'hover:text-white cursor-pointer')
              }
            >
              <input
                type='radio'
                name='split-type'
                value='EqualPlusTraits'
                disabled={disabled || !tokenId}
                onChange={(e) => setSplitType(e.target.value as 'EqualPlusTraits')}
                checked={splitType === 'EqualPlusTraits'}
                className='disabled:opacity-50'
              />
              <span className='ml-2 text-sm'>Equal Splits + Traits</span>
            </label>
            <label
              className={
                'flex items-center ' +
                (disabled || !tokenId ? 'text-gray-700 cursor-not-allowed' : 'hover:text-white cursor-pointer')
              }
            >
              <input
                type='radio'
                name='split-type'
                value=''
                disabled={true}
                onChange={(e) => setSplitType(e.target.value as '')}
                checked={false}
                className='disabled:opacity-50'
              />
              <span className='ml-2 text-sm'>For more options, contact us!</span>
            </label>
          </div>

          {splitType ? (
            <div>
              {splitType === 'Equal' ? (
                <p className={'mt-1 text-xs ' + (disabled || !tokenId ? 'text-gray-700' : '')}>
                  Coins per NFT = Balance / Unlisted NFTs
                </p>
              ) : splitType === 'EqualPlusTraits' ? (
                <div>
                  <p className={'mt-1 text-xs ' + (disabled || !tokenId ? 'text-gray-700' : '')}>
                    Coins per NFT = (Balance / Unlisted NFTs) + (Trait Count * Trait Coins)
                  </p>
                  <p className={'mt-1 text-xs ' + (disabled || !tokenId ? 'text-gray-700' : '')}>
                    * These rewards are not included, but additional (!) to the total balance.
                    <br />
                    Note: trait categories & values are case-sensitive!
                  </p>

                  <div className='w-full'>
                    {rewardingTraits.map(({ category, trait, amount }, idx) => (
                      <div key={`pid-${idx}-${rewardingTraits.length}`} className='my-2'>
                        <div className='flex items-center justify-between'>
                          <input
                            placeholder='Category (ex. Eyewear)'
                            disabled={disabled}
                            value={category}
                            onChange={(e) =>
                              setRewardingTraits((prev) => {
                                const payload = [...prev]
                                payload[idx] = { ...(payload[idx] || {}), category: e.target.value }
                                return payload
                              })
                            }
                            className='flex-1 my-0.5 mr-1 p-3 disabled:cursor-not-allowed disabled:bg-gray-900 disabled:bg-opacity-50 disabled:border-gray-800 disabled:text-gray-700 disabled:placeholder:text-gray-700 rounded-lg bg-gray-900 border border-gray-700 text-sm hover:bg-gray-700 hover:border-gray-500 hover:text-white hover:placeholder:text-white'
                          />
                          <input
                            placeholder='Trait (ex. 3D Glasses)'
                            disabled={disabled}
                            value={trait}
                            onChange={(e) =>
                              setRewardingTraits((prev) => {
                                const payload = [...prev]
                                payload[idx] = { ...(payload[idx] || {}), trait: e.target.value }
                                return payload
                              })
                            }
                            className='flex-1 my-0.5 mr-1 p-3 disabled:cursor-not-allowed disabled:bg-gray-900 disabled:bg-opacity-50 disabled:border-gray-800 disabled:text-gray-700 disabled:placeholder:text-gray-700 rounded-lg bg-gray-900 border border-gray-700 text-sm hover:bg-gray-700 hover:border-gray-500 hover:text-white hover:placeholder:text-white'
                          />
                          {rewardingTraits.length > 1 ? (
                            <button
                              onClick={() =>
                                setRewardingTraits((prev) => prev.filter((_item, _idx) => _idx !== idx))
                              }
                              className={
                                'w-8 h-8 p-1.5 text-sm text-red-400 rounded-full border bg-red-900 border-red-400 hover:text-red-200 hover:bg-red-700 hover:border-red-200 ' +
                                (disabled ? 'hidden' : '')
                              }
                            >
                              <TrashIcon />
                            </button>
                          ) : null}
                        </div>
                        <div className='flex items-center'>
                          <label className={'mr-2 ml-4 ' + (disabled ? 'text-gray-700' : '')}>Coins:</label>
                          <input
                            className='w-20 my-0.5 p-3 disabled:cursor-not-allowed disabled:bg-gray-900 disabled:bg-opacity-50 disabled:border-gray-800 disabled:text-gray-700 disabled:placeholder:text-gray-700 rounded-lg bg-gray-900 border border-gray-700 text-sm hover:bg-gray-700 hover:border-gray-500 hover:text-white hover:placeholder:text-white'
                            disabled={disabled}
                            value={String(amount)}
                            onChange={(e) =>
                              setRewardingTraits((prev) => {
                                const payload = [...prev]
                                const v = Number(e.target.value)
                                if (isNaN(v)) return payload
                                payload[idx] = { ...(payload[idx] || {}), amount: v }
                                return payload
                              })
                            }
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      type='button'
                      disabled={disabled}
                      onClick={() =>
                        setRewardingTraits((prev) => {
                          const payload = [...prev]
                          payload.push({ category: '', trait: '', amount: 0 })
                          return payload
                        })
                      }
                      className='w-fit my-1 p-3 flex items-center justify-between disabled:cursor-not-allowed disabled:bg-gray-900 disabled:bg-opacity-50 disabled:border-gray-800 disabled:text-gray-700 rounded-lg bg-gray-900 hover:bg-gray-700 text-sm hover:text-white border border-gray-700 hover:border-gray-500'
                    >
                      <PlusCircleIcon className='w-6 h-6 mr-2' />
                      Add another attribute
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default Settings
