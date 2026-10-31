import "@/web/styles/base.css";
import "./theme.css";
import Deck from "@/web/deck/Deck";
import type { Theme, ThemeIslandProps } from "@/web/themes/types";
import Chrome from "./Chrome";
import Hero from "./slides/Hero";
import About from "./slides/About";
import Experience from "./slides/Experience";
import Skills from "./slides/Skills";
import Projects from "./slides/Projects";
import Education from "./slides/Education";
import Contact from "./slides/Contact";

export const plainTheme: Theme = {
  id: "plain",
  slides: { hero: Hero, about: About, experience: Experience, skills: Skills, projects: Projects, education: Education, contact: Contact },
  Chrome,
  rootClassName: "bg-bg font-sans text-fg",
  slideClassName: (i) => (i % 2 ? "bg-bg-2" : "bg-bg"),
};

/** The island for src/pages/index.astro. */
export default function PlainDeck(props: ThemeIslandProps) {
  return <Deck theme={plainTheme} {...props} />;
}
