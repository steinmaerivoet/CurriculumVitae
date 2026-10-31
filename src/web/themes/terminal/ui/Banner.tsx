/**
 * Initials drawn in a 5×5 block font, like the logo next to neofetch output.
 * Decorative: screen readers get the name from the text beside it.
 */
const GLYPHS: Record<string, string> = {
  A: ".###.#...#######...##...#", B: "####.#...#####.#...#####.", C: ".#####....#....#.....####", D: "####.#...##...##...#####.",
  E: "######....####.#....#####", F: "######....####.#....#....", G: ".#####....#..###...#.####", H: "#...##...#######...##...#",
  I: "#####..#....#....#..#####", J: "....#....#....##...#.###.", K: "#...##..#.###..#..#.#...#", L: "#....#....#....#....#####",
  M: "#...###.###.#.##...##...#", N: "#...###..##.#.##..###...#", O: ".###.#...##...##...#.###.", P: "####.#...#####.#....#....",
  Q: ".###.#...##.#.##..#..##.#", R: "####.#...#####.#..#.#...#", S: ".#####.....###.....#####.", T: "#####..#....#....#....#..",
  U: "#...##...##...##...#.###.", V: "#...##...##...#.#.#...#..", W: "#...##...##.#.###.###...#", X: "#...#.#.#...#...#.#.#...#",
  Y: "#...#.#.#...#....#....#..", Z: "#####...#...#...#...#####",
};

const rows = (ch: string): string[] => {
  const g = GLYPHS[ch.toUpperCase()] ?? "".padEnd(25, ".");
  return Array.from({ length: 5 }, (_, r) => g.slice(r * 5, r * 5 + 5));
};

export default function Banner({ text, className = "" }: { text: string; className?: string }) {
  const glyphs = [...text].map(rows);
  const lines = Array.from({ length: 5 }, (_, r) => glyphs.map((g) => g[r]!.replace(/#/g, "█").replace(/\./g, " ")).join("  "));
  return (
    <pre className={`m-0 leading-[1.05] text-accent ${className}`} aria-hidden="true">
      {lines.join("\n")}
    </pre>
  );
}
