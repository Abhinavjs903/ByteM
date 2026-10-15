import { ChangeEvent, FormEvent, useEffect, useState } from "react";

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
type Role = { id: string; name: string; description: string; keywords: string[]; builtIn?: boolean };
type ResumeAnalysis = { filename: string; wordCount: number; flags: { severity: "high" | "medium" | "info"; title: string; detail: string }[]; roleMatches: { id: string; name: string; matches: string[]; fitPercent: number }[]; detectedSkills: string[]; summary: string; limitations: string[] };
type Page = "overview" | "research" | "resume" | "sources" | "reports";
type Repo = { name: string; fullName: string; url: string; description: string | null; language: string | null; stars: number; forks: number; fork: boolean; updatedAt: string; topics: string[]; roleRelated: boolean };
type Report = {
  generatedAt: string; roleLabel: string; summary: string; methodology: string; demo?: boolean;
  candidate: { login: string; name: string | null; bio: string | null; avatarUrl: string; profileUrl: string; followers: number; publicRepos: number; createdAt: string };
  evidence: { title: string; detail: string; sourceUrl: string; kind: string }[];
  uncertainties: string[]; interviewQuestions: string[];
  metrics: { sampledRepositories: number; roleRelatedRepositories: number; sampledCommits: number; languages: string[] };
  repositories: Repo[];
  commits: { message: string; date: string | null; url: string; authorLogin: string | null; repo: string }[];
};

const demoReport: Report = {
  generatedAt: "2026-10-15T04:30:00.000Z", roleLabel: "Software Engineering (SDE)", demo: true,
  summary: "This sample brief demonstrates how ByteM can organize public engineering artifacts into evidence-linked observations. It is illustrative demo data, not a live assessment of this candidate.",
  methodology: "Demo mode: static sample profile and repository records. No GitHub API call was made for this preview.",
  candidate: { login: "octocat", name: "The Octocat", bio: "GitHub mascot profile used for product demonstrations.", avatarUrl: "https://github.com/octocat.png", profileUrl: "https://github.com/octocat", followers: 20, publicRepos: 8, createdAt: "2011-01-25T18:44:36Z" },
  evidence: [
    { title: "Repository metadata available", detail: "Sample repository records include language, description, stars, and last-updated metadata. These fields help guide follow-up research but do not prove individual skill.", sourceUrl: "https://github.com/octocat", kind: "profile" },
    { title: "Project context needs verification", detail: "A repository description can indicate a project's intended purpose. Inspect code, history, and contribution context before drawing conclusions.", sourceUrl: "https://github.com/octocat/Hello-World", kind: "repository" },
    { title: "Role fit is a research lead", detail: "Keyword matches can prioritize what to inspect next; they are not a validated skill score or hiring recommendation.", sourceUrl: "https://github.com/octocat/Spoon-Knife", kind: "repository" }
  ],
  uncertainties: ["This report uses static demo data rather than a live profile fetch.", "Public activity may not represent private work or contributions on other platforms.", "Repository ownership alone does not establish how much work the candidate authored."],
  interviewQuestions: ["Walk through one design decision in a project you contributed to and the trade-offs you considered.", "How would you test and debug a failure in this project's main workflow?", "Which part of this repository best demonstrates your own contribution, and how can we verify it?"],
  metrics: { sampledRepositories: 3, roleRelatedRepositories: 2, sampledCommits: 4, languages: ["JavaScript", "HTML", "CSS"] },
  repositories: [
    { name: "Hello-World", fullName: "octocat/Hello-World", url: "https://github.com/octocat/Hello-World", description: "My first repository on GitHub!", language: "Markdown", stars: 3200, forks: 1800, fork: false, updatedAt: "2026-09-25T10:00:00Z", topics: ["getting-started", "documentation"], roleRelated: true },
    { name: "Spoon-Knife", fullName: "octocat/Spoon-Knife", url: "https://github.com/octocat/Spoon-Knife", description: "This repo is for demonstration purposes.", language: "HTML", stars: 12000, forks: 150000, fork: false, updatedAt: "2026-10-02T10:00:00Z", topics: ["demo", "html", "css"], roleRelated: true },
    { name: "git-consortium", fullName: "octocat/git-consortium", url: "https://github.com/octocat/git-consortium", description: "A sample collaborative repository.", language: "JavaScript", stars: 18, forks: 6, fork: false, updatedAt: "2026-08-18T10:00:00Z", topics: ["collaboration"], roleRelated: false }
  ],
  commits: [
    { message: "Update README with project information", date: "2026-10-02T10:00:00Z", url: "https://github.com/octocat/Hello-World/commits/main", authorLogin: "octocat", repo: "octocat/Hello-World" },
    { message: "Add sample page assets", date: "2026-09-25T10:00:00Z", url: "https://github.com/octocat/Spoon-Knife/commits/main", authorLogin: "octocat", repo: "octocat/Spoon-Knife" },
    { message: "Document setup steps", date: "2026-09-20T10:00:00Z", url: "https://github.com/octocat/Hello-World/commits/main", authorLogin: "octocat", repo: "octocat/Hello-World" },
    { message: "Improve repository description", date: "2026-09-18T10:00:00Z", url: "https://github.com/octocat/git-consortium/commits/main", authorLogin: "octocat", repo: "octocat/git-consortium" }
  ]
};

