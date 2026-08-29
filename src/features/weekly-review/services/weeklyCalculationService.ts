export function getWeekStart(date: Date) {
  const currentDate = new Date(date);

  const day = currentDate.getDay();

  // Convert Sunday = 0 into Monday-based week
  const diff =
    day === 0
      ? -6
      : 1 - day;

  currentDate.setDate(
    currentDate.getDate() + diff,
  );

  currentDate.setHours(
    0,
    0,
    0,
    0,
  );

  return currentDate;
}

export function getWeekEnd(
  weekStart: Date,
) {
  const weekEnd = new Date(weekStart);

  weekEnd.setDate(
    weekEnd.getDate() + 6,
  );

  weekEnd.setHours(
    23,
    59,
    59,
    999,
  );

  return weekEnd;
}

export function getNextWeek(
  weekStart: Date,
) {
  const nextWeek = new Date(weekStart);

  nextWeek.setDate(
    nextWeek.getDate() + 7,
  );

  return nextWeek;
}

export function getPreviousWeek(
  weekStart: Date,
) {
  const previousWeek = new Date(
    weekStart,
  );

  previousWeek.setDate(
    previousWeek.getDate() - 7,
  );

  return previousWeek;
}

export function formatWeekRange(
  weekStart: Date,
  weekEnd: Date,
) {
  const start = weekStart.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
    },
  );

  const end = weekEnd.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );

  return `${start} – ${end}`;
}