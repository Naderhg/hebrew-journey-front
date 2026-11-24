import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  FileText,
  GripVertical,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Link2,
  ListTodo,
  Minus,
  Paperclip,
  Pin,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { AppShell, PageHeader } from "./app-shell";
import { useI18n } from "../lib/i18n";
import { Button, Card, Input } from "./ui";
import { usePlatformStore, uploadFile, type WorkspaceBlock, type WorkspaceBlockType, type WorkspacePageItem } from "../hooks/use-platform-store";
import { useAuth } from "../hooks/use-auth";

// ─── Design tokens (map to existing app palette) ──────────────────────────────
const TYPE_META: Record<WorkspaceBlockType, { label: string; icon: typeof FileText; text: string; bg: string; ring: string; accent: string }> = {
  text: { label: "نص", icon: FileText, text: "text-foreground", bg: "bg-muted", ring: "hover:ring-muted", accent: "bg-border" },
  heading: { label: "عنوان", icon: Heading1, text: "text-brand", bg: "bg-brand/10", ring: "hover:ring-brand/30", accent: "bg-brand" },
  todo: { label: "مهمة", icon: ListTodo, text: "text-sage", bg: "bg-sage/10", ring: "hover:ring-sage/30", accent: "bg-sage" },
  link: { label: "رابط", icon: Link2, text: "text-blue-600", bg: "bg-blue-500/10", ring: "hover:ring-blue-300", accent: "bg-blue-500" },
  image: { label: "صورة", icon: ImageIcon, text: "text-purple-600", bg: "bg-purple-500/10", ring: "hover:ring-purple-300", accent: "bg-purple-500" },
  file: { label: "ملف", icon: Paperclip, text: "text-gold", bg: "bg-gold/10", ring: "hover:ring-gold/30", accent: "bg-gold" },
  divider: { label: "فاصل", icon: Minus, text: "text-muted-foreground", bg: "bg-muted", ring: "hover:ring-muted", accent: "bg-border" },
};

const BLOCK_ORDER: WorkspaceBlockType[] = ["text", "heading", "todo", "link", "image", "file", "divider"];

const PAGE_ICONS = ["📄", "📝", "💡", "🚀", "📌", "🎯", "📊", "🧠", "💼", "🔥", "⭐", "❗", "💰", "📞", "🧩", "🗂️", "🗓️", "✅", "🎓", "🗣️", "🛠️", "🌱", "🔖", "🧭"];

function isImageUrl(url: string | null | undefined, fileName?: string | null) {
  if (!url) return false;
  return /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url) || !!fileName?.match(/\.(png|jpe?g|webp|gif)$/i) || /image\//.test(url);
}

