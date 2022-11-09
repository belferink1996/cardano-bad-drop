import { NextApiRequest, NextApiResponse } from 'next'
import { BlockFrostAPI } from '@blockfrost/blockfrost-js'
import { resolveStakeAddress } from '@martifylabs/mesh'

type Response = {
  assetId: string
  stakeKey: string
  walletAddress: string
}

const handler = async (req: NextApiRequest, res: NextApiResponse<Response>) => {
  try {
    const {
      method,
      query: { blockfrostKey, assetId },
    } = req

    if (!blockfrostKey || typeof blockfrostKey !== 'string') {
      return res.status(401).end('Unauthorized')
    }

    const blockfrost = new BlockFrostAPI({
      projectId: blockfrostKey,
      debug: true,
    })

    switch (method) {
      case 'GET': {
        if (!assetId || typeof assetId !== 'string') {
          return res.status(400).end('Bad Request')
        }

        console.log('Fetching wallet address with asset ID:', assetId)

        const data = await blockfrost.assetsAddresses(assetId)
        const walletAddress = data[0]?.address ?? ''

        console.log('Fetched wallet address:', walletAddress)

        let stakeKey = ''
        try {
          stakeKey = resolveStakeAddress(walletAddress)
        } catch (error) {}

        return res.status(200).json({
          assetId,
          stakeKey,
          walletAddress,
        })
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
