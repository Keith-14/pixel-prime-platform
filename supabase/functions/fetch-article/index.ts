import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── HTML sanitizer ───────────────────────────────────────────────────────────

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<\/?(?:div|span|section|aside|header|footer|nav|figure|figcaption|table|thead|tbody|tr|td|th|article|main)[^>]*>/gi, " ")
    .replace(/<img([^>]*)>/gi, (_: string, attrs: string) => {
      const src = attrs.match(/\bsrc=["']([^"']+)["']/i)?.[1];
      const alt = attrs.match(/\balt=["']([^"']+)["']/i)?.[1] ?? "";
      return src ? `<img src="${src}" alt="${alt}">` : "";
    })
    .replace(/<a([^>]*)>([\s\S]*?)<\/a>/gi, (_: string, attrs: string, content: string) => {
      const href = attrs.match(/\bhref=["']([^"']+)["']/i)?.[1];
      return href ? `<a href="${href}" target="_blank" rel="noopener noreferrer">${content}</a>` : content;
    })
    .replace(/<(\/?(?:p|h[1-6]|ul|ol|li|blockquote|strong|em|b|i|br))[^>]*>/gi, "<$1>")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/ {2,}/g, " ")
    .trim();
}

// ─── OG meta extraction ──────────────────────────────────────────────────────

interface OGMeta {
  description: string | null;
  image: string | null;
  author: string | null;
  publishedTime: string | null;
}

function extractOGMeta(html: string): OGMeta {
  const metaRe = /<meta\s+([^>]+)>/gi;
  const metas: Record<string, string> = {};
  let m: RegExpExecArray | null;
  while ((m = metaRe.exec(html)) !== null) {
    const attrs = m[1];
    const prop =
      attrs.match(/\bproperty=["']([^"']+)["']/i)?.[1] ||
      attrs.match(/\bname=["']([^"']+)["']/i)?.[1];
    const content = attrs.match(/\bcontent=["']([^"']+)["']/i)?.[1];
    if (prop && content) metas[prop.toLowerCase()] = content;
  }
  const linkImage = html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i)?.[1];
  return {
    description: metas["og:description"] || metas["twitter:description"] || metas["description"] || null,
    image: metas["og:image"] || metas["og:image:url"] || metas["twitter:image"] || metas["twitter:image:src"] || linkImage || null,
    author: metas["article:author"] || metas["author"] || null,
    publishedTime: metas["article:published_time"] || metas["article:modified_time"] || null,
  };
}

function toAbsoluteUrl(base: string, url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url, base).href;
  } catch {
    return null;
  }
}

async function isImageReachable(url: string): Promise<boolean> {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000 + attempt * 2000);
      let res = await fetch(url, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) {
        const controller2 = new AbortController();
        const timer2 = setTimeout(() => controller2.abort(), 8000 + attempt * 2000);
        res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' }, signal: controller2.signal });
        clearTimeout(timer2);
      }
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.startsWith('image')) return true;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 200 * Math.pow(2, attempt)));
  }
  return false;
}

// ─── Article body extraction ──────────────────────────────────────────────────

const NOISE_PATTERNS = /^(advertisement|subscribe|follow us|read more|sign up for|newsletter|cookie policy|copyright|all rights reserved|terms of|privacy policy|share this|related articles|you may also like)/i;

function extractArticleHtml(html: string): string | null {
  const body =
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[0] ||
    html.match(/<div[^>]+class="[^"]*(?:article-body|post-content|entry-content|article-content|story-body|news-body|content-body)[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[0] ||
    html.match(/<div[^>]+(?:id|class)="[^"]*(?:content|article|post|story)[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[0] ||
    html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[0] ||
    html;

  const sanitized = sanitizeHtml(body);
  const elements: string[] = [];
  const elementRe = /<(p|h[1-6]|ul|ol|blockquote)([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = elementRe.exec(sanitized)) !== null) {
    const tag = match[1];
    const full = match[0];
    const text = full.replace(/<[^>]+>/g, "").trim();
    if (tag === "p" && text.length < 25) continue;
    if (NOISE_PATTERNS.test(text)) continue;
    elements.push(full);
    if (elements.length >= 50) break;
  }
  return elements.length > 0 ? elements.join("\n") : null;
}

// ─── Core enrichment function ─────────────────────────────────────────────────

interface EnrichedArticle {
  content: string | null;
  image_url: string | null;
  author: string | null;
  published_at: string | null;
  og_description: string | null;
}

async function fetchAndEnrichArticle(url: string, existingImage: string | null): Promise<EnrichedArticle> {
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
    let articleHtml = extractArticleHtml(html);

    // Normalize image URLs in the article HTML and add lazy loading
    if (articleHtml) {
      articleHtml = articleHtml.replace(/<img([^>]+)>/gi, (full, attrs) => {
        const src = attrs.match(/\bsrc=["']([^"']+)["']/i)?.[1];
        const alt = attrs.match(/\balt=["']([^"']+)["']/i)?.[1] ?? "";
        const resolved = toAbsoluteUrl(url, src) || src;
        return src ? `<img src="${resolved}" alt="${alt}" loading="lazy" style="max-width:100%;height:auto;border-radius:8px;margin:8px 0;">` : "";
      });
    }

    // Resolve image priority: OG/Twitter first, then existingImage, then first image in content
    let resolvedImage = og.image || existingImage || null;
    if (resolvedImage) resolvedImage = toAbsoluteUrl(url, resolvedImage) || resolvedImage;
    if (resolvedImage && !(await isImageReachable(resolvedImage))) {
      // try to find first image in articleHtml
      const firstImg = articleHtml?.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
      if (firstImg) {
        const abs = toAbsoluteUrl(url, firstImg) || firstImg;
        resolvedImage = (await isImageReachable(abs)) ? abs : null;
      } else {
        resolvedImage = null;
      }
    }

    return {
      content: articleHtml,
      image_url: resolvedImage,
      author: og.author || null,
      published_at: og.publishedTime ? new Date(og.publishedTime).toISOString() : null,
      og_description: og.description || null,
    };
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

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { articleId } = await req.json().catch(() => ({}));
    if (!articleId) {
      return new Response(
        JSON.stringify({ error: "articleId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Load the article record
    const { data: article, error: fetchErr } = await supabase
      .from("news_articles")
      .select("id, article_url, image_url, content, description, author, published_at")
      .eq("id", articleId)
      .maybeSingle();

    if (fetchErr || !article) {
      return new Response(
        JSON.stringify({ error: "Article not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch and enrich from the original page
    const enriched = await fetchAndEnrichArticle(article.article_url, article.image_url);

    // Only update fields that were improved
    const updates: Record<string, string | null> = {};
    if (enriched.content && (!article.content || article.content.replace(/<[^>]+>/g, "").length < 300)) {
      updates.content = enriched.content;
    }
    if (enriched.image_url && enriched.image_url !== article.image_url) {
      updates.image_url = enriched.image_url;
    }
    if (enriched.author && !article.author) {
      updates.author = enriched.author;
    }
    if (enriched.og_description && !article.description) {
      updates.description = enriched.og_description;
    }
    if (enriched.published_at && !article.published_at) {
      updates.published_at = enriched.published_at;
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from("news_articles").update(updates).eq("id", articleId);
    }

    // Return the freshest available data
    const { data: fresh } = await supabase
      .from("news_articles")
      .select("id, title, description, content, image_url, article_url, source_name, published_at, author, category")
      .eq("id", articleId)
      .maybeSingle();

    return new Response(
      JSON.stringify({ success: true, article: fresh }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
