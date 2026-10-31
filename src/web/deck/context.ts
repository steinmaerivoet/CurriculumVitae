import { createContext, useContext } from "react";
import type { SectionId } from "@/core/model";

export type DeckState = {
  index: number;
  ids: readonly SectionId[];
  goToId: (id: SectionId) => void;
};

export const DeckContext = createContext<DeckState>({
  index: 0,
  ids: [],
  goToId: () => {},
});

export const useDeck = () => useContext(DeckContext);
