import generateNanoID from 'nanoid/generate'

export const idAlphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function generateID() {
  return generateNanoID(idAlphabet, 10)
}
