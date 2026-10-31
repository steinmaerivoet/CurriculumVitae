import type { ReactNode } from "react";

/**
 * A slide's area between the tmux bar and the key bar. `top` anchors the
 * content to the top instead of centring it: for slides whose content changes
 * height (a selection), so nothing above it moves.
 */
export default function Frame({ children, top = false, className = "" }: { children: ReactNode; top?: boolean; className?: string }) {
  return (
    <div
      className={`mx-auto flex min-h-full w-full max-w-[96rem] flex-col px-4 pt-[calc(2.75rem+env(safe-area-inset-top))] pb-[calc(3rem+env(safe-area-inset-bottom))] text-[13px] leading-relaxed sm:px-8 sm:text-sm lg:px-12 short:text-[13px] ${
        top ? "justify-start lg:pt-[calc(2.75rem+8vh)]" : "justify-center"
      } ${className}`}
    >
      {children}
    </div>
  );
}
