const HIJRI_MONTHS = [
  'Muharram',
  'Safar',
  'Rabi al-Awwal',
  'Rabi al-Thani',
  'Jumada al-Awwal',
  'Jumada al-Thani',
  'Rajab',
  'Shaban',
  'Ramadan',
  'Shawwal',
  'Dhul Qadah',
  'Dhul Hijjah',
];

const islamicToJd = (year: number, month: number, day: number) =>
  day +
  Math.ceil(29.5 * (month - 1)) +
  (year - 1) * 354 +
  Math.floor((3 + 11 * year) / 30) +
  1948439 -
  1;

const gregorianToJd = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
};

const fallbackTabularHijri = (date: Date) => {
  const jd = gregorianToJd(date);
  const year = Math.floor((30 * (jd - 1948439) + 10646) / 10631);
  const month = Math.min(
    12,
    Math.ceil((jd - (29 + islamicToJd(year, 1, 1))) / 29.5) + 1,
  );
  const day = jd - islamicToJd(year, month, 1) + 1;

  return `${day} ${HIJRI_MONTHS[month - 1]}, ${year} AH`;
};

export const formatHijriDate = (date: Date) => {
  try {
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-tbla', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const parts = formatter.formatToParts(date);
    const day = Number(parts.find((part) => part.type === 'day')?.value);
    const month = parts.find((part) => part.type === 'month')?.value;
    const year = Number(parts.find((part) => part.type === 'year')?.value);

    if (
      Number.isFinite(day) &&
      Number.isFinite(year) &&
      month &&
      HIJRI_MONTHS.includes(month)
    ) {
      return `${day} ${month}, ${year} AH`;
    }
  } catch {
    // Fall back below when a runtime lacks the islamic-tbla calendar.
  }

  return fallbackTabularHijri(date);
};

export const formatGregorianDate = (date: Date) =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
