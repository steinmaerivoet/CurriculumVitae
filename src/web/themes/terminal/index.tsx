import "@/web/styles/base.css";
import "./theme.css";
import Deck from "@/web/deck/Deck";
import type { Theme, ThemeIslandProps } from "@/web/themes/types";
import type { TerminalView } from "@/bff/web/themes/terminal";
import Chrome from "./Chrome";
import Hero from "./slides/Hero";
import About from "./slides/About";
import Experience from "./slides/Experience";
import Skills from "./slides/Skills";
import Projects from "./slides/Projects";
import Education from "./slides/Education";
import Contact from "./slides/Contact";

export const terminalTheme: Theme<TerminalView> = {
  id: "terminal",
  slides: { hero: Hero, about: About, experience: Experience, skills: Skills, projects: Projects, education: Education, contact: Contact },
  Chrome,
  rootClassName: "t-glow font-mono text-fg",
};

/** The island for src/pages/terminal.astro. */
export default function TerminalDeck(props: ThemeIslandProps<TerminalView>) {
  return <Deck theme={terminalTheme} {...props} />;
}
