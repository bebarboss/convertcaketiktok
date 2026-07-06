export const DEFAULT_API_BASE =
  import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";

export function getApiBase(): string {
  if (typeof localStorage !== "undefined") {
    return localStorage.getItem("tt_api_base") ?? DEFAULT_API_BASE;
  }
  return DEFAULT_API_BASE;
}

export function setApiBase(url: string): void {
  localStorage.setItem("tt_api_base", url);
}

// ─── Response types ────────────────────────────────────────────────────────────

export type PageContent = { url: string; title: string; description: string };

export type AnalyzeResp = {
  page_contents: PageContent[];
  keywords: string[];
};

export type VideoStats = {
  likes: number;
  comments: number;
  shares: number;
  plays: number;
  favorites: number;
};

export type Video = {
  id: string;
  tiktok_url: string;
  desc: string;
  cover: string;
  author_name: string;
  author_uniqueId: string;
  author_avatar: string;
  author_followers: number;
  author_total_likes: number;
  stats: VideoStats;
};

export type Author = {
  author_name: string;
  author_uniqueId: string;
  author_avatar: string;
  followers: number;
  total_likes: number;
  top_likes: number;
};

export type SearchResp = {
  keywords: string[];
  videos_count: number;
  videos: Video[];
  top_authors_count: number;
  top_authors: Author[];
};

// ─── API functions ─────────────────────────────────────────────────────────────

export async function analyzeUrls(
  urls: string[],
  numKeywords = 5,
  apiBase = getApiBase(),
): Promise<AnalyzeResp> {
  const qs = urls.map((u) => `url=${encodeURIComponent(u)}`).join("&");
  const r = await fetch(`${apiBase}/analyze?${qs}&num_keywords=${numKeywords}`);
  if (!r.ok) {
    const body = await r.json().catch(() => null);
    throw new Error(body?.detail ?? `HTTP ${r.status}`);
  }
  return r.json() as Promise<AnalyzeResp>;
}

export async function searchTikTok(
  keywords: string[],
  topN = 10,
  apiBase = getApiBase(),
): Promise<SearchResp> {
  const qs = keywords.map((k) => `keyword=${encodeURIComponent(k)}`).join("&");
  const r = await fetch(`${apiBase}/search?${qs}&top_n=${topN}`);
  if (!r.ok) {
    const body = await r.json().catch(() => null);
    throw new Error(body?.detail ?? `HTTP ${r.status}`);
  }
  return r.json() as Promise<SearchResp>;
}
