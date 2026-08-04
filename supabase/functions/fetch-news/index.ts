import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Readability } from "https://esm.sh/@mozilla/readability@0.5.0";
import { parseHTML } from "https://esm.sh/linkedom@0.18.5/worker";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type NewsCategory = "world" | "education" | "community" | "charity" | "business" | "politics";

const TRUSTED_PUBLISHERS: { match: RegExp; name: string; category: NewsCategory }[] = [
  { match: /middle\s*east\s*eye|middleeasteye/i, name: "Middle East Eye", category: "world" },
  { match: /al\s*jazeera|aljazeera/i, name: "Al Jazeera", category: "world" },
  { match: /trt\s*(world|afrika|haber)?/i, name: "TRT World", category: "world" },
  { match: /anadolu|aa\.com\.tr/i, name: "Anadolu Agency", category: "world" },
  { match: /arab\s*news|arabnews/i, name: "Arab News", category: "world" },
  { match: /the\s*new\s*arab|newarab/i, name: "The New Arab", category: "politics" },
  { match: /muslim\s*news/i, name: "Muslim News UK", category: "community" },
  { match: /iqna/i, name: "IQNA", category: "community" },
  { match: /islamic\s*voice/i, name: "Islamic Voice", category: "education" },
  { match: /gulf\s*news/i, name: "Gulf News", category: "business" },
];

const NEWSDATA_DOMAINS = [
  "middleeasteye.net",
  "aljazeera.com",
  "trtworld.com",
  "aa.com.tr",
  "arabnews.com",
  "newarab.com",
  "muslimnews.co.uk",
  "iqna.ir",
  "islamicvoice.com",
  "gulfnews.com",
];

const DOMAIN_CHUNKS: string[][] = [];
for (let i = 0; i < NEWSDATA_DOMAINS.length; i += 5) DOMAIN_CHUNKS.push(NEWSDATA_DOMAINS.slice(i, i + 5));

const QUERIES = [
  "Islam OR Muslim OR Palestine OR Gaza OR Ummah",
  "Hajj OR Umrah OR Quran OR Hadith OR Ramadan OR Eid",
  "halal OR \"Islamic finance\" OR \"Muslim community\" OR \"Islamic education\"",
];

const CATEGORY_HINTS: { re: RegExp; category: NewsCategory }[] = [
  { re: /charity|relief|donat|humanitarian|aid/i, category: "charity" },
  { re: /school|university|education|student|scholar/i, category: "education" },
  { re: /finance|business|economy|market|trade|investment|halal industry/i, category: "business" },
  { re: /election|government|parliament|minister|policy|diplomat|war|ceasefire/i, category: "politics" },
  { re: /mosque|community|ummah|ramadan|eid|hajj|umrah|quran|hadith/i, category: "community" },
];

interface NewsDataArticle {
  article_id?: string;
  title?: string;
  link?: string;
  description?: string;
  content?: string;
  image_url?: string;
  pubDate?: string;
  source_id?: string;
  source_name?: string;
  creator?: string[] | null;
  keywords?: string[] | null;
  language?: string;
  country?: string[] | null;
}

function trustedPublisher(article: NewsDataArticle) {
  const haystack = `${article.source_name ?? ""} ${article.source_id ?? ""} ${article.link ?? ""}`;
  return TRUSTED_PUBLISHERS.find((p) => p.match.test(haystack)) ?? null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;|&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&ldquo;|&rdquo;/gi, '"')
    .replace(/&mdash;/gi, "\u2014")
    .replace(/&ndash;/gi, "\u2013")
    .replace(/&hellip;/gi, "\u2026")
    .replace(/&#(\d+);/g, (_m, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, h) => String.fromCodePoint(parseInt(h, 16)));
}

function stripHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  const text = decodeEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
  return text || null;
}

