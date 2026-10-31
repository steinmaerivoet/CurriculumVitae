export function range(start: string, end: string | null, present: string): string {
  if (end === start) return start;
  return `${start} – ${end ?? present}`;
}

export const pad = (n: number) => String(n).padStart(2, "0");
