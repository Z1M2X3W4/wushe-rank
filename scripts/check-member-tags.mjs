import { readFile } from "node:fs/promises";
import { parseTagFile, tagFile } from "../lib/member-tags.ts";
import { memberCount } from "../lib/voting-common.ts";

const source = await readFile(new URL("../" + tagFile, import.meta.url), "utf8");
const { tags, errors } = parseTagFile(source, memberCount);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`已校验 ${Object.values(tags).flat().length} 个群友标签。`);
}
