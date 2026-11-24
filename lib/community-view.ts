import { headers } from "next/headers";
import { getCommentService, type CommentService } from "./comment-service";
import type { TagService } from "./member-tags";
import { getTagService } from "./member-tags-server";

export type ViewQuery = Promise<{ view?: string | string[] }>;

export async function communityView(searchParams: ViewQuery) {
  let comments: CommentService = getCommentService();
  let tags: TagService = getTagService();
  let suffix = "";
  if (process.env.NODE_ENV === "development" && (await searchParams).view === "visitor") {
    const host = (await headers()).get("host") ?? "";
    if (/^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host)) {
      if (comments.kind === "preview") comments = { kind: "visitor" };
      if (tags.kind === "preview") tags = { kind: "visitor" };
      suffix = "?view=visitor";
    }
  }
  return { comments, tags, suffix };
}
