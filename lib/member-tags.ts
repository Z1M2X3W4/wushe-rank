export type MemberTagMap = Record<string, string[]>;
export type TagService =
  | { kind: "github"; repo: string; branch: string }
  | { kind: "preview" }
  | { kind: "visitor" }
  | { kind: "closed" };

export const tagFile = "public/member-tags.txt";
export const tagLength = 16;

export function cleanTag(input: string) {
  if (/[\u0000-\u001f\u007f-\u009f\u2028\u2029\u202a-\u202e\u2066-\u2069]/u.test(input)) return "";
  const label = input.normalize("NFKC").trim().replace(/^#+\s*/, "").trim().replace(/ +/g, " ");
  return Array.from(label).length <= tagLength ? label : "";
}

export function parseTagFile(source: string, memberCount: number) {
  const tags: MemberTagMap = {};
  const errors: string[] = [];
  for (const [index, raw] of source.replace(/^\uFEFF/, "").split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const entry = /^(\d{3})[ \t]+(.+)$/u.exec(line);
    const id = entry?.[1];
    const label = entry && cleanTag(entry[2]);
    if (!id || Number(id) < 1 || Number(id) > memberCount || !label) {
      errors.push(`第 ${index + 1} 行需填写三位群友编号、空格和 1 至 ${tagLength} 个字的标签。`);
      continue;
    }
    const labels = tags[id] ??= [];
    if (labels.some(existing => existing.toLowerCase() === label.toLowerCase())) {
      errors.push(`第 ${index + 1} 行与群友 ${id} 已有的标签重复。`);
      continue;
    }
    labels.push(label);
  }
  return { tags, errors };
}
