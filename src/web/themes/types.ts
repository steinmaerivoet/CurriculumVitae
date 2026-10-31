import type { ComponentType } from "react";
import type { DeckModel } from "@/bff/web/model";
import type { SectionId } from "@/core/model";
import type { ThemeId } from "./registry";

/**
 * The contract between the deck engine and a theme.
 *
 * The engine (src/web/deck) owns navigation: the track, the snap, input,
 * cross-links and reveals. A theme owns how things look: one component per
 * slide and the fixed chrome around them. `V` is the theme's own extra view
 * model, built at build time by its presenter in src/bff/web/themes.
 */
export type SlideProps<V = undefined> = { deck: DeckModel; view: V };

export type ChromeProps<V = undefined> = SlideProps<V> & {
  index: number;
  goTo: (index: number) => boolean;
  ready: boolean;
};

export type Theme<V = undefined> = {
  id: ThemeId;
  slides: Record<SectionId, ComponentType<SlideProps<V>>>;
  Chrome: ComponentType<ChromeProps<V>>;
  /** Classes for the deck root and for each slide (alternating backgrounds and so on). */
  rootClassName?: string;
  slideClassName?: (index: number) => string;
  /** A fixed decorative layer above the slides, such as film grain. */
  Backdrop?: ComponentType;
};

/** What a theme's island receives from its Astro page. */
export type ThemeIslandProps<V = undefined> = SlideProps<V>;
