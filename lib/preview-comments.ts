// Browser-only fixtures for the local preview. The production widget uses GitHub.
export const reportReasons = ["人身攻击或骚扰", "泄露个人隐私", "低俗或不适当内容", "广告或垃圾信息", "其他"] as const;
export const demoAuthor = "demo-wushe";
export const previewChannel = "wushe-preview-comments-v1";
export type ReportReason = typeof reportReasons[number];
export type DemoComment = {
  id: string;
  member: number;
  author: string;
  body: string;
  created: number;
  report?: { reason: ReportReason; note: string };
  decision?: "removed" | "kept";
};
export type DemoAction =
  | { kind: "post"; member: number; body: string }
  | { kind: "report"; id: string; reason: ReportReason; note: string }
  | { kind: "remove" | "keep"; id: string };

export const sampleComments: DemoComment[] = [
  { id: "sample-1", member: 1, author: "demo-leaf", body: "在五舍留言板留下第一颗小树苗。🌱", created: 0 },
  { id: "sample-2", member: 1, author: "demo-cloud", body: "路过留个脚印，祝你今天也有好心情！", created: 0 },
  { id: "sample-3", member: 2, author: "demo-cloud", body: "送上一份来自五舍的问候。", created: 0 },
];
let connection: Promise<IDBDatabase> | undefined;

function database() {
  if (!connection) {
    connection = new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open(previewChannel, 1);
      open.onupgradeneeded = () => {
        const store = open.result.createObjectStore("comments", { keyPath: "id" });
        sampleComments.forEach(comment => store.add(comment));
      };
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const db = open.result;
        db.onversionchange = () => { db.close(); connection = undefined; };
        resolve(db);
      };
    }).catch(error => { connection = undefined; throw error; });
  }
  return connection;
}

export async function loadComments(): Promise<DemoComment[]> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const read = db.transaction("comments").objectStore("comments").getAll();
    read.onsuccess = () => resolve((read.result as DemoComment[]).sort((a, b) => b.created - a.created || a.id.localeCompare(b.id)));
    read.onerror = () => reject(read.error);
  });
}

export async function updateComments(action: DemoAction): Promise<void> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("comments", "readwrite");
    const store = tx.objectStore("comments");
    let failure: Error | undefined;
    function stop(message: string) { failure = new Error(message); tx.abort(); }
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(failure ?? tx.error ?? new Error("本地保存失败，请重试。"));
    if (action.kind === "post") {
      const body = action.body.trim();
      if (!body || body.length > 500) return stop("请输入 1 至 500 字的评论。");
      store.add({ id: crypto.randomUUID(), member: action.member, author: demoAuthor, body, created: Date.now() } satisfies DemoComment);
      return;
    }
    const read = store.get(action.id);
    read.onsuccess = () => {
      const comment = read.result as DemoComment | undefined;
      if (!comment || comment.decision === "removed") return stop("这条评论已经下架。");
      if (action.kind === "report") {
        if (comment.report) return stop("这条评论已有举报记录。");
        if (!reportReasons.includes(action.reason) || action.note.length > 200) return stop("请检查举报原因和说明。");
        comment.report = { reason: action.reason, note: action.note.trim() };
      } else if (action.kind === "keep") {
        if (!comment.report || comment.decision) return stop("这条举报已经处理。");
        comment.decision = "kept";
      } else {
        comment.body = "";
        comment.decision = "removed";
      }
      store.put(comment);
    };
  });
}
