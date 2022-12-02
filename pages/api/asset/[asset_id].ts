import { NextApiRequest, NextApiResponse } from 'next'
import { BlockFrostAPI } from '@blockfrost/blockfrost-js'

type Response = {
  asset: string
  policy_id: string
  asset_name: string | null
  fingerprint: string
  quantity: string
  initial_mint_tx_hash: string
  mint_or_burn_count: number
  onchain_metadata:
    | ({
        name?: string
        image?: string | string[]
      } & {
        [key: string]: unknown
      })
    | null
  metadata: {
    name: string
    description: string
    ticker: string | null
    url: string | null
    logo: string | null
    decimals: number | null
  } | null
}

const handler = async (req: NextApiRequest, res: NextApiResponse<Response>) => {
  const {
    method,
    query: { blockfrostKey, asset_id },
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
        if (!asset_id || typeof asset_id !== 'string') {
          return res.status(400).end('Bad Request')
        }

        console.log('Fetching asset with asset ID:', asset_id)

        const data = await blockfrost.assetsById(asset_id)

        console.log('Fetched asset:', data)

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
