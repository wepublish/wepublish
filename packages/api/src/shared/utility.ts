import generateNanoID from 'nanoid/async/generate'
import generateNanoIDSync from 'nanoid/generate'

export const idAlphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
export const tokenAlphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_'

export function generateID() {
  return generateNanoID(idAlphabet, 10)
}

export function generateToken() {
  return generateNanoID(tokenAlphabet, 32)
}

export function generateIDSync() {
  return generateNanoIDSync(idAlphabet, 10)
}

export function generateTokenSync() {
  return generateNanoIDSync(tokenAlphabet, 32)
}
