import { ONE_MILLION } from '../../constants'
import formatBigNumber from '../../functions/formatBigNumber'

export interface Payout {
  stakeKey: string
  address: string
  payout: number
  txHash?: string
}

export interface Count {
  [policyId: string]: {
    listed: number
    unlisted: number
  }
}

export interface ResultsProps {
  isLovelace: boolean
  count: Count
  payoutWallets: Payout[]
}

const Results = (props: ResultsProps) => {
  const { isLovelace, count, payoutWallets } = props

  return (
    <div className='overflow-clip w-screen mt-4 flex flex-col items-center border border-r-0 border-l-0 border-b-0'>
      <table className='my-4'>
        <thead>
          <tr>
            <th className='text-start'>Policy ID</th>
            <th className='px-1 text-start'>Listed</th>
            <th className='px-1 text-start'>Unlisted</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(count).map(([pId, obj]) => (
            <tr key={`res-listings-${pId}`}>
              <td className='text-start'>{pId}</td>
              <td className='text-center'>{obj.listed}</td>
              <td className='text-center'>{obj.unlisted}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {payoutWallets.length ? (
        <table>
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
                  {isLovelace ? `${(payout / ONE_MILLION).toFixed(2)} ADA` : formatBigNumber(payout)}
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
