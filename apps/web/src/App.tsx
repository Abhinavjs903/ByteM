import { FormEvent, useState } from "react";

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
type Role = "sde" | "cybersecurity" | "ml_ai";
type Report = {
  generatedAt: string; roleLabel: string; summary: string; methodology: string;
  candidate: { login: string; name: string | null; bio: string | null; avatarUrl: string; profileUrl: string; followers: number; publicRepos: number; createdAt: string };
  evidence: { title: string; detail: string; sourceUrl: string; kind: string }[];
  uncertainties: string[]; interviewQuestions: string[];
  metrics: { sampledRepositories: number; roleRelatedRepositories: number; sampledCommits: number; languages: string[] };
  repositories: { name: string; fullName: string; url: string; description: string | null; language: string | null; stars: number; forks: number; fork: boolean; updatedAt: string; topics: string[]; roleRelated: boolean }[];
  commits: { message: string; date: string | null; url: string; authorLogin: string | null; repo: string }[];
};

export default function App() {
  const [githubUrl, setGithubUrl] = useState("");
  const [role, setRole] = useState<Role>("sde");
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setReport(null);
    try {
      const response = await fetch(`${apiBase}/api/research`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ githubUrl, role }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Research failed.");
      setReport(data as Report);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not reach ByteM API. Start the backend and retry."); }
    finally { setBusy(false); }
  }

  return <main className="shell">
    <header className="topbar"><div className="brand-mark">B</div><div><strong>ByteM</strong><span>BYTE MATTERS</span></div><div className="status-pill"><i /> GitHub evidence MVP</div></header>
    <section className="hero"><p className="eyebrow">TECHNICAL CANDIDATE RESEARCH AGENT</p><h1>Look beyond the resume.<br/><em>Investigate the evidence.</em></h1><p className="intro">Turn public technical artifacts into a structured research brief, with source links and explicit uncertainty. ByteM surfaces evidence; it does not make hiring decisions.</p></section>
    <section className="panel"><div className="panel-heading"><div><p className="eyebrow">START A RESEARCH RUN</p><h2>Candidate profile</h2></div><span className="step">01 / INPUT</span></div>
      <form onSubmit={submit}><label htmlFor="githubUrl">GitHub profile or repository URL</label><input id="githubUrl" type="url" required placeholder="https://github.com/username" value={githubUrl} onChange={e => setGithubUrl(e.target.value)}/><label htmlFor="role">Target technical role</label><select id="role" value={role} onChange={e => setRole(e.target.value as Role)}><option value="sde">Software Engineering (SDE)</option><option value="cybersecurity">Cybersecurity</option><option value="ml_ai">Machine Learning / AI</option></select><button disabled={busy}>{busy ? "Inspecting public evidence…" : "Research candidate →"}</button></form>
      {busy && <div className="notice" role="status">Retrieving public GitHub profile, repository metadata and a limited sample of commits. This may take a few seconds.</div>}{error && <div className="notice error" role="alert">{error}</div>}
    </section>
    <section className="feature-grid"><article><span>01</span><h3>Collect</h3><p>Retrieve public GitHub profile, repositories and sampled commits.</p></article><article><span>02</span><h3>Inspect</h3><p>Surface role-related metadata signals with original source links.</p></article><article><span>03</span><h3>Question</h3><p>Highlight limitations and suggest evidence-led interview questions.</p></article></section>
    {report && <section className="results" aria-live="polite">
      <div className="report-heading"><div><p className="eyebrow">SOURCE-LINKED RESEARCH BRIEF</p><h2>Candidate findings</h2></div><a className="external" href={report.candidate.profileUrl} target="_blank" rel="noreferrer">Open GitHub profile ↗</a></div>
      <div className="candidate-card"><img src={report.candidate.avatarUrl} alt=""/><div className="candidate-main"><h3>{report.candidate.name || report.candidate.login} <span>@{report.candidate.login}</span></h3><p>{report.candidate.bio || "No public bio provided."}</p><small>{report.roleLabel} · {report.candidate.publicRepos} public repos · {report.candidate.followers} followers</small></div></div>
      <div className="metrics"><div><strong>{report.metrics.sampledRepositories}</strong><span>Repos sampled</span></div><div><strong>{report.metrics.roleRelatedRepositories}</strong><span>Keyword-related repos</span></div><div><strong>{report.metrics.sampledCommits}</strong><span>Commits sampled</span></div></div>
      <article className="report-card"><p className="eyebrow">PRELIMINARY SUMMARY</p><p>{report.summary}</p><small>{report.methodology}</small></article>
      <div className="report-columns"><section className="report-card"><p className="eyebrow">OBSERVATIONS</p>{report.evidence.map((item, i) => <div className="evidence-item" key={item.title}><strong>{String(i + 1).padStart(2,"0")} · {item.title}</strong><p>{item.detail}</p><a href={item.sourceUrl} target="_blank" rel="noreferrer">View source ↗</a></div>)}</section><section className="report-card"><p className="eyebrow">UNCERTAINTIES</p><ul>{report.uncertainties.map(x => <li key={x}>{x}</li>)}</ul><p className="eyebrow question-label">INTERVIEW PROBES</p><ol>{report.interviewQuestions.map(x => <li key={x}>{x}</li>)}</ol></section></div>
      <section className="report-card"><div className="report-heading"><div><p className="eyebrow">PUBLIC ARTIFACTS</p><h3>Repository sample</h3></div><span className="step">{report.repositories.length} ITEMS</span></div><div className="repo-list">{report.repositories.map(repo => <article className="repo" key={repo.fullName}><div className="repo-title"><a href={repo.url} target="_blank" rel="noreferrer">{repo.fullName} ↗</a>{repo.roleRelated && <span className="tag">Role keyword match</span>}{repo.fork && <span className="tag muted">Fork</span>}</div><p>{repo.description || "No public description."}</p><div className="repo-meta"><span>{repo.language || "Language not declared"}</span><span>★ {repo.stars}</span><span>⑂ {repo.forks}</span><span>Updated {new Date(repo.updatedAt).toLocaleDateString()}</span></div>{repo.topics.length > 0 && <div className="topics">{repo.topics.slice(0,5).map(t => <span key={t}>{t}</span>)}</div>}</article>)}</div></section>
      <section className="report-card"><p className="eyebrow">SAMPLED COMMITS</p>{report.commits.length ? report.commits.map((commit, i) => <div className="commit" key={commit.url}><a href={commit.url} target="_blank" rel="noreferrer">{commit.message || "Commit details"} ↗</a><span>{commit.repo} · {commit.date ? new Date(commit.date).toLocaleDateString() : "Date unavailable"}</span></div>) : <p>No commits were returned for the sampled repositories and GitHub author filter. This is not proof that the candidate has no contributions.</p>}</section>
      <p className="disclaimer">Generated {new Date(report.generatedAt).toLocaleString()}. This prototype uses public GitHub metadata and keyword matching, not a full code audit or an AI-generated verdict. Never use it as the sole basis for hiring.</p>
    </section>}
    <footer>ByteM · Evidence-first technical research · Prototype for Hack-Tic-Thon ’26</footer>
  </main>;
}
