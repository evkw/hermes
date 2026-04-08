export type SourceType = "manual" | "teams" | "gitlab" | "jira" | "url_other";

export function detectSource(url: string): { type: SourceType; label: string } {
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes("teams.microsoft")) return { type: "teams", label: "Teams Link" };
  if (host.includes("lfmsco.atlassian")) return { type: "jira", label: "Jira Link" };
  if (host.includes("gitlab.lfms")) return { type: "gitlab", label: "GitLab Link" };
  return { type: "url_other", label: "Link" };
}
