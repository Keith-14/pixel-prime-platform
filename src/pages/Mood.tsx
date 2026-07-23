import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  ChevronRight,
  X,
  Sun,
  Heart,
  Home,
  Moon,
  Sunrise,
  MapPin,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { BottomNavigation } from '@/components/BottomNavigation';
import duasData from '@/data/duas.json';

const CREAM = '#FFF5E5';
const CREAM_CARD = '#FFFFFF';
const BROWN = '#2C1309';
const BROWN_ACCENT = '#B0431E';
const BROWN_MUTED = '#8B6F5C';
const BORDER = 'rgba(232,213,196,0.86)';

interface HisnulDua {
  number: number;
  title: string;
  url?: string;
  arabic?: string;
  translation?: string[];
  transliteration_and_notes?: string;
}

interface DuaGroup {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Sun;
  parts: HisnulDua[];
  searchable: string;
}

const cleanText = (value?: string | string[]) => {
  if (!value) return '';
  const raw = Array.isArray(value) ? value.join('\n') : value;
  return raw.replace(/\s+/g, ' ').trim();
};

const getIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes('sleep') || t.includes('night')) return Moon;
  if (t.includes('wake') || t.includes('morning')) return Sunrise;
  if (t.includes('home') || t.includes('house')) return Home;
  if (t.includes('travel') || t.includes('journey')) return MapPin;
  if (t.includes('prayer') || t.includes('mosque') || t.includes('witr')) return BookOpen;
  if (t.includes('fear') || t.includes('distress') || t.includes('sick') || t.includes('worry')) return Heart;
  return Sparkles;
};

const groupedDuas: DuaGroup[] = Object.values(
  (duasData as HisnulDua[]).reduce<Record<string, DuaGroup>>((groups, dua) => {
    const key = dua.title.trim().toLowerCase();
    const existing = groups[key];
    const group =
      existing ||
      ({
        id: key.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        title: dua.title,
        subtitle: '',
        icon: getIcon(dua.title),
        parts: [],
        searchable: '',
      } satisfies DuaGroup);

    group.parts.push(dua);
    group.subtitle =
      group.parts.length === 1
        ? `Hisnul Muslim #${group.parts[0].number}`
        : `${group.parts.length} duas - Hisnul Muslim #${group.parts[0].number}-${group.parts[group.parts.length - 1].number}`;
    group.searchable = [
      group.title,
      ...group.parts.flatMap((part) => [
        String(part.number),
        part.arabic,
        cleanText(part.translation),
        part.transliteration_and_notes,
      ]),
    ]
      .join(' ')
      .toLowerCase();

    groups[key] = group;
    return groups;
  }, {})
);

export const Mood = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDua, setSelectedDua] = useState<DuaGroup | null>(null);

  const filteredDuas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return groupedDuas;
    return groupedDuas.filter((dua) => dua.searchable.includes(q));
  }, [searchQuery]);

  return (
    <div
      className="min-h-screen max-w-md mx-auto relative overflow-hidden font-arabic"
      style={{ background: CREAM }}
    >
      <div
        className="flex items-center gap-3 px-5 pt-4 pb-3"
        style={{ background: CREAM, paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2"
          style={{ color: BROWN }}
          aria-label="Back"
        >
          <ArrowLeft className="h-6 w-6" strokeWidth={2} />
        </button>
        <h1
          className="text-[20px] font-bold"
          style={{ color: BROWN, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Duas
        </h1>
      </div>

      <div className="px-5 pb-4">
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3 border"
          style={{ background: CREAM_CARD, borderColor: BORDER }}
        >
          <Search className="h-5 w-5 flex-shrink-0" style={{ color: BROWN_MUTED }} strokeWidth={2} />
          <input
            type="text"
            placeholder="Search duas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#B8A898]"
            style={{ color: BROWN }}
          />
        </div>
      </div>

      <div className="px-5 pb-28 space-y-2.5 overflow-y-auto">
        {filteredDuas.map((dua) => {
          const Icon = dua.icon;
          return (
            <button
              key={dua.id}
              onClick={() => setSelectedDua(dua)}
              className="w-full flex items-center gap-4 rounded-2xl px-4 py-4 border text-left transition-transform active:scale-[0.98]"
              style={{ background: CREAM_CARD, borderColor: BORDER }}
            >
              <div
                className="h-11 w-11 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(176,67,30,0.08)', color: BROWN_ACCENT }}
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold truncate" style={{ color: BROWN }}>
                  {dua.title}
                </p>
                <p className="text-[13px] truncate" style={{ color: BROWN_MUTED }}>
                  {dua.subtitle}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 flex-shrink-0" style={{ color: BROWN_ACCENT }} strokeWidth={2} />
            </button>
          );
        })}

        {filteredDuas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[15px]" style={{ color: BROWN_MUTED }}>
              No duas found
            </p>
          </div>
        )}
      </div>

      <BottomNavigation />

      {selectedDua && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedDua(null)} />

          <div
            className="relative w-full max-w-md rounded-t-[32px] px-6 pt-6 pb-10 max-h-[90vh] overflow-y-auto"
            style={{ background: CREAM_CARD, paddingBottom: 'calc(env(safe-area-inset-bottom) + 2.5rem)' }}
          >
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setSelectedDua(null)}
                className="p-2 -mr-2"
                style={{ color: BROWN }}
                aria-label="Close"
              >
                <X className="h-6 w-6" strokeWidth={2} />
              </button>
            </div>

            <h2
              className="text-[22px] font-bold"
              style={{ color: BROWN, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {selectedDua.title}
            </h2>
            <p className="text-[14px] mt-1" style={{ color: BROWN_MUTED }}>
              {selectedDua.subtitle}
            </p>

            <div className="my-5 h-px" style={{ background: BORDER }} />

            <div className="space-y-7">
              {selectedDua.parts.map((part, index) => (
                <section key={`${selectedDua.id}-${part.number}`}>
                  {selectedDua.parts.length > 1 && (
                    <div
                      className="inline-flex rounded-full px-3 py-1 text-[12px] font-semibold mb-4"
                      style={{ background: 'rgba(176,67,30,0.08)', color: BROWN_ACCENT }}
                    >
                      Part {index + 1} - #{part.number}
                    </div>
                  )}

                  {part.arabic && (
                    <p
                      className="text-[24px] leading-[1.8] text-center font-arabic whitespace-pre-line"
                      style={{ color: BROWN }}
                      dir="rtl"
                    >
                      {part.arabic}
                    </p>
                  )}

                  {part.transliteration_and_notes && (
                    <p
                      className="text-[14px] italic text-center mt-4 leading-relaxed whitespace-pre-line"
                      style={{ color: BROWN_MUTED }}
                    >
                      {part.transliteration_and_notes}
                    </p>
                  )}

                  {part.translation?.length ? (
                    <>
                      <div className="my-5 h-px" style={{ background: BORDER }} />
                      <p className="text-[14px] font-semibold mb-3" style={{ color: BROWN }}>
                        English
                      </p>
                      <div className="space-y-3">
                        {part.translation.map((line, i) => (
                          <p key={`${part.number}-translation-${i}`} className="text-[16px] leading-relaxed" style={{ color: BROWN }}>
                            {line}
                          </p>
                        ))}
                      </div>
                    </>
                  ) : null}
                </section>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-6">
              <BookOpen className="h-4 w-4" style={{ color: BROWN_ACCENT }} strokeWidth={2} />
              <p className="text-[13px]" style={{ color: BROWN_MUTED }}>
                Source: Hisnul Muslim
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
