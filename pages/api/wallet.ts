import { NextApiRequest, NextApiResponse } from 'next'
import blockfrost from '../../utils/blockfrost'

export type FetchedOwnerResponse = {
  isContract: boolean
  stakeKey: string
  walletAddress: string
  assets: {
    unit: string
    quantity: string
  }[]
}

const handler = async (req: NextApiRequest, res: NextApiResponse<FetchedOwnerResponse>) => {
  const {
    method,
    query: { assetId, policyId },
  } = req

  try {
    switch (method) {
      case 'GET': {
        if (!assetId || typeof assetId !== 'string' || !policyId || typeof policyId !== 'string') {
          return res.status(400).end('Bad Request')
        }

        console.log('Fetching wallet information with asset ID:', assetId)

        const assetAddresses = await blockfrost.assetsAddresses(assetId)
        const walletAddress = assetAddresses[0]?.address ?? ''

        const addressInfo = await blockfrost.addresses(walletAddress)
        const isContract = addressInfo.script
        const stakeKey = addressInfo.stake_address || ''
        const assets = addressInfo.amount.filter(({ unit }) => unit.indexOf(policyId) === 0)

        const payload = {
          isContract,
          stakeKey,
          walletAddress,
          assets,
        }

        console.log('Fetched wallet information:', payload)

        return res.status(200).json(payload)
      }

      default: {
        res.setHeader('Allow', 'GET')
        return res.status(405).end('Method Not Allowed')
      }
    }
  } catch (error) {
    console.error(error)

    return res.status(500).end('Internal Server Error')
  }
}

export default handler
