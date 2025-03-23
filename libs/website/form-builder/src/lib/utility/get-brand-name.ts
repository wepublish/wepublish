import {isBrandAction, isPipeAction} from './is-action'

export const getBrandName = (input: unknown) => {
  if (isBrandAction(input)) {
    return input.name
  }

  if (!isPipeAction(input)) {
    return null
  }

  const results = input.pipe.flatMap(schem => {
    const res = getBrandName(schem)

    return res ? [res] : []
  }) as string[]

  return results.at(-1)
}
