import { useEffect, useState } from "react";

type Mode = "light" | "dark";
const KEY = "cv-mode";

/** The mode the page shows now: a saved choice, else the system setting. */
const currentMode = (): Mode =>
  (document.documentElement.dataset["mode"] as Mode | undefined) ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

/**
 * Light / dark switch for the Plain theme. The choice is remembered per
 * visitor; until one is made, the system setting decides. An inline script
 * in the layout applies a saved choice before first paint.
 */
export default function ModeToggle() {
  const [mode, setMode] = useState<Mode | null>(null);
  useEffect(() => setMode(currentMode()), []);

  const toggle = () => {
    const next: Mode = currentMode() === "dark" ? "light" : "dark";
    document.documentElement.dataset["mode"] = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* private mode: the choice lasts for this page only */
    }
    setMode(next);
  };

  const dark = mode === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="grid h-7 w-7 place-items-center rounded-full text-fg/80 transition-colors hover:text-accent"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
        )}
      </svg>
    </button>
  );
}
