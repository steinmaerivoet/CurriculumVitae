import type { ReactNode } from "react";

/** One command at the prompt: "~/stein ❯ whoami". */
export default function Prompt({ cwd, children, className = "" }: { cwd: string; children: ReactNode; className?: string }) {
  return (
    <p className={`t-prompt t-cyan ${className}`} style={{ ["--t-cwd" as string]: `"${cwd}"` }}>
      <span className="text-fg">{children}</span>
    </p>
  );
}
