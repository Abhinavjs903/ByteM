# ByteM (Byte Matters)

An evidence-first technical candidate research prototype. ByteM helps reviewers inspect public technical work, flag resume details for review, and prepare role-specific interview questions. It does not make hiring decisions.

## Features
- Long-scroll dark dashboard with role-focused overview.
- GitHub public profile, repository metadata, sampled commits, and source links.
- Resume parsing for text-based PDF, DOCX, and TXT files; flags potential gaps and shows keyword coverage across roles.
- Built-in role lenses (Software Engineering, Cybersecurity, ML/AI) plus custom roles with editable keyword sets.
- Demo report clearly labelled as sample data.

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
Open http://localhost:5173. API health: http://localhost:4000/api/health.

Optional: set `GITHUB_TOKEN` in `apps/api/.env` to raise GitHub API rate limits. Never commit .env or expose the token in frontend code.

## Important limitations
- Resume flags and role-fit percentages use deterministic keyword heuristics; they are not AI judgments, probabilities, or validated skill scores.
- Resume uploads are processed by the local API and are not saved by the application. Scanned PDFs need OCR; legacy .doc is not supported (save as DOCX/PDF).
- Custom roles are saved in `apps/api/data/roles.json` on the machine running the API.
- GitHub evidence is limited to public metadata and a small commit sample. No full source-code audit or proof of authorship is performed.
- Runtime/build and end-to-end behavior still need to be verified locally after installing dependencies.
