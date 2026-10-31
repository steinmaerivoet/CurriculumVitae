export function range(start: string, end: string | null, present: string): string {
  return `${start} – ${end ?? present}`;
}

export const pad = (n: number) => String(n).padStart(2, "0");
