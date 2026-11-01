// Test-only loader: lets Node run the project's TypeScript directly.
// Resolves "@/..." and extensionless imports, and swaps Supabase for an in-memory fake.
import { register } from "node:module";
register("./ts-resolve.mjs", import.meta.url);
