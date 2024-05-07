export const isWithinTimeslot = (
  showFrom = '6:00',
  showUntil = '11:00',
  scheduledDate: Date | undefined = undefined
): boolean => {
  const now = new Date()

  // check if the scheduled date is today.
  if (scheduledDate) {
    const isSameDay = scheduledDate.getDate() === now.getDate()
    const isSameMonth = scheduledDate.getMonth() === now.getMonth()
    const isSameYear = scheduledDate.getFullYear() === now.getFullYear()

    // since we've got a date object, just return false, if the scheduled date isn't today.
    if (!isSameDay || !isSameMonth || !isSameYear) {
      return false
    }
  }

  const [showFromHour, showFromMinutes] = showFrom.split(':').map(Number)
  const [showUntilHour, showUntilMinutes] = showUntil.split(':').map(Number)

  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()

  const isAfterStart =
    currentHour > showFromHour || (currentHour === showFromHour && currentMinute >= showFromMinutes)
  const isBeforeEnd =
    currentHour < showUntilHour ||
    (currentHour === showUntilHour && currentMinute < showUntilMinutes)

  return isAfterStart && isBeforeEnd
}
