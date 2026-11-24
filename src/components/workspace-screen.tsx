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
  Lightbulb,
  Link2,
  ListTodo,
  Minus,
  Palette,
  Paperclip,
  Pin,
  Plus,
  Search,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import { AppShell, PageHeader } from "./app-shell";
import { useI18n } from "../lib/i18n";
import { Button, Card, Input } from "./ui";
import { usePlatformStore, uploadFile, type WorkspaceBlock, type WorkspaceBlockType, type WorkspacePageItem, type WorkspaceSearchResult } from "../hooks/use-platform-store";
import { useAuth } from "../hooks/use-auth";

// ─── Design tokens (map to existing app palette) ──────────────────────────────
const TYPE_META: Record<WorkspaceBlockType, { label: string; icon: typeof FileText; text: string; bg: string; ring: string; accent: string }> = {
  text: { label: "نص", icon: FileText, text: "text-foreground", bg: "bg-muted", ring: "hover:ring-muted", accent: "bg-border" },
  heading: { label: "عنوان", icon: Heading1, text: "text-brand", bg: "bg-brand/10", ring: "hover:ring-brand/30", accent: "bg-brand" },
  todo: { label: "مهمة", icon: ListTodo, text: "text-sage", bg: "bg-sage/10", ring: "hover:ring-sage/30", accent: "bg-sage" },
  link: { label: "رابط", icon: Link2, text: "text-blue-600", bg: "bg-blue-500/10", ring: "hover:ring-blue-300", accent: "bg-blue-500" },
  image: { label: "صورة", icon: ImageIcon, text: "text-purple-600", bg: "bg-purple-500/10", ring: "hover:ring-purple-300", accent: "bg-purple-500" },
  file: { label: "ملف", icon: Paperclip, text: "text-gold", bg: "bg-gold/10", ring: "hover:ring-gold/30", accent: "bg-gold" },
  callout: { label: "ملاحظة", icon: Lightbulb, text: "text-amber-700", bg: "bg-amber-100", ring: "hover:ring-amber-300", accent: "bg-amber-400" },
  divider: { label: "فاصل", icon: Minus, text: "text-muted-foreground", bg: "bg-muted", ring: "hover:ring-muted", accent: "bg-border" },
};

const BLOCK_ORDER: WorkspaceBlockType[] = ["text", "heading", "todo", "link", "image", "file", "callout", "divider"];

// Callout color variants (stored in block.fileName)
const CALLOUT_COLORS: Record<string, { label: string; wrap: string; text: string; dot: string }> = {
  amber:  { label: "كهرماني", wrap: "bg-amber-50 border-amber-200", text: "text-amber-800", dot: "bg-amber-400" },
  blue:   { label: "أزرق",    wrap: "bg-blue-50 border-blue-200",   text: "text-blue-800",   dot: "bg-blue-400" },
  green:  { label: "أخضر",    wrap: "bg-emerald-50 border-emerald-200", text: "text-emerald-800", dot: "bg-emerald-400" },
  red:    { label: "أحمر",    wrap: "bg-red-50 border-red-200",     text: "text-red-800",    dot: "bg-red-400" },
};

// Page accent colors (stored in page.color)
const PAGE_COLORS: Record<string, { label: string; hex: string }> = {
  slate:  { label: "رمادي",   hex: "#64748b" },
  blue:   { label: "أزرق",    hex: "#3b82f6" },
  green:  { label: "أخضر",    hex: "#22c55e" },
  amber:  { label: "كهرماني", hex: "#f59e0b" },
  red:    { label: "أحمر",    hex: "#ef4444" },
  purple: { label: "بنفسجي",  hex: "#a855f7" },
};

const PAGE_ICONS = ["📄", "📝", "💡", "🚀", "📌", "🎯", "📊", "🧠", "💼", "🔥", "⭐", "❗", "💰", "📞", "🧩", "🗂️", "🗓️", "✅", "🎓", "🗣️", "🛠️", "🌱", "🔖", "🧭"];

// ─── Page templates ──────────────────────────────────────────────────────────
interface TemplateBlock { type: WorkspaceBlockType; content?: string }
interface PageTemplate { title: string; icon: string; desc: string; blocks: TemplateBlock[] }

