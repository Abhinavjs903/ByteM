# ByteM — 3-hour finale runbook

## Priority order
1. Install dependencies and start API + web app.
2. Verify `/api/health` returns `{ "status": "ok", ... }`.
3. Research a known public GitHub profile (start with your own public profile).
4. Verify repository cards and every source link open correctly.
5. Test invalid URL, missing user, GitHub rate limit, and no matching commits.
6. Capture screenshots and rehearse a 90-second demo.

## Timebox
- 0:00–0:25 — install, start both servers, fix environment errors.
- 0:25–1:10 — verify live GitHub data and fix API/UI integration.
- 1:10–1:45 — test SDE, Cybersecurity, and ML/AI role modes; check uncertainties and links.
- 1:45–2:20 — visual polish only for obvious issues; no major rewrites.
- 2:20–2:45 — rehearse the same demo twice and prepare a backup screenshot/video.
- 2:45–3:00 — freeze changes; verify both servers and college ID / presentation materials.

## Demo flow
1. Open ByteM and paste a public GitHub profile URL.
2. Select a target role.
3. Run research and show the real profile/repository metadata.
4. Open one repository source and one sampled commit.
5. Explain a role-keyword match as a lead, not proof of skill.
6. Show uncertainties and interview questions; explicitly state this MVP uses public GitHub metadata and is not a full code audit.

## Local run
Terminal 1:
```powershell
cd apps\api
Copy-Item .env.example .env
npm install
npm run dev
```
Terminal 2:
```powershell
cd apps\web
npm install
npm run dev
```
Health check: http://localhost:4000/api/health
Web app: usually http://localhost:5173

If GitHub returns a rate-limit error, set `GITHUB_TOKEN` in `apps/api/.env` (never in frontend env and never commit `.env`).
