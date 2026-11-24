"use client";

import { useState } from "react";
import { Check, Copy, GitMerge, GitPullRequest, Plus, X } from "lucide-react";
import { cleanTag, tagFile, tagLength, type TagService } from "@/lib/member-tags";
import { changeDemoProposal, useMemberTags } from "./use-member-tags";

const suggestions = ["热心", "游戏搭子", "气氛组", "靠谱"];

export default function ImpressionTags({ id, service }: { id: string; service: TagService }) {
  const { tags, proposals, local, loaded, failed, retry } = useMemberTags(service.kind);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState("");
  const [copied, setCopied] = useState(false);
  const visitor = service.kind === "visitor";
  if (service.kind !== "github" && !visitor && !local) return null;
  const labels = tags[id] ?? [];
  const pending = proposals.filter(row => row.member === id && row.status === "pending");
  const label = cleanTag(draft);
  const duplicate = !!label && [...labels, ...pending.map(row => row.label)].some(value => value.toLowerCase() === label.toLowerCase());
  const valid = !!label && !duplicate && loaded && !failed;
  const line = id + " " + label;
  const editLink = service.kind === "github"
    ? `https://github.com/${service.repo}/edit/${service.branch.split("/").map(encodeURIComponent).join("/")}/${tagFile}` : null;

  function updateDraft(value: string) { setDraft(value); setCopied(false); setFeedback(""); }
  async function copyLine() {
    try { await navigator.clipboard.writeText(line); setCopied(true); setFeedback(""); }
    catch { setFeedback("可长按或选中绿色框里的新增行并复制。"); }
  }
  function simulate(value: string, status: "pending" | "merged" | "closed") {
    if (!local) return;
    try {
      changeDemoProposal(id, value, status);
      if (status === "pending") { setEditing(false); setDraft(""); setCopied(false); }
      setFeedback(status === "pending" ? "已生成本地示例 PR。" : status === "merged" ? "示例 PR 已合并。" : "示例 PR 已关闭。");
    } catch (error) {
      setFeedback(error instanceof Error && error.name === "Error" ? error.message : "浏览器暂时无法保存示例提议。");
    }
  }
  return <section className="impressions" aria-labelledby="impressions-title">
    <div className="tag-heading"><h2 id="impressions-title">印象标签</h2>
      <button type="button" className="tag-toggle" aria-expanded={editing} aria-controls="tag-editor"
        onClick={() => { setEditing(!editing); updateDraft(""); }}>
        {editing ? <X size={15}/> : <Plus size={15}/>} {editing ? "收起" : "提议标签"}
      </button>
    </div>
    {failed ? <p className="tag-hint" role="status">暂时无法读取标签。<button className="tag-retry" onClick={retry}>重试</button></p>
      : labels.length ? <ul className="tag-list" aria-label="已合并的印象标签">{labels.map(tag => <li key={tag}><span aria-hidden="true">#</span>{tag}</li>)}</ul>
      : <p className="tag-hint">{loaded ? "还没有标签。提议经 PR 合并后会显示在这里。" : "正在读取标签…"}</p>}
    {editing && <div id="tag-editor" className="tag-editor">
      <label htmlFor="impression-draft">给群友 {id} 提议标签</label>
      <input id="impression-draft" value={draft} type="text" autoComplete="off" placeholder="写一个印象，或选下方的词"
        aria-describedby="tag-guidance" onChange={event => updateDraft(event.target.value)}/>
      <div className="tag-suggestions">{suggestions.map(tag => <button type="button" key={tag}
        aria-pressed={tag === label} onClick={() => updateDraft(tag)}>#{tag}</button>)}</div>
      <p id="tag-guidance" className="tag-hint">{duplicate ? "这个标签已经存在或正在审核。"
        : draft && !label ? `标签请用 1 至 ${tagLength} 个字，写在一行内。`
        : local ? "本地演示，可体验提议和合并。" : "复制新增行，在 GitHub 文件末尾粘贴，提交到新分支并创建 PR。"}</p>
      {valid && <div className="tag-diff"><span aria-hidden="true">+</span><code>{line}</code></div>}
      <div className="tag-actions">
        {(editLink || visitor) && valid && <button type="button" className="subtle-button" onClick={copyLine}>
          {copied ? <Check size={15}/> : <Copy size={15}/>} {copied ? "已复制" : "复制新增行"}</button>}
        {local ? <button type="button" className="thread-primary" disabled={!valid} onClick={() => simulate(label, "pending")}>
          <GitPullRequest size={16}/> 模拟提交 PR</button> : valid && editLink
          ? <a className="thread-primary" href={editLink} target="_blank" rel="noopener noreferrer"><GitPullRequest size={16}/>去 GitHub 提 PR</a>
          : visitor && valid ? <button type="button" className="thread-primary" onClick={() => setFeedback("本地访客预览：接入项目仓库后，这里会打开 GitHub 文件编辑页。")}><GitPullRequest size={16}/>去 GitHub 提 PR</button>
          : <button type="button" className="thread-primary" disabled><GitPullRequest size={16}/>去 GitHub 提 PR</button>}
      </div>
    </div>}
    {local && pending.length > 0 && <ul className="tag-proposals" aria-label="待审核的本地示例 PR">
      {pending.map(row => <li key={row.label}><div><GitPullRequest size={15}/><strong>{row.label}</strong><small>待审核 · 示例 PR</small></div>
        <div><button type="button" className="subtle-button" onClick={() => simulate(row.label, "merged")}><GitMerge size={15}/>模拟合并</button>
          <button type="button" className="subtle-button" onClick={() => simulate(row.label, "closed")}>关闭提议</button></div></li>)}
    </ul>}
    {feedback && <p className="tag-feedback" role="status">{feedback}</p>}
  </section>;
}
