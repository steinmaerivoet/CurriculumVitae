import type { Endpoint as EndpointModel } from "@/bff/web/themes/reference";

/** An endpoint chip: "GET /api/v1/skills.json", linking to the real file. */
export default function Endpoint({ endpoint, suffix = "" }: { endpoint: EndpointModel; suffix?: string }) {
  const body = (
    <>
      <span className="r-method mr-2" data-method={endpoint.method}>
        {endpoint.method}
      </span>
      <span className="truncate">
        {endpoint.path}
        <span className="text-mute">{suffix}</span>
      </span>
    </>
  );
  const cls = "inline-flex max-w-full items-center rounded-md border border-line bg-surface px-2.5 py-1.5 font-mono text-[13px] whitespace-nowrap";
  return endpoint.href ? (
    <a href={endpoint.href} target={endpoint.method === "GET" ? "_blank" : undefined} rel="noreferrer" className={`${cls} transition-colors hover:border-accent`}>
      {body}
    </a>
  ) : (
    <span className={cls}>{body}</span>
  );
}
