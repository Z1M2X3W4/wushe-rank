"use client";

import { useEffect, useMemo, useState } from "react";
import { cleanTag, parseTagFile, type MemberTagMap, type TagService } from "@/lib/member-tags";
import { memberCount, validMember } from "@/lib/voting-common";

type Proposal = { member: string; label: string; status: "pending" | "merged" };
const prefix = "wushe-demo-tag-pr:v1/";
const previewEvent = "wushe-demo-tag-pr";
const visitorExamples: MemberTagMap = { "001": ["热心", "游戏搭子"] };

function demoProposals(): Proposal[] {
  const result: Proposal[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(prefix)) continue;
    try {
      const row = JSON.parse(localStorage.getItem(key) ?? "null");
      if (row && typeof row.member === "string" && /^\d{3}$/.test(row.member) && validMember(Number(row.member))
        && typeof row.label === "string" && row.label && cleanTag(row.label) === row.label
        && (row.status === "pending" || row.status === "merged")) result.push(row);
    } catch { /* Ignore an incomplete local example. */ }
  }
  return result;
}

export function changeDemoProposal(member: string, label: string, next: "pending" | "merged" | "closed") {
  const key = prefix + member + "/" + label.toLowerCase();
  const previous = localStorage.getItem(key);
  if (next === "pending" && previous) throw Error("这个标签已经提议过了。");
  if (next !== "pending" && (!previous || JSON.parse(previous).status !== "pending")) {
    throw Error("这条提议已处理，请查看最新状态。");
  }
  if (next === "closed") localStorage.removeItem(key);
  else localStorage.setItem(key, JSON.stringify({ member, label, status: next }));
  window.dispatchEvent(new Event(previewEvent));
}

export function useMemberTags(kind: TagService["kind"]) {
  const [source, setSource] = useState<MemberTagMap>({});
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [local, setLocal] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const demo = kind === "preview" && ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
    setLocal(demo);
    if (kind !== "github" && !demo) return;
    const controller = new AbortController();
    let pending = false;
    function readDemo() {
      try { setProposals(demoProposals()); } catch { setProposals([]); }
    }
    function storageChanged(event: StorageEvent) {
      if (!event.key || event.key.startsWith(prefix)) readDemo();
    }
    async function load() {
      if (pending) return;
      pending = true;
      try {
        const response = await fetch(demo ? "/member-tags.txt" : "/api/member-tags", {
          cache: "no-store", signal: controller.signal,
        });
        if (!response.ok) throw Error();
        let tags: MemberTagMap;
        if (demo) {
          const parsed = parseTagFile(await response.text(), memberCount);
          if (parsed.errors.length) throw Error();
          tags = parsed.tags;
        } else {
          tags = await response.json();
        }
        if (!controller.signal.aborted) { setSource(tags); setLoaded(true); setFailed(false); }
      } catch {
        if (!controller.signal.aborted) { setSource({}); setFailed(true); }
      } finally { pending = false; }
    }
    function whenVisible() { if (document.visibilityState === "visible") void load(); }
    if (demo) {
      readDemo();
      window.addEventListener("storage", storageChanged);
      window.addEventListener(previewEvent, readDemo);
    }
    void load();
    const timer = window.setInterval(whenVisible, 120_000);
    document.addEventListener("visibilitychange", whenVisible);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", whenVisible);
      window.removeEventListener("storage", storageChanged);
      window.removeEventListener(previewEvent, readDemo);
    };
  }, [kind, attempt]);

  const tags = useMemo(() => {
    if (!local) return source;
    const result = { ...source };
    for (const row of proposals) {
      if (row.status !== "merged") continue;
      const labels = result[row.member] ?? [];
      if (!labels.some(label => label.toLowerCase() === row.label.toLowerCase())) {
        result[row.member] = [...labels, row.label];
      }
    }
    return result;
  }, [source, proposals, local]);
  const visitor = kind === "visitor";
  return {
    tags: visitor ? visitorExamples : tags, proposals: visitor ? [] : proposals,
    local: kind === "preview" && local, loaded: visitor || loaded, failed: !visitor && failed,
    retry: () => setAttempt(n => n + 1),
  };
}
