import nanoid from 'nanoid/generate'

export const IDAlphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function generateID() {
  return nanoid(IDAlphabet, 16)
}

export function generateToken() {
  return nanoid(IDAlphabet, 32)
}

export enum MongoErrorCode {
  DuplicateKey = 11000
}