export function WorkspaceScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const {
    workspacePages,
    workspaceBlocks,
    fetchWorkspacePages,
    createWorkspacePage,
    updateWorkspacePage,
    deleteWorkspacePage,
    fetchWorkspaceBlocks,
    createWorkspaceBlock,
    updateWorkspaceBlock,
    deleteWorkspaceBlock,
    reorderWorkspaceBlocks,
  } = usePlatformStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [newPageTitle, setNewPageTitle] = useState("");
  const [addingChildOf, setAddingChildOf] = useState<string | null | "root">(null);
  const [titleDraft, setTitleDraft] = useState("");

  useEffect(() => {
    fetchWorkspacePages().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedPage = workspacePages.find((p) => p.id === selectedId) ?? null;
  const blocks = useMemo(
    () => workspaceBlocks.filter((b) => b.pageId === selectedId).sort((a, b) => a.position - b.position),
    [workspaceBlocks, selectedId]
  );

  // Breadcrumb chain for the selected page
  const breadcrumb = useMemo(() => {
    if (!selectedPage) return [];
    const byId = new Map(workspacePages.map((p) => [p.id, p]));
    const chain: WorkspacePageItem[] = [];
    let cur: WorkspacePageItem | undefined = selectedPage;
    while (cur) {
      chain.unshift(cur);
      cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    }
    return chain;
  }, [selectedPage, workspacePages]);

  // Build page tree
  const tree = useMemo(() => {
    const q = search.trim().toLowerCase();
    const byParent = new Map<string | null, WorkspacePageItem[]>();
    for (const p of workspacePages) {
      const key = p.parentId;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(p);
    }
    for (const arr of byParent.values()) arr.sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || a.position - b.position);

    const matches = (p: WorkspacePageItem): boolean => !q || p.title.toLowerCase().includes(q);
    const visible = new Set<string>();
    if (q) {
      const byId = new Map(workspacePages.map((p) => [p.id, p]));
      for (const p of workspacePages) {
        if (matches(p)) {
          let cur: WorkspacePageItem | undefined = p;
          while (cur && !visible.has(cur.id)) {
            visible.add(cur.id);
            cur = cur.parentId ? byId.get(cur.parentId) : undefined;
          }
        }
      }
    }

    const isDescendantOf = (ancestorId: string, id: string | null): boolean => {
      if (!id) return false;
      const byId = new Map(workspacePages.map((p) => [p.id, p]));
      let cur = byId.get(id);
      while (cur?.parentId) {
        if (cur.parentId === ancestorId) return true;
        cur = byId.get(cur.parentId);
      }
      return false;
    };

    const render = (parentId: string | null, depth: number): React.ReactNode[] =>
      (byParent.get(parentId) ?? [])
        .filter((p) => !q || visible.has(p.id))
        .flatMap((p) => {
          const kids = byParent.get(p.id) ?? [];
          const isCollapsed = collapsed.has(p.id) && !q;
          return [
            <PageTreeRow
              key={p.id}
              page={p}
              depth={depth}
              selected={selectedId === p.id}
              hasChildren={kids.length > 0}
              collapsed={isCollapsed}
              onSelect={() => {
                setSelectedId(p.id);
                setTitleDraft(p.title);
                fetchWorkspaceBlocks(p.id).catch(() => {});
              }}
              onToggleCollapse={() =>
                setCollapsed((prev) => {
                  const next = new Set(prev);
                  if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
                  return next;
                })
              }
              onAddChild={() => { setAddingChildOf(p.id); setNewPageTitle(""); }}
              isAddingChild={addingChildOf === p.id}
              childTitle={newPageTitle}
              onChildTitleChange={setNewPageTitle}
              onChildSubmit={() => handleCreatePage(p.id)}
              onChildCancel={() => setAddingChildOf(null)}
              onRename={(title) => updateWorkspacePage(p.id, { title }).catch(() => {})}
              onTogglePin={() => updateWorkspacePage(p.id, { isPinned: !p.isPinned }).catch(() => {})}
              onDelete={() => {
                if (window.confirm(t("حذف الصفحة وكل صفحاتها الفرعية؟"))) {
                  deleteWorkspacePage(p.id).catch(() => {});
                  if (selectedId === p.id || isDescendantOf(p.id, selectedId)) setSelectedId(null);
                }
              }}
            />,
            ...(isCollapsed ? [] : render(p.id, depth + 1)),
          ];
        });

    return render(null, 0);
  }, [workspacePages, collapsed, search, selectedId, addingChildOf, newPageTitle, t, fetchWorkspaceBlocks, updateWorkspacePage, deleteWorkspacePage]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreatePage(parentId: string | null) {
    const title = newPageTitle.trim();
    if (!title) return;
    const page = await createWorkspacePage({ title, parentId });
    if (page) {
      setSelectedId(page.id);
      setTitleDraft(page.title);
      setCollapsed((prev) => {
        if (page.parentId) {
          const next = new Set(prev);
          next.delete(page.parentId);
          return next;
        }
        return prev;
      });
      fetchWorkspaceBlocks(page.id).catch(() => {});
    }
    setNewPageTitle("");
    setAddingChildOf(null);
  }

  async function insertBlockAfter(afterId: string | null, type: WorkspaceBlockType) {
    if (!selectedId) return;
    const block = await createWorkspaceBlock({ pageId: selectedId, type, content: "" });
    if (!block) return;
    const ids = blocks.map((b) => b.id);
    const idx = afterId ? ids.indexOf(afterId) : -1;
    ids.splice(idx + 1, 0, block.id);
    reorderWorkspaceBlocks(selectedId, ids).catch(() => {});
  }

  function moveBlock(id: string, dir: -1 | 1) {
    if (!selectedId) return;
    const ids = blocks.map((b) => b.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (i === -1 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
    reorderWorkspaceBlocks(selectedId, ids).catch(() => {});
  }

  function dropBlock(draggedId: string, targetId: string) {
    if (!selectedId || draggedId === targetId) return;
    const ids = blocks.map((b) => b.id);
    const from = ids.indexOf(draggedId);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) return;
    ids.splice(from, 1);
    ids.splice(to, 0, draggedId);
    reorderWorkspaceBlocks(selectedId, ids).catch(() => {});
  }

  if (user && user.role !== "SUPER_ADMIN") {
    return (
      <AppShell role="SUPER_ADMIN">
        <Card className="mx-auto max-w-md py-10 text-center">
          <p className="text-sm text-muted-foreground">{t("هذه الصفحة متاحة للسوبر أدمن فقط.")}</p>
        </Card>
      </AppShell>
    );
  }

  const pinnedPages = workspacePages.filter((p) => p.isPinned && !p.parentId);

  return (
    <AppShell role="SUPER_ADMIN">
      <PageHeader
        title={t("مساحتي")}
      />
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* ─── Sidebar: page tree ─── */}
        <Card className="h-fit p-3 lg:sticky lg:top-4">
          <div className="relative mb-3">
            <Search className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("بحث في الصفحات...")} className="ps-8" />
          </div>
          <Button
            className="mb-3 w-full text-xs"
            variant="primary"
            onClick={() => { setAddingChildOf("root"); setNewPageTitle(""); }}
          >
            <Plus className="size-4" /> {t("صفحة جديدة")}
          </Button>
          {addingChildOf === "root" && (
            <div className="mb-2 flex gap-1">
              <Input autoFocus value={newPageTitle} onChange={(e) => setNewPageTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreatePage(null); if (e.key === "Escape") setAddingChildOf(null); }}
                placeholder={t("اسم الصفحة...")} className="h-8 text-xs" />
              <Button className="h-8 px-2 text-xs" variant="primary" onClick={() => handleCreatePage(null)} disabled={!newPageTitle.trim()}>{t("تم")}</Button>
            </div>
          )}

          {!search && pinnedPages.length > 0 && (
            <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wide text-gold">📌 {t("الصفحات المثبتة بتظهر أول القائمة")}</p>
          )}

          <div className="max-h-[70vh] space-y-0.5 overflow-y-auto">
            {tree}
            {workspacePages.length === 0 && !search && (
              <div className="py-8 text-center">
                <div className="mx-auto mb-2 grid size-12 place-items-center rounded-2xl bg-brand/10 text-2xl">🗒️</div>
                <p className="text-xs text-muted-foreground">{t("لا توجد صفحات بعد — أنشئ أول صفحة.")}</p>
              </div>
            )}
            {search && workspacePages.length > 0 && tree.length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground">{t("لا نتائج.")}</p>
            )}
          </div>
        </Card>

        {/* ─── Editor ─── */}
        <Card className="min-h-[70vh] overflow-hidden">
          {!selectedPage ? (
            <div className="flex h-72 flex-col items-center justify-center text-center text-muted-foreground">
              <div className="mb-4 grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-brand/15 to-brand2/15 text-3xl">🗒️</div>
              <p className="text-sm font-semibold text-foreground">{t("مساحتك الخاصة")}</p>
              <p className="mt-1 max-w-sm text-xs">{t("اختر صفحة من القائمة أو أنشئ واحدة جديدة — كل ملاحظاتك وملفاتك في مكان واحد.")}</p>
              <Button className="mt-4 text-xs" variant="primary" onClick={() => { setAddingChildOf("root"); setNewPageTitle(""); }}>
                <Plus className="size-4" /> {t("إنشاء صفحة")}
              </Button>
            </div>
          ) : (
            <div>
              {/* Breadcrumb */}
              {breadcrumb.length > 1 && (
                <div className="mb-2 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                  {breadcrumb.map((p, i) => (
                    <span key={p.id} className="flex items-center gap-1">
                      {i > 0 && <span className="opacity-50">/</span>}
                      <button
                        onClick={() => {
                          setSelectedId(p.id);
                          setTitleDraft(p.title);
                          fetchWorkspaceBlocks(p.id).catch(() => {});
                        }}
                        className={`hover:underline ${i === breadcrumb.length - 1 ? "font-bold text-brand" : ""}`}
                      >
                        {p.icon} {p.title}
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Page header */}
              <div className="mb-4 border-b border-border pb-4">
                <div className="flex items-start gap-3">
                  <PageIconButton icon={selectedPage.icon} onPick={(icon) => updateWorkspacePage(selectedPage.id, { icon }).catch(() => {})} />
                  <div className="min-w-0 flex-1">
                    <input
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      onBlur={() => {
                        const v = titleDraft.trim();
                        if (v && v !== selectedPage.title) updateWorkspacePage(selectedPage.id, { title: v }).catch(() => {});
                        else setTitleDraft(selectedPage.title);
                      }}
                      className="w-full bg-transparent text-2xl font-extrabold outline-none placeholder:text-muted-foreground/50"
                      placeholder={t("عنوان الصفحة")}
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {t("آخر تعديل")}: {new Date(selectedPage.updatedAt).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" })}
                      {" · "}
                      <span className="text-sage">{blocks.length} {t("بلوك")}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button title={t("تثبيت الصفحة")} onClick={() => updateWorkspacePage(selectedPage.id, { isPinned: !selectedPage.isPinned }).catch(() => {})}
                      className={`grid size-9 place-items-center rounded-lg border transition active:scale-90 ${selectedPage.isPinned ? "border-gold/40 bg-gold/15 text-gold" : "border-border text-muted-foreground hover:border-gold/40 hover:bg-gold/10 hover:text-gold"}`}>
                      <Pin className="size-4" />
                    </button>
                    <button title={t("حذف الصفحة")} onClick={() => {
                      if (window.confirm(t("حذف الصفحة وكل صفحاتها الفرعية؟"))) {
                        deleteWorkspacePage(selectedPage.id).catch(() => {});
                        setSelectedId(null);
                      }
                    }} className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-danger/40 hover:bg-danger/10 hover:text-danger active:scale-90">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Blocks */}
              <div className="space-y-0.5">
                {blocks.map((b, i) => (
                  <WorkspaceBlockRow
                    key={b.id}
                    block={b}
                    isFirst={i === 0}
                    isLast={i === blocks.length - 1}
                    onMove={(dir) => moveBlock(b.id, dir)}
                    onDropOn={(draggedId) => dropBlock(draggedId, b.id)}
                    onUpdate={(input) => updateWorkspaceBlock(b.id, input).catch(() => {})}
                    onDelete={() => deleteWorkspaceBlock(b.id).catch(() => {})}
                    onEnterNew={(type) => insertBlockAfter(b.id, type)}
                  />
                ))}
                {blocks.length === 0 && (
                  <div className="py-10 text-center">
                    <div className="mx-auto mb-2 grid size-12 place-items-center rounded-2xl bg-muted text-2xl">✍️</div>
                    <p className="text-sm text-muted-foreground">{t("صفحة فارغة — ابدأ بالكتابة بالأسفل.")}</p>
                  </div>
                )}
              </div>

              {/* Add-block toolbar */}
              <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-3">
                <p className="mb-2 text-[11px] font-bold text-muted-foreground">➕ {t("إضافة بلوك")}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {BLOCK_ORDER.map((key) => {
                    const meta = TYPE_META[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => insertBlockAfter(blocks.length ? blocks[blocks.length - 1]!.id : null, key)}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition active:scale-95 ${meta.bg} ${meta.text} hover:brightness-95`}
                      >
                        <meta.icon className="size-3.5" /> {t(meta.label)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

// ─── Page icon button with emoji picker ──────────────────────────────────────

function PageIconButton({ icon, onPick }: { icon: string; onPick: (icon: string) => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        title={t("تغيير الأيقونة")}
        className="grid size-12 place-items-center rounded-xl text-3xl transition hover:scale-105 hover:bg-muted active:scale-95"
      >
        {icon || "📄"}
      </button>
      {open && (
        <div className="absolute top-full z-20 mt-1 grid w-56 grid-cols-8 gap-1 rounded-xl border border-border bg-background p-2 shadow-lg">
          {PAGE_ICONS.map((e) => (
            <button
              key={e}
              onClick={() => { onPick(e); setOpen(false); }}
              className="grid size-6 place-items-center rounded text-lg transition hover:scale-125 hover:bg-muted"
            >
              {e}
            </button>
          ))}
          <button onClick={() => setOpen(false)} className="col-span-8 mt-1 text-center text-[10px] text-muted-foreground hover:text-foreground">
            {t("إغلاق")}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page tree row ────────────────────────────────────────────────────────────

function PageTreeRow({
  page, depth, selected, hasChildren, collapsed, onSelect, onToggleCollapse, onAddChild, onRename, onTogglePin, onDelete,
  isAddingChild, childTitle, onChildTitleChange, onChildSubmit, onChildCancel,
}: {
  page: WorkspacePageItem;
  depth: number;
  selected: boolean;
  hasChildren: boolean;
  collapsed: boolean;
  onSelect: () => void;
  onToggleCollapse: () => void;
  onAddChild: () => void;
  onRename: (title: string) => void;
  onTogglePin: () => void;
  onDelete: () => void;
  isAddingChild: boolean;
  childTitle: string;
  onChildTitleChange: (v: string) => void;
  onChildSubmit: () => void;
  onChildCancel: () => void;
}) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(page.title);

  return (
    <>
    <div
      className={`group flex items-center gap-1 rounded-lg py-1.5 text-sm transition ${selected ? "border-s-2 border-brand bg-brand/10 font-semibold text-brand" : "border-s-2 border-transparent hover:bg-muted"}`}
      style={{ paddingInlineStart: `${depth * 14 + 6}px` }}
    >
      {hasChildren ? (
        <button onClick={onToggleCollapse} className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={t("طي")}>
          <ChevronDown className={`size-3.5 transition ${collapsed ? "-rotate-90" : ""}`} />
        </button>
      ) : (
        <span className="w-4" />
      )}
      <button onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-1.5 text-start">
        <span className="text-base">{page.icon || "📄"}</span>
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => { setEditing(false); if (draft.trim() && draft !== page.title) onRename(draft.trim()); }}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") { setDraft(page.title); setEditing(false); } }}
            className="w-full bg-transparent text-xs outline-none"
          />
        ) : (
          <span className="truncate">{page.title}</span>
        )}
      </button>
      {!!page._count?.blocks && (
        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${selected ? "bg-brand/20 text-brand" : "bg-muted text-muted-foreground"}`}>
          {page._count.blocks}
        </span>
      )}
      {page.isPinned && <Pin className="size-3 shrink-0 text-gold" />}
      <div className="flex shrink-0 items-center gap-0.5">
        <button title={t("إعادة تسمية")} onClick={() => { setDraft(page.title); setEditing(true); }} className="grid size-6 place-items-center rounded text-muted-foreground transition hover:bg-brand/10 hover:text-brand active:scale-90"><FileText className="size-3" /></button>
        <button title={t("صفحة فرعية")} onClick={onAddChild} className="grid size-6 place-items-center rounded text-muted-foreground transition hover:bg-sage/10 hover:text-sage active:scale-90"><Plus className="size-3.5" /></button>
        <button title={t("تثبيت")} onClick={onTogglePin} className={`grid size-6 place-items-center rounded transition active:scale-90 ${page.isPinned ? "text-gold" : "text-muted-foreground hover:bg-gold/10 hover:text-gold"}`}><Pin className="size-3" /></button>
        <button title={t("حذف")} onClick={onDelete} className="grid size-6 place-items-center rounded text-muted-foreground transition hover:bg-danger/10 hover:text-danger active:scale-90"><Trash2 className="size-3" /></button>
      </div>
    </div>
    {isAddingChild && (
      <div className="flex gap-1 px-1 py-1" style={{ paddingInlineStart: `${(depth + 1) * 14 + 6}px` }}>
        <Input
          autoFocus
          value={childTitle}
          onChange={(e) => onChildTitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onChildSubmit();
            if (e.key === "Escape") onChildCancel();
          }}
          placeholder={t("اسم الصفحة الفرعية...")}
          className="h-7 text-xs"
        />
        <Button className="h-7 bg-sage px-2 text-xs text-white" onClick={onChildSubmit} disabled={!childTitle.trim()}>{t("تم")}</Button>
      </div>
    )}
    </>
  );
}

// ─── Block row ────────────────────────────────────────────────────────────────

function WorkspaceBlockRow({
  block, isFirst, isLast, onMove, onDropOn, onUpdate, onDelete, onEnterNew,
}: {
  block: WorkspaceBlock;
  isFirst: boolean;
  isLast: boolean;
  onMove: (dir: -1 | 1) => void;
  onDropOn: (draggedId: string) => void;
  onUpdate: (input: { type?: WorkspaceBlockType; content?: string; checked?: boolean; mediaUrl?: string | null; fileName?: string | null }) => void;
  onDelete: () => void;
  onEnterNew: (type: WorkspaceBlockType) => void;
}) {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [linkLabel, setLinkLabel] = useState(block.fileName ?? "");
  const [linkUrl, setLinkUrl] = useState(block.content ?? "");
  const [dropHint, setDropHint] = useState(false);
  const meta = TYPE_META[block.type];
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea to fit content (like Notion)
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [block.content, block.type]);

  // Universal controls: drag handle + move up/down + insert below + delete (always visible)
  const controls = (
    <div className={`flex shrink-0 items-center gap-0.5 rounded-lg border bg-background p-0.5 ${dropHint ? "border-brand" : "border-border"}`}>
      <span
        draggable
        onDragStart={(e) => e.dataTransfer.setData("text/block-id", block.id)}
        onDragOver={(e) => { e.preventDefault(); setDropHint(true); }}
        onDragLeave={() => setDropHint(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDropHint(false);
          const dragged = e.dataTransfer.getData("text/block-id");
          if (dragged) onDropOn(dragged);
        }}
        title={t("اسحب لإعادة الترتيب")}
        className="grid size-6 cursor-grab place-items-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground active:cursor-grabbing active:scale-90"
      >
        <GripVertical className="size-3.5" />
      </span>
      <button title={t("أعلى")} disabled={isFirst} onClick={() => onMove(-1)} className="grid size-6 place-items-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-90 disabled:opacity-25"><ArrowUp className="size-3" /></button>
      <button title={t("أسفل")} disabled={isLast} onClick={() => onMove(1)} className="grid size-6 place-items-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-90 disabled:opacity-25"><ArrowDown className="size-3" /></button>
      <button title={t("إضافة تحته")} onClick={() => onEnterNew("text")} className="grid size-6 place-items-center rounded text-sage transition hover:bg-sage/10 active:scale-90"><Plus className="size-3.5" /></button>
      <button title={t("حذف")} onClick={onDelete} className="grid size-6 place-items-center rounded text-danger transition hover:bg-danger/10 active:scale-90"><Trash2 className="size-3" /></button>
    </div>
  );

  if (block.type === "divider") {
    return (
      <div className="group flex items-center gap-2 py-1.5">
        <span className="h-3 w-1 rounded-full bg-border" />
        <hr className="flex-1 border-t-2 border-dashed border-border" />
        {controls}
      </div>
    );
  }

  if (block.type === "image" || block.type === "file") {
    const isImg = block.type === "image" || isImageUrl(block.mediaUrl, block.fileName);
    return (
      <div className={`flex items-start gap-2 rounded-lg border-s-2 py-1.5 pe-1 ps-2 transition ${dropHint ? "border-brand bg-brand/5" : "border-transparent hover:bg-muted/40"} ${meta.accent.replace("bg-", "border-")}`}>
        <div className="flex flex-col items-center gap-1 pt-1">
          <button onClick={() => fileRef.current?.click()} className={`grid size-8 place-items-center rounded-lg transition active:scale-90 ${meta.bg} ${meta.text}`} title={t("استبدال الملف")}>
            {isImg ? <ImageIcon className="size-4" /> : <Paperclip className="size-4" />}
          </button>
        </div>
        <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const up = await uploadFile(f, "workspace");
            onUpdate({ mediaUrl: up.url, fileName: f.name, content: f.name });
          }} />
        <div className="min-w-0 flex-1 py-0.5">
          {isImg && block.mediaUrl ? (
            <a href={block.mediaUrl} target="_blank" rel="noreferrer">
              <img src={block.mediaUrl} alt={block.fileName ?? ""} className="max-h-72 rounded-xl border border-border object-contain transition hover:brightness-95" />
            </a>
          ) : block.mediaUrl ? (
            <a href={block.mediaUrl} target="_blank" rel="noreferrer" className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition hover:underline ${meta.text} ${meta.bg}`}>
              <Paperclip className="size-4 shrink-0" />
              <span className="truncate">{block.fileName || block.content || t("ملف")}</span>
            </a>
          ) : (
            <button onClick={() => fileRef.current?.click()} className={`flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs font-semibold transition hover:brightness-95 ${meta.bg} ${meta.text}`}>
              <Plus className="size-3.5" /> {t("اضغط لإرفاق ملف...")}
            </button>
          )}
        </div>
        {controls}
      </div>
    );
  }

  if (block.type === "link") {
    const hasLink = !!block.content;
    return (
      <div className={`flex items-start gap-2 rounded-lg border-s-2 py-1.5 pe-1 ps-2 transition ${dropHint ? "border-brand bg-brand/5" : "border-transparent hover:bg-muted/40"}`}>
        <span className={`mt-1 grid size-8 shrink-0 place-items-center rounded-lg ${meta.bg} ${meta.text}`}><Link2 className="size-4" /></span>
        {hasLink ? (
          <div className="min-w-0 flex-1">
            <a href={block.content} target="_blank" rel="noreferrer" className={`flex items-center gap-1.5 text-sm font-semibold hover:underline ${meta.text}`}>
              <span className="truncate">{block.fileName || block.content}</span>
            </a>
            <input
              defaultValue={linkLabel}
              placeholder={t("نص الرابط (اختياري)")}
              onBlur={(e) => { if (e.target.value !== (block.fileName ?? "")) onUpdate({ fileName: e.target.value || null }); }}
              className="mt-0.5 w-full bg-transparent text-xs text-muted-foreground outline-none"
            />
          </div>
        ) : (
          <div className="grid min-w-0 flex-1 gap-1 sm:grid-cols-2">
            <input autoFocus value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && linkUrl.trim()) onUpdate({ content: linkUrl.trim() }); }}
              onBlur={() => { if (linkUrl.trim()) onUpdate({ content: linkUrl.trim() }); }}
              placeholder={t("https://...")} className="w-full rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none focus:border-brand" />
            <input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)}
              onBlur={() => onUpdate({ fileName: linkLabel.trim() || null })}
              placeholder={t("عنوان الرابط...")} className="w-full rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none focus:border-brand" />
          </div>
        )}
        {controls}
      </div>
    );
  }

  if (block.type === "todo") {
    return (
      <div className={`flex items-center gap-2 rounded-lg border-s-2 py-1.5 pe-1 ps-2 transition ${dropHint ? "border-brand bg-brand/5" : "border-transparent hover:bg-muted/40"} ${block.checked ? "" : meta.accent.replace("bg-", "border-")}`}>
        <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${block.checked ? "bg-sage text-white" : meta.bg + " " + meta.text}`}><ListTodo className="size-4" /></span>
        <input
          type="checkbox"
          checked={block.checked}
          onChange={(e) => onUpdate({ checked: e.target.checked })}
          className="size-4 shrink-0 accent-[var(--sage)]"
        />
        <input
          defaultValue={block.content}
          placeholder={t("مهمة...")}
          onBlur={(e) => { if (e.target.value !== block.content) onUpdate({ content: e.target.value }); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onEnterNew("todo"); } }}
          className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${block.checked ? "text-muted-foreground line-through" : ""}`}
        />
        {controls}
      </div>
    );
  }

  // text | heading
  const isHeading = block.type === "heading";
  return (
    <div className={`flex items-start gap-2 rounded-lg border-s-2 py-1.5 pe-1 ps-2 transition ${dropHint ? "border-brand bg-brand/5" : "border-transparent hover:bg-muted/40"} ${isHeading ? meta.accent.replace("bg-", "border-") : ""}`}>
      <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${meta.bg} ${meta.text}`}>
        {isHeading ? <Heading2 className="size-4" /> : <FileText className="size-4" />}
      </span>
      <textarea
        ref={taRef}
        defaultValue={block.content}
        placeholder={isHeading ? t("عنوان...") : t("اكتب...")}
        rows={1}
        onInput={(e) => {
          const el = e.currentTarget;
          el.style.height = "auto";
          el.style.height = `${el.scrollHeight}px`;
        }}
        onBlur={(e) => { if (e.target.value !== block.content) onUpdate({ content: e.target.value }); }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onEnterNew("text");
          }
        }}
        className={`min-w-0 flex-1 resize-none overflow-hidden bg-transparent outline-none ${isHeading ? "text-lg font-bold" : "text-sm"}`}
      />
      <button
        title={isHeading ? t("تحويل لنص") : t("تحويل لعنوان")}
        onClick={() => onUpdate({ type: isHeading ? "text" : "heading" })}
        className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded transition active:scale-90 ${isHeading ? "text-muted-foreground hover:bg-muted hover:text-foreground" : "text-brand hover:bg-brand/10"}`}
      >
        {isHeading ? <FileText className="size-3.5" /> : <Heading2 className="size-3.5" />}
      </button>
      {controls}
    </div>
  );
}
