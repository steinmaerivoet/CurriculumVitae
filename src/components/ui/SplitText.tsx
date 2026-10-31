type Props = { text: string; className?: string };

/**
 * Renders text as masked characters that rise into view when their slide is
 * first revealed (see `.split-char` in global.css). Screen readers get the
 * plain text.
 */
export default function SplitText({ text, className }: Props) {
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      {text.split(" ").map((word, w, words) => (
        <span key={w} aria-hidden="true" className="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom">
          {Array.from(word).map((ch, c) => (
            <span key={c} className="split-char inline-block">
              {ch}
            </span>
          ))}
          {w < words.length - 1 ? <span className="inline-block">&nbsp;</span> : null}
        </span>
      ))}
    </span>
  );
}
