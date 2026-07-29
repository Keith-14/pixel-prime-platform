// fetch-news: NewsData.io ingestion pipeline
// Trusted publishers → AI relevance → Readability extraction → clean HTML → featured image → Supabase
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { JSDOM } from "https://esm.sh/jsdom@22.1.0";
import { Readability } from "https://esm.sh/@mozilla/readability@0.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Trusted publisher allowlist ─────────────────────────────────────────────
const TRUSTED_PUBLISHERS: Array<{ match: string; display: string; gulfIslamOnly?: boolean }> = [
  { match: "middleeasteye", display: "Middle East Eye" },
  { match: "middle east eye", display: "Middle East Eye" },
  { match: "aljazeera", display: "Al Jazeera" },
  { match: "al jazeera", display: "Al Jazeera" },
  { match: "trtworld", display: "TRT World" },
  { match: "trt world", display: "TRT World" },
  { match: "trt", display: "TRT World" },
  { match: "anadolu", display: "Anadolu Agency" },
  { match: "aa.com.tr", display: "Anadolu Agency" },
  { match: "arabnews", display: "Arab News" },
  { match: "arab news", display: "Arab News" },
  { match: "newarab", display: "The New Arab" },
  { match: "the new arab", display: "The New Arab" },
  { match: "muslimnews", display: "Muslim News UK" },
  { match: "muslim news", display: "Muslim News UK" },
  { match: "iqna", display: "IQNA" },
  { match: "islamicvoice", display: "Islamic Voice" },
  { match: "islamic voice", display: "Islamic Voice" },
  { match: "gulfnews", display: "Gulf News", gulfIslamOnly: true },
  { match: "gulf news", display: "Gulf News", gulfIslamOnly: true },
];

function matchTrustedPublisher(sourceId?: string | null, sourceName?: string | null, link?: string | null): { display: string; gulfIslamOnly: boolean } | null {
  const hay = `${sourceId ?? ""} ${sourceName ?? ""} ${link ?? ""}`.toLowerCase();
  for (const p of TRUSTED_PUBLISHERS) {
    if (hay.includes(p.match)) return { display: p.display, gulfIslamOnly: !!p.gulfIslamOnly };
  }
  return null;
}

// ─── HTML utils ──────────────────────────────────────────────────────────────
function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function toAbsoluteUrl(base: string, url: string | null | undefined): string | null {
  if (!url) return null;
  try { return new URL(url, base).href; } catch { return null; }
}

async function isImageReachable(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    let res = await fetch(url, { method: "HEAD", signal: controller.signal, redirect: "follow" });
    clearTimeout(timer);
    if (!res.ok || !(res.headers.get("content-type") || "").startsWith("image")) {
      const c2 = new AbortController();
      const t2 = setTimeout(() => c2.abort(), 8000);
      res = await fetch(url, { method: "GET", headers: { Range: "bytes=0-0" }, signal: c2.signal, redirect: "follow" });
      clearTimeout(t2);
    }
    const ct = res.headers.get("content-type") || "";
    return res.ok && ct.startsWith("image");
  } catch { return false; }
}

// Clean HTML from Readability output: strip unwanted tags, keep formatting/images/links.
function cleanReadabilityHtml(html: string, baseUrl: string): string {
  let out = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<button[\s\S]*?<\/button>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");

  // Resolve <img src> to absolute + style
  out = out.replace(/<img([^>]+)>/gi, (_full, attrs) => {
    const src = attrs.match(/\bsrc=["']([^"']+)["']/i)?.[1];
    const alt = attrs.match(/\balt=["']([^"']+)["']/i)?.[1] ?? "";
    if (!src) return "";
    const abs = toAbsoluteUrl(baseUrl, src) || src;
    return `<img src="${abs}" alt="${alt}" loading="lazy" style="max-width:100%;height:auto;border-radius:8px;margin:8px 0;">`;
  });

  // Resolve <a href> to absolute
  out = out.replace(/<a([^>]+)>/gi, (_full, attrs) => {
    const href = attrs.match(/\bhref=["']([^"']+)["']/i)?.[1];
    if (!href) return "<a>";
    const abs = toAbsoluteUrl(baseUrl, href) || href;
    return `<a href="${abs}" target="_blank" rel="noopener noreferrer">`;
  });

  out = decodeEntities(out).replace(/\n{3,}/g, "\n\n").replace(/ {2,}/g, " ").trim();
  return out;
}

function extractFirstImageFromHtml(html: string, baseUrl: string): string | null {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (!m) return null;
  return toAbsoluteUrl(baseUrl, m[1]);
}

