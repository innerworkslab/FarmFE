const normalizeTimestamp = (value: string) =>
  value.replace(/(\.\d{3})\d+(?=Z|[+-]\d{2}:?\d{2}$)/, "$1");

export const formatReadableDate = (value?: string | null) => {
  if (!value) return "—";
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(normalizeTimestamp(value));
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

export const formatReadableDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(normalizeTimestamp(value));
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
};
