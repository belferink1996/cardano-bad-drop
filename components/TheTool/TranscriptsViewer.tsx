import { Fragment } from 'react'

export interface Transcript {
  timestamp: number
  msg: string
  key?: string
}

export interface TranscriptsViewerProps {
  transcripts: Transcript[]
}

const TranscriptsViewer = (props: TranscriptsViewerProps) => {
  const { transcripts } = props

  return (
    <div className='overflow-y-auto flex flex-col-reverse w-full h-[42vh] mt-4 py-2 px-4 bg-gray-900 bg-opacity-50 rounded-xl border border-gray-700'>
      {transcripts.map(({ timestamp, msg, key }, idx) => (
        <p key={`transcript_${idx}_${timestamp}`}>
          {new Date(timestamp).toLocaleTimeString()} - {msg}
          {key ? (
            <Fragment>
              <br />
              <span className='text-xs'>{key}</span>
            </Fragment>
          ) : null}
        </p>
      ))}
    </div>
  )
}

export default TranscriptsViewer
