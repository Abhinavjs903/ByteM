import "dotenv/config";
import express from "express";
import cors from "cors";
import { z } from "zod";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173";
const GH = "https://api.github.com";
app.use(cors({ origin: webOrigin }));
app.use(express.json({ limit: "1mb" }));

const requestSchema = z.object({
  githubUrl: z.string().url(),
  role: z.enum(["sde", "cybersecurity", "ml_ai"]),
});

type Repo = {
  name: string; full_name: string; html_url: string; description: string | null;
  stargazers_count: number; forks_count: number; language: string | null;
  topics?: string[]; updated_at: string; fork: boolean; default_branch: string;
};
type Commit = { html_url: string; commit: { message: string; author: { date: string; name: string } | null }; author: { login: string } | null };

async function gh<T>(path: string): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "ByteM-Research-Prototype" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const response = await fetch(`${GH}${path}`, { headers, signal: AbortSignal.timeout(12000) });
  if (!response.ok) {
    const error = new Error(response.status === 404 ? "GitHub profile or repository was not found, or is private." : response.status === 403 ? "GitHub API rate limit reached. Add GITHUB_TOKEN to apps/api/.env and retry." : `GitHub API returned ${response.status}.`);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }
  return response.json() as Promise<T>;
}

function parseGithubUrl(raw: string) {
  const url = new URL(raw);
  if (url.hostname.toLowerCase() !== "github.com") throw new Error("Enter a public github.com profile or repository URL.");
  const parts = url.pathname.split("/").filter(Boolean);
  if (!parts.length || parts.length > 2) throw new Error("Use a profile URL (github.com/username) or repository URL (github.com/owner/repo).");
  return { owner: parts[0], repoName: parts[1] };
}

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "bytem-api", stage: "github-evidence-mvp" }));

