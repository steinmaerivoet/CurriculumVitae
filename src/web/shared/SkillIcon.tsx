import type { SkillView } from "@/bff/web/model";
import { initials } from "@/bff/shared/format";

/** A skill's logo in the current text colour, or its initials when it has none. */
export default function SkillIcon({ skill, className = "", monogramClassName = "" }: { skill: Pick<SkillView, "icon" | "name">; className?: string; monogramClassName?: string }) {
  if (skill.icon) {
    return (
      <svg
        viewBox={skill.icon.viewBox}
        className={className}
        aria-hidden="true"
        fill="currentColor"
        // Markup comes from the icon sets at build time, never from user input.
        dangerouslySetInnerHTML={{ __html: skill.icon.body }}
      />
    );
  }
  return (
    <span className={`grid place-items-center leading-none ${className} ${monogramClassName}`} aria-hidden="true">
      <span className="text-[0.95em]">{initials(skill.name)}</span>
    </span>
  );
}
