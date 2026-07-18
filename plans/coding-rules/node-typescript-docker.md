# Node/TypeScript + Docker Rules

Applies to Node/TypeScript apps (NestJS, Next.js, or plain tsc) built inside Docker in this repo.

- Always exclude `**/*.tsbuildinfo` in `.dockerignore`. A host-generated incremental build cache copied into the build context makes `tsc` believe output already exists and it silently skips emitting files — the build reports success but `dist/` (or equivalent) is empty or missing.
- For NestJS apps with a `drizzle.config.ts` (or any root-level `.ts` config file) alongside `src/`, give the project a `tsconfig.build.json` that sets `rootDir: "./src"` and excludes the config file. Without it, `tsc` infers a shared rootDir across `src/` and the loose config file, nesting compiled output under `dist/src/...` instead of `dist/...` and breaking `node dist/main.js`.
