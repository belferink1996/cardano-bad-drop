import { ChevronDownIcon } from '@heroicons/react/24/solid'
import { Asset } from '@martifylabs/mesh'
import { useEffect, useState } from 'react'
import { ONE_MILLION } from '../../constants'
import formatBigNumber from '../../functions/formatBigNumber'

interface Balance extends Asset {
  name?: string
}

export type AmountType = 'Fixed' | 'Percent' | ''
export type SplitType = 'Equal' | ''

export interface SettingsObject {
  policyId: string

  tokenId: string
  tokenName: string
  tokenBalance: number

  amountType: AmountType
  fixedAmount: number
  percentAmount: number

  splitType: SplitType
}

export interface SettingsProps {
  disabled: boolean
  tokens: Balance[]
  callbackSettings: (_payload: SettingsObject) => void
}

const Settings = (props: SettingsProps) => {
  const { disabled, tokens, callbackSettings } = props

  const [policyId, setPolicyId] = useState('')

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
      policyId,
      tokenId,
      tokenName,
      tokenBalance,
      amountType,
      fixedAmount,
      percentAmount,
      splitType,
    })
  }, [policyId, tokenId, tokenName, tokenBalance, amountType, fixedAmount, percentAmount, splitType])

  return (
    <div className='w-full px-1 flex flex-col items-center'>
      <input
        placeholder='Policy ID (holders to pay)'
        disabled={disabled}
        value={policyId}
        onChange={(e) => setPolicyId(e.target.value)}
        className='w-full my-1 p-3 disabled:cursor-not-allowed disabled:bg-gray-900 disabled:bg-opacity-50 disabled:border-gray-800 disabled:text-gray-700 disabled:placeholder:text-gray-700 rounded-lg bg-gray-900 border border-gray-700 text-sm hover:bg-gray-700 hover:border-gray-500 hover:text-white hover:placeholder:text-white'
      />

      <div className='w-full'>
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

        <div className='m-1'>
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
              />
              <span className='ml-2 text-sm'>Percent Amount</span>
            </label>
          </div>

          <div className='my-1'>
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
      </div>

      <div className='w-full my-1 px-1'>
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
              value=''
              disabled={true}
              onChange={(e) => setSplitType(e.target.value as '')}
              checked={false}
            />
            <span className='ml-2 text-sm'>For more options, contact us!</span>
          </label>
        </div>

        {!!splitType ? (
          <p className={'text-sm ' + (disabled || !tokenId ? 'text-gray-700' : '')}>
            {splitType === 'Equal' ? 'Tokens per NFT = Total Amount / Unlisted Assets' : ''}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default Settings
