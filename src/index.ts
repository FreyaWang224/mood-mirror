import {
  createEntry,
  deleteEntry,
  getEntry,
  InvalidEntryError,
  listEntries,
  updateEntry,
  validateEntryInput,
} from "./entries";
import type { Env } from "./types";

const jsonHeaders = {
  "cache-control": "no-store",
  "content-type": "application/json; charset=utf-8",
};

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: jsonHeaders,
  });
}

function empty(status: number): Response {
  return new Response(null, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: {
      ...jsonHeaders,
      "www-authenticate": "Bearer",
    },
  });
}

function isAuthorized(request: Request, env: Env): boolean {
  const expectedToken = env.DIARY_ACCESS_TOKEN;
  const authorization = request.headers.get("authorization");
  return (
    typeof expectedToken === "string" &&
    expectedToken.length > 0 &&
    authorization === `Bearer ${expectedToken}`
  );
}

async function readEntryInput(request: Request) {
  try {
    return validateEntryInput(await request.json());
  } catch (error) {
    if (error instanceof InvalidEntryError || error instanceof SyntaxError) {
      throw new InvalidEntryError();
    }
    throw error;
  }
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const { pathname } = new URL(request.url);

  if (pathname === "/api/health") {
    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405);
    }
    await env.DB.prepare("SELECT 1").first();
    return json({ ok: true });
  }

  if (pathname === "/api/entries") {
    if (!isAuthorized(request, env)) {
      return unauthorized();
    }

    if (request.method === "GET") {
      return json(await listEntries(env.DB));
    }
    if (request.method === "POST") {
      const input = await readEntryInput(request);
      return json(await createEntry(env.DB, input), 201);
    }
    return json({ error: "Method not allowed" }, 405);
  }

  const match = pathname.match(/^\/api\/entries\/([^/]+)$/);
  if (match) {
    if (!isAuthorized(request, env)) {
      return unauthorized();
    }

    const id = match[1];

    if (request.method === "GET") {
      const entry = await getEntry(env.DB, id);
      return entry === null
        ? json({ error: "Not found" }, 404)
        : json(entry);
    }
    if (request.method === "PUT") {
      const input = await readEntryInput(request);
      const entry = await updateEntry(env.DB, id, input);
      return entry === null
        ? json({ error: "Not found" }, 404)
        : json(entry);
    }
    if (request.method === "DELETE") {
      return (await deleteEntry(env.DB, id))
        ? empty(204)
        : json({ error: "Not found" }, 404);
    }
    return json({ error: "Method not allowed" }, 405);
  }

  return json({ error: "Not found" }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const pathname = new URL(request.url).pathname;
    if (pathname !== "/api" && !pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    try {
      return await handleApi(request, env);
    } catch (error) {
      if (error instanceof InvalidEntryError) {
        return json({ error: "Invalid entry" }, 400);
      }

      console.error("API request failed", error);
      return json({ error: "Internal server error" }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
