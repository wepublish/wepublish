import baseSlugify from 'slugify'

export enum LocalStorageKey {
  SessionToken = 'sessionToken'
}

export function slugify(value: string) {
  return baseSlugify(value, {lower: true}) // TODO: Replace with custom slugify
}

// https://gist.github.com/WebReflection/6076a40777b65c397b2b9b97247520f0
export function dateTimeLocalString(date: Date) {
  function prefix(i: number) {
    return (i < 10 ? '0' : '') + i
  }

  const year = date.getFullYear()
  const month = prefix(date.getMonth() + 1)
  const day = prefix(date.getDate())
  const hours = prefix(date.getHours())
  const minutes = prefix(date.getMinutes())
  const seconds = prefix(date.getSeconds())

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}
