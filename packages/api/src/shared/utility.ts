import generateNanoID from 'nanoid/async/generate'
import generateNanoIDSync from 'nanoid/generate'

export const idAlphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function generateID() {
  return generateNanoID(idAlphabet, 10)
}

export function generateTokenID() {
  return generateNanoID(idAlphabet, 32)
}

export function generateIDSync() {
  return generateNanoIDSync(idAlphabet, 10)
}

export function generateTokenIDSync() {
  return generateNanoIDSync(idAlphabet, 32)
}
