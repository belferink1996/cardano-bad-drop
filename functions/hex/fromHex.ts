const fromHex = (hex: string): string => {
  // @ts-ignore
  return decodeURIComponent('%' + hex.match(/.{1,2}/g).join('%'))
}

export default fromHex
