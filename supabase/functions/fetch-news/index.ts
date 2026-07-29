import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { JSDOM } from "https://esm.sh/jsdom@20.0.3";
import { Readability } from "https://esm.sh/@mozilla/readability@0.4.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── XML helpers ─────────────────────────────────────────────────────────────

function pick(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = xml.match(re);
  if (!m) return null;
  return decode(stripCData(m[1]).trim());
}

function pickAttr(xml: string, tag: string, attr: string): string | null {
  const re = new RegExp(`<${tag}[^>]*\\b${attr}=["']([^"']+)["'][^>]*/?>`, "i");
  const m = xml.match(re);
  return m ? m[1] : null;
}

function pickAll(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const out: string[] = [];
  let m: RegExpExecArray | null;
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
  const result = s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  return result || null;
}

// ─── HTML sanitizer: keep safe formatting tags ────────────────────────────────

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      // NewsData.io integration
      const NEWSDATA_KEY = Deno.env.get("NEWSDATA_API_KEY") || "pub_f22cee1671c5424491983937fbf02ebd";

      // Trusted publisher allowlist (case-insensitive match)
      const TRUSTED_PUBLISHERS = [
        'middle east eye',
        'al jazeera',
        'trt world',
        'anadolu agency',
        'arab news',
        'the new arab',
        'muslim news',
        'iqna',
        'islamic voice',
        'gulf news',
      ];

      function isTrustedPublisher(name: string | undefined | null): boolean {
        if (!name) return false;
        const n = name.toLowerCase().trim();
        return TRUSTED_PUBLISHERS.some((t) => n.includes(t));
      }

      // Simple keyword-based fallback classifier; if OPENAI_API_KEY is provided this can be replaced by an AI call
      function classifyIsIslamic(title: string | null, description: string | null, categories: string[] | null): { accept: boolean; category?: string } {
        const acceptKeywords = [
          'palestine','gaza','islam','muslim','hajj','umrah','ramadan','eid','quran','hadith','halal','mosque','islamic','ummah','muslim communities','islamic finance','islamic education'
        ];
        const rejectKeywords = ['gossip','entertainment','celebrity','sports','crime','accident'];
        const text = `${title ?? ''} ${description ?? ''} ${(categories ?? []).join(' ')}`.toLowerCase();
        for (const r of rejectKeywords) if (text.includes(r)) return { accept: false };
        for (const k of acceptKeywords) if (text.includes(k)) return { accept: true, category: k };
        // fallback false
        return { accept: false };
      }

      async function extractFullArticleWithReadability(url: string): Promise<{ content: string | null; title: string | null; firstImage: string | null }> {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 15000);
          const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BarakahNewsBot/2.0)' }, signal: controller.signal });
          clearTimeout(timer);
          if (!res.ok) return { content: null, title: null, firstImage: null };
          const html = await res.text();
          const dom = new JSDOM(html, { url });
          const reader = new Readability(dom.window.document);
          const article = reader.parse();
          if (!article) return { content: null, title: null, firstImage: null };
          const content = sanitizeHtml(article.content || '');
          const firstImg = (article.content || '').match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] || null;
          return { content, title: article.title || null, firstImage: firstImg ? toAbsoluteUrl(url, firstImg) : null };
        } catch (e) {
          console.warn('Readability failed for', url, (e as Error).message);
          return { content: null, title: null, firstImage: null };
        }
      }

      try {
        let totalInserted = 0;
        const results: Record<string, number | string> = {};

        // Fetch pages from NewsData.io (respect rate limits) — fetch first 2 pages as a start
        const pagesToFetch = 2;
        const seenGuids = new Set<string>();

        for (let p = 0; p < pagesToFetch; p++) {
          const apiUrl = `https://newsdata.io/api/1/news?apikey=${NEWSDATA_KEY}&page=${p}`;
          const res = await fetch(apiUrl, { headers: { 'User-Agent': 'BarakahNewsBot/2.0' } });
          if (!res.ok) {
            results[`newsdata_page_${p}`] = `HTTP ${res.status}`;
            continue;
          }
          const json = await res.json().catch(() => ({}));
          const articles = Array.isArray(json.results) ? json.results : [];
          let pageInserted = 0;

          for (const a of articles) {
            const sourceName = (a.source_id || a.source || a.creator || '') as string;
            if (!isTrustedPublisher(sourceName)) continue;

            const guid = a.link || a.guid || a.id || `${a.title}-${a.pubDate}`;
            if (seenGuids.has(guid)) continue;
            seenGuids.add(guid);

            // AI relevance classification (or fallback)
            const cls = classifyIsIslamic(a.title || null, a.description || null, Array.isArray(a.category) ? a.category : (a.category ? [a.category] : null));
            if (!cls.accept) continue;

            // Extract full article with Readability
            const extracted = await extractFullArticleWithReadability(a.link);

            // OG metadata
            const og = extractOGMeta(extracted.content || '');

            // Resolve featured image priority
            let candidateImages: Array<string | null> = [];
            candidateImages.push(og.image || null);
            candidateImages.push(a.image_url || a.image || null);
            candidateImages.push(a.media_content || null);
            candidateImages.push(a.media_thumbnail || null);
            candidateImages.push(a.enclosure || null);
            candidateImages.push(extracted.firstImage || null);

            let chosenImage: string | null = null;
            for (const img of candidateImages) {
              if (!img) continue;
              const abs = toAbsoluteUrl(a.link, img) || img;
              if (await isImageReachable(abs)) {
                chosenImage = abs;
                break;
              }
            }

            const row = {
              guid,
              title: a.title || extracted.title || 'Untitled',
              description: a.description || null,
              content: extracted.content || (a.description ? `<p>${a.description}</p>` : null),
              image_url: chosenImage,
              article_url: a.link,
              published_at: a.pubDate ? new Date(a.pubDate).toISOString() : null,
              author: a.creator || a.source || null,
              tags: Array.isArray(a.category) ? a.category : (a.category ? [a.category] : []),
              source_name: sourceName || 'newsdata',
              category: cls.category || (Array.isArray(a.category) ? a.category[0] : a.category) || null,
              language: a.language || null,
              country: a.country || null,
            };

            // Upsert single row by guid
            const { error: upErr } = await supabase.from('news_articles').upsert(row, { onConflict: 'guid' });
            if (upErr) {
              console.warn('DB upsert failed for', guid, upErr.message);
              continue;
            }
            pageInserted += 1;
          }

          results[`page_${p}`] = pageInserted;
          totalInserted += pageInserted;
          // Respect a small delay to avoid rate limits
          await new Promise((r) => setTimeout(r, 500));
        }

        return new Response(JSON.stringify({ success: true, totalProcessed: totalInserted, results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    if (tag === "p" && text.length < 25) continue;
    if (NOISE_PATTERNS.test(text)) continue;
    elements.push(full);
    if (elements.length >= 50) break;
  }
  return elements.length > 0 ? elements.join("\n") : null;
}

// ─── Per-article enrichment ──────────────────────────────────────────────────

export interface EnrichedArticle {
  content: string | null;
  image_url: string | null;
  author: string | null;
  published_at: string | null;
  og_description: string | null;
}

export async function fetchAndEnrichArticle(url: string, existingImage: string | null): Promise<EnrichedArticle> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BarakahNewsBot/2.0; +https://barakah.app)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return { content: null, image_url: existingImage, author: null, published_at: null, og_description: null };

    const html = await res.text();
    const og = extractOGMeta(html);
    const articleHtml = extractArticleHtml(html);

    return {
      content: articleHtml,
      image_url: og.image || existingImage,
      author: og.author || null,
      published_at: og.publishedTime ? new Date(og.publishedTime).toISOString() : null,
      og_description: og.description || null,
    };
  } catch {
    return { content: null, image_url: existingImage, author: null, published_at: null, og_description: null };
  }
}

