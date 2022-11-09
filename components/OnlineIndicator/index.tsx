import { ReactNode } from 'react'
import { styled } from '@mui/material/styles'
import { Badge, Avatar } from '@mui/material'

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: 'black',
    color: 'black',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}))

const OnlineBadge = styled(StyledBadge)(() => ({
  '& .MuiBadge-badge': {
    backgroundColor: 'rgb(0, 222, 0)',
    color: 'rgb(0, 222, 0)',
  },
}))

const OfflineBadge = styled(StyledBadge)(() => ({
  '& .MuiBadge-badge': {
    backgroundColor: 'rgb(222, 0, 0)',
    color: 'rgb(222, 0, 0)',
  },
}))

export default function OnlineIndicator({
  online = false,
  children = <Avatar src='' alt='' />,
}: {
  online: boolean
  children: ReactNode
}) {
  return online ? (
    <OnlineBadge variant='dot' overlap='circular' anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
      {children}
    </OnlineBadge>
  ) : (
    <OfflineBadge variant='dot' overlap='circular' anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
      {children}
    </OfflineBadge>
  )
}