const navItems: { id: Page; icon: string; label: string }[] = [
  { id: "overview", icon: "⌂", label: "Overview" },
  { id: "research", icon: "⌕", label: "Candidate research" },
  { id: "resume", icon: "▤", label: "Resume review" },
  { id: "sources", icon: "◎", label: "Data sources" },
  { id: "reports", icon: "▧", label: "Reports" }
];

export default function App() {
  const [page, setPage] = useState<Page>("overview");
  const [githubUrl, setGithubUrl] = useState("");
  const [role, setRole] = useState("sde");
  const [roles, setRoles] = useState<Role[]>([]);
  const [customRoleName, setCustomRoleName] = useState("");
  const [customRoleDescription, setCustomRoleDescription] = useState("");
  const [customRoleKeywords, setCustomRoleKeywords] = useState("");
  const [roleNotice, setRoleNotice] = useState("");
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const [resumeBusy, setResumeBusy] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeDemo, setResumeDemo] = useState(false);

  useEffect(() => { fetch(apiBase + "/api/roles").then(r => r.json()).then(d => setRoles(d.roles ?? [])).catch(() => setRoles([])); }, []);

  async function createRole(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setRoleNotice(""); const keywords = customRoleKeywords.split(",").map(k => k.trim()).filter(Boolean); try { const response = await fetch(apiBase + "/api/roles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: customRoleName, description: customRoleDescription, keywords }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Could not create role."); const refreshed = await fetch(apiBase + "/api/roles").then(r => r.json()); setRoles(refreshed.roles ?? []); setRole(data.role.id); setCustomRoleName(""); setCustomRoleDescription(""); setCustomRoleKeywords(""); setRoleNotice("Role created and selected."); } catch (e) { setRoleNotice(e instanceof Error ? e.message : "Could not create role. Is the backend running?"); } }
  async function analyzeResume() { if (!resumeFile) return; setResumeBusy(true); setResumeError(""); setResumeAnalysis(null); try { const form = new FormData(); form.append("resume", resumeFile); const response = await fetch(apiBase + "/api/resume/analyze", { method: "POST", body: form }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Resume analysis failed."); setResumeAnalysis(data as ResumeAnalysis); } catch (e) { setResumeError(e instanceof Error ? e.message : "Could not analyze resume."); } finally { setResumeBusy(false); } }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setReport(null);
    try {
      const response = await fetch(apiBase + "/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUrl, role })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Research failed.");
      setReport(data as Report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach ByteM API. Start the backend and retry.");
    } finally { setBusy(false); }
  }

  function showDemo() {
    setReport({ ...demoReport, generatedAt: new Date().toISOString() });
    setGithubUrl("https://github.com/octocat");
    setRole("sde");
    setError("");
  }

  function onResumeChange(event: ChangeEvent<HTMLInputElement>) {
    setResumeFile(event.target.files?.[0] ?? null);
    setResumeDemo(false);
  }

  const pageTitle = navItems.find((item) => item.id === page)?.label ?? "Overview";

  return <div className="app-frame">
    <main className="main-area">
      <header className="page-topbar">
        <a className="brand top-brand" href="#" onClick={(e) => { e.preventDefault(); setPage("overview"); }} aria-label="ByteM home"><span className="brand-symbol">B</span><span className="top-brand-copy"><strong>ByteM</strong><small>BYTE MATTERS</small></span></a>
        <nav className="top-nav" aria-label="Main navigation">{navItems.map((item) => <button key={item.id} className={"top-nav-item " + (page === item.id ? "active" : "")} onClick={() => setPage(item.id)}>{item.label}{item.id === "sources" && <span className="nav-count">1/4</span>}</button>)}</nav>
        <div className="topbar-right"><span className="live-pill"><i></i> Preview</span><a href="https://github.com/Abhinavjs903/ByteM" target="_blank" rel="noreferrer" className="github-link">GitHub ↗</a></div>
      </header>
      {page === "overview" && <section className="page-content">
        <div className="welcome-row"><div><p className="eyebrow">TECHNICAL TALENT INTELLIGENCE</p><h1>Research beyond the resume.</h1><p className="muted-text">Turn public technical work into structured, evidence-linked research.</p><div className="hero-chips"><span><i className="chip-dot cyan"></i> GitHub evidence</span><span><i className="chip-dot green"></i> Resume analysis</span><span><i className="chip-dot violet"></i> Custom role signals</span></div></div><div className="hero-visual" aria-hidden="true"><div className="hero-glow"></div><div className="hero-ring ring-one"></div><div className="hero-ring ring-two"></div><div className="hero-core"><span>B</span><small>BYTE<br/>MATTERS</small></div><div className="hero-float float-top">↗ <span>Evidence</span></div><div className="hero-float float-bottom">✓ <span>Role signals</span></div></div><button className="primary compact" onClick={() => setPage("research")}>＋ New research</button></div>
        <div className="stat-grid"><article className="stat-card"><span className="stat-icon blue">⌕</span><small>Research runs</small><strong>03</strong><span className="stat-foot">2 demo · 1 live-ready flow</span></article><article className="stat-card"><span className="stat-icon green">↗</span><small>Evidence sources</small><strong>01 <em>active</em></strong><span className="stat-foot">GitHub API integration</span></article><article className="stat-card"><span className="stat-icon violet">▤</span><small>Resume reviews</small><strong>01 <em>API ready</em></strong><span className="stat-foot">PDF, DOCX and TXT analysis</span></article><article className="stat-card"><span className="stat-icon amber">◎</span><small>Platforms planned</small><strong>04</strong><span className="stat-foot">GitLab, Hugging Face, Kaggle, web</span></article></div>
        <div className="section-heading"><div><h2>Start with a candidate</h2><p>Choose a source and generate an evidence brief.</p></div><span className="subtle-label">QUICK START</span></div>
        <div className="quick-grid"><button className="quick-card" onClick={() => setPage("research")}><span className="quick-icon github-icon">⌘</span><span><strong>Research GitHub profile</strong><small>Repositories, commits and role signals</small></span><b>→</b></button><button className="quick-card" onClick={() => setPage("resume")}><span className="quick-icon resume-icon">▤</span><span><strong>Review a resume</strong><small>Flags, skills and role-fit signals</small></span><b>→</b></button></div>
        <div className="section-heading"><div><h2>Recent activity</h2><p>Example items to preview the product flow.</p></div><button className="text-button" onClick={() => setPage("reports")}>View reports →</button></div>
        <div className="activity-list"><button className="activity-row" onClick={() => { showDemo(); setPage("reports"); }}><div className="activity-avatar">O</div><div className="activity-main"><strong>octocat <span className="demo-tag">DEMO DATA</span></strong><small>Software Engineering · Sample research brief</small></div><span className="activity-status">Preview report →</span></button><div className="activity-row static-row"><div className="activity-avatar neutral">R</div><div className="activity-main"><strong>Resume upload flow</strong><small>Resume flags + role keyword coverage</small></div><span className="planned-tag">In progress</span></div></div>
        <div className="notice-banner"><span>ⓘ</span><p><strong>Evidence first, not auto-hiring.</strong> ByteM summarizes public artifacts and uncertainty. Demo records are labelled and should never be treated as a real candidate assessment.</p></div><section className="story-section"><p className="eyebrow">A BETTER WAY TO REVIEW TECHNICAL TALENT</p><h2>From a static resume to a clearer picture.</h2><p className="muted-text">Connect candidate claims to inspectable evidence—without pretending a keyword score is a hiring decision.</p><div className="story-grid"><article><span>01 / COLLECT</span><h3>Bring the signals together</h3><p>Resume text, public repositories, commit samples and project links in one research flow.</p></article><article><span>02 / FLAG</span><h3>Spot what needs a closer look</h3><p>Missing contact details, thin project evidence, unclear outcomes and gaps worth clarifying.</p></article><article><span>03 / VALIDATE</span><h3>Turn findings into questions</h3><p>Role-specific interview probes linked to original sources and visible uncertainty.</p></article></div></section><section className="story-section"><p className="eyebrow">BUILT FOR DIFFERENT TECHNICAL PATHS</p><h2>One workflow. Different role lenses.</h2><div className="role-story-grid">{roles.slice(0,6).map(r => <button key={r.id} onClick={() => { setRole(r.id); setPage("research"); }}><span>{r.builtIn ? "CORE ROLE" : "CUSTOM ROLE"}</span><strong>{r.name}</strong><small>{r.description}</small><b>Research this role ↗</b></button>)}</div><button className="secondary" onClick={() => setPage("research")}>＋ Create a custom role</button></section><section className="story-section final-cta"><p className="eyebrow">EVIDENCE, NOT GUESSWORK</p><h2>Make the next review more structured.</h2><p>Start with a public GitHub profile or review a resume for role signals and follow-up questions.</p><button className="primary" onClick={() => setPage("research")}>Start candidate research →</button></section>
      </section>}
      {page === "research" && <section className="page-content">
        <div className="welcome-row"><div><p className="eyebrow">SOURCE-LINKED INVESTIGATION</p><h1>Candidate research</h1><p className="muted-text">Run against public GitHub data or preview the flow with clearly labelled sample data.</p></div><span className="source-pill"><i></i> GitHub · first connector</span></div>
        <div className="research-layout"><section className="surface-card"><div className="card-heading"><div><p className="eyebrow">STEP 01</p><h2>Candidate details</h2></div><span className="step-badge">INPUT</span></div><form onSubmit={submit} className="research-form"><label htmlFor="githubUrl">GitHub profile or repository URL</label><input id="githubUrl" type="url" required placeholder="https://github.com/username" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} /><label htmlFor="role">Target technical role</label><select id="role" value={role} onChange={(e) => setRole(e.target.value)}>{roles.map(r => <option key={r.id} value={r.id}>{r.name}{r.builtIn ? "" : " · Custom"}</option>)}</select><button className="primary" disabled={busy}>{busy ? "Inspecting public evidence…" : "Run GitHub research →"}</button>{error && <div className="notice error" role="alert">{error}</div>}{busy && <div className="notice" role="status">Fetching public profile, repositories and a limited commit sample…</div>}</form><div className="divider"></div><div className="role-builder"><p className="eyebrow">CUSTOM ROLE BUILDER</p><h3>Create another role</h3><p className="muted-text small">Add a role and comma-separated keywords used by resume matching and GitHub research.</p><form className="role-form" onSubmit={createRole}><input required minLength={2} maxLength={60} placeholder="Role name · e.g. DevOps Engineer" value={customRoleName} onChange={e => setCustomRoleName(e.target.value)} /><input placeholder="Short description (optional)" value={customRoleDescription} onChange={e => setCustomRoleDescription(e.target.value)} /><textarea required placeholder="Keywords · Docker, Kubernetes, CI/CD" value={customRoleKeywords} onChange={e => setCustomRoleKeywords(e.target.value)} rows={3} /><button className="secondary" type="submit">＋ Save custom role</button>{roleNotice && <div className="notice">{roleNotice}</div>}</form></div><div className="divider"></div><div className="demo-prompt"><div><strong>Just exploring the interface?</strong><small>Load a sample report. No API call is made.</small></div><button className="secondary" type="button" onClick={showDemo}>Preview demo report</button></div></section>
          <section className="surface-card what-card"><p className="eyebrow">WHAT YOU'LL GET</p><h2>An evidence-led brief</h2><div className="deliverable"><span>01</span><div><strong>Public footprint</strong><small>Profile, repository metadata and commit sample</small></div></div><div className="deliverable"><span>02</span><div><strong>Relevant signals</strong><small>Role-related project context with source links</small></div></div><div className="deliverable"><span>03</span><div><strong>Interview probes</strong><small>Questions designed to validate observed work</small></div></div><div className="side-note">Role keyword matches are clues for follow-up, not validated skill scores.</div></section></div>
        {report && <ReportView report={report} />}
      </section>}
      {page === "resume" && <section className="page-content">
        <div className="welcome-row"><div><p className="eyebrow">RESUME + PUBLIC EVIDENCE</p><h1>Resume review</h1><p className="muted-text">Extract resume text, flag missing signals, and compare keyword coverage across roles.</p></div><span className="planned-tag larger">UI prototype</span></div>
        <div className="resume-layout"><section className="surface-card upload-card"><div className="upload-symbol">↑</div><h2>Upload a candidate resume</h2><p>Upload a PDF, DOCX or TXT file for a heuristic resume scan.</p><label className="file-picker" htmlFor="resumeFile">Choose file</label><input className="visually-hidden" id="resumeFile" type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={onResumeChange}/><small className="file-help">PDF, DOCX, TXT · max 8 MB</small>{resumeFile && <div className="selected-file"><span className="file-icon">▤</span><div><strong>{resumeFile.name}</strong><small>{(resumeFile.size / 1024 / 1024).toFixed(2)} MB · Selected locally</small></div><button className="remove-file" onClick={() => { setResumeFile(null); setResumeDemo(false); }}>×</button></div>}{resumeFile && <><div className="notice">Selected: {resumeFile.name}. It will be sent to your local ByteM API for text extraction.</div><button className="primary full-width" disabled={resumeBusy} onClick={analyzeResume}>{resumeBusy ? "Extracting resume text…" : "Analyze resume + role fit →"}</button></>}{resumeError && <div className="notice error">{resumeError}</div>}</section>
          <section className="surface-card"><p className="eyebrow">ANALYSIS PIPELINE</p><h2>What ByteM checks</h2><div className="skill-chip-row"><span>Skills</span><span>Projects</span><span>Experience</span><span>Education</span><span>Links</span></div><p className="muted-text small">The API extracts text, detects common resume gaps, identifies skill keywords and estimates role keyword coverage. It does not make hiring decisions.</p><button className="secondary full-width" onClick={() => setResumeDemo(!resumeDemo)}>{resumeDemo ? "Hide sample extraction" : "Preview sample extraction"}</button>{resumeDemo && <div className="sample-extract"><span className="demo-tag">DEMO OUTPUT · NOT FROM YOUR FILE</span><h3>Example candidate profile</h3><p><strong>Skills:</strong> React, TypeScript, Node.js, SQL</p><p><strong>Project claim:</strong> Built a task management web app</p><p><strong>Verification state:</strong> Illustrative only — no external evidence was checked.</p></div>}</section></div>
        <div className="notice-banner"><span>ⓘ</span><p><strong>Privacy note:</strong> the selected file is sent to your local API for parsing and is not saved by this prototype.</p></div>
      </section>}
      {page === "resume" && resumeAnalysis && <section className="page-content resume-results"><div className="section-heading"><div><h2>Resume findings</h2><p>{resumeAnalysis.filename} · {resumeAnalysis.wordCount} words extracted</p></div><span className="subtle-label">HEURISTIC SCAN</span></div><div className="flag-grid">{resumeAnalysis.flags.map((flag,i) => <article className={"flag-card "+flag.severity} key={i}><span className="flag-severity">{flag.severity.toUpperCase()}</span><h3>{flag.title}</h3><p>{flag.detail}</p></article>)}</div><div className="surface-card"><h2>Role fit signals</h2><p className="muted-text small">Keyword coverage only—not probability of job success.</p>{resumeAnalysis.roleMatches.map(r => <div className="fit-row" key={r.id}><div className="fit-label"><strong>{r.name}</strong><span>{r.matches.length} matching keywords</span></div><div className="fit-track"><div style={{width:r.fitPercent+"%"}} /></div><strong className="fit-percent">{r.fitPercent}%</strong><small className="fit-matches">{r.matches.slice(0,8).join(" · ") || "No keyword matches detected"}</small></div>)}<div className="skill-chip-row">{resumeAnalysis.detectedSkills.map(x=><span key={x}>{x}</span>)}</div><p className="muted-text small">{resumeAnalysis.summary}</p><ul className="limitations">{resumeAnalysis.limitations.map(x=><li key={x}>{x}</li>)}</ul></div></section>}
      {page === "sources" && <section className="page-content">
        <div className="welcome-row"><div><p className="eyebrow">SOURCE MANAGEMENT</p><h1>Research sources</h1><p className="muted-text">Add platforms over time. Only GitHub is wired to the current backend.</p></div><span className="source-pill"><i></i> 1 active</span></div>
        <div className="source-grid"><SourceCard icon="⌘" name="GitHub" desc="Public profiles, repositories, topics and a limited commit sample." status="Connected in prototype" active /><SourceCard icon="G" name="GitLab" desc="Projects, languages and public contribution context." status="Planned" /><SourceCard icon="H" name="Hugging Face" desc="Public ML models, datasets and model cards." status="Planned" /><SourceCard icon="K" name="Kaggle" desc="Public notebooks and competition evidence, subject to access." status="Planned" /><SourceCard icon="↗" name="Portfolio & blogs" desc="Project case studies, documentation and technical write-ups." status="Planned" /><SourceCard icon="in" name="Resume document" desc="PDF/DOCX claims to extract and cross-check against evidence." status="API analysis" /></div>
        <div className="notice-banner"><span>ⓘ</span><p><strong>Platform access varies.</strong> We'll use official APIs or permitted public pages, and will show unavailable data as unknown rather than infer a negative result.</p></div>
      </section>}
      {page === "reports" && <section className="page-content">
        <div className="welcome-row"><div><p className="eyebrow">RESEARCH HISTORY</p><h1>Reports</h1><p className="muted-text">Preview sample output or run a live GitHub query from Candidate research.</p></div><button className="primary compact" onClick={() => setPage("research")}>＋ New research</button></div>
        {report ? <ReportView report={report} /> : <div className="empty-state"><div className="empty-icon">▧</div><h2>No report opened yet</h2><p>Load the sample report to explore the output, or run a GitHub research request.</p><button className="primary compact" onClick={showDemo}>Load demo report</button></div>}
      </section>}
      <footer className="app-footer">ByteM · Evidence-first technical research · <a href="https://github.com/Abhinavjs903/ByteM" target="_blank" rel="noreferrer">Open source repository ↗</a></footer>
    </main>
  </div>;
}

function SourceCard({ icon, name, desc, status, active = false }: { icon: string; name: string; desc: string; status: string; active?: boolean }) {
  return <article className="source-card"><div className={"source-logo " + (active ? "active-logo" : "")}>{icon}</div><div className="source-title"><h3>{name}</h3><span className={active ? "connected-status" : "planned-tag"}>{status}</span></div><p>{desc}</p><div className="source-card-bottom"><span>{active ? "First-party connector" : "Roadmap"}</span><span>{active ? "●" : "○"}</span></div></article>;
}

function ReportView({ report }: { report: Report }) {
  return <section className="results" aria-live="polite">
    {report.demo && <div className="demo-banner"><span>✦</span><div><strong>Sample report · Demo data</strong><small>This is illustrative content. No candidate API lookup was made for this report.</small></div></div>}
    <div className="report-heading"><div><p className="eyebrow">SOURCE-LINKED RESEARCH BRIEF</p><h2>Candidate findings</h2></div><a className="external" href={report.candidate.profileUrl} target="_blank" rel="noreferrer">Open GitHub profile ↗</a></div>
    <div className="candidate-card"><img src={report.candidate.avatarUrl} alt="" /><div className="candidate-main"><h3>{report.candidate.name || report.candidate.login} <span>@{report.candidate.login}</span></h3><p>{report.candidate.bio || "No public bio provided."}</p><small>{report.roleLabel} · {report.candidate.publicRepos} public repos · {report.candidate.followers} followers</small></div></div>
    <div className="metrics"><div><strong>{report.metrics.sampledRepositories}</strong><span>Repos sampled</span></div><div><strong>{report.metrics.roleRelatedRepositories}</strong><span>Keyword-related repos</span></div><div><strong>{report.metrics.sampledCommits}</strong><span>Commits sampled</span></div></div>
    <article className="report-card"><p className="eyebrow">PRELIMINARY SUMMARY</p><p>{report.summary}</p><small>{report.methodology}</small></article>
    <div className="report-columns"><section className="report-card"><p className="eyebrow">OBSERVATIONS</p>{report.evidence.map((item, i) => <div className="evidence-item" key={item.title}><strong>{String(i + 1).padStart(2, "0")} · {item.title}</strong><p>{item.detail}</p><a href={item.sourceUrl} target="_blank" rel="noreferrer">View source ↗</a></div>)}</section><section className="report-card"><p className="eyebrow">UNCERTAINTIES</p><ul>{report.uncertainties.map((x) => <li key={x}>{x}</li>)}</ul><p className="eyebrow question-label">INTERVIEW PROBES</p><ol>{report.interviewQuestions.map((x) => <li key={x}>{x}</li>)}</ol></section></div>
    <section className="report-card"><div className="report-heading"><div><p className="eyebrow">PUBLIC ARTIFACTS</p><h3>Repository sample</h3></div><span className="step-badge">{report.repositories.length} ITEMS</span></div><div className="repo-list">{report.repositories.map((repo) => <article className="repo" key={repo.fullName}><div className="repo-title"><a href={repo.url} target="_blank" rel="noreferrer">{repo.fullName} ↗</a>{repo.roleRelated && <span className="tag">Role keyword match</span>}{repo.fork && <span className="tag muted">Fork</span>}</div><p>{repo.description || "No public description."}</p><div className="repo-meta"><span>{repo.language || "Language not declared"}</span><span>★ {repo.stars}</span><span>⑂ {repo.forks}</span><span>Updated {new Date(repo.updatedAt).toLocaleDateString()}</span></div>{repo.topics.length > 0 && <div className="topics">{repo.topics.slice(0, 5).map((t) => <span key={t}>{t}</span>)}</div>}</article>)}</div></section>
    <section className="report-card"><p className="eyebrow">SAMPLED COMMITS</p>{report.commits.length ? report.commits.map((commit) => <div className="commit" key={commit.url}><a href={commit.url} target="_blank" rel="noreferrer">{commit.message || "Commit details"} ↗</a><span>{commit.repo} · {commit.date ? new Date(commit.date).toLocaleDateString() : "Date unavailable"}</span></div>) : <p>No commits were returned for the sampled repositories. This is not proof that the candidate has no contributions.</p>}</section>
    <p className="disclaimer">Generated {new Date(report.generatedAt).toLocaleString()}. This prototype uses public GitHub metadata and keyword matching, not a full code audit or AI-generated verdict. Never use it as the sole basis for hiring.</p>
  </section>;
}
