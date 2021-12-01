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

// copied from packages/editor
export function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[ÀÁÂÃÄÅÆĀĂĄẠẢẤẦẨẪẬẮẰẲẴẶ]/gi, 'a')
    .replace(/[ÇĆĈČ]/gi, 'c')
    .replace(/[ÐĎĐÞ]/gi, 'd')
    .replace(/[ÈÉÊËĒĔĖĘĚẸẺẼẾỀỂỄỆ]/gi, 'e')
    .replace(/[ĜĞĢǴ]/gi, 'g')
    .replace(/[ĤḦ]/gi, 'h')
    .replace(/[ÌÍÎÏĨĪĮİỈỊ]/gi, 'i')
    .replace(/[Ĵ]/gi, 'j')
    .replace(/[Ĳ]/gi, 'ij')
    .replace(/[Ķ]/gi, 'k')
    .replace(/[ĹĻĽŁ]/gi, 'l')
    .replace(/[Ḿ]/gi, 'm')
    .replace(/[ÑŃŅŇ]/gi, 'n')
    .replace(/[ÒÓÔÕÖØŌŎŐỌỎỐỒỔỖỘỚỜỞỠỢǪǬƠ]/gi, 'o')
    .replace(/[Œ]/gi, 'oe')
    .replace(/[ṕ]/gi, 'p')
    .replace(/[ŔŖŘ]/gi, 'r')
    .replace(/[ßŚŜŞŠ]/gi, 's')
    .replace(/[ŢŤ]/gi, 't')
    .replace(/[ÙÚÛÜŨŪŬŮŰŲỤỦỨỪỬỮỰƯ]/gi, 'u')
    .replace(/[ẂŴẀẄ]/gi, 'w')
    .replace(/[ẍ]/gi, 'x')
    .replace(/[ÝŶŸỲỴỶỸ]/gi, 'y')
    .replace(/[ŹŻŽ]/gi, 'z')
    .replace(/[·/_,:;\\']/gi, '-')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '') //eslint-disable-line
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}
