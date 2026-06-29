import {
  AiServiceError,
  AiServiceNotConfiguredError,
  analyzeDiary,
  InvalidAnalysisInputError,
  validateAnalysisInput,
} from "./ai";
import {
  createEntry,
  deleteEntry,
  getEntry,
  InvalidEntryError,
  InvalidOwnerError,
  listEntries,
  updateEntry,
  validateOwnerId,
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

function readOwnerId(request: Request) {
  return validateOwnerId(request.headers.get("x-diary-owner"));
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

async function readAnalysisInput(request: Request) {
  try {
    return validateAnalysisInput(await request.json());
  } catch (error) {
    if (
      error instanceof InvalidAnalysisInputError ||
      error instanceof SyntaxError
    ) {
      throw new InvalidAnalysisInputError();
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

  if (pathname === "/api/analyze") {
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    readOwnerId(request);
    const input = await readAnalysisInput(request);
    return json(await analyzeDiary(env, input));
  }

  if (pathname === "/api/entries") {
    const ownerId = readOwnerId(request);

    if (request.method === "GET") {
      return json(await listEntries(env.DB, ownerId));
    }
    if (request.method === "POST") {
      const input = await readEntryInput(request);
      return json(await createEntry(env.DB, ownerId, input), 201);
    }
    return json({ error: "Method not allowed" }, 405);
  }

  const match = pathname.match(/^\/api\/entries\/([^/]+)$/);
  if (match) {
    const ownerId = readOwnerId(request);
    const id = match[1];

    if (request.method === "GET") {
      const entry = await getEntry(env.DB, ownerId, id);
      return entry === null
        ? json({ error: "Not found" }, 404)
        : json(entry);
    }
    if (request.method === "PUT") {
      const input = await readEntryInput(request);
      const entry = await updateEntry(env.DB, ownerId, id, input);
      return entry === null
        ? json({ error: "Not found" }, 404)
        : json(entry);
    }
    if (request.method === "DELETE") {
      return (await deleteEntry(env.DB, ownerId, id))
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
      if (error instanceof InvalidOwnerError) {
        return json({ error: "Invalid owner" }, 400);
      }
      if (error instanceof InvalidAnalysisInputError) {
        return json({ error: "Invalid analysis request" }, 400);
      }
      if (error instanceof AiServiceNotConfiguredError) {
        return json({ error: "AI service not configured" }, 503);
      }
      if (error instanceof AiServiceError) {
        return json({ error: "AI service failed" }, 502);
      }

      console.error("API request failed", error);
      return json({ error: "Internal server error" }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
