import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Share2, Plus, X, Loader2, Settings } from "lucide-react";
import {
  DEFAULT_API_BASE,
  getApiBase,
  setApiBase,
  analyzeUrls as apiAnalyzeUrls,
  searchTikTok as apiSearchTikTok,
  type AnalyzeResp,
  type Video,
  type Author,
  type SearchResp,
} from "@/lib/api";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "TikTok Insight — Keyword & Creator Discovery" },
      {
        name: "description",
        content:
          "Paste website or Facebook links, get AI-generated keywords, and discover top TikTok videos and creators.",
      },
      { property: "og:title", content: "TikTok Insight" },
      {
        property: "og:description",
        content: "AI keyword analysis + TikTok search dashboard.",
      },
    ],
  }),
});

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

function Index() {
  const [apiBase, setApiBaseState] = useState(DEFAULT_API_BASE);
  const [showSettings, setShowSettings] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urls, setUrls] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeErr, setAnalyzeErr] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeResp | null>(null);
  const [activeKeywords, setActiveKeywords] = useState<string[]>([]);

  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResp | null>(null);
  const [view, setView] = useState<"video" | "authors">("video");

  useEffect(() => {
    setApiBaseState(getApiBase());
  }, []);

  function addUrl() {
    const u = urlInput.trim();
    if (!u) return;
    if (urls.includes(u)) {
      setUrlInput("");
      return;
    }
    setUrls((prev) => [...prev, u]);
    setUrlInput("");
  }

  function removeUrl(u: string) {
    setUrls((prev) => prev.filter((x) => x !== u));
  }

  async function runAnalyze() {
    if (urls.length === 0) return;
    setAnalyzing(true);
    setAnalyzeErr(null);
    setAnalysis(null);
    setActiveKeywords([]);
    try {
      const data = await apiAnalyzeUrls(urls, 5, apiBase);
      setAnalysis(data);
      if (data.keywords?.length) setActiveKeywords(data.keywords);
    } catch (e: any) {
      setAnalyzeErr(e?.message ?? "Failed to analyze");
    } finally {
      setAnalyzing(false);
    }
  }

  async function runSearch() {
    if (activeKeywords.length === 0) return;
    setSearching(true);
    setSearchErr(null);
    setResults(null);
    try {
      const data = await apiSearchTikTok(activeKeywords, 10, apiBase);
      setResults(data);
    } catch (e: any) {
      setSearchErr(e?.message ?? "Search failed");
    } finally {
      setSearching(false);
    }
  }

  const canSearch = activeKeywords.length > 0 && !searching;

  function toggleKeyword(k: string) {
    setActiveKeywords((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ background: "#F4F8FF" }}>
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 p-6 lg:flex-row">
        {/* LEFT PANEL */}
        <aside className="w-full lg:w-[360px] shrink-0">
          <div className="rounded-3xl border bg-white p-5 shadow-sm" style={brandBorder}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold" style={{ color: "#1E293B" }}>
                  TikTok Insight
                </h1>
                <p className="text-xs" style={{ color: "#64748B" }}>
                  Analyze links → discover creators
                </p>
              </div>
              <button
                onClick={() => setShowSettings((s) => !s)}
                className="rounded-full p-2 hover:bg-[#F4F8FF]"
                aria-label="Settings"
              >
                <Settings className="h-4 w-4" style={{ color: "#64748B" }} />
              </button>
            </div>

            {showSettings && (
              <div className="mb-4 rounded-2xl border p-3" style={brandBorder}>
                <label className="text-xs font-medium" style={{ color: "#64748B" }}>
                  API base URL
                </label>
                <input
                  value={apiBase}
                  onChange={(e) => setApiBaseState(e.target.value)}
                  onBlur={() => setApiBase(apiBase)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={brandBorder}
                />
              </div>
            )}

            {/* URL input pill */}
            <div
              className="flex items-center rounded-full border bg-[#F4F8FF] pl-4 pr-1.5 py-1.5"
              style={brandBorder}
            >
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addUrl();
                }}
                placeholder="Paste website or Facebook Page URL"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                style={{ color: "#1E293B" }}
              />
              <button
                onClick={addUrl}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white transition hover:opacity-90"
                style={{ background: "#2F80FF" }}
                aria-label="Add URL"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* URLs list */}
            {urls.length > 0 && (
              <ul className="mt-3 space-y-2">
                {urls.map((u, i) => (
                  <li
                    key={u}
                    className="flex items-center justify-between rounded-xl border bg-white px-3 py-2 text-xs"
                    style={brandBorder}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold" style={{ color: "#2F80FF" }}>
                        URL {i + 1}
                      </div>
                      <div className="truncate" style={{ color: "#64748B" }}>
                        {u}
                      </div>
                    </div>
                    <button
                      onClick={() => removeUrl(u)}
                      className="ml-2 grid h-6 w-6 shrink-0 place-items-center rounded-full hover:bg-[#F4F8FF]"
                      aria-label="Remove"
                    >
                      <X className="h-3.5 w-3.5" style={{ color: "#64748B" }} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Analyze trigger */}
            <button
              onClick={runAnalyze}
              disabled={urls.length === 0 || analyzing}
              className="mt-3 w-full rounded-full border px-4 py-2 text-xs font-medium transition disabled:opacity-40"
              style={{ ...brandBorder, color: "#2F80FF" }}
            >
              {analyzing ? "Analyzing..." : "Analyze links"}
            </button>

            {/* AI Analysis output */}
            <div
              className="mt-4 min-h-[220px] rounded-2xl border bg-[#FAFCFF] p-4"
              style={brandBorder}
            >
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748B" }}>
                AI Analysis
              </div>

                <ProgressBar running={analyzing} />

              {analyzing && (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-sm" style={{ color: "#64748B" }}>
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#2F80FF" }} />
                  Analyzing... this can take a moment
                </div>
              )}

              {!analyzing && analyzeErr && (
                <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600">{analyzeErr}</div>
              )}

              {!analyzing && !analysis && !analyzeErr && (
                <p className="text-sm" style={{ color: "#94a3b8" }}>
                  Results will appear here
                </p>
              )}

              {analysis && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {analysis.page_contents.map((p) => (
                      <div key={p.url} className="rounded-lg bg-white p-2 text-xs" style={{ border: "1px solid #DCE8FF" }}>
                        <div className="truncate font-semibold" style={{ color: "#1E293B" }}>
                          {p.title || p.url}
                        </div>
                        {p.description && (
                          <div className="mt-0.5 line-clamp-2" style={{ color: "#64748B" }}>
                            {p.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {analysis.keywords.length > 0 && (
                    <div>
                      <div className="mb-2 text-xs font-semibold" style={{ color: "#1E293B" }}>
                        Suggested keywords
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.keywords.map((k) => {
                          const active = activeKeywords.includes(k);
                          return (
                            <button
                              key={k}
                              onClick={() => toggleKeyword(k)}
                              className="rounded-full px-3 py-1.5 text-xs font-medium transition"
                              style={
                                active
                                  ? { background: "#2F80FF", color: "white" }
                                  : { background: "#F4F8FF", color: "#2F80FF", border: "1px solid #DCE8FF" }
                              }
                            >
                              {k}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Search TikTok button */}
            <button
              onClick={runSearch}
              disabled={!canSearch}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: "#2F80FF" }}
            >
              {searching && <Loader2 className="h-4 w-4 animate-spin" />}
              Search TikTok &raquo;
            </button>
          </div>
        </aside>

        {/* RIGHT PANEL */}
        <section className="min-w-0 flex-1">
          <div
            className="flex h-full min-h-[80vh] flex-col rounded-3xl border bg-white p-5 shadow-sm"
            style={brandBorder}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold" style={{ color: "#1E293B" }}>
                  Results
                </h2>
                {results && (
                  <p className="text-xs" style={{ color: "#64748B" }}>
                    {results.keywords.map((k, i) => (
                      <span key={k}>
                        {i > 0 && <span className="mx-1">·</span>}
                        <span className="font-semibold" style={{ color: "#2F80FF" }}>{k}</span>
                      </span>
                    ))}
                    {" · "}
                    {results.videos_count} videos · {results.top_authors_count} authors
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium" style={{ color: "#64748B" }}>
                  Sort
                </span>
                <div className="flex rounded-full border p-1" style={brandBorder}>
                  {(["video", "authors"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className="rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition"
                      style={
                        view === v
                          ? { background: "#2F80FF", color: "white" }
                          : { color: "#64748B" }
                      }
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <ProgressBar running={searching} />

            <div className="flex-1 overflow-y-auto pr-1 custom-scroll">
              {searching && (
                <div className="flex flex-col items-center justify-center gap-3 py-24 text-sm" style={{ color: "#64748B" }}>
                  <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#2F80FF" }} />
                  Searching TikTok... this can take a moment
                </div>
              )}

              {!searching && searchErr && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{searchErr}</div>
              )}

              {!searching && !results && !searchErr && (
                <EmptyState />
              )}

              {results && !searching && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {view === "video" ? (
                    <VideoList videos={results.videos} />
                  ) : (
                    <AuthorGrid authors={results.top_authors} />
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #DCE8FF; border-radius: 999px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #2F80FF; }
      `}</style>
    </div>
  );
}

const brandBorder = { borderColor: "#DCE8FF" } as const;

function ProgressBar({ running }: { running: boolean }) {
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState<"idle" | "running" | "completing">("idle");
  const prevRunning = useRef(false);

  useEffect(() => {
    if (running && !prevRunning.current) {
      setPhase("running");
      setPct(0);
    } else if (!running && prevRunning.current) {
      setPhase("completing");
      setPct(100);
    }
    prevRunning.current = running;
  }, [running]);

  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => {
      setPct((p) => (p >= 88 ? p : p + (88 - p) * 0.04));
    }, 250);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "completing") return;
    const id = setTimeout(() => setPhase("idle"), 600);
    return () => clearTimeout(id);
  }, [phase]);

  if (phase === "idle") return null;

  return (
    <div className="w-full overflow-hidden rounded-full" style={{ height: 4, background: "#DCE8FF" }}>
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          background: "#2F80FF",
          transition: phase === "completing" ? "width 0.4s ease-in-out" : "width 0.25s ease-out",
        }}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 py-24 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl" style={{ background: "#F4F8FF" }}>
        <span className="text-2xl">🔍</span>
      </div>
      <p className="text-sm font-medium" style={{ color: "#1E293B" }}>
        No results yet
      </p>
      <p className="max-w-xs text-xs" style={{ color: "#64748B" }}>
        Add URLs, analyze to generate keywords, pick one, then press Search TikTok.
      </p>
    </div>
  );
}

function VideoList({ videos }: { videos: Video[] }) {
  if (!videos.length) return <p className="p-4 text-sm text-slate-500">No videos found.</p>;
  return (
    <ul className="space-y-3">
      {videos.map((v) => (
        <li
          key={v.id}
          className="flex flex-col gap-4 rounded-2xl border bg-white p-4 transition hover:shadow-md sm:flex-row"
          style={brandBorder}
        >
          <img
            src={v.cover}
            alt=""
            loading="lazy"
            className="h-24 w-24 shrink-0 rounded-xl object-cover"
            style={{ background: "#F4F8FF" }}
          />
          <div className="min-w-0 flex-1">
            <a
              href={v.tiktok_url}
              target="_blank"
              rel="noopener noreferrer"
              className="line-clamp-2 text-sm font-medium hover:underline"
              style={{ color: "#1E293B" }}
            >
              {v.desc || "(no description)"}
            </a>
            <div className="mt-1 truncate text-[11px]" style={{ color: "#94a3b8" }}>
              {v.tiktok_url}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs" style={{ color: "#64748B" }}>
              <Stat icon={<Heart className="h-3.5 w-3.5" />} n={v.stats.likes} />
              <Stat icon={<MessageCircle className="h-3.5 w-3.5" />} n={v.stats.comments} />
              <Stat icon={<Share2 className="h-3.5 w-3.5" />} n={v.stats.shares} />
            </div>
          </div>

          <div className="hidden w-px shrink-0 sm:block" style={{ background: "#DCE8FF" }} />

          <div className="flex w-full items-center gap-3 sm:w-56">
            <img
              src={v.author_avatar}
              alt={v.author_name}
              loading="lazy"
              className="h-12 w-12 shrink-0 rounded-full object-cover"
              style={{ background: "#F4F8FF" }}
            />
            <div className="min-w-0">
              <a
                href={`https://www.tiktok.com/@${v.author_uniqueId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate block text-sm font-bold hover:underline"
                style={{ color: "#1E293B" }}
              >
                {v.author_name}
              </a>
              <div className="text-[11px]" style={{ color: "#64748B" }}>
                @{v.author_uniqueId}
              </div>
              <div className="text-[11px]" style={{ color: "#64748B" }}>
                followers: <span className="font-medium">{fmt(v.author_followers)}</span>
              </div>
              <div className="text-[11px]" style={{ color: "#64748B" }}>
                total likes: <span className="font-medium">{fmt(v.author_total_likes)}</span>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Stat({ icon, n }: { icon: React.ReactNode; n: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      {icon} {fmt(n)}
    </span>
  );
}

function AuthorGrid({ authors }: { authors: Author[] }) {
  if (!authors.length) return <p className="p-4 text-sm text-slate-500">No authors found.</p>;
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {authors.map((a, i) => (
        <div
          key={a.author_uniqueId + i}
          className="flex items-center gap-4 rounded-2xl border bg-white p-4 transition hover:shadow-md"
          style={brandBorder}
        >
          <div
            className="w-10 shrink-0 text-center text-3xl font-black tabular-nums"
            style={{ color: "#2F80FF", opacity: 0.6 }}
          >
            {i + 1}
          </div>
          <img
            src={a.author_avatar}
            alt={a.author_name}
            loading="lazy"
            className="h-14 w-14 shrink-0 rounded-full object-cover"
            style={{ background: "#F4F8FF" }}
          />
          <div className="min-w-0 flex-1">
            <a
              href={`https://www.tiktok.com/@${a.author_uniqueId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate block text-sm font-bold hover:underline"
              style={{ color: "#1E293B" }}
            >
              {a.author_name}
            </a>
            <div className="text-[11px]" style={{ color: "#64748B" }}>
              @{a.author_uniqueId}
            </div>
            <div className="text-[11px]" style={{ color: "#64748B" }}>
              followers: <span className="font-medium">{fmt(a.followers)}</span>
            </div>
            <div className="text-[11px]" style={{ color: "#64748B" }}>
              total likes: <span className="font-medium">{fmt(a.total_likes)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
