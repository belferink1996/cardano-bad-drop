const fromHex = (hex: string): string => {
  try {
    // @ts-ignore
    return decodeURIComponent('%' + hex.match(/.{1,2}/g).join('%'))
  } catch (error) {
    return hex
  }
}

export default fromHex
