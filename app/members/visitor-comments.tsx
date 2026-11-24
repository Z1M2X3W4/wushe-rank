"use client";

import { useState } from "react";
import { Leaf, Cloud, LogIn } from "lucide-react";
import { sampleComments } from "@/lib/preview-comments";

// Read-only stand-in for the signed-out giscus iframe until a repository is connected.
export default function VisitorComments({ member }: { member: number }) {
  const comments = sampleComments.filter(comment => comment.member === member);
  const [preview, setPreview] = useState(false);
  const [notice, setNotice] = useState(false);
  return <div className="visitor-comments">
    <p className="widget-count">{comments.length} 条评论</p>
    <div className="widget-composer">
      <div className="widget-tabs" role="group" aria-label="评论编辑模式">
        <button type="button" aria-pressed={!preview} onClick={() => setPreview(false)}>撰写</button>
        <button type="button" aria-pressed={preview} onClick={() => setPreview(true)}>预览</button>
      </div>
      {preview ? <p className="widget-empty">无预览内容</p>
        : <textarea aria-label="评论内容" rows={2} disabled placeholder="登录即可发表评论"/>}
      <div className="widget-login"><button type="button" onClick={() => setNotice(true)}>
        <LogIn size={15}/>使用 GitHub 登录</button></div>
    </div>
    {notice && <p className="tag-feedback" role="status">接入项目仓库后，这里会打开 GitHub 登录授权。</p>}
    {comments.length > 0 && <ul className="widget-comments" aria-label="群友留言">{comments.map(comment => <li key={comment.id}>
      <div className="widget-author">{comment.author === "demo-leaf" ? <Leaf size={15}/> : <Cloud size={15}/>}<b>{comment.author}</b></div>
      <p>{comment.body}</p>
    </li>)}</ul>}
  </div>;
}
