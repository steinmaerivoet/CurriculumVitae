import "@/web/styles/base.css";
import "./theme.css";
import Deck from "@/web/deck/Deck";
import type { Theme, ThemeIslandProps } from "@/web/themes/types";
import type { ReferenceView } from "@/bff/web/themes/reference";
import Chrome from "./Chrome";
import Hero from "./slides/Hero";
import About from "./slides/About";
import Experience from "./slides/Experience";
import Skills from "./slides/Skills";
import Projects from "./slides/Projects";
import Education from "./slides/Education";
import Contact from "./slides/Contact";

export const referenceTheme: Theme<ReferenceView> = {
  id: "reference",
  slides: { hero: Hero, about: About, experience: Experience, skills: Skills, projects: Projects, education: Education, contact: Contact },
  Chrome,
  rootClassName: "bg-bg font-sans text-fg",
};

/** The island for src/pages/api-reference.astro. */
export default function ReferenceDeck(props: ThemeIslandProps<ReferenceView>) {
  return <Deck theme={referenceTheme} {...props} />;
}
