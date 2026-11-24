import { useState } from "react";
import { Check, Flag, Inbox, Trash2 } from "lucide-react";
import { idText } from "@/lib/member-display";
import type { DemoAction, DemoComment } from "@/lib/preview-comments";

export type ApplyAction = (action: DemoAction, message: string) => Promise<boolean>;
type Filter = "pending" | "member" | "done";

export default function ReviewPanel({ member, comments, apply, busy }: {
  member: number; comments: DemoComment[]; apply: ApplyAction; busy: boolean;
}) {
  const [filter, setFilter] = useState<Filter>("pending");
  const [confirm, setConfirm] = useState("");
  const pending = comments.filter(c => c.report && !c.decision);
  const items = filter === "pending" ? pending : filter === "done" ? comments.filter(c => c.decision) :
    comments.filter(c => c.member === member && c.decision !== "removed");
  const filters: { key: Filter; name: string }[] = [
    { key: "pending", name: "待处理 " + pending.length }, { key: "member", name: "本页留言" }, { key: "done", name: "已处理" },
  ];
  return <section aria-labelledby="review-title" className="review-panel">
    <div className="comment-heading"><h2 id="review-title">举报审核</h2></div>
    <p className="posting-note">可处理所有留言板的举报，也可以直接下架本页评论。</p>
    <div className="review-filters" role="group" aria-label="审核范围">{filters.map(item =>
      <button key={item.key} type="button" aria-pressed={filter === item.key} onClick={() => { setFilter(item.key); setConfirm(""); }}>{item.name}</button>
    )}</div>
    {items.length === 0 ? <div className="thread-empty"><Inbox size={22}/><p>{filter === "pending" ? "暂无待处理的举报" : filter === "done" ? "尚无处理记录" : "这位群友还没有评论"}</p></div> :
      <ul className="review-list">{items.map(c => <li key={c.id}>
        <div className="review-meta"><b>群友 {idText(c.member)}</b><span>{c.author}</span>
          {c.decision && <span className="decision">{c.decision === "removed" ? "已下架" : "已保留"}</span>}
        </div>
        {c.body && <p className="comment-body">{c.body}</p>}
        {c.report && <div className="report-reason"><Flag size={14}/><div><b>{c.report.reason}</b>{c.report.note && <p>{c.report.note}</p>}</div></div>}
        {c.decision !== "removed" && (confirm === c.id ? <div className="review-confirm">
          <p>下架后，这条示例评论会从群友 {idText(c.member)} 的留言板移除。</p>
          <div><button className="danger-button" disabled={busy} onClick={async () => {
            if (await apply({ kind: "remove", id: c.id }, "评论已下架。")) setConfirm("");
          }}>确认下架</button><button className="subtle-button" onClick={() => setConfirm("")}>取消</button></div>
        </div> : <div className="review-actions">
          {c.report && !c.decision && <button className="subtle-button" disabled={busy} onClick={() => apply({ kind: "keep", id: c.id }, "举报已处理，评论已保留。")}><Check size={15}/>保留评论</button>}
          <button className="remove-link" onClick={() => setConfirm(c.id)}><Trash2 size={15}/>下架评论</button>
        </div>)}
      </li>)}</ul>}
  </section>;
}
