import { NextApiRequest, NextApiResponse } from 'next'
import { BlockFrostAPI } from '@blockfrost/blockfrost-js'

type Response = {
  asset: string
  quantity: string
}[]

const handler = async (req: NextApiRequest, res: NextApiResponse<Response>) => {
  const {
    method,
    query: { blockfrostKey, policyId },
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
        if (!policyId || typeof policyId !== 'string') {
          return res.status(400).end('Bad Request')
        }

        console.log('Fetching assets with policy ID:', policyId)

        const data = await blockfrost.assetsPolicyByIdAll(policyId)

        console.log('Fetched assets:', data)

        return res.status(200).json(data)
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
