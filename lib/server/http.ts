export const json = (data: unknown, status = 200) => Response.json(data, { status });

export const badRequest = (details: string[]) =>
  json({ error: "Invalid request", details }, 400);

export const notFound = (what = "Student") => json({ error: `${what} not found` }, 404);

export function serverError(e: unknown) {
  console.error("[api]", e);
  return json({ error: "Something went wrong on the server" }, 500);
}

export async function readJson(req: Request): Promise<unknown | undefined> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}

// Postgres error codes surfaced by PostgREST
export const isUniqueViolation = (e: { code?: string } | null) => e?.code === "23505";
export const isForeignKeyViolation = (e: { code?: string } | null) => e?.code === "23503";