app.post("/api/research", async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Provide a valid GitHub URL and target role." });
  let parsedUrl: ReturnType<typeof parseGithubUrl>;
  try { parsedUrl = parseGithubUrl(parsed.data.githubUrl); }
  catch (e) { return res.status(400).json({ error: e instanceof Error ? e.message : "Invalid GitHub URL." }); }

  try {
    const { owner, repoName } = parsedUrl;
    const profile = await gh<any>(`/users/${encodeURIComponent(owner)}`);
    const allRepos = await gh<Repo[]>(`/users/${encodeURIComponent(owner)}/repos?per_page=100&sort=updated&type=owner`);
    let repos = allRepos.filter(r => !r.fork).slice(0, 12);
    if (repoName) {
      const selected = await gh<Repo>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}`);
      repos = [selected, ...repos.filter(r => r.full_name !== selected.full_name)].slice(0, 12);
    }
    const commitTargets = repos.slice(0, 4);
    const commitResults = await Promise.all(commitTargets.map(async repo => {
      try {
        const commits = await gh<Commit[]>(`/repos/${repo.full_name}/commits?author=${encodeURIComponent(owner)}&per_page=5`);
        return { repo: repo.full_name, commits: commits.map(c => ({ message: c.commit.message.split("\n")[0], date: c.commit.author?.date ?? null, url: c.html_url, authorLogin: c.author?.login ?? null })) };
      } catch { return { repo: repo.full_name, commits: [] as { message: string; date: string | null; url: string; authorLogin: string | null }[] }; }
    }));

    const roleLabels = { sde: "Software Engineering", cybersecurity: "Cybersecurity", ml_ai: "Machine Learning / AI" };
    const languages = [...new Set(repos.map(r => r.language).filter(Boolean))] as string[];
    const allCommits = commitResults.flatMap(r => r.commits.map(c => ({ ...c, repo: r.repo })));
    const roleTerms: Record<string, string[]> = {
      sde: ["api", "backend", "frontend", "web", "typescript", "react", "node", "test", "database", "server"],
      cybersecurity: ["security", "ctf", "owasp", "vulnerability", "pentest", "malware", "forensic", "exploit", "soc", "crypto"],
      ml_ai: ["machine learning", "deep learning", "model", "neural", "pytorch", "tensorflow", "dataset", "llm", "ai", "computer vision"]
    };
    const termHits = repos.filter(r => {
      const text = `${r.name} ${r.description ?? ""} ${(r.topics ?? []).join(" ")} ${r.language ?? ""}`.toLowerCase();
      return roleTerms[parsed.data.role].some(term => text.includes(term));
    });
    const evidence = [
      { title: "Public profile retrieved", detail: `GitHub account @${profile.login} was retrieved from the public API.`, sourceUrl: profile.html_url, kind: "observation" },
      { title: "Public repository sample", detail: `${repos.length} non-fork repositories (plus a selected repository if supplied) were inspected from the available public listing.`, sourceUrl: `https://github.com/${owner}?tab=repositories`, kind: "observation" },
      { title: "Role-related metadata signals", detail: `${termHits.length} sampled repositories have names, descriptions, topics, or languages matching keywords for ${roleLabels[parsed.data.role]}. Keyword matches are leads, not proof of skill.`, sourceUrl: `https://github.com/${owner}?tab=repositories`, kind: "observation" },
      { title: "Commit evidence", detail: `${allCommits.length} commits returned by GitHub's author filter across ${commitTargets.length} sampled repositories. This filter is not conclusive proof of authorship or independent work.`, sourceUrl: `https://github.com/${owner}?tab=repositories`, kind: "observation" },
    ];
    const uncertainties = [
      "Public profile data cannot establish the candidate's full skill level or independent ownership of a project.",
      "Only a limited, recently updated sample of repositories and commits was inspected; deleted, private, or older work is not represented.",
      "Repository names, descriptions, stars, and language metadata are weak signals and may not reflect implementation depth.",
      "No code-quality, security, reproducibility, or live-project audit has been performed in this MVP."
    ];
    const interviewQuestions: Record<string, string[]> = {
      sde: ["Walk through a design decision in one of the sampled repositories and its trade-offs.", "Choose a recent commit and explain the problem, implementation, and how you tested it.", "What would you change first if this project had to serve 10× more users?"],
      cybersecurity: ["Pick a security-related repository or write-up and explain the threat model and safe reproduction boundaries.", "How would you validate a vulnerability finding and distinguish a true positive from a false positive?", "Which mitigations and regression tests would you add, and why?"],
      ml_ai: ["Explain the dataset provenance, baseline, and evaluation metric for a relevant project.", "How did you avoid data leakage and make the experiment reproducible?", "What failure cases or ablation tests changed your conclusions?"]
    };
    return res.json({
      generatedAt: new Date().toISOString(),
      candidate: { login: profile.login, name: profile.name, bio: profile.bio, avatarUrl: profile.avatar_url, profileUrl: profile.html_url, followers: profile.followers, publicRepos: profile.public_repos, createdAt: profile.created_at },
      role: parsed.data.role, roleLabel: roleLabels[parsed.data.role],
      summary: `${profile.login} has ${profile.public_repos} public repositories and ${profile.followers} followers. The sampled repositories use ${languages.slice(0, 6).join(", ") || "no declared primary languages"}. This is a source-linked preliminary scan, not a hiring recommendation.`,
      evidence, uncertainties, interviewQuestions: interviewQuestions[parsed.data.role],
      metrics: { sampledRepositories: repos.length, roleRelatedRepositories: termHits.length, sampledCommits: allCommits.length, languages },
      repositories: repos.map(r => ({ name: r.name, fullName: r.full_name, url: r.html_url, description: r.description, language: r.language, stars: r.stargazers_count, forks: r.forks_count, fork: r.fork, updatedAt: r.updated_at, topics: r.topics ?? [], roleRelated: termHits.some(t => t.full_name === r.full_name) })),
      commits: allCommits,
      methodology: "Public GitHub API metadata only. Findings are observations and keyword leads; no overall candidate score is produced."
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    const status = err.status === 404 ? 404 : err.status === 403 ? 429 : 502;
    return res.status(status).json({ error: err.message || "Could not complete GitHub research. Check the URL and try again." });
  }
});

app.listen(port, () => console.log(`ByteM API listening on http://localhost:${port}`));