// ─── RSS image extraction ─────────────────────────────────────────────────────

function extractImage(itemXml: string): string | null {
  // Prefer media:content, then media:thumbnail, then enclosure, then first img in content
  const mediaContent = pickAttr(itemXml, "media:content", "url");
  if (mediaContent) return mediaContent;
  const mediaThumb = pickAttr(itemXml, "media:thumbnail", "url");
  if (mediaThumb) return mediaThumb;
  const enclosure = pickAttr(itemXml, "enclosure", "url");
  if (enclosure) return enclosure;
  const html = pick(itemXml, "content:encoded") || pick(itemXml, "description") || "";
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return imgMatch ? imgMatch[1] : null;
}

// ─── RSS parser ───────────────────────────────────────────────────────────────

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
  const itemBlocks =
    xml.match(/<item[\s\S]*?<\/item>/gi) ||
    xml.match(/<entry[\s\S]*?<\/entry>/gi) ||
    [];
  const items: ParsedItem[] = [];
  for (const block of itemBlocks) {
    const title = pick(block, "title") || "";
    let link = pick(block, "link");
    if (!link) link = pickAttr(block, "link", "href");
    if (!title || !link) continue;
    const guid = pick(block, "guid") || pick(block, "id") || link;
    const description = stripHtml(pick(block, "description") || pick(block, "summary"));
    // Preserve full HTML from content:encoded — just sanitize it
    const rawContent = pick(block, "content:encoded") || pick(block, "content") || null;
    const content = rawContent ? sanitizeHtml(rawContent) : null;
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
      published_at: pub ? new Date(pub).toISOString() : null,
      author,
      tags,
    });
  }
  return items;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { data: sources, error: srcErr } = await supabase
      .from("news_sources")
      .select("name, rss_url, category")
      .eq("is_active", true);
    if (srcErr) throw srcErr;

    let totalInserted = 0;
    const results: Record<string, number | string> = {};

    for (const src of sources ?? []) {
      try {
        const res = await fetch(src.rss_url, {
          headers: { "User-Agent": "BarakahNewsBot/2.0" },
        });
        if (!res.ok) {
          results[src.name] = `HTTP ${res.status}`;
          continue;
        }
        const xml = await res.text();
        const items = parseRss(xml);
        const rows = [];

        for (const it of items) {
          const rssTextLength = `${it.description ?? ""} ${it.content?.replace(/<[^>]+>/g, "") ?? ""}`.trim().length;
          // Start with RSS-provided candidates
          let enriched: EnrichedArticle = {
            content: it.content,
            image_url: it.image_url,
            author: it.author,
            published_at: it.published_at,
            og_description: null,
          };

          // Always try to enrich from the article page to prefer publisher's OG/twitter images
          try {
            const fetched = await fetchAndEnrichArticle(it.article_url, it.image_url);

            // Normalize image URLs and validate reachability
            if (fetched.image_url) {
              const abs = toAbsoluteUrl(it.article_url, fetched.image_url) || fetched.image_url;
              if (await isImageReachable(abs)) {
                fetched.image_url = abs;
              } else {
                // fallback to RSS candidate
                const rssImg = it.image_url;
                if (rssImg) {
                  const absRss = toAbsoluteUrl(it.article_url, rssImg) || rssImg;
                  fetched.image_url = (await isImageReachable(absRss)) ? absRss : null;
                } else {
                  fetched.image_url = null;
                }
              }
            } else if (it.image_url) {
              const absRss = toAbsoluteUrl(it.article_url, it.image_url) || it.image_url;
              fetched.image_url = (await isImageReachable(absRss)) ? absRss : null;
            }

            enriched = {
              content: fetched.content || it.content,
              image_url: fetched.image_url || it.image_url,
              author: it.author || fetched.author,
              published_at: fetched.published_at || it.published_at,
              og_description: fetched.og_description,
            };
          } catch (e) {
            console.warn('Enrichment error for', it.article_url, (e as Error).message);
          }

          rows.push({
            guid: it.guid,
            title: it.title,
            description: enriched.og_description || it.description,
            content: enriched.content || (it.description ? `<p>${it.description}</p>` : null),
            image_url: enriched.image_url,
            article_url: it.article_url,
            published_at: it.published_at || enriched.published_at,
            author: enriched.author,
            tags: it.tags,
            source_name: src.name,
            category: src.category,
          });
        }

        if (rows.length) {
          const { error } = await supabase.from("news_articles").upsert(rows, { onConflict: "guid" });
          if (error) {
            results[src.name] = `DB: ${error.message}`;
            continue;
          }
        }
        results[src.name] = rows.length;
        totalInserted += rows.length;
      } catch (e) {
        results[src.name] = `ERR: ${(e as Error).message}`;
      }
    }

    return new Response(
      JSON.stringify({ success: true, totalProcessed: totalInserted, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
