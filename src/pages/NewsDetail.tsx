import { Layout } from '@/components/Layout';
import { ArrowLeft, Loader2, ExternalLink, Clock, Share2, Globe } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Share } from '@capacitor/share';
import { Browser } from '@capacitor/browser';

interface Article {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  image_url: string | null;
  article_url: string;
  source_name: string;
  published_at: string | null;
  author: string | null;
  category: string | null;
}

const BROWN = '#A35233';
const BROWN_DARK = '#7a3a22';
const CREAM = '#FFF5E5';
const BROWN_SOFT = '#F5D9C4';

// Client-side HTML sanitiser — strips dangerous tags, keeps formatting
function toAbsoluteUrl(base: string, url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url, base).href;
  } catch {
    return null;
  }
}

function sanitizeForDisplay(html: string, baseUrl?: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '')
    // Unwrap structural wrappers that mess up spacing
    .replace(/<\/?(?:div|span|section|figure|figcaption|aside|header|footer|nav)[^>]*>/gi, ' ')
    // Sanitize img tags — only keep src and alt, normalize to absolute and add lazy loading
    .replace(/<img([^>]*)>/gi, (_, attrs) => {
      const src = attrs.match(/\bsrc=["']([^"']+)["']/i)?.[1];
      const alt = attrs.match(/\balt=["']([^"']+)["']/i)?.[1] ?? '';
      const resolved = baseUrl ? (toAbsoluteUrl(baseUrl, src) || src) : src;
      return src ? `<img src="${resolved}" alt="${alt}" loading="lazy" style="max-width:100%;border-radius:8px;margin:8px 0;">` : '';
    })
    // Sanitize anchor tags
    .replace(/<a([^>]*)>([\s\S]*?)<\/a>/gi, (_, attrs, content) => {
      const href = attrs.match(/\bhref=["']([^"']+)["']/i)?.[1];
      const resolved = baseUrl ? (toAbsoluteUrl(baseUrl, href) || href) : href;
      return href ? `<a href="${resolved}" target="_blank" rel="noopener noreferrer" style="color:${BROWN};text-decoration:underline;">${content}</a>` : content;
    })
    // Strip attributes from safe tags
    .replace(/<(\/?(?:p|h[1-6]|ul|ol|li|blockquote|strong|em|b|i|br))[^>]*>/gi, '<$1>')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    .trim();
}