function absolutize(url: string | null | undefined, base: string): string | null {
  if (!url) return null;
  try {
    return new URL(url, base).toString();
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url: string, timeoutMs = 12000, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      redirect: "follow",
      ...init,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; BarakahNewsBot/2.0; +https://barakah.services)",
        ...(init.headers ?? {}),
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(id);
  }
}

const ALLOWED_TAGS = new Set([
  "P","H1","H2","H3","H4","H5","H6","UL","OL","LI","BLOCKQUOTE","FIGURE","FIGCAPTION",
  "IMG","A","STRONG","EM","B","I","BR","HR","TABLE","THEAD","TBODY","TR","TD","TH","PRE","CODE","SPAN","DIV",
]);
const DROP_SELECTOR =
  "script,style,noscript,iframe,form,button,input,svg,nav,aside,footer,header," +
  "[class*='share'],[class*='social'],[class*='newsletter'],[class*='related'],[class*='promo']," +
  "[class*='advert'],[id*='advert'],[class*='cookie'],[id*='cookie'],[class*='comment'],[id*='comment']";

function cleanArticleHtml(html: string, baseUrl: string): string | null {
  const { document } = parseHTML(`<div id="__root">${html}</div>`);
  const root = document.getElementById("__root");
  if (!root) return null;
  root.querySelectorAll(DROP_SELECTOR).forEach((el: any) => el.remove());
  root.querySelectorAll("*").forEach((el: any) => {
    const tag = String(el.tagName || "").toUpperCase();
    if (!ALLOWED_TAGS.has(tag)) {
      el.replaceWith(...Array.from(el.childNodes));
      return;
    }
    for (const attr of Array.from(el.attributes ?? []) as any[]) {
      const n = attr.name.toLowerCase();
      const keep =
        (tag === "IMG" && (n === "src" || n === "alt")) ||
        (tag === "A" && (n === "href" || n === "title"));
      if (!keep) el.removeAttribute(attr.name);
    }
    if (tag === "IMG") {
      const abs = absolutize(el.getAttribute("src"), baseUrl);
      if (!abs) el.remove();
      else el.setAttribute("src", abs);
    }
    if (tag === "A") {
      const abs = absolutize(el.getAttribute("href"), baseUrl);
      if (abs) {
        el.setAttribute("href", abs);
      } else {
        el.replaceWith(...Array.from(el.childNodes));
      }
    }
  });
  const out = decodeEntities(root.innerHTML).replace(/\s{2,}/g, " ").trim();
  return out.length > 200 ? out : null;
}

function metaContent(document: any, selectors: string[]): string | null {
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    const content = el?.getAttribute?.("content") || el?.getAttribute?.("href");
    if (content) return content;
  }
  return null;
}

async function imageExists(url: string): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(url, 8000, { method: "GET", headers: { Range: "bytes=0-256" } });
    const type = res.headers.get("content-type") ?? "";
    return res.ok && type.startsWith("image");
  } catch {
    return false;
  }
}

interface Extraction {
  html: string | null;
  text: string | null;
  image: string | null;
  author: string | null;
  title: string | null;
}

async function extractArticle(url: string): Promise<Extraction> {
  const empty: Extraction = { html: null, text: null, image: null, author: null, title: null };
  try {
    const res = await fetchWithTimeout(url, 15000);
    if (!res.ok) return empty;
    const raw = await res.text();
    const { document } = parseHTML(raw);
    const ogImage =
      metaContent(document, [
        'meta[property="og:image"]',
        'meta[property="og:image:url"]',
        'meta[name="og:image"]',
        'meta[name="twitter:image"]',
        'meta[property="twitter:image"]',
        'meta[name="twitter:image:src"]',
        'meta[itemprop="image"]',
        'link[rel="image_src"]',
      ]) ?? null;
    let article: any = null;
    try {
      article = new Readability(document as any, { charThreshold: 200 }).parse();
    } catch {
      article = null;
    }
    const html = article?.content ? cleanArticleHtml(article.content, url) : null;
    let image = absolutize(ogImage, url);
    if (!image && html) {
      const m = html.match(/<img[^>]+src="([^"]+)"/i);
      image = m ? m[1] : null;
    }
    return {
      html,
      text: article?.textContent ? decodeEntities(article.textContent).replace(/\s+/g, " ").trim() : null,
      image,
      author: article?.byline ? decodeEntities(article.byline).trim() : null,
      title: article?.title ? decodeEntities(article.title).trim() : null,
    };
  } catch {
    return empty;
  }
}

