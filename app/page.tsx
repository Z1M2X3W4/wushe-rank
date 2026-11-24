import Leaderboard from "./leaderboard";
import { communityView, type ViewQuery } from "@/lib/community-view";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: ViewQuery }) {
  const { comments, tags, suffix } = await communityView(searchParams);
  return <Leaderboard commentsAvailable={comments.kind !== "closed"} tagMode={tags.kind} viewSuffix={suffix}/>;
}
