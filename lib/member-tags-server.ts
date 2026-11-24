import { parseTagFile, tagFile, type MemberTagMap, type TagService } from "./member-tags";
import { memberCount } from "./voting-common";

export function getTagService(): TagService {
  const repo = (process.env.MEMBER_TAGS_REPO || process.env.GISCUS_REPO || "").trim();
  const branch = process.env.MEMBER_TAGS_BRANCH?.trim() || "main";
  if (/^[\w-]+\/[\w.-]+$/.test(repo) && /^[\w.-]+(?:\/[\w.-]+)*$/.test(branch) && !branch.includes("..")) {
    return { kind: "github", repo, branch };
  }
  return { kind: process.env.NODE_ENV === "development" ? "preview" : "closed" };
}

// The published branch is the only upstream. Coalesce refreshes across visitors.
let cached: { url: string; until: number; value: Promise<MemberTagMap> } | undefined;
export function readMergedTags(config: Extract<TagService, { kind: "github" }>) {
  const url = new URL(`https://api.github.com/repos/${config.repo}/contents/${tagFile}`);
  url.searchParams.set("ref", config.branch);
  const key = url.href;
  if (cached?.url === key && cached.until > Date.now()) return cached.value;
  const value = fetch(url, {
    headers: { Accept: "application/vnd.github.raw+json", "User-Agent": "wushe-rank" },
    signal: AbortSignal.timeout(5000),
  }).then(async response => {
    if (!response.ok) throw new Error("GitHub 标签文件暂不可读");
    const { tags, errors } = parseTagFile(await response.text(), memberCount);
    if (errors.length) throw new Error("GitHub 标签文件格式错误");
    return tags;
  }).catch(error => {
    if (cached?.value === value) cached.until = Date.now() + 15_000;
    throw error;
  });
  cached = { url: key, value, until: Date.now() + 120_000 };
  return value;
}
