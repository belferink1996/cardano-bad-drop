import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react'

// init context
const ScreenSizeContext = createContext({
  screenWidth: 0,
  screenHeight: 0,
  isMobile: true,
  isTablet: true,
})

// export the consumer
export const useScreenSize = () => {
  return useContext(ScreenSizeContext)
}

// export the provider (handle all the logic here)
export const ScreenSizeProvider = ({ children }: { children: ReactNode }) => {
  const mountRef = useRef<boolean>(true)
  const [{ screenWidth, screenHeight }, setWindowDimensions] = useState<{
    screenWidth: number
    screenHeight: number
  }>({
    screenWidth: 0,
    screenHeight: 0,
  })

  useEffect(() => {
    const handleResize = () => {
      if (mountRef.current)
        setWindowDimensions({
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight,
        })
    }

    handleResize()

    window.addEventListener('resize', handleResize)
    return () => {
      mountRef.current = false
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const memoedValue = useMemo(
    () => ({
      screenWidth,
      screenHeight,
      isMobile: screenWidth ? screenWidth < 768 : true,
      isTablet: screenWidth ? screenWidth < 992 : true,
    }),
    [screenWidth, screenHeight]
  )

  return <ScreenSizeContext.Provider value={memoedValue}>{children}</ScreenSizeContext.Provider>
}
