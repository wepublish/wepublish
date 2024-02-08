const shouldDisplayBaselBriefing = (showFrom = '6:00', showUntil = '11:00'): boolean => {
  const now = new Date()

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

export default shouldDisplayBaselBriefing
