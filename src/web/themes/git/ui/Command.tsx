/** "$ git log --graph experience": the command a slide is the output of. */
export default function Command({ command, arg }: { command: string; arg?: string | undefined }) {
  return (
    <p className="mb-5 text-xs text-mute" data-reveal>
      <span className="text-accent">$</span> {command}
      {arg ? <b className="font-normal text-fg"> {arg}</b> : null}
    </p>
  );
}
