import { getTagService, readMergedTags } from "@/lib/member-tags-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const service = getTagService();
  if (service.kind !== "github") return new Response(null, { status: 404 });
  try {
    return Response.json(await readMergedTags(service), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "暂时无法读取 GitHub 上的标签。" }, {
      status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "15" },
    });
  }
}
