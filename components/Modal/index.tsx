import { CSSProperties, ReactNode } from 'react'
import { Modal as MuiModal, IconButton, Typography, Fade } from '@mui/material'

const Modal = ({
  open = false,
  onClose = () => {},
  title = '',
  style = {},
  children,
}: {
  open: boolean
  onClose: () => void
  title?: string
  style?: CSSProperties
  children: ReactNode
}) => {
  return (
    <MuiModal
      open={open}
      onClose={onClose}
      sx={{ display: 'grid', placeItems: 'center', backdropFilter: 'blur(1rem)' }}
    >
      <Fade in={open}>
        <div
          style={{
            minWidth: '420px',
            width: 'fit-content',
            height: 'fit-content',
            padding: '1rem',

            backgroundColor: 'var(--grey-darkest)',
            borderRadius: '0.5rem',

            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',

            cursor: 'unset',
            ...style,
          }}
        >
          {onClose ? (
            <IconButton
              sx={{
                width: '2.5rem',
                height: '2.5rem',
                margin: '0.5rem',
                color: 'orange',
                fontSize: '2rem',
                position: 'absolute',
                top: 0,
                right: 0,
                zIndex: 9,
              }}
              onClick={onClose}
            >
              &times;
            </IconButton>
          ) : null}
          {title && <Typography variant='h5'>{title}</Typography>}
          {children}
        </div>
      </Fade>
    </MuiModal>
  )
}

export default Modal
