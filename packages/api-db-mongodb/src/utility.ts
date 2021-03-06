import nanoid from 'nanoid/generate'

export const IDAlphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function generateID() {
  return nanoid(IDAlphabet, 16)
}

export function generateToken() {
  return nanoid(IDAlphabet, 32)
}

export function base64Encode(str: string): string {
  return Buffer.from(str).toString('base64')
}

export function base64Decode(str: string): string {
  return Buffer.from(str, 'base64').toString()
}

export function isNonNull<T>(value: T): value is NonNullable<T> {
  return value != null
}

export enum MongoErrorCode {
  DuplicateKey = 11000
}

/**
 * this method gets a string with special characters like:
 *  - , [ , ] , / , { , } , ( , ) , * , + , ? , . , \ , ^ , $ , |
 * and it adds \ the slash to let regex works properly as intended
 * @param string string with special characters
 */
export function escapeRegExp(string: string) {
  return string.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
}
