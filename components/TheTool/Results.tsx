import { ONE_MILLION } from '../../constants'
import formatBigNumber from '../../functions/formatBigNumber'

type Payout = {
  stakeKey: string
  address: string
  payout: number
  txHash?: string
}

export interface ResultsProps {
  isLovelace: boolean
  unlisted: number
  listed: number
  payoutWallets: Payout[]
}

const Results = (props: ResultsProps) => {
  const { isLovelace, unlisted, listed, payoutWallets } = props

  return (
    <div className='overflow-clip'>
      <div className='my-4 flex items-center justify-center'>
        <p className='mx-4'>Unlisted: {unlisted}</p>
        <p className='mx-4'>Listed: {listed}</p>
      </div>

      {payoutWallets.length ? (
        <table className='mx-auto'>
          <thead>
            <tr>
              <th className='text-sm font-normal'>Payout</th>
              <th className='text-sm font-normal'>Stake Key</th>
              <th className='text-sm font-normal'>TX Hash</th>
            </tr>
          </thead>
          <tbody>
            {payoutWallets.map(({ stakeKey, payout, txHash }, idx) => (
              <tr key={`${idx}-${stakeKey}`}>
                <td className='text-xs'>
                  {isLovelace ? `${formatBigNumber(payout / ONE_MILLION)} ADA` : formatBigNumber(payout)}
                </td>
                <td className='text-xs px-4'>{stakeKey}</td>
                <td className='text-xs'>{txHash || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  )
}

export default Results
