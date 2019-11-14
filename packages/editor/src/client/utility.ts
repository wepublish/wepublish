import baseSlugify from 'slugify'

export enum LocalStorageKey {
  SessionToken = 'sessionToken'
}

export function slugify(value: string) {
  return baseSlugify(value, {remove: /[^0-9a-z]/gi}) // TODO: Replace with custom slugify
}
