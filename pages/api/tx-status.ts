import { NextApiRequest, NextApiResponse } from 'next'
import blockfrost from '../../utils/blockfrost'

export type FetchedTxResponse = {
  txHash: string
  submitted: boolean
}

const handler = async (req: NextApiRequest, res: NextApiResponse<FetchedTxResponse>) => {
  const {
    method,
    query: { txHash },
  } = req

  try {
    switch (method) {
      case 'GET': {
        if (!txHash || typeof txHash !== 'string') {
          return res.status(400).end('Bad Request')
        }

        console.log('Fetching TX information with TX Hash:', txHash)

        const tx = await blockfrost.txs(txHash)

        console.log('Fetched TX information:', tx)

        return res.status(200).json({
          txHash,
          submitted: true,
        })
      }

      default: {
        res.setHeader('Allow', 'GET')
        return res.status(405).end('Method Not Allowed')
      }
    }
  } catch (error) {
    console.error(error)

    // @ts-ignore
    if (error?.status_code === 404 || error?.message === 'The requested component has not been found.') {
      return res.status(200).json({
        txHash: txHash as string,
        submitted: false,
      })
    }

    return res.status(500).end('Internal Server Error')
  }
}

export default handler
