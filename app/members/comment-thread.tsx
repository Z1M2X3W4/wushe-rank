"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Flag } from "lucide-react";
import type { CommentService, GiscusConfig } from "@/lib/comment-service";
import { idText } from "@/lib/member-display";
import LocalComments from "./local-comments";
import VisitorComments from "./visitor-comments";

function GithubComments({ member, config }: { member: number; config?: GiscusConfig }) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [discussion, setDiscussion] = useState<number | null>(null);
  const term = "wushe-member-" + idText(member);
  const { repo, repoId, category, categoryId } = config ?? {};
  const discussions = repo ? "https://github.com/" + repo + "/discussions" : null;

  useEffect(() => {
    const host = container.current;
    if (!host || !repo || !repoId || !category || !categoryId) return;
    const widget = document.createElement("div");
    widget.className = "giscus";
    host.appendChild(widget);
    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    Object.assign(script.dataset, {
      repo, repoId, category, categoryId,
      mapping: "specific", term, strict: "1", reactionsEnabled: "0", emitMetadata: "1",
      inputPosition: "top", lang: "zh-CN", theme: "light",
    });
    function receive(event: MessageEvent) {
      const frame = widget.querySelector("iframe")?.contentWindow;
      if (!frame || event.origin !== "https://giscus.app" || event.source !== frame) return;
      const number = event.data?.giscus?.discussion?.number;
      if (Number.isSafeInteger(number) && number > 0) setDiscussion(number);
    }
    window.addEventListener("message", receive);
    script.onerror = () => setFailed(true);
    widget.appendChild(script);
    return () => {
      window.removeEventListener("message", receive);
      script.onerror = null;
      widget.remove();
    };
  }, [repo, repoId, category, categoryId, term, attempt]);

  return <section className="live-comments" aria-label="GitHub 评论区">
    <div className="comment-heading"><h2>全部评论</h2><span>由 giscus 提供</span></div>
    <p className="posting-note">评论将随 GitHub 账号公开显示。</p>
    {failed && <p className="load-warning" role="alert">暂时无法加载 GitHub 评论。<button onClick={() => { setFailed(false); setAttempt(n => n + 1); }}>重试</button></p>}
    {config ? <div ref={container}/> : <VisitorComments member={member}/>}
    <details className="report-help">
      <summary><Flag size={15}/>举报与下架</summary>
      <p>打开 GitHub 原讨论，从对应评论的「…」菜单举报。有仓库写入权限的维护者可删除违规评论。</p>
      {discussions && <a href={discussion ? discussions + "/" + discussion : discussions + "?discussions_q=" + encodeURIComponent(term)} target="_blank" rel="noopener noreferrer">前往 GitHub 讨论区 <ArrowUpRight size={14}/></a>}
      <a href="https://support.github.com/contact/report-abuse" target="_blank" rel="noopener noreferrer">向 GitHub 举报 <ArrowUpRight size={14}/></a>
    </details>
  </section>;
}

export default function CommentThread({ member, service }: { member: number; service: CommentService }) {
  const [local, setLocal] = useState<boolean | null>(null);
  useEffect(() => {
    setLocal(["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname));
  }, []);
  if (service.kind === "giscus") return <GithubComments member={member} config={service.config}/>;
  if (service.kind === "visitor") return <GithubComments member={member}/>;
  if (service.kind === "preview" && local) return <LocalComments member={member}/>;
  if (service.kind === "preview" && local === null) return <p className="comment-placeholder" role="status">正在打开留言板…</p>;
  return <p className="comment-placeholder">评论区尚未开放。</p>;
}
