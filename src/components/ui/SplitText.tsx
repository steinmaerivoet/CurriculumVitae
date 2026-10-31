type Props = { text: string; className?: string };

/** Renders text as masked characters that `revealSlide` can animate. */
export default function SplitText({ text, className }: Props) {
  return (
    <span className={className} aria-label={text}>
      {text.split(" ").map((word, w, words) => (
        <span key={w} aria-hidden="true" className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom">
          {Array.from(word).map((ch, c) => (
            <span key={c} className="split-char inline-block will-change-transform">
              {ch}
            </span>
          ))}
          {w < words.length - 1 ? <span className="inline-block">&nbsp;</span> : null}
        </span>
      ))}
    </span>
  );
}
