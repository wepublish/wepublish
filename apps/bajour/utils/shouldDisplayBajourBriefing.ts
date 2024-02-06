const shouldDisplayBajourBriefing = (): boolean => {
  const now = new Date()

  // Swiss time is UTC+1 or UTC+2 (when daylight saving time is in effect)
  const offset = now.getTimezoneOffset() === -120 ? 2 : 1 // -120 for CEST (daylight saving), otherwise it's CET
  const swissTime = new Date(now.getTime() + offset * 3600 * 1000)

  const hour = swissTime.getHours()
  return hour >= 6 && hour < 11
}

export default shouldDisplayBajourBriefing
