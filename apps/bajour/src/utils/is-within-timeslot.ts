export const isWithinTimeslot = (
  showFrom = '6:00',
  showUntil = '11:00',
  scheduledDate?: Date
): boolean => {
  const now = new Date();

  // if scheduled date is given, return false, if today is not the scheduled date.
  if (
    scheduledDate &&
    new Date().setHours(0, 0, 0, 0) !== scheduledDate.setHours(0, 0, 0, 0)
  ) {
    return false;
  }

  const [showFromHour, showFromMinutes] = showFrom.split(':').map(Number);
  const [showUntilHour, showUntilMinutes] = showUntil.split(':').map(Number);

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const isAfterStart =
    currentHour > showFromHour ||
    (currentHour === showFromHour && currentMinute >= showFromMinutes);
  const isBeforeEnd =
    currentHour < showUntilHour ||
    (currentHour === showUntilHour && currentMinute < showUntilMinutes);

  return isAfterStart && isBeforeEnd;
};
