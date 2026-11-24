const dayMs = 24 * 60 * 60 * 1000;
const beijingOffsetMs = 8 * 60 * 60 * 1000;

export function beijingDay(now = Date.now()) {
  return new Date(now + beijingOffsetMs).toISOString().slice(0, 10);
}

export function nextBeijingMidnight(day: string) {
  return Date.parse(day + "T00:00:00+08:00") + dayMs;
}
