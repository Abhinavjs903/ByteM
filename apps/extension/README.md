# ByteM Chrome Extension (Manifest V3)

A compact Chrome side panel for source-linked candidate research. This is a local prototype that connects to the existing ByteM Express API.

## Features
- Open the side panel from the extension toolbar.
- Use the current GitHub tab to prefill a profile or repository URL.
- Choose Software Engineering, Cybersecurity, or ML/AI and call the existing `POST /api/research` endpoint.
- Inspect candidate profile metadata, repository samples, fork status, sampled commits, and source links.
- Paste resume claims and public source URLs to call `POST /api/resume/verify`.
- GitHub and Hugging Face metadata may be retrieved automatically; LinkedIn and Kaggle links are surfaced for manual review.

## Load unpacked
1. Start the backend: `cd apps/api && npm install && npm run dev`.
2. In Chrome, open `chrome://extensions`.
3. Enable **Developer mode**.
4. Choose **Load unpacked** and select this `apps/extension` folder.
5. Pin ByteM and click its toolbar icon to open the side panel.
6. Test with a public GitHub profile such as `https://github.com/octocat`.

The extension calls `http://localhost:4000`; keep the backend running locally. If Chrome blocks a local request, verify the extension host permissions and backend CORS settings.

## Privacy and limitations
- The extension does not read page contents or scrape LinkedIn. “Use tab” only reads the active tab URL/title via the tabs API.
- Resume claims and links are sent to the local ByteM API only when you click the review button.
- The API uses metadata overlap for triage, not semantic proof. No claim is automatically marked verified or false.
- No WebCMD or LLM provider is integrated in this extension yet.
- Manual browser testing and build validation are still required before release.
