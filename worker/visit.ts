/** One stored visit: what the dashboard reads. Pure types, shared by the store and the dashboard. */
export type Visit = {
  id: string;
  /** Unix ms of the first beacon. */
  startedAt: number;
  /** Unix ms of the last beacon. */
  updatedAt: number;
  theme: string;
  ref: string | null;
  referrer: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  /** The network the visit came from: a company on an office network, otherwise an ISP. */
  org: string | null;
  device: string;
  browser: string;
  os: string;
  language: string | null;
  viewport: string | null;
  totalMs: number;
  slides: Record<string, number>;
  path: string[];
  order: string[];
};
