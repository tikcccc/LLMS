export function nowIso() {
  return new Date().toISOString();
}

const DEFAULT_TIMEZONE = "Asia/Hong_Kong";

const buildDateParts = (date, { timeZone, withTime, withSeconds }) => {
  const options = {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  if (withTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
    options.hour12 = false;
    options.hourCycle = "h23";
    if (withSeconds) {
      options.second = "2-digit";
    }
  }

  const formatter = new Intl.DateTimeFormat("en-CA", options);
  const parts = formatter.formatToParts(date);
  return parts.reduce((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});
};

export function formatInTimeZone(value, { timeZone = DEFAULT_TIMEZONE, mode = "datetime", withSeconds = false } = {}) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const withTime = mode !== "date";
  const parts = buildDateParts(date, { timeZone, withTime, withSeconds });
  const dateText = `${parts.year}-${parts.month}-${parts.day}`;

  if (!withTime) return dateText;

  const timeText = withSeconds
    ? `${parts.hour}:${parts.minute}:${parts.second}`
    : `${parts.hour}:${parts.minute}`;

  return `${dateText} ${timeText}`;
}

export function formatHongKong(value, { mode = "datetime", withSeconds = false } = {}) {
  return formatInTimeZone(value, { timeZone: DEFAULT_TIMEZONE, mode, withSeconds });
}

export function todayInTimeZone(timeZone = DEFAULT_TIMEZONE) {
  return formatInTimeZone(new Date(), { timeZone, mode: "date" });
}

export function todayHongKong() {
  return todayInTimeZone(DEFAULT_TIMEZONE);
}
