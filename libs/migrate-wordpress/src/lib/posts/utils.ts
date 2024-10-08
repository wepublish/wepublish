import {addSeconds, differenceInSeconds, format, startOfDay} from 'date-fns'

export const humanizeObject = (obj: object) =>
  Object.entries(obj)
    .filter(([key, value]) => value)
    .map(keyValue => keyValue.join(': '))
    .join(',')

function formatSeconds(seconds?: number) {
  if (seconds === undefined) {
    return 'unknown'
  }
  const time = addSeconds(startOfDay(new Date()), seconds)
  return format(time, 'HH:mm:ss')
}

export const createTimer = () => {
  const start = new Date()
  let total: number
  let done = 0
  let updateInterval: any
  const onUpdate = (callback: () => void) => {
    if (updateInterval) {
      clearInterval(updateInterval)
    }
    updateInterval = setInterval(callback, 1000)
  }

  const progress = () => (total ? `${done}/${total}` : undefined)
  const secondsElapsed = () => differenceInSeconds(new Date(), start)
  const secondsLeft = () => (done && total ? (secondsElapsed() / done) * total : undefined)

  return {
    updateTotal: (newTotal: number | string) => {
      total = +newTotal
      // onUpdate()
    },
    updateDone: (newDone: number | string) => {
      done = +newDone
      // onUpdate()
    },
    progress,
    minutesElapsed: secondsElapsed,
    minutesLeft: secondsLeft,
    onUpdate,
    message: () =>
      `Running for ${formatSeconds(
        secondsElapsed()
      )}, done ${progress()}, expected: ${formatSeconds(secondsLeft())} left`
  }
}
