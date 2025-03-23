import {isDescriptionAction, isPipeAction, isTitleAction} from './is-action'

export const getDescription = (input: unknown) => {
  if (isDescriptionAction(input)) {
    return input.description
  }

  if (!isPipeAction(input)) {
    return null
  }

  const results = input.pipe.flatMap(schem => {
    const res = getDescription(schem)

    return res ? [res] : []
  }) as string[]

  return results.at(-1)
}

export const getTitle = (input: unknown) => {
  if (isTitleAction(input)) {
    return input.title
  }

  if (!isPipeAction(input)) {
    return null
  }

  const results = input.pipe.flatMap(schem => {
    const res = getTitle(schem)

    return res ? [res] : []
  }) as string[]

  return results.at(-1)
}
