import type { SkillView } from "@/bff/web/model";
import { initials } from "@/bff/shared/format";

/**
 * A skill's logo in the current text colour, or its initials when it has none.
 * The logo itself is a <symbol> in the page's icon sprite (IconSprite.astro).
 */
export default function SkillIcon({ skill, className = "", monogramClassName = "" }: { skill: Pick<SkillView, "icon" | "name">; className?: string; monogramClassName?: string }) {
  if (skill.icon) {
    return (
      <svg className={className} aria-hidden="true" fill="currentColor">
        <use href={`#${skill.icon}`} />
      </svg>
    );
  }
  return (
    <span className={`grid place-items-center leading-none ${className} ${monogramClassName}`} aria-hidden="true">
      <span className="text-[0.95em]">{initials(skill.name)}</span>
    </span>
  );
}
