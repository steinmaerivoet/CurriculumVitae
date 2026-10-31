import { useCallback, useState } from "react";
import { useFollow } from "@/web/deck/follow";

type EmployerLike = { company: string; projects: { id: string }[] };

/**
 * Which employer is selected on the experience slide, and which of its
 * projects is open. Follows links to an employer (and to one of its
 * projects) from anywhere in the deck. Shared by every theme.
 */
export function useEmployerSelection<E extends EmployerLike>(items: E[]) {
  const [active, setActive] = useState(0);
  const [openProject, setOpenProject] = useState(0);

  useFollow("employer", (ref) => {
    const i = items.findIndex((e) => e.company === ref.company);
    if (i === -1) return;
    setActive(i);
    const p = ref.project ? items[i]!.projects.findIndex((p) => p.id === ref.project) : 0;
    setOpenProject(Math.max(0, p));
  });

  const select = useCallback((i: number) => {
    setActive(i);
    setOpenProject(0);
  }, []);
  const toggleProject = useCallback((i: number) => setOpenProject((open) => (open === i ? -1 : i)), []);

  return { active, item: items[active], select, openProject, toggleProject };
}