function plainText(html: string | null): string {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export const NewsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [openingBrowser, setOpeningBrowser] = useState(false);
  const hasEnrichedRef = useRef(false);

  const loadArticle = useCallback(async (): Promise<Article | null> => {
    if (!id) return null;
    const { data } = await supabase
      .from('news_articles')
      .select('id, title, description, content, image_url, article_url, source_name, published_at, author, category')
      .eq('id', id)
      .maybeSingle();
    return data as Article | null;
  }, [id]);

  // Initial load from DB
  useEffect(() => {
    let active = true;
    (async () => {
      const data = await loadArticle();
      if (active) {
        setArticle(data);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [loadArticle]);

  // On-demand enrichment via fetch-article edge function
  useEffect(() => {
    if (!article || hasEnrichedRef.current) return;
    const contentLength = plainText(article.content).length;
    // Enrich if: no image, or content is very short
    const needsEnrich = !article.image_url || contentLength < 400;
    if (!needsEnrich) return;

    hasEnrichedRef.current = true;
    setEnriching(true);

    supabase.functions
      .invoke('fetch-article', { body: { articleId: article.id } })
      .then(({ data }) => {
        if (data?.article) {
          setArticle(data.article as Article);
        }
      })
      .catch(() => {/* silent — we still show what we have */})
      .finally(() => setEnriching(false));
  }, [article]);

  // ── Share ────────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (!article) return;
    try {
      const canShare = await Share.canShare();
      const shareData = {
        title: article.title,
        text: `${article.source_name}: ${article.title}`,
        url: article.article_url,
        dialogTitle: 'Share this article',
      };
      if (canShare.value) {
        await Share.share(shareData);
      } else if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(article.article_url);
      }
    } catch (e: any) {
      const msg = e?.message?.toLowerCase() ?? '';
      if (!msg.includes('cancel') && !msg.includes('abort') && !msg.includes('dismiss')) {
        console.error('Share failed:', e);
      }
    }
  };

  // ── Open in-app browser ──────────────────────────────────────────────────────
  const openInBrowser = async () => {
    if (!article) return;
    setOpeningBrowser(true);
    try {
      await Browser.open({ url: article.article_url, presentationStyle: 'popover' });
    } catch {
      // Fallback to window.open if Capacitor Browser fails
      window.open(article.article_url, '_blank', 'noopener,noreferrer');
    } finally {
      setOpeningBrowser(false);
    }
  };

  // ── Derived display values ────────────────────────────────────────────────────
  const sanitizedContent = sanitizeForDisplay(article?.content ?? '', article?.article_url);
  const sanitizedDescription = sanitizeForDisplay(article?.description ?? '', article?.article_url);
  const contentText = plainText(sanitizedContent);
  const descriptionText = plainText(sanitizedDescription);
  const contentStartsWithDescription = Boolean(descriptionText) && contentText.startsWith(descriptionText);
  const showDescription = Boolean(sanitizedDescription) && !contentStartsWithDescription;
  const showContent = Boolean(sanitizedContent) && contentText !== descriptionText;
  const hasReadableContent = (showDescription && descriptionText.length > 100) || (showContent && contentText.length > 100);
  const shortTitle = article?.title
    ? article.title.length > 22
      ? article.title.slice(0, 22).trim() + '…'
      : article.title
    : '';

  return (
    <Layout showHeader={false} showNavigation={false}>
      <div className="min-h-screen" style={{ backgroundColor: CREAM }}>
        {/* Top bar */}
        <div className="bg-white px-4 pt-4 pb-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-full border flex items-center justify-center shrink-0"
            style={{ borderColor: BROWN, color: BROWN }}
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-base font-semibold truncate px-3 flex-1" style={{ color: BROWN }}>
            {shortTitle}
          </h1>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={openInBrowser}
              disabled={openingBrowser}
              className="h-10 w-10 rounded-full flex items-center justify-center"
              style={{ color: BROWN }}
              aria-label="Open in browser"
              title="Open full article"
            >
              {openingBrowser ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="h-10 w-10 rounded-full flex items-center justify-center"
              style={{ color: BROWN }}
              aria-label="Share"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: BROWN }} />
          </div>
        ) : !article ? (
          <p className="text-center py-20 text-sm" style={{ color: BROWN }}>Article not found.</p>
        ) : (
          <article className="pb-16">
            {/* Hero image */}
            {article.image_url && (
              <div className="relative w-full bg-neutral-200">
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-full object-cover"
                  style={{ maxHeight: '280px' }}
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = 'none';
                  }}
                />
                {article.category && (
                  <span
                    className="absolute left-4 bottom-3 text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-md text-white"
                    style={{ backgroundColor: BROWN }}
                  >
                    {article.category}
                  </span>
                )}
              </div>
            )}

            <div className="px-5 pt-6 space-y-5">
              {/* Title */}
              <h2 className="text-[24px] leading-[1.25] font-bold text-neutral-900">
                {article.title}
              </h2>

              {/* Source / author / date row */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div
                    className="h-11 w-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ backgroundColor: BROWN }}
                  >
                    {article.source_name?.[0]?.toUpperCase() ?? 'N'}
                  </div>
                  <div className="leading-tight min-w-0">
                    <p className="text-[14px] font-bold text-neutral-900 truncate">{article.source_name}</p>
                    {article.author && (
                      <p className="text-xs text-neutral-500 truncate">{article.author}</p>
                    )}
                  </div>
                </div>
                {article.published_at && (
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: BROWN_SOFT, color: BROWN_DARK }}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {timeAgo(article.published_at)}
                  </span>
                )}
              </div>

              <div className="h-px" style={{ backgroundColor: '#E8D2B8' }} />

              {/* Article body */}
              {showDescription && (
                <p className="text-[15px] leading-relaxed text-neutral-600 italic">
                  {descriptionText}
                </p>
              )}

              {showContent && (
                <div
                  className="prose-article text-[15px] leading-relaxed space-y-3"
                  style={{ color: '#2d1f14' }}
                  dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                />
              )}

              {/* Enriching indicator */}
              {enriching && (
                <div
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{ backgroundColor: BROWN_SOFT, color: BROWN_DARK }}
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading full article…
                </div>
              )}

              {/* Fallback: open in browser if content is still short after enrichment */}
              {!enriching && !hasReadableContent && (
                <div
                  className="rounded-2xl p-5 space-y-3 text-center"
                  style={{ backgroundColor: BROWN_SOFT }}
                >
                  <Globe className="h-8 w-8 mx-auto" style={{ color: BROWN }} />
                  <p className="text-sm font-semibold" style={{ color: BROWN_DARK }}>
                    Full content is only available on the publisher's website.
                  </p>
                  <button
                    type="button"
                    onClick={openInBrowser}
                    className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: BROWN }}
                  >
                    {openingBrowser ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                    Read Full Article
                  </button>
                </div>
              )}

              {/* View source link */}
              {hasReadableContent && (
                <button
                  type="button"
                  onClick={openInBrowser}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold pt-2"
                  style={{ color: BROWN }}
                >
                  View on {article.source_name} <ExternalLink className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </article>
        )}
      </div>

      {/* Article prose styles */}
      <style>{`
        .prose-article p { margin: 0.5rem 0; }
        .prose-article h1, .prose-article h2, .prose-article h3,
        .prose-article h4, .prose-article h5, .prose-article h6 {
          font-weight: 700;
          color: #1a0f0a;
          margin: 1rem 0 0.25rem;
          line-height: 1.25;
        }
        .prose-article h1 { font-size: 1.4rem; }
        .prose-article h2 { font-size: 1.2rem; }
        .prose-article h3 { font-size: 1.05rem; }
        .prose-article ul, .prose-article ol { padding-left: 1.25rem; margin: 0.5rem 0; }
        .prose-article li { margin: 0.2rem 0; }
        .prose-article blockquote {
          border-left: 3px solid #A35233;
          padding-left: 1rem;
          margin: 0.75rem 0;
          color: #5a3a28;
          font-style: italic;
        }
        .prose-article img {
          max-width: 100%;
          border-radius: 8px;
          margin: 8px 0;
        }
        .prose-article strong, .prose-article b { font-weight: 700; }
        .prose-article em, .prose-article i { font-style: italic; }
      `}</style>
    </Layout>
  );
};
