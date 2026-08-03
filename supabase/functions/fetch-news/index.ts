import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type NewsCategory = "world" | "education" | "community" | "charity" | "business" | "politics";

interface NewsSource {
  name: string;
  rss_url: string;
  category: NewsCategory;
}

const DEFAULT_SOURCES: NewsSource[] = [
  { name: "Al Jazeera", rss_url: "https://www.aljazeera.com/xml/rss/all.xml", category: "world" },
  { name: "Middle East Eye", rss_url: "https://www.middleeasteye.net/rss", category: "world" },
  { name: "TRT World", rss_url: "https://www.trtworld.com/rss", category: "world" },
  { name: "Islamic Relief Worldwide", rss_url: "https://islamic-relief.org/feed/", category: "charity" },
  { name: "Muslim Matters", rss_url: "https://muslimmatters.org/feed/", category: "education" },
  { name: "About Islam", rss_url: "https://aboutislam.net/feed/", category: "community" },
  { name: "The Muslim Vibe", rss_url: "https://themuslimvibe.com/feed/", category: "community" },
  { name: "Islamic Finance Guru", rss_url: "https://www.islamicfinanceguru.com/feed/", category: "business" },
];

const NEWS_CATEGORIES = new Set<NewsCategory>(["world", "education", "community", "charity", "business", "politics"]);
const MAX_ITEMS_PER_SOURCE = 10;
const MAX_ARTICLE_EXCERPT_FETCHES = 12;

function normalizeCategory(value: unknown): NewsCategory {
  return typeof value === "string" && NEWS_CATEGORIES.has(value as NewsCategory) ? (value as NewsCategory) : "world";
}

function mergeSources(sources: NewsSource[]): NewsSource[] {
  const merged = new Map<string, NewsSource>();
  for (const source of [...DEFAULT_SOURCES, ...sources]) {
    if (!source.rss_url || merged.has(source.rss_url)) continue;
    merged.set(source.rss_url, {
      ...source,
      category: normalizeCategory(source.category),
    });
  }
  return [...merged.values()];
}

function inferCategory(item: ParsedItem, sourceCategory: NewsCategory): NewsCategory {
  const text = [item.title, item.description, item.content, item.author, item.tags.join(" ")]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    /\b(election|government|minister|parliament|policy|diplomat|president|prime minister|senate|congress|politic|court ruling|law)\b/.test(
      text,
    )
  )
    return "politics";
  if (
    /\b(zakat|sadaqah|charity|donat|relief|aid|humanitarian|fundrais|hunger|poverty|flood|earthquake|emergency)\b/.test(
      text,
    )
  )
    return "charity";
  if (
    /\b(finance|business|economy|market|bank|investment|startup|trade|commerce|halal industry|islamic finance|sukuk)\b/.test(
      text,
    )
  )
    return "business";
  if (
    /\b(education|school|university|student|teacher|quran class|learning|scholarship|curriculum|academy|study|knowledge)\b/.test(
      text,
    )
  )
    return "education";
  if (
    /\b(community|family|lifestyle|culture|heritage|mosque|masjid|ramadan|eid|marriage|youth|women|food|travel|event)\b/.test(
      text,
    )
  )
    return "community";
  return sourceCategory;
}

