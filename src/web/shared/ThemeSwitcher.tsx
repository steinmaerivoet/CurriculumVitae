import { useId } from "react";
import { themes, type ThemeId } from "@/web/themes/registry";

/**
 * Switches between the website themes. Each theme is its own static page, so
 * switching is a navigation; the current slide travels along in the hash.
 * A native <select> keeps it accessible and familiar on every device.
 */
export default function ThemeSwitcher({ current, label = "Theme", className = "", selectClassName = "" }: { current: ThemeId; label?: string; className?: string; selectClassName?: string }) {
  const id = useId();
  return (
    <span className={`theme-switcher relative inline-flex items-center ${className}`}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={current}
        onChange={(e) => {
          const next = themes.find((t) => t.id === e.target.value);
          if (next) window.location.assign(next.path + window.location.hash);
        }}
        className={`cursor-pointer appearance-none bg-transparent pr-6 ${selectClassName}`}
      >
        {themes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-1 h-3 w-3 opacity-60" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M3 4.5 6 7.5l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}
