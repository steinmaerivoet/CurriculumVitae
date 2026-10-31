import "@/web/styles/base.css";
import "./theme.css";
import Deck from "@/web/deck/Deck";
import type { Theme, ThemeIslandProps } from "@/web/themes/types";
import type { GitView } from "@/bff/web/themes/git";
import Chrome from "./Chrome";
import Hero from "./slides/Hero";
import About from "./slides/About";
import Experience from "./slides/Experience";
import Skills from "./slides/Skills";
import Projects from "./slides/Projects";
import Education from "./slides/Education";
import Contact from "./slides/Contact";

export const gitTheme: Theme<GitView> = {
  id: "git",
  slides: { hero: Hero, about: About, experience: Experience, skills: Skills, projects: Projects, education: Education, contact: Contact },
  Chrome,
  rootClassName: "g-paper font-sans text-fg",
};

/** The island for src/pages/commit-graph.astro. */
export default function GitDeck(props: ThemeIslandProps<GitView>) {
  return <Deck theme={gitTheme} {...props} />;
}
