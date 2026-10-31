import type { ReactNode } from "react";

/**
 * Shared layout for a slide: full height, safe-area aware padding that leaves
 * room for the fixed navigation, and an optional background layer.
 */
export default function SlideFrame({
  children,
  background,
  className = "",
}: {
  children: ReactNode;
  background?: ReactNode;
  className?: string;
}) {
  return (
    <div className="relative flex min-h-full w-full">
      {background ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {background}
        </div>
      ) : null}
      <div
        className={`relative mx-auto flex w-full max-w-[90rem] flex-col justify-center pt-[max(5.5rem,env(safe-area-inset-top))] pr-11 pb-[max(5rem,env(safe-area-inset-bottom))] sm:pb-[max(5.5rem,env(safe-area-inset-bottom))] pl-6 sm:pr-20 sm:pl-10 lg:pr-28 lg:pl-16 ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
