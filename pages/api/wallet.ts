import { NextApiRequest, NextApiResponse } from 'next'
import { BlockFrostAPI } from '@blockfrost/blockfrost-js'

type Response = {
  isContract: boolean
  stakeKey: string
  walletAddress: string
  assets: {
    unit: string
    quantity: string
  }[]
}

const handler = async (req: NextApiRequest, res: NextApiResponse<Response>) => {
  const {
    method,
    query: { blockfrostKey, assetId },
  } = req

  if (!blockfrostKey || typeof blockfrostKey !== 'string') {
    return res.status(401).end('Unauthorized')
  }

  try {
    const blockfrost = new BlockFrostAPI({
      projectId: blockfrostKey,
      debug: true,
    })

    switch (method) {
      case 'GET': {
        if (!assetId || typeof assetId !== 'string') {
          return res.status(400).end('Bad Request')
        }

        console.log('Fetching wallet information with asset ID:', assetId)

        const assetAddresses = await blockfrost.assetsAddresses(assetId)
        const walletAddress = assetAddresses[0]?.address ?? ''

        const addressInfo = await blockfrost.addresses(walletAddress)
        const isContract = addressInfo.script
        const stakeKey = addressInfo.stake_address || ''
        const assets = addressInfo.amount

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

    // @ts-ignore
    if (error?.status_code === 403 || error?.message === 'Invalid project token.') {
      return res.status(401).end('Unauthorized')
    }

    return res.status(500).end('Internal Server Error')
  }
}

export default handler