async function fetchWithTimeout(url: string, timeoutMs = 9000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      headers: { "User-Agent": "BarakahNewsBot/1.0 (+https://barakah.app)" },
      redirect: "follow",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function pick(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = xml.match(re);
  if (!m) return null;
  return decode(stripCData(m[1]).trim());
}

function pickAttr(xml: string, tag: string, attr: string): string | null {
  const re = new RegExp(`<${tag}[^>]*\\b${attr}=["']([^"']+)["'][^>]*\\/?>`, "i");
  const m = xml.match(re);
  return m ? m[1] : null;
}

function pickAll(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const out: string[] = [];
  let m;
  while ((m = re.exec(xml)) !== null) out.push(decode(stripCData(m[1]).trim()));
  return out;
}

function stripCData(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function stripHtml(s: string | null): string | null {
  if (!s) return null;
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeText(s: string): string {
  return decode(s)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textToParagraphHtml(text: string): string | null {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return null;
  const chunks = clean
    .split(/(?<=[.!?])\s+(?=[A-Z"'])/)
    .reduce<string[]>((acc, sentence) => {
      const last = acc[acc.length - 1] ?? "";
      if (!last || last.length > 420) acc.push(sentence);
      else acc[acc.length - 1] = `${last} ${sentence}`;
      return acc;
    }, [])
    .slice(0, 6);
  return chunks.map((chunk) => `<p>${escapeHtml(chunk)}</p>`).join("");
}

function parseDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function fetchArticleExcerpt(url: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(url, 7000);
    if (!res.ok) return null;
    const html = await res.text();
    const body = html.match(/<article[\s\S]*?<\/article>/i)?.[0] || html.match(/<main[\s\S]*?<\/main>/i)?.[0] || html;
    const paragraphs = [...body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) => normalizeText(m[1]))
      .filter((p) => p.length > 45 && !/^(advertisement|subscribe|follow us|read more)$/i.test(p));
    const text = paragraphs.join(" ").slice(0, 2200);
    return textToParagraphHtml(text);
  } catch {
    return null;
  }
}

function extractImage(itemXml: string): string | null {
  const enclosure = pickAttr(itemXml, "enclosure", "url");
  if (enclosure) return enclosure;
  const mediaContent = pickAttr(itemXml, "media:content", "url");
  if (mediaContent) return mediaContent;
  const mediaThumb = pickAttr(itemXml, "media:thumbnail", "url");
  if (mediaThumb) return mediaThumb;
  const html = pick(itemXml, "content:encoded") || pick(itemXml, "description") || "";
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return imgMatch ? imgMatch[1] : null;
}

interface ParsedItem {
  guid: string;
  title: string;
  description: string | null;
  content: string | null;
  image_url: string | null;
  article_url: string;
  published_at: string | null;
  author: string | null;
  tags: string[];
}

function parseRss(xml: string): ParsedItem[] {
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) || xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  const items: ParsedItem[] = [];
  for (const block of itemBlocks) {
    const title = pick(block, "title") || "";
    let link = pick(block, "link");
    if (!link) link = pickAttr(block, "link", "href");
    if (!title || !link) continue;
    const guid = pick(block, "guid") || pick(block, "id") || link;
    const description = stripHtml(pick(block, "description") || pick(block, "summary"));
    const content = stripHtml(pick(block, "content:encoded") || pick(block, "content"));
    const pub = pick(block, "pubDate") || pick(block, "published") || pick(block, "updated");
    const author = stripHtml(pick(block, "dc:creator") || pick(block, "author"));
    const tags = pickAll(block, "category").filter(Boolean).slice(0, 10);
    items.push({
      guid,
      title,
      description,
      content,
      image_url: extractImage(block),
      article_url: link,
      published_at: parseDate(pub),
      author,
      tags,
    });
  }
  return items;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ success: false, error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { data: sources, error: srcErr } = await supabase
      .from("news_sources")
      .select("name, rss_url, category")
      .eq("is_active", true);
    if (srcErr) throw srcErr;

    const activeSources = mergeSources(
      (sources ?? []).map((source) => ({
        name: source.name,
        rss_url: source.rss_url,
        category: normalizeCategory(source.category),
      })),
    );

    let totalProcessed = 0;
    const results: Record<string, number | string> = {};
    const categories: Record<NewsCategory, number> = {
      world: 0,
      education: 0,
      community: 0,
      charity: 0,
      business: 0,
      politics: 0,
    };
    let excerptFetches = 0;

    for (const src of activeSources) {
      try {
        const res = await fetchWithTimeout(src.rss_url);
        if (!res.ok) {
          results[src.name] = `HTTP ${res.status}`;
          continue;
        }
        const xml = await res.text();
        const items = parseRss(xml).slice(0, MAX_ITEMS_PER_SOURCE);
        const rows = [];
        const rowCategories: NewsCategory[] = [];
        for (const it of items) {
          const rssText = `${it.description ?? ""} ${stripHtml(it.content) ?? ""}`.trim();
          const shouldFetchExcerpt = rssText.length < 700 && excerptFetches < MAX_ARTICLE_EXCERPT_FETCHES;
          const enrichedContent = shouldFetchExcerpt ? await fetchArticleExcerpt(it.article_url) : it.content;
          if (shouldFetchExcerpt) excerptFetches += 1;
          const category = inferCategory(it, src.category);
          rows.push({
            ...it,
            content: enrichedContent || it.content || (it.description ? textToParagraphHtml(it.description) : null),
            source_name: src.name,
            category,
          });
          rowCategories.push(category);
        }
        if (rows.length) {
          const { error } = await supabase.from("news_articles").upsert(rows, { onConflict: "guid" });
          if (error) {
            results[src.name] = `DB: ${error.message}`;
            continue;
          }
        }
        rowCategories.forEach((category) => {
          categories[category] += 1;
        });
        results[src.name] = rows.length;
        totalProcessed += rows.length;
      } catch (e) {
        results[src.name] = `ERR: ${(e as Error).message}`;
      }
    }

    return new Response(JSON.stringify({ success: true, totalProcessed, categories, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