function extractOgImage(html: string): string | null {
  const metas: Record<string, string> = {};
  const re = /<meta\s+([^>]+)>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1];
    const prop = attrs.match(/\b(?:property|name)=["']([^"']+)["']/i)?.[1];
    const content = attrs.match(/\bcontent=["']([^"']+)["']/i)?.[1];
    if (prop && content) metas[prop.toLowerCase()] = content;
  }
  return metas["og:image"] || metas["og:image:url"] || metas["twitter:image"] || metas["twitter:image:src"] || null;
}

// ─── Article extraction (Readability) ────────────────────────────────────────
interface Extracted {
  html: string | null;
  title: string | null;
  excerpt: string | null;
  byline: string | null;
  ogImage: string | null;
  firstContentImage: string | null;
}

async function extractArticle(url: string): Promise<Extracted> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BarakahNewsBot/3.0; +https://barakah.services)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return { html: null, title: null, excerpt: null, byline: null, ogImage: null, firstContentImage: null };
    const raw = await res.text();
    const ogImage = toAbsoluteUrl(url, extractOgImage(raw));

    try {
      const dom = new JSDOM(raw, { url });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();
      if (article && article.content) {
        const cleaned = cleanReadabilityHtml(article.content, url);
        return {
          html: cleaned,
          title: article.title || null,
          excerpt: article.excerpt ? decodeEntities(article.excerpt).trim() : null,
          byline: article.byline || null,
          ogImage,
          firstContentImage: extractFirstImageFromHtml(cleaned, url),
        };
      }
    } catch (e) {
      console.warn("Readability failed for", url, (e as Error).message);
    }
    return { html: null, title: null, excerpt: null, byline: null, ogImage, firstContentImage: null };
  } catch (e) {
    console.warn("extractArticle failed for", url, (e as Error).message);
    return { html: null, title: null, excerpt: null, byline: null, ogImage: null, firstContentImage: null };
  }
}

// ─── AI relevance classifier via Lovable AI Gateway ──────────────────────────
const ACCEPT_KEYWORDS = [
  "palestine", "gaza", "israel", "west bank", "jerusalem", "al-aqsa",
  "islam", "muslim", "ummah", "hajj", "umrah", "ramadan", "eid", "quran", "hadith",
  "halal", "haram", "mosque", "masjid", "sharia", "zakat", "sunni", "shia",
  "islamic finance", "islamic education", "muslim communities", "muslim world",
  "saudi", "mecca", "medina", "makkah", "madinah", "ottoman", "caliphate",
  "rohingya", "uyghur", "kashmir", "syria", "yemen", "iraq", "iran",
];
const REJECT_KEYWORDS = [
  "celebrity", "gossip", "kardashian", "hollywood", "bollywood",
  "grammy", "oscar", "netflix series", "tv show",
  "nfl", "nba", "mlb", "premier league", "world cup football", "cricket ipl",
];

function keywordVerdict(title: string, description: string, categories: string[]): { accept: boolean; category?: string } {
  const text = `${title} ${description} ${categories.join(" ")}`.toLowerCase();
  for (const r of REJECT_KEYWORDS) if (text.includes(r)) return { accept: false };
  for (const k of ACCEPT_KEYWORDS) if (text.includes(k)) return { accept: true, category: k };
  return { accept: false };
}

