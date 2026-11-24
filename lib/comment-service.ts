export type GiscusConfig = { repo: string; repoId: string; category: string; categoryId: string };
export type CommentService = { kind: "giscus"; config: GiscusConfig } | { kind: "preview" } | { kind: "visitor" } | { kind: "closed" };

// Only these four public widget settings may reach the client.
export function getCommentService(): CommentService {
  const repo = process.env.GISCUS_REPO?.trim();
  const repoId = process.env.GISCUS_REPO_ID?.trim();
  const category = process.env.GISCUS_CATEGORY?.trim();
  const categoryId = process.env.GISCUS_CATEGORY_ID?.trim();
  if (repo && /^[\w.-]+\/[\w.-]+$/.test(repo) && repoId && category && categoryId) {
    return { kind: "giscus", config: { repo, repoId, category, categoryId } };
  }
  return { kind: process.env.NODE_ENV === "development" ? "preview" : "closed" };
}
