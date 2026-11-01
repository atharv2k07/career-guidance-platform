import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fake = pathToFileURL(path.join(root, "scripts/fake-supabase.mjs")).href;

export async function resolve(specifier, context, next) {
  if (specifier === "@supabase/supabase-js") return { url: fake, shortCircuit: true };
  if (specifier.startsWith("@/")) {
    return { url: pathToFileURL(path.join(root, specifier.slice(2) + ".ts")).href, shortCircuit: true };
  }
  try {
    return await next(specifier, context);
  } catch (e) {
    if (specifier.startsWith(".") && !/\.\w+$/.test(specifier)) return next(specifier + ".ts", context);
    throw e;
  }
}
