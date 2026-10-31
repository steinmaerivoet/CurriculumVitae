import type { ReactNode } from "react";

/** A slide's area below the command bar, clear of the branch rail on the right. */
export default function Frame({ children, top = false, className = "" }: { children: ReactNode; top?: boolean; className?: string }) {
  return (
    <div
      className={`mx-auto flex min-h-full w-full max-w-[100rem] flex-col pt-[calc(4.5rem+env(safe-area-inset-top))] pr-12 pb-[calc(4.5rem+env(safe-area-inset-bottom))] pl-5 text-[13px] sm:pr-20 sm:pl-10 lg:pr-36 lg:pl-14 short:pt-16 short:pb-14 ${
        top ? "justify-start lg:pt-[calc(4.5rem+5vh)]" : "justify-center"
      } ${className}`}
    >
      {children}
    </div>
  );
}
