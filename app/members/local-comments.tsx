"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Cloud, Flag, FlaskConical, Leaf, LogIn, MessageCircle, Send, ShieldCheck, UserRound } from "lucide-react";
import { demoAuthor, loadComments, previewChannel, reportReasons, updateComments, type DemoComment, type ReportReason } from "@/lib/preview-comments";
import ReviewPanel, { type ApplyAction } from "./review-panel";

const signInKey = "wushe-preview-comment-author";
const timeFormat = new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Shanghai" });

function AuthorIcon({ author }: { author: string }) {
  if (author === "demo-leaf") return <span className="author-icon leaf"><Leaf size={18}/></span>;
  if (author === "demo-cloud") return <span className="author-icon cloud"><Cloud size={19}/></span>;
  return <span className="author-icon"><UserRound size={17}/></span>;
}

function ReportForm({ id, busy, apply, close }: { id: string; busy: boolean; apply: ApplyAction; close: () => void }) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [note, setNote] = useState("");
  return <form className="report-form" aria-label="举报这条评论" onSubmit={async event => {
    event.preventDefault();
    if (reason && await apply({ kind: "report", id, reason, note }, "举报已提交，可在审核预览中处理。")) close();
  }}>
    <label>举报原因<select required value={reason} onChange={e => setReason(e.target.value as ReportReason)}>
      <option value="">请选择原因</option>{reportReasons.map(r => <option key={r}>{r}</option>)}
    </select></label>
    <label>补充说明（选填）<textarea rows={2} maxLength={200} value={note} onChange={e => setNote(e.target.value)}/></label>
    <div className="form-actions"><button className="subtle-button" type="button" onClick={close}>取消</button>
      <button className="thread-primary" disabled={busy || !reason} type="submit">提交举报</button></div>
  </form>;
}

export default function LocalComments({ member }: { member: number }) {
  const [comments, setComments] = useState<DemoComment[] | null>(null);
  const [storageError, setStorageError] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [draft, setDraft] = useState("");
  const [reporting, setReporting] = useState("");
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const writing = useRef(false);
  const channel = useRef<BroadcastChannel | null>(null);
  const refresh = useCallback(async () => {
    try { setComments(await loadComments()); setStorageError(false); }
    catch { setStorageError(true); }
  }, []);
  useEffect(() => {
    try { setSignedIn(sessionStorage.getItem(signInKey) === "yes"); } catch { /* Keep the sample session in memory. */ }
    refresh();
    const sync = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(previewChannel) : null;
    if (sync) sync.onmessage = refresh;
    channel.current = sync;
    window.addEventListener("focus", refresh);
    return () => { sync?.close(); channel.current = null; window.removeEventListener("focus", refresh); };
  }, [refresh]);
  function useAccount(active: boolean) {
    setSignedIn(active);
    try {
      if (active) sessionStorage.setItem(signInKey, "yes");
      else sessionStorage.removeItem(signInKey);
    } catch { /* The current tab can still exercise the preview. */ }
    setFeedback("");
  }
  const apply: ApplyAction = async (action, message) => {
    if (writing.current) return false;
    writing.current = true;
    setBusy(true);
    try {
      await updateComments(action);
      channel.current?.postMessage("changed");
      await refresh();
      setFeedback(message);
      return true;
    } catch (error) {
      await refresh();
      setFeedback(error instanceof Error ? error.message : "本地保存失败，请重试。");
      return false;
    } finally {
      writing.current = false;
      setBusy(false);
    }
  };
  const visible = (comments ?? []).filter(c => c.member === member && c.decision !== "removed");
  const pending = (comments ?? []).filter(c => c.report && !c.decision).length;
  return <>
    <div className="local-strip">
      <div><FlaskConical size={16}/><span><b>本地示例</b><small>仅保存在此浏览器</small></span></div>
      <button type="button" className="preview-switch" onClick={() => { setReview(!review); setReporting(""); setFeedback(""); }}>
        {review ? <ArrowLeft size={15}/> : <ShieldCheck size={15}/>}
        {review ? "返回留言" : "审核预览"}{!review && pending > 0 && <b className="pending-count">{pending}</b>}
      </button>
    </div>
    {feedback && <p className="comment-feedback" role="status">{feedback}</p>}
    {storageError ? <p className="load-warning" role="alert">无法读取本地留言，请检查浏览器是否允许网站存储。<button onClick={refresh}>重试</button></p> :
      !comments ? <p className="comment-placeholder" role="status">正在读取示例留言…</p> :
      review ? <ReviewPanel member={member} comments={comments} apply={apply} busy={busy}/> : <>
        <section className="composer" aria-labelledby="write-title">
          <div className="composer-title"><span className="composer-mark"><MessageCircle size={18}/></span><h2 id="write-title">写评论</h2>
            {signedIn && <button type="button" className="exit-sample" onClick={() => useAccount(false)}>退出示例账号</button>}</div>
          {signedIn ? <form onSubmit={async event => {
            event.preventDefault();
            if (draft.trim() && await apply({ kind: "post", member, body: draft }, "示例评论已发布。")) setDraft("");
          }}>
            <label className="author-label" htmlFor="comment-draft">{demoAuthor}</label>
            <textarea id="comment-draft" aria-label="评论内容" placeholder="给这位群友留句话…" rows={3} value={draft} maxLength={500} onChange={e => setDraft(e.target.value)}/>
            <div className="compose-bottom"><span>{draft.length} / 500</span>
              <button className="thread-primary" type="submit" disabled={busy || !draft.trim()}><Send size={15}/>发布示例评论</button></div>
          </form> : <div className="login-prompt">
            <p>评论使用 GitHub 登录。本地预览可用示例账号体验。</p>
            <button className="thread-primary" onClick={() => useAccount(true)}><LogIn size={16}/>使用示例账号</button>
          </div>}
        </section>
        <section className="thread-list" aria-labelledby="comments-title">
          <div className="comment-heading"><h2 id="comments-title">全部评论 <span className="count-pill">{visible.length}</span></h2></div>
          {!visible.length ? <div className="thread-empty"><MessageCircle size={23}/><p>还没有留言</p></div> :
            <ol className="comment-list">{visible.map(c => <li key={c.id}>
              <article><div className="comment-meta"><AuthorIcon author={c.author}/><div><b>{c.author}</b>
                {c.created ? <time dateTime={new Date(c.created).toISOString()}>{timeFormat.format(c.created)}</time> : <small>示例留言</small>}</div>
                <button className="report-button" aria-label={c.report ? "已举报 " + c.author + " 的评论" : "举报 " + c.author + " 的评论"}
                  disabled={!!c.report} aria-expanded={reporting === c.id} onClick={() => { setReporting(reporting === c.id ? "" : c.id); setFeedback(""); }}>
                  <Flag size={13}/>{c.report ? "已举报" : "举报"}
                </button></div>
                <p className="comment-body">{c.body}</p>
                {reporting === c.id && !c.report && <ReportForm key={c.id} id={c.id} busy={busy} apply={apply} close={() => setReporting("")}/>}
              </article>
            </li>)}</ol>}
        </section>
      </>}
  </>;
}
