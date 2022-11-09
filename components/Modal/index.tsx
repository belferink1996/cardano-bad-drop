import { CSSProperties, ReactNode } from 'react'
import { Modal as MuiModal, IconButton, Typography, Fade } from '@mui/material'
import { useScreenSize } from '../../contexts/ScreenSizeContext'

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
  const { isMobile } = useScreenSize()

  return (
    <MuiModal
      open={open}
      onClose={onClose}
      sx={{ display: 'grid', placeItems: 'center', backdropFilter: 'blur(1rem)' }}
    >
      <Fade in={open}>
        <div
          className='scroll'
          style={{
            cursor: 'unset',
            maxWidth: '100vw',
            minWidth: isMobile ? '100vw' : '420px',
            width: isMobile ? '100%' : 'fit-content',
            minHeight: isMobile ? '100vh' : 'fit-content',
            maxHeight: isMobile ? '100vh' : '90vh',
            padding: '1rem',
            borderRadius: isMobile ? '0' : '1rem',
            backgroundColor: 'var(--grey-darkest)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            ...style,
          }}
        >
          {onClose ? (
            <IconButton
              sx={{
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
