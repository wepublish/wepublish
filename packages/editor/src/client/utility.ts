import baseSlugify from 'slugify'

export enum LocalStorageKey {
  SessionToken = 'sessionToken'
}

export function slugify(value: string) {
  return baseSlugify(value, {lower: true}) // TODO: Replace with custom slugify
}
