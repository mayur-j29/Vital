const EST = 'America/New_York';

export function getESTDateString() {
  return new Date().toLocaleDateString('en-CA', { timeZone: EST });
}

export function getESTHour() {
  return Number(
    new Date().toLocaleString('en-US', {
      timeZone: EST,
      hour: 'numeric',
      hour12: false
    })
  );
}

export function getESTMonth() {
  return getESTDateString().slice(0, 7);
}

export function formatESTDate(options = {}) {
  return new Date().toLocaleDateString(undefined, {
    timeZone: EST,
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  });
}
