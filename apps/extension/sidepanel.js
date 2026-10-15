const API_BASE = "http://localhost:4000";
const $ = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const isAllowedSource = (value) => {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && ["github.com","www.github.com","huggingface.co","linkedin.com","www.linkedin.com","kaggle.com","www.kaggle.com"].includes(u.hostname);
  } catch { return false; }
};
async function request(path, options = {}) {
  const response = await fetch(API_BASE + path, {...options, headers: {"Content-Type":"application/json", ...(options.headers || {})}});
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `ByteM API returned HTTP ${response.status}`);
  return data;
}
function setStatus(id, message, isError = false) {
  const el = $(id); el.textContent = message; el.classList.toggle("error", isError);
}
function showCards(id, html) { const el = $(id); el.innerHTML = html; el.classList.remove("hidden"); }
function hideResult(id) { $(id).classList.add("hidden"); $(id).textContent = ""; }

$("useCurrent").addEventListener("click", async () => {
  setStatus("researchStatus", "Checking the active tab…");
  try {
    const tab = await chrome.runtime.sendMessage({type:"BYTEM_GET_ACTIVE_TAB"});
    const url = new URL(tab.url);
    if (url.hostname !== "github.com") throw new Error("Open a public GitHub profile or repository tab first.");
    $("profileUrl").value = url.origin + url.pathname.replace(/\/$/, "");
    setStatus("researchStatus", "GitHub URL copied from the active tab.");
  } catch (e) { setStatus("researchStatus", e.message || "Could not read active tab.", true); }
});

$("researchBtn").addEventListener("click", async () => {
  const githubUrl = $("profileUrl").value.trim();
  if (!githubUrl) return setStatus("researchStatus", "Enter a GitHub profile or repository URL.", true);
  $("researchBtn").disabled = true; hideResult("researchResult"); setStatus("researchStatus", "Fetching public profile, repository metadata, and a small commit sample…");
  try {
    const data = await request("/api/research", {method:"POST",body:JSON.stringify({githubUrl,role:$("role").value})});
    const c = data.candidate || {};
    const evidence = (data.evidence || []).map(e => `<article class="result-card"><h3>${escapeHtml(e.title)}</h3><p>${escapeHtml(e.detail)}</p><a href="${escapeHtml(e.sourceUrl)}" target="_blank" rel="noreferrer">Open source ↗</a></article>`).join("");
    const repos = (data.repositories || []).slice(0,6).map(repo => `<article class="result-card"><h3>${escapeHtml(repo.fullName)} ${repo.fork ? '<span class="tag review">FORK</span>' : '<span class="tag">NON-FORK</span>'}</h3><p>${escapeHtml(repo.description || "No description")}</p><p>${escapeHtml(repo.language || "Language not declared")} · ★ ${Number(repo.stars)||0} · Forks ${Number(repo.forks)||0}</p><a href="${escapeHtml(repo.url)}" target="_blank" rel="noreferrer">Inspect repository ↗</a></article>`).join("");
    const commits = (data.commits || []).slice(0,5).map(commit => `<article class="result-card"><h3>${escapeHtml(commit.message)}</h3><p>${escapeHtml(commit.repo)} · ${escapeHtml(commit.date ? new Date(commit.date).toLocaleDateString() : "Date unavailable")}</p><a href="${escapeHtml(commit.url)}" target="_blank" rel="noreferrer">Inspect commit ↗</a></article>`).join("");
    showCards("researchResult", `<article class="result-card"><h3>${escapeHtml(c.name || c.login || "GitHub candidate")} · @${escapeHtml(c.login)}</h3><p>${escapeHtml(c.bio || "No public bio")}<br>${Number(c.publicRepos)||0} public repositories · ${Number(c.followers)||0} followers</p><a href="${escapeHtml(c.profileUrl)}" target="_blank" rel="noreferrer">Open profile ↗</a></article><p class="eyebrow">SOURCE-LINKED OBSERVATIONS</p>${evidence}<p class="eyebrow">REPOSITORY SAMPLE</p>${repos || '<p class="fine-print">No public repositories were returned.</p>'}<p class="eyebrow">SAMPLED COMMITS</p>${commits || '<p class="fine-print">No commits were returned in this sample.</p>'}<p class="fine-print">${escapeHtml((data.uncertainties || []).join(" "))}</p>`);
    setStatus("researchStatus", "Research complete. Treat findings as leads for human review.");
  } catch (e) { setStatus("researchStatus", e.message || "Research failed.", true); }
  finally { $("researchBtn").disabled = false; }
});

$("verifyBtn").addEventListener("click", async () => {
  const claims = $("claims").value.split("\n").map(s=>s.trim()).filter(Boolean);
  const sourceUrls = $("sourceUrls").value.split(/[\s,]+/).map(s=>s.trim()).filter(Boolean);
  if (!claims.length) return setStatus("verifyStatus", "Add at least one resume claim, one per line.", true);
  if (claims.length > 20) return setStatus("verifyStatus", "Please review at most 20 claims per run.", true);
  if (sourceUrls.some(url => !isAllowedSource(url))) return setStatus("verifyStatus", "Use HTTPS links from GitHub, Hugging Face, LinkedIn, or Kaggle.", true);
  $("verifyBtn").disabled = true; hideResult("verifyResult"); setStatus("verifyStatus", "Retrieving accessible public metadata and comparing source signals…");
  try {
    const data = await request("/api/resume/verify", {method:"POST",body:JSON.stringify({claims,sourceUrls})});
    const claimCards = (data.claims || []).map(item => `<article class="result-card"><span class="tag ${item.status === "supporting_signals_found" ? "" : "review"}">${item.status === "supporting_signals_found" ? "SIGNALS FOUND" : "HUMAN REVIEW"}</span><h3>${escapeHtml(item.claim)}</h3><p>${escapeHtml(item.detail)}</p>${item.matchedTerms?.length ? `<p>Overlapping terms: ${escapeHtml(item.matchedTerms.join(", "))}</p>` : ""}</article>`).join("");
    const sourceCards = (data.sources || []).map(source => `<article class="result-card"><span class="tag ${source.accessible ? "" : "review"}">${source.accessible ? "METADATA RETRIEVED" : "MANUAL REVIEW"}</span><h3>${escapeHtml(source.platform)}</h3><p>${escapeHtml(source.detail)}</p><a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">Open source ↗</a></article>`).join("");
    showCards("verifyResult", `<p class="fine-print">${escapeHtml(data.summary)}</p><p class="eyebrow">CLAIM REVIEW</p>${claimCards}<p class="eyebrow">SOURCES</p>${sourceCards}<p class="fine-print">${escapeHtml((data.limitations || []).join(" "))}</p>`);
    setStatus("verifyStatus", "Review ready. No claim is automatically marked true or false.");
  } catch (e) { setStatus("verifyStatus", e.message || "Claim review failed.", true); }
  finally { $("verifyBtn").disabled = false; }
});

request("/api/health").then(data => setStatus("researchStatus", "API connected · " + (data.service || "ByteM"))).catch(() => setStatus("researchStatus", "Start apps/api first: npm run dev (port 4000).", true));
