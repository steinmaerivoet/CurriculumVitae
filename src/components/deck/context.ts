import { createContext, useContext } from "react";
import type { SlideId } from "@/lib/cv";

export type DeckState = {
  index: number;
  ids: readonly SlideId[];
  goToId: (id: SlideId) => void;
};

export const DeckContext = createContext<DeckState>({
  index: 0,
  ids: [],
  goToId: () => {},
});

export const useDeck = () => useContext(DeckContext);