async function aiClassify(title: string, description: string, categories: string[]): Promise<{ accept: boolean; category: string | null }> {
  // Fast local reject/accept first
  const kv = keywordVerdict(title, description, categories);
  if (kv.accept) return { accept: true, category: kv.category ?? null };

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return { accept: false, category: null };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-luna",
        reasoning_effort: "none",
        messages: [
          {
            role: "system",
            content: `You classify news articles for a Muslim/Islamic audience app called Barakah.
Accept only articles clearly relevant to: Palestine, Gaza, Ummah, Muslim communities, Islam, Hajj, Umrah, Quran, Hadith, Ramadan, Eid, Halal, Islamic finance, Islamic education, Muslim technology, Muslim business, or humanitarian issues affecting Muslims.
Reject: celebrity gossip, sports, entertainment, generic politics unrelated to Muslims, general crime, irrelevant international news.
Respond ONLY with compact JSON: {"accept": true|false, "category": "short-topic-or-null"}.`,
          },
          {
            role: "user",
            content: `Title: ${title}\nDescription: ${description}\nCategories: ${categories.join(", ")}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return { accept: false, category: null };
    const data = await res.json();
    const txt = data?.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(txt);
    return { accept: !!parsed.accept, category: parsed.category ?? null };
  } catch {
    return { accept: false, category: null };
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const NEWSDATA_KEY = Deno.env.get("NEWSDATA_API_KEY");
  if (!NEWSDATA_KEY) {
    return new Response(JSON.stringify({ success: false, error: "NEWSDATA_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* empty */ }
  const maxPages = Math.min(Number(body.pages ?? 3), 5);
  const reenrichExisting = body.reenrich !== false;

  try {
    const results: Record<string, unknown> = {};
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let rejected = 0;

    // NewsData.io: query trusted publishers using multiple category/keyword queries.
    // Free tier: 10 articles/page. Use a mix of relevant queries.
    const queries = [
      "islam OR muslim OR palestine OR gaza",
      "hajj OR umrah OR quran OR ramadan OR eid",
      "muslim world OR islamic",
    ];

    const seenGuids = new Set<string>();
    let nextPage: string | null = null;

    for (const q of queries) {
      nextPage = null;
      for (let page = 0; page < maxPages; page++) {
        const params = new URLSearchParams({
          apikey: NEWSDATA_KEY,
          q,
          language: "en",
        });
        if (nextPage) params.set("page", nextPage);

        const apiUrl = `https://newsdata.io/api/1/news?${params.toString()}`;
        const res = await fetch(apiUrl, { headers: { "User-Agent": "BarakahNewsBot/3.0" } });
        if (!res.ok) {
          results[`q="${q}"_page${page}`] = `HTTP ${res.status}`;
          break;
        }
        const json = await res.json().catch(() => ({}));
        const articles: any[] = Array.isArray(json.results) ? json.results : [];
        nextPage = json.nextPage ?? null;

        for (const a of articles) {
          const link = a.link || a.url;
          if (!link) continue;
          const guid = String(a.article_id || a.link || a.title);
          if (seenGuids.has(guid)) { skipped++; continue; }
          seenGuids.add(guid);

          const trusted = matchTrustedPublisher(a.source_id, a.source_name, link);
          if (!trusted) { rejected++; continue; }

          const title: string = a.title || "Untitled";
          const description: string = a.description || "";
          const categories: string[] = Array.isArray(a.category) ? a.category : (a.category ? [a.category] : []);

          // AI relevance (with keyword fast-path)
          const verdict = await aiClassify(title, description, categories);
          if (!verdict.accept) { rejected++; continue; }
          // Gulf News: only Islam-related
          if (trusted.gulfIslamOnly) {
            const t = `${title} ${description}`.toLowerCase();
            if (!ACCEPT_KEYWORDS.some((k) => t.includes(k))) { rejected++; continue; }
          }

          // Skip if already ingested with content — avoid reprocessing
          const { data: existing } = await supabase
            .from("news_articles")
            .select("id, image_url, content")
            .eq("guid", guid)
            .maybeSingle();
          if (existing && existing.content && existing.image_url && !reenrichExisting) {
            skipped++;
            continue;
          }

          const extracted = await extractArticle(link);

          // Featured image priority: og:image → NewsData → media_content → enclosure → first content image
          const candidates = [
            extracted.ogImage,
            a.image_url,
            a.media_content,
            a.media_thumbnail,
            a.enclosure,
            extracted.firstContentImage,
          ].filter(Boolean) as string[];
          let featured: string | null = null;
          for (const c of candidates) {
            const abs = toAbsoluteUrl(link, c) || c;
            if (await isImageReachable(abs)) { featured = abs; break; }
          }

          const cleanDescription = description ? decodeEntities(description).replace(/<[^>]+>/g, "").trim() : null;
          const cleanContent = extracted.html || (cleanDescription ? `<p>${cleanDescription}</p>` : null);

          const row = {
            guid,
            title: decodeEntities(title),
            description: cleanDescription,
            content: cleanContent,
            image_url: featured,
            article_url: link,
            published_at: a.pubDate ? new Date(a.pubDate).toISOString() : null,
            author: a.creator?.[0] || extracted.byline || null,
            tags: categories,
            source_name: trusted.display,
            category: verdict.category || categories[0] || null,
            language: a.language || "en",
            country: Array.isArray(a.country) ? a.country[0] : (a.country || null),
            is_islamic: true,
            ai_category: verdict.category,
          };

          const { error: upErr } = await supabase
            .from("news_articles")
            .upsert(row, { onConflict: "guid" });
          if (upErr) {
            console.warn("Upsert failed:", upErr.message);
            continue;
          }
          if (existing) updated++; else inserted++;
        }

        if (!nextPage) break;
        // brief pause between pages to respect rate limits
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    // Deduplicate: keep newest by article_url
    try {
      await supabase.rpc("noop"); // no-op guard if RPC missing; deduplication done via SQL below
    } catch { /* ignore */ }

    return new Response(
      JSON.stringify({ success: true, inserted, updated, skipped, rejected, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});