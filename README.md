# ByteM (Byte Matters) — 3-hour GitHub Evidence MVP

ByteM is a technical candidate research prototype. This build retrieves public GitHub profile/repository metadata, samples commits, shows source links, surfaces role-keyword matches, lists limitations, and suggests interview questions. It is not a full code audit, does not yet use an LLM, and must not be used as the sole basis for hiring.

## Stack
- Frontend: React, TypeScript, Vite
- Backend: Node.js, Express, TypeScript
- Evidence source: GitHub REST API (public endpoints)

## Run locally (Node.js 20+)
Terminal 1:
```bash
cd apps/api
cp .env.example .env
npm install
npm run dev
```
Terminal 2:
```bash
cd apps/web
npm install
npm run dev
```
Open the Vite URL (usually http://localhost:5173). API health: http://localhost:4000/api/health.

Optional: add a GitHub personal access token with public read-only access to `apps/api/.env` as `GITHUB_TOKEN=...` to raise rate limits. Do not commit `.env` or expose the token in frontend code.

## Current intended functionality
- Accept GitHub profile or repository URL and target role (SDE, Cybersecurity, ML/AI).
- Retrieve public profile, up to 12 non-fork repos (or selected repo plus profile sample), and commits from up to 4 sampled repos.
- Show repository metadata, source links, role keyword matches, uncertainties, and role-specific interview prompts.
- Keep uncertainty visible; keyword matches are leads, not proof of skill.

## Known limitations (do not overclaim)
- No LLM integration, Chrome extension, WebCMD automation, authentication, database, or deployment configured.
- GitHub's author filter can miss contributions and cannot prove independent authorship.
- Role matching is keyword-based; no source code is audited.
- Runtime, install, build, and live API behavior must be verified on the developer's machine before the demo.