const PAGE_TEMPLATES: PageTemplate[] = [
  {
    title: "محضر اجتماع", icon: "🗣️", desc: "هيكل جاهز لأي اجتماع — حضور، قرارات، مهام",
    blocks: [
      { type: "heading", content: "📋 الحضور" },
      { type: "todo", content: "" },
      { type: "todo", content: "" },
      { type: "divider" },
      { type: "heading", content: "🗒️ جدول الأعمال" },
      { type: "todo", content: "" },
      { type: "todo", content: "" },
      { type: "divider" },
      { type: "heading", content: "✅ القرارات" },
      { type: "text", content: "" },
      { type: "heading", content: "➡️ مهام تالية" },
      { type: "todo", content: "" },
      { type: "todo", content: "" },
    ],
  },
  {
    title: "خطة أسبوعية", icon: "🗓️", desc: "تنظيم مهامك على مدار الأسبوع",
    blocks: [
      { type: "heading", content: "🌅 اليوم" },
      { type: "todo", content: "" },
      { type: "todo", content: "" },
      { type: "divider" },
      { type: "heading", content: "📅 هذا الأسبوع" },
      { type: "todo", content: "" },
      { type: "todo", content: "" },
      { type: "todo", content: "" },
      { type: "divider" },
      { type: "heading", content: "🎯 أهداف الأسبوع" },
      { type: "text", content: "" },
    ],
  },
  {
    title: "أفكار منتج", icon: "💡", desc: "من المشكلة للحل للمقاييس",
    blocks: [
      { type: "heading", content: "❓ المشكلة" },
      { type: "text", content: "" },
      { type: "heading", content: "🛠️ الحل المقترح" },
      { type: "text", content: "" },
      { type: "divider" },
      { type: "heading", content: "🧪 خطوات التجربة" },
      { type: "todo", content: "نسخة أولية" },
      { type: "todo", content: "اختبار مع 5 مستخدمين" },
      { type: "heading", content: "📊 المقاييس" },
      { type: "todo", content: "معدل التفعيل" },
      { type: "todo", content: "معدل الاحتفاظ" },
    ],
  },
  {
    title: "تتبع مشكلة", icon: "🐞", desc: "وصف، إعادة إنتاج، حل، تحقق",
    blocks: [
      { type: "heading", content: "📝 وصف المشكلة" },
      { type: "text", content: "" },
      { type: "heading", content: "🔁 خطوات إعادة الإنتاج" },
      { type: "todo", content: "" },
      { type: "todo", content: "" },
      { type: "divider" },
      { type: "heading", content: "🔧 الحل" },
      { type: "text", content: "" },
      { type: "heading", content: "✅ التحقق" },
      { type: "todo", content: "تم الإصلاح" },
      { type: "todo", content: "تم الاختبار والإغلاق" },
    ],
  },
];

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
    searchWorkspace,
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
  const [showTemplates, setShowTemplates] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [searchResults, setSearchResults] = useState<WorkspaceSearchResult>({ pages: [], blocks: [] });

  useEffect(() => {
    fetchWorkspacePages().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Content search (titles + block text) — debounced
  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) { setSearchResults({ pages: [], blocks: [] }); return; }
    const h = setTimeout(() => {
      searchWorkspace(q).then(setSearchResults).catch(() => {});
    }, 300);
    return () => clearTimeout(h);
  }, [search, searchWorkspace]);

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

  async function applyTemplate(tpl: PageTemplate) {
    const page = await createWorkspacePage({ title: tpl.title, icon: tpl.icon });
    if (!page) return;
    setShowTemplates(false);
    setSelectedId(page.id);
    setTitleDraft(page.title);
    fetchWorkspaceBlocks(page.id).catch(() => {});
    for (const b of tpl.blocks) {
      await createWorkspaceBlock({ pageId: page.id, type: b.type, content: b.content ?? "" });
    }
    fetchWorkspaceBlocks(page.id).catch(() => {});
  }

  async function insertBlockAfter(afterId: string | null, type: WorkspaceBlockType) {
    await insertBlocksAfter(afterId, [{ type }]);
  }

  // Create one or more blocks right after `afterId` (used by paste + slash + toolbar)
  async function insertBlocksAfter(afterId: string | null, items: { type: WorkspaceBlockType; content?: string; checked?: boolean; fileName?: string | null }[]) {
    if (!selectedId || !items.length) return;
    const newIds: string[] = [];
    for (const it of items) {
      const b = await createWorkspaceBlock({
        pageId: selectedId,
        type: it.type,
        content: it.content ?? "",
        ...(it.checked !== undefined ? { checked: it.checked } : {}),
        ...(it.fileName ? { fileName: it.fileName } : {}),
      });
      if (b) newIds.push(b.id);
    }
    if (!newIds.length) return;
    const ids = blocks.map((b) => b.id);
    const idx = afterId ? ids.indexOf(afterId) : -1;
    ids.splice(idx + 1, 0, ...newIds);
    reorderWorkspaceBlocks(selectedId, ids).catch(() => {});
  }

  // Open a page from search results and scroll to a specific block
  async function openBlockResult(pageId: string, blockId: string) {
    setSelectedId(pageId);
    const page = workspacePages.find((p) => p.id === pageId);
    if (page) setTitleDraft(page.title);
    setSearch("");
    await fetchWorkspaceBlocks(pageId).catch(() => {});
    setTimeout(() => {
      const el = document.getElementById(`wsb-${blockId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.classList.add("ring-2", "ring-brand", "rounded-lg");
      setTimeout(() => el?.classList.remove("ring-2", "ring-brand", "rounded-lg"), 2000);
    }, 150);
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
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("بحث في الصفحات والمحتوى...")} className="ps-8" />
            {search.trim().length >= 2 && (searchResults.blocks.length > 0 || searchResults.pages.length > 0) && (
              <div className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-xl border border-border bg-background shadow-xl">
                {searchResults.pages.length > 0 && (
                  <div className="border-b border-border py-1">
                    <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{t("صفحات")}</p>
                    {searchResults.pages.map((p) => (
                      <button key={p.id} onClick={() => { setSelectedId(p.id); setTitleDraft(p.title); fetchWorkspaceBlocks(p.id).catch(() => {}); setSearch(""); }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted">
                        <span>{p.icon}</span><span className="truncate">{p.title}</span>
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.blocks.length > 0 && (
                  <div className="py-1">
                    <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{t("داخل الصفحات")}</p>
                    {searchResults.blocks.map((b) => (
                      <button key={b.id} onClick={() => openBlockResult(b.page.id, b.id)}
                        className="flex w-full flex-col gap-0.5 px-3 py-1.5 text-start hover:bg-muted">
                        <span className="text-[10px] text-muted-foreground">{b.page.icon} {b.page.title}</span>
                        <span className="line-clamp-2 text-xs">{b.snippet}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <Button
            className="mb-3 w-full text-xs"
            variant="primary"
            onClick={() => { setAddingChildOf("root"); setNewPageTitle(""); }}
          >
            <Plus className="size-4" /> {t("صفحة جديدة")}
          </Button>
          <Button
            className="mb-3 w-full bg-brand2 text-xs text-white"
            variant="secondary"
            onClick={() => setShowTemplates(true)}
          >
            <StickyNote className="size-4" /> {t("من قالب جاهز")}
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
        <Card className="min-h-[70vh] overflow-hidden p-0">
          {selectedPage?.color && PAGE_COLORS[selectedPage.color] && (
            <div
              className="h-2 w-full"
              style={{ background: `linear-gradient(90deg, ${PAGE_COLORS[selectedPage.color]!.hex}, ${PAGE_COLORS[selectedPage.color]!.hex}55)` }}
            />
          )}
          <div className="p-4">
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
                    <div className="relative">
                      <button title={t("لون الصفحة")} onClick={() => setShowColorPicker((v) => !v)}
                        className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted active:scale-90">
                        <Palette className="size-4" />
                      </button>
                      {showColorPicker && (
                        <div className="absolute end-0 top-full z-20 mt-1 flex items-center gap-1.5 rounded-xl border border-border bg-background p-2 shadow-lg">
                          <button title={t("بدون لون")} onClick={() => { updateWorkspacePage(selectedPage.id, { color: null }).catch(() => {}); setShowColorPicker(false); }}
                            className="grid size-6 place-items-center rounded-full border border-dashed border-border text-[10px] text-muted-foreground hover:bg-muted">✕</button>
                          {Object.entries(PAGE_COLORS).map(([key, c]) => (
                            <button key={key} title={t(c.label)}
                              onClick={() => { updateWorkspacePage(selectedPage.id, { color: key }).catch(() => {}); setShowColorPicker(false); }}
                              className={`size-6 rounded-full transition hover:scale-110 active:scale-95 ${selectedPage.color === key ? "ring-2 ring-foreground/40 ring-offset-2" : ""}`}
                              style={{ backgroundColor: c.hex }} />
                          ))}
                        </div>
                      )}
                    </div>
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
                  <div key={b.id} id={`wsb-${b.id}`} className="scroll-mt-4">
                    <WorkspaceBlockRow
                      block={b}
                      isFirst={i === 0}
                      isLast={i === blocks.length - 1}
                      onMove={(dir) => moveBlock(b.id, dir)}
                      onDropOn={(draggedId) => dropBlock(draggedId, b.id)}
                      onUpdate={(input) => updateWorkspaceBlock(b.id, input).catch(() => {})}
                      onDelete={() => deleteWorkspaceBlock(b.id).catch(() => {})}
                      onEnterNew={(type) => insertBlockAfter(b.id, type)}
                      onPasteItems={(items) => insertBlocksAfter(b.id, items)}
                    />
                  </div>
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
          </div>
        </Card>
      </div>

      {/* Templates modal */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setShowTemplates(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-border bg-background p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold">{t("اختر قالب صفحة")}</h3>
              <button onClick={() => setShowTemplates(false)} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-4" /></button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {PAGE_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.title}
                  onClick={() => applyTemplate(tpl)}
                  className="flex flex-col items-start gap-1 rounded-xl border border-border p-3 text-start transition hover:border-brand hover:bg-brand/5 active:scale-[0.98]"
                >
                  <span className="text-2xl">{tpl.icon}</span>
                  <b className="text-sm">{t(tpl.title)}</b>
                  <span className="text-[11px] leading-relaxed text-muted-foreground">{t(tpl.desc)}</span>
                  <span className="mt-1 text-[10px] text-muted-foreground">{tpl.blocks.length} {t("بلوك")}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
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
  block, isFirst, isLast, onMove, onDropOn, onUpdate, onDelete, onEnterNew, onPasteItems,
}: {
  block: WorkspaceBlock;
  isFirst: boolean;
  isLast: boolean;
  onMove: (dir: -1 | 1) => void;
  onDropOn: (draggedId: string) => void;
  onUpdate: (input: { type?: WorkspaceBlockType; content?: string; checked?: boolean; mediaUrl?: string | null; fileName?: string | null }) => void;
  onDelete: () => void;
  onEnterNew: (type: WorkspaceBlockType) => void;
  onPasteItems: (items: { type: WorkspaceBlockType; content?: string; checked?: boolean; fileName?: string | null }[]) => void;
}) {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [linkLabel, setLinkLabel] = useState(block.fileName ?? "");
  const [linkUrl, setLinkUrl] = useState(block.content ?? "");
  const [dropHint, setDropHint] = useState(false);
  const meta = TYPE_META[block.type];
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(block.content);
  const [slashQuery, setSlashQuery] = useState<string | null>(null);
  const [slashIdx, setSlashIdx] = useState(0);

  // Auto-grow textarea to fit content (like Notion)
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [block.content, block.type]);

  const slashMatches = slashQuery !== null
    ? BLOCK_ORDER.filter((k) => {
        const label = TYPE_META[k].label;
        return !slashQuery || label.includes(slashQuery) || k.includes(slashQuery.toLowerCase());
      })
    : [];

  function pickSlashType(type: WorkspaceBlockType) {
    onUpdate({ type, content: "" });
    setText("");
    setSlashQuery(null);
    setSlashIdx(0);
  }

  // Markdown-style paste: checklist → todo blocks, bare URL → link block
  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const raw = e.clipboardData.getData("text/plain");
    const trimmed = raw.trim();
    if (!trimmed) return;
    const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
    const checklistRe = /^[-*•]?\s*\[([ xX])\]\s*(.+)$/;
    const isChecklist = lines.length > 0 && lines.every((l) => checklistRe.test(l));
    if (isChecklist) {
      e.preventDefault();
      onPasteItems(
        lines.map((l) => {
          const m = l.match(checklistRe)!;
          return { type: "todo" as const, content: m[2]!.trim(), checked: m[1]!.toLowerCase() === "x" };
        })
      );
      return;
    }
    if (/^https?:\/\/\S+$/.test(trimmed)) {
      e.preventDefault();
      onPasteItems([{ type: "link", content: trimmed, fileName: trimmed }]);
    }
  }

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

  if (block.type === "callout") {
    const ckey = block.fileName && CALLOUT_COLORS[block.fileName] ? block.fileName : "amber";
    const cc = CALLOUT_COLORS[ckey]!;
    return (
      <div className={`flex items-start gap-2 rounded-xl border p-3 ${cc.wrap} ${dropHint ? "ring-2 ring-brand" : ""}`}>
        <Lightbulb className={`mt-0.5 size-5 shrink-0 ${cc.text}`} />
        <div className="min-w-0 flex-1">
          <textarea
            defaultValue={block.content}
            placeholder={t("ملاحظة مهمة...")}
            rows={1}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${el.scrollHeight}px`;
            }}
            onBlur={(e) => { if (e.target.value !== block.content) onUpdate({ content: e.target.value }); }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onEnterNew("text"); }
            }}
            className={`w-full resize-none overflow-hidden bg-transparent text-sm outline-none ${cc.text}`}
          />
          <div className="mt-1.5 flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">{t("اللون:")}</span>
            {Object.entries(CALLOUT_COLORS).map(([key, c]) => (
              <button key={key} title={t(c.label)} onClick={() => onUpdate({ fileName: key })}
                className={`size-4 rounded-full transition hover:scale-110 ${c.dot} ${ckey === key ? "ring-2 ring-foreground/40 ring-offset-1" : "opacity-60"}`} />
            ))}
          </div>
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
      <div className="relative min-w-0 flex-1">
        <textarea
          ref={taRef}
          value={text}
          placeholder={isHeading ? t("عنوان...") : t("اكتب... ( / للأوامر)")}
          rows={1}
          onChange={(e) => {
            const v = e.target.value;
            setText(v);
            const el = e.target;
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
            // slash menu: "/" at start of block, no spaces yet
            if (/^\/\S*$/.test(v)) { setSlashQuery(v.slice(1)); setSlashIdx(0); }
            else setSlashQuery(null);
          }}
          onPaste={handlePaste}
          onBlur={() => {
            setSlashQuery(null);
            if (text !== block.content) onUpdate({ content: text });
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape" && slashQuery !== null) { setSlashQuery(null); e.preventDefault(); return; }
            if (slashQuery !== null && slashMatches.length > 0) {
              if (e.key === "ArrowDown") { e.preventDefault(); setSlashIdx((i) => (i + 1) % slashMatches.length); return; }
              if (e.key === "ArrowUp") { e.preventDefault(); setSlashIdx((i) => (i - 1 + slashMatches.length) % slashMatches.length); return; }
              if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); pickSlashType(slashMatches[Math.min(slashIdx, slashMatches.length - 1)]!); return; }
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              setSlashQuery(null);
              onEnterNew("text");
            }
          }}
          className={`w-full resize-none overflow-hidden bg-transparent outline-none ${isHeading ? "text-lg font-bold" : "text-sm"}`}
        />
        {slashQuery !== null && (
          <div className="absolute start-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-xl border border-border bg-background py-1 shadow-xl">
            <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{t("تحويل البلوك إلى")}</p>
            {slashMatches.map((k, i) => {
              const m = TYPE_META[k];
              return (
                <button
                  key={k}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setSlashIdx(i)}
                  onClick={() => pickSlashType(k)}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm transition ${i === Math.min(slashIdx, slashMatches.length - 1) ? "bg-brand/10 font-semibold" : "hover:bg-muted"}`}
                >
                  <span className={`grid size-6 place-items-center rounded-md ${m.bg} ${m.text}`}><m.icon className="size-3.5" /></span>
                  {t(m.label)}
                  <span className="ms-auto text-[10px] text-muted-foreground" dir="ltr">/{k}</span>
                </button>
              );
            })}
            {slashMatches.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">{t("لا نتائج")}</p>
            )}
          </div>
        )}
      </div>
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
