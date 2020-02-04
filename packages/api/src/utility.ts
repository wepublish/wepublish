import nanoid from 'nanoid/generate'

export const idAlphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function generateID() {
  return nanoid(idAlphabet, 16)
}

export function generateTokenID() {
  return nanoid(idAlphabet, 32)
}