const AI_CATEGORIES = [
  "Palestine","Gaza","Ummah","Muslim Communities","Islam","Hajj","Umrah","Quran","Hadith",
  "Ramadan","Eid","Halal","Islamic Finance","Islamic Education","Muslim Technology",
  "Muslim Business","Humanitarian",
];

async function classifyBatch(
  items: { idx: number; title: string; description: string }[],
  apiKey: string,
): Promise<Record<number, { relevant: boolean; category: string }>> {
  const fallback: Record<number, { relevant: boolean; category: string }> = {};
  for (const it of items) fallback[it.idx] = { relevant: false, category: "Islam" };
  if (!items.length) return fallback;
  try {
    const res = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", 45000, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          {
            role: "system",
            content:
              "You classify news articles for an Islamic news app. Accept only articles about: " +
              AI_CATEGORIES.join(", ") +
              ", or humanitarian issues affecting Muslims. Reject celebrity gossip, sports, entertainment, general politics unrelated to Muslims, crime unless directly relevant, and irrelevant international news. " +
              'Reply ONLY with JSON: {"results":[{"idx":number,"relevant":boolean,"category":string}]}',
          },
          {
            role: "user",
            content: JSON.stringify(
              items.map((i) => ({ idx: i.idx, title: i.title, description: i.description.slice(0, 400) })),
            ),
          },
        ],
      }),
    });
    if (!res.ok) return fallback;
    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "";
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return fallback;
    const parsed = JSON.parse(match[0]);
    for (const r of parsed?.results ?? []) {
      if (typeof r?.idx === "number") {
        fallback[r.idx] = {
          relevant: Boolean(r.relevant),
          category: typeof r.category === "string" && r.category ? r.category : "Islam",
        };
      }
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function sectionFor(text: string, fallback: NewsCategory): NewsCategory {
  for (const hint of CATEGORY_HINTS) if (hint.re.test(text)) return hint.category;
  return fallback;
}

function guidFor(link: string): string {
  try {
    const u = new URL(link);
    u.search = "";
    u.hash = "";
    return `newsdata:${u.toString()}`;
  } catch {
    return `newsdata:${link}`;
  }
}

async function fetchNewsData(apiKey: string, domains: string[]): Promise<NewsDataArticle[]> {
  const url = new URL("https://newsdata.io/api/1/latest");
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("language", "en");
  url.searchParams.set("domainurl", domains.join(","));
  try {
    const res = await fetchWithTimeout(url.toString(), 15000);
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.results) ? (json.results as NewsDataArticle[]) : [];
  } catch {
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const newsKey = Deno.env.get("NEWSDATA_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

  if (!supabaseUrl || !serviceKey || !newsKey || !lovableKey) {
    return new Response(JSON.stringify({ success: false, error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // 1. Fetch from NewsData.io (batched queries, sequential to respect rate limits)
    const raw: NewsDataArticle[] = [];
    for (const domain of NEWSDATA_DOMAINS) {
      raw.push(...(await fetchNewsData(newsKey, [domain])));
      await new Promise((r) => setTimeout(r, 900));
    }

    // 2. Normalize + trusted publisher filter + dedupe by canonical link
    const byGuid = new Map<string, { a: NewsDataArticle; pub: (typeof TRUSTED_PUBLISHERS)[number] }>();
    for (const a of raw) {
      if (!a.link || !a.title) continue;
      const pub = trustedPublisher(a);
      if (!pub) continue;
      const guid = guidFor(a.link);
      if (!byGuid.has(guid)) byGuid.set(guid, { a, pub });
    }
    const candidates = [...byGuid.entries()];

    // 3. Skip already-enriched articles (performance / caching)
    const guids = candidates.map(([g]) => g);
    const existing = new Map<string, { content: string | null; image_url: string | null }>();
    for (let i = 0; i < guids.length; i += 100) {
      const { data } = await supabase
        .from("news_articles")
        .select("guid, content, image_url")
        .in("guid", guids.slice(i, i + 100));
      for (const row of data ?? []) existing.set(row.guid, row);
    }
    const toProcess = candidates.filter(([g]) => {
      const e = existing.get(g);
      return !e || !e.content || !e.image_url;
    });

    // 4. AI relevance classification
    const classifyItems = toProcess.map(([, v], idx) => ({
      idx,
      title: v.a.title ?? "",
      description: stripHtml(v.a.description) ?? "",
    }));
    const verdicts: Record<number, { relevant: boolean; category: string }> = {};
    for (let i = 0; i < classifyItems.length; i += 20) {
      Object.assign(verdicts, await classifyBatch(classifyItems.slice(i, i + 20), lovableKey));
    }

    // 5. Extract + clean + image resolution + store
    let stored = 0;
    let rejected = 0;
    const usedImages = new Set<string>(
      (
        await supabase
          .from("news_articles")
          .select("image_url")
          .not("image_url", "is", null)
          .limit(1000)
      ).data?.map((r: any) => r.image_url) ?? [],
    );

    const rows: any[] = [];
    for (let idx = 0; idx < toProcess.length; idx++) {
      const [guid, { a, pub }] = toProcess[idx];
      const verdict = verdicts[idx];
      if (!verdict?.relevant) {
        rejected++;
        continue;
      }
      const extraction = await extractArticle(a.link!);
      const description = stripHtml(a.description) ?? extraction.text?.slice(0, 300) ?? null;
      const html =
        extraction.html ??
        (description ? `<p>${description.replace(/</g, "&lt;")}</p>` : null);

      // featured image priority: og/twitter (from page) -> newsdata -> first article image
      const candidatesImg = [extraction.image, absolutize(a.image_url, a.link!)].filter(Boolean) as string[];
      let image: string | null = null;
      for (const c of candidatesImg) {
        if (usedImages.has(c)) continue;
        if (await imageExists(c)) {
          image = c;
          break;
        }
      }
      if (image) usedImages.add(image);

      const section = sectionFor(
        `${a.title} ${description ?? ""} ${verdict.category}`,
        pub.category,
      );

      rows.push({
        guid,
        title: decodeEntities(a.title!).trim(),
        description,
        content: html,
        image_url: image,
        article_url: a.link,
        source_name: pub.name,
        author: (a.creator?.[0] ? decodeEntities(a.creator[0]) : null) ?? extraction.author,
        published_at: a.pubDate ? new Date(a.pubDate.replace(" ", "T") + "Z").toISOString() : new Date().toISOString(),
        tags: (a.keywords ?? []).slice(0, 10),
        category: section,
        language: a.language ?? "en",
        country: a.country?.[0] ?? null,
        is_islamic: true,
        ai_category: verdict.category,
      });
    }

    if (rows.length) {
      const { error } = await supabase.from("news_articles").upsert(rows, { onConflict: "guid" });
      if (error) throw error;
      stored = rows.length;
    }

    // 6. Cleanup: remove legacy RSS rows and unusable articles
    await supabase.from("news_articles").delete().not("guid", "like", "newsdata:%");
    await supabase.from("news_articles").delete().is("image_url", null);

    return new Response(
      JSON.stringify({
        success: true,
        fetched: raw.length,
        trusted: candidates.length,
        processed: toProcess.length,
        rejectedByAi: rejected,
        stored,
        samples: rows.slice(0, 5).map((r) => ({
          title: r.title,
          source_name: r.source_name,
          image_url: r.image_url,
          published_at: r.published_at,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
