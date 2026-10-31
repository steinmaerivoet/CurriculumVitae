import type { APIRoute, GetStaticPaths } from "astro";
import { getCv } from "@/core";
import { buildApiResources, type ApiResourceName } from "@/bff/api/resources";

// The CV as static JSON: /api/v1/cv.json, /api/v1/skills.json, …
export const getStaticPaths: GetStaticPaths = () =>
  Object.keys(buildApiResources(getCv())).map((resource) => ({ params: { resource } }));

export const GET: APIRoute = ({ params }) => {
  const body = buildApiResources(getCv())[params["resource"] as ApiResourceName];
  return new Response(JSON.stringify(body, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8" } });
};
