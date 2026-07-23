import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  ChevronRight,
  X,
  Sun,
  Heart,
  UtensilsCrossed,
  Home,
  Moon,
  Sunrise,
  MapPin,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { BottomNavigation } from '@/components/BottomNavigation';

const CREAM = '#FFF5E5';
const CREAM_CARD = '#FFFFFF';
const BROWN = '#2C1309';
const BROWN_ACCENT = '#B0431E';
const BROWN_MUTED = '#8B6F5C';
const BORDER = 'rgba(232,213,196,0.86)';

interface DuaItem {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Sun;
  arabic: string;
  transliteration: string;
  translation: string;
  source: string;
}

const duas: DuaItem[] = [
  {
    id: 'waking-up',
    title: 'Waking Up',
    subtitle: 'Gratitude for a new day',
    icon: Sun,
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
    transliteration: 'Alhamdulillahilladhi ahyana ba\'da ma amatana wa ilayhin-nushur',
    translation: 'All praise is due to Allah, who gave us life after He caused us to die, and to Him is the resurrection.',
    source: 'Sahih al-Bukhari',
  },
  {
    id: 'before-sleeping',
    title: 'Before Sleeping',
    subtitle: 'Seeking protection through the night',
    icon: Moon,
    arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    transliteration: 'Bismika Allahumma amutu wa ahya',
    translation: 'In Your name, O Allah, I die and I live.',
    source: 'Sahih al-Bukhari',
  },
  {
    id: 'morning-evening-protection',
    title: 'Morning & Evening Protection',
    subtitle: 'Allah is enough for every concern',
    icon: Sunrise,
    arabic: 'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ، وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
    transliteration: 'Hasbiyallahu la ilaha illa huwa, \'alayhi tawakkaltu, wa huwa rabbul-\'arshil-\'azim',
    translation: 'Allah is sufficient for me. There is no god but Him. Upon Him I rely, and He is the Lord of the mighty Throne.',
    source: 'Quran 9:129; Abu Dawud',
  },
  {
    id: 'sayyidul-istighfar',
    title: 'Sayyidul Istighfar',
    subtitle: 'The best way to seek forgiveness',
    icon: Heart,
    arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَكَ بِذَنْبِي، فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    transliteration: 'Allahumma anta rabbi la ilaha illa anta, khalaqtani wa ana \'abduka, wa ana \'ala \'ahdika wa wa\'dika mastata\'tu, a\'udhu bika min sharri ma sana\'tu, abu\'u laka bini\'matika \'alayya, wa abu\'u laka bidhanbi, faghfir li fa innahu la yaghfirudh-dhunuba illa anta',
    translation: 'O Allah, You are my Lord; there is no god but You. You created me and I am Your servant. I keep Your covenant as much as I can. I seek refuge in You from the evil I have done. I admit Your favors upon me and I admit my sins, so forgive me, for none forgives sins except You.',
    source: 'Sahih al-Bukhari',
  },
  {
    id: 'leaving-home',
    title: 'Leaving Home',
    subtitle: 'Trusting Allah outside',
    icon: Home,
    arabic: 'بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    transliteration: 'Bismillah, tawakkaltu \'alallah, wa la hawla wa la quwwata illa billah',
    translation: 'In the name of Allah, I place my trust in Allah, and there is no might or power except with Allah.',
    source: 'Abu Dawud, At-Tirmidhi',
  },
  {
    id: 'entering-home',
    title: 'Entering Home',
    subtitle: 'Peace for the household',
    icon: Home,
    arabic: 'بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى رَبِّنَا تَوَكَّلْنَا',
    transliteration: 'Bismillahi walajna, wa bismillahi kharajna, wa \'ala rabbina tawakkalna',
    translation: 'In the name of Allah we enter, in the name of Allah we leave, and upon our Lord we rely.',
    source: 'Abu Dawud',
  },
  {
    id: 'before-eating',
    title: 'Before Eating',
    subtitle: 'Seeking blessing in rizq',
    icon: UtensilsCrossed,
    arabic: 'بِسْمِ اللَّهِ',
    transliteration: 'Bismillah',
    translation: 'In the name of Allah.',
    source: 'Abu Dawud',
  },
  {
    id: 'after-eating',
    title: 'After Eating',
    subtitle: 'Thankfulness after meals',
    icon: UtensilsCrossed,
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ',
    transliteration: 'Alhamdulillahilladhi at\'amani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah',
    translation: 'All praise is for Allah who fed me this and provided it for me without any power or strength from me.',
    source: 'Abu Dawud, At-Tirmidhi',
  },
  {
    id: 'traveling',
    title: 'When Traveling',
    subtitle: 'Safety and gratitude for transport',
    icon: MapPin,
    arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ، وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ',
    transliteration: 'Subhanalladhi sakhkhara lana hadha wa ma kunna lahu muqrinin, wa inna ila rabbina lamunqalibun',
    translation: 'Glory be to Him who subjected this to us, for we could not have done it ourselves. Surely to our Lord we will return.',
    source: 'Quran 43:13-14',
  },
  {
    id: 'after-prayer',
    title: 'After Prayer',
    subtitle: 'Seeking forgiveness and peace',
    icon: Sparkles,
    arabic: 'أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ\nاللَّهُمَّ أَنْتَ السَّلَامُ، وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
    transliteration: 'Astaghfirullah, astaghfirullah, astaghfirullah\nAllahumma antas-salam, wa minkas-salam, tabarakta ya dhal-jalali wal-ikram',
    translation: 'I seek forgiveness from Allah three times. O Allah, You are Peace, and from You comes peace. Blessed are You, O Owner of majesty and honour.',
    source: 'Sahih Muslim',
  },
  {
    id: 'after-adhan',
    title: 'After Adhan',
    subtitle: 'Ask for the Prophet\'s honoured station',
    icon: Sparkles,
    arabic: 'اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ',
    transliteration: 'Allahumma rabba hadhihid-da\'watit-tammah, was-salatil-qa\'imah, ati Muhammadanil-wasilata wal-fadilah, wab\'athhu maqamam-mahmudanilladhi wa\'adtah',
    translation: 'O Allah, Lord of this perfect call and established prayer, grant Muhammad the intercession and virtue, and raise him to the praised station You promised him.',
    source: 'Sahih al-Bukhari',
  },
  {
    id: 'entering-mosque',
    title: 'Entering the Mosque',
    subtitle: 'Seeking mercy when entering',
    icon: BookOpen,
    arabic: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
    transliteration: 'Allahumma iftah li abwaba rahmatik',
    translation: 'O Allah, open for me the doors of Your mercy.',
    source: 'Sahih Muslim',
  },
  {
    id: 'leaving-mosque',
    title: 'Leaving the Mosque',
    subtitle: 'Seeking Allah\'s bounty',
    icon: BookOpen,
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ',
    transliteration: 'Allahumma inni as\'aluka min fadlik',
    translation: 'O Allah, I ask You from Your bounty.',
    source: 'Sahih Muslim',
  },
  {
    id: 'beneficial-knowledge',
    title: 'Beneficial Knowledge',
    subtitle: 'Knowledge, provision and accepted deeds',
    icon: BookOpen,
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا',
    transliteration: 'Allahumma inni as\'aluka \'ilman nafi\'an, wa rizqan tayyiban, wa \'amalan mutaqabbalan',
    translation: 'O Allah, I ask You for beneficial knowledge, wholesome provision, and deeds that are accepted.',
    source: 'Ibn Majah',
  },
  {
    id: 'anxiety-sorrow',
    title: 'Anxiety and Sorrow',
    subtitle: 'Relief for a heavy heart',
    icon: Heart,
    arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ',
    transliteration: 'Allahumma inni a\'udhu bika minal-hammi wal-hazan, wal-\'ajzi wal-kasal, wal-bukhli wal-jubn, wa dala\'id-dayni wa ghalabatir-rijal',
    translation: 'O Allah, I seek refuge in You from worry and grief, weakness and laziness, miserliness and cowardice, the burden of debt, and being overpowered by people.',
    source: 'Sahih al-Bukhari',
  },
  {
    id: 'distress',
    title: 'When in Distress',
    subtitle: 'Remembering Allah\'s greatness',
    icon: Heart,
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ',
    transliteration: 'La ilaha illallahul-\'azimul-halim, la ilaha illallahu rabbul-\'arshil-\'azim, la ilaha illallahu rabbus-samawati wa rabbul-ardi wa rabbul-\'arshil-karim',
    translation: 'There is no god but Allah, the Magnificent, the Forbearing. There is no god but Allah, Lord of the mighty Throne. There is no god but Allah, Lord of the heavens, Lord of the earth, and Lord of the noble Throne.',
    source: 'Sahih al-Bukhari, Sahih Muslim',
  },
  {
    id: 'anger',
    title: 'When Angry',
    subtitle: 'Seeking refuge from Shaytan',
    icon: Heart,
    arabic: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ',
    transliteration: 'A\'udhu billahi minash-shaytanir-rajim',
    translation: 'I seek refuge in Allah from the rejected Shaytan.',
    source: 'Sahih al-Bukhari, Sahih Muslim',
  },
  {
    id: 'parents',
    title: 'For Parents',
    subtitle: 'Mercy for those who raised us',
    icon: Heart,
    arabic: 'رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
    transliteration: 'Rabbirhamhuma kama rabbayani saghira',
    translation: 'My Lord, have mercy on them as they raised me when I was young.',
    source: 'Quran 17:24',
  },
  {
    id: 'guidance',
    title: 'Guidance and Steadiness',
    subtitle: 'A Qur\'anic dua for the heart',
    icon: Sparkles,
    arabic: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً، إِنَّكَ أَنْتَ الْوَهَّابُ',
    transliteration: 'Rabbana la tuzigh qulubana ba\'da idh hadaytana wa hab lana min ladunka rahmah, innaka antal-wahhab',
    translation: 'Our Lord, do not let our hearts deviate after You have guided us, and grant us mercy from Yourself. You are the Bestower.',
    source: 'Quran 3:8',
  },
  {
    id: 'hardship',
    title: 'Dua for Hardship',
    subtitle: 'Recite when facing difficulty',
    icon: Heart,
    arabic: 'اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا، وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلًا',
    transliteration: 'Allahumma la sahla illa ma ja\'altahu sahla, wa anta taj\'alul-hazna idha shi\'ta sahla',
    translation: 'O Allah, nothing is easy except what You make easy, and You can make difficulty easy when You will.',
    source: 'Ibn Hibban',
  },
  {
    id: 'calamity',
    title: 'When Calamity Strikes',
    subtitle: 'Patience and hope for better',
    icon: Heart,
    arabic: 'إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ، اللَّهُمَّ أْجُرْنِي فِي مُصِيبَتِي وَأَخْلِفْ لِي خَيْرًا مِنْهَا',
    transliteration: 'Inna lillahi wa inna ilayhi raji\'un, Allahumma\'jurni fi musibati wa akhlif li khayran minha',
    translation: 'We belong to Allah and to Him we return. O Allah, reward me in my hardship and replace it for me with something better.',
    source: 'Sahih Muslim',
  },
  {
    id: 'visiting-sick',
    title: 'Visiting the Sick',
    subtitle: 'A dua for healing',
    icon: Heart,
    arabic: 'لَا بَأْسَ، طَهُورٌ إِنْ شَاءَ اللَّهُ',
    transliteration: 'La ba\'sa, tahurun in sha Allah',
    translation: 'No harm; may it be a purification, if Allah wills.',
    source: 'Sahih al-Bukhari',
  },
  {
    id: 'rain',
    title: 'When It Rains',
    subtitle: 'Asking for beneficial rain',
    icon: Sunrise,
    arabic: 'اللَّهُمَّ صَيِّبًا نَافِعًا',
    transliteration: 'Allahumma sayyiban nafi\'a',
    translation: 'O Allah, make it beneficial rain.',
    source: 'Sahih al-Bukhari',
  },
  {
    id: 'gathering',
    title: 'End of a Gathering',
    subtitle: 'Kaffaratul majlis',
    icon: Sparkles,
    arabic: 'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ، أَسْتَغْفِرُكَ وَأَتُوبُ إِلَيْكَ',
    transliteration: 'Subhanaka Allahumma wa bihamdik, ash-hadu an la ilaha illa anta, astaghfiruka wa atubu ilayk',
    translation: 'Glory is Yours, O Allah, and all praise is Yours. I testify that there is no god but You. I seek Your forgiveness and repent to You.',
    source: 'Abu Dawud, At-Tirmidhi',
  },
  {
    id: 'for-favor',
    title: 'For Someone Who Helped You',
    subtitle: 'A beautiful way to show gratitude',
    icon: Heart,
    arabic: 'جَزَاكَ اللَّهُ خَيْرًا',
    transliteration: 'Jazakallahu khayra',
    translation: 'May Allah reward you with goodness.',
    source: 'At-Tirmidhi',
  },
];

export const Mood = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDua, setSelectedDua] = useState<DuaItem | null>(null);

  const filteredDuas = useMemo(() => {
    if (!searchQuery.trim()) return duas;
    const q = searchQuery.toLowerCase();
    return duas.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.subtitle.toLowerCase().includes(q) ||
        d.transliteration.toLowerCase().includes(q) ||
        d.translation.toLowerCase().includes(q) ||
        d.source.toLowerCase().includes(q) ||
        d.arabic.includes(q)
    );
  }, [searchQuery]);

  return (
    <div
      className="min-h-screen max-w-md mx-auto relative overflow-hidden font-arabic"
      style={{ background: CREAM }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 pt-4 pb-3"
        style={{ background: CREAM }}
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
          style={{
            color: BROWN,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          Duas
        </h1>
      </div>

      {/* Search */}
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

      {/* Dua List */}
      <div className="px-5 pb-28 space-y-2.5">
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
                <p
                  className="text-[15px] font-semibold truncate"
                  style={{ color: BROWN }}
                >
                  {dua.title}
                </p>
                <p
                  className="text-[13px] truncate"
                  style={{ color: BROWN_MUTED }}
                >
                  {dua.subtitle}
                </p>
              </div>
              <ChevronRight
                className="h-5 w-5 flex-shrink-0"
                style={{ color: BROWN_ACCENT }}
                strokeWidth={2}
              />
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

      {/* Detail Modal */}
      {selectedDua && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelectedDua(null)}
          />

          {/* Card */}
          <div
            className="relative w-full max-w-md rounded-t-[32px] px-6 pt-6 pb-10 max-h-[90vh] overflow-y-auto"
            style={{ background: CREAM_CARD }}
          >
            {/* Close */}
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

            {/* Title */}
            <h2
              className="text-[22px] font-bold"
              style={{
                color: BROWN,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {selectedDua.title}
            </h2>
            <p className="text-[14px] mt-1" style={{ color: BROWN_MUTED }}>
              {selectedDua.subtitle}
            </p>

            {/* Divider */}
            <div
              className="my-5 h-px"
              style={{ background: BORDER }}
            />

            {/* Arabic */}
            <p
              className="text-[24px] leading-[1.8] text-center font-arabic"
              style={{ color: BROWN }}
              dir="rtl"
            >
              {selectedDua.arabic}
            </p>

            {/* Transliteration */}
            <p
              className="text-[14px] italic text-center mt-4 leading-relaxed"
              style={{ color: BROWN_MUTED }}
            >
              &ldquo;{selectedDua.transliteration}&rdquo;
            </p>

            {/* Divider */}
            <div
              className="my-5 h-px"
              style={{ background: BORDER }}
            />

            {/* English */}
            <p
              className="text-[14px] font-semibold mb-3"
              style={{ color: BROWN }}
            >
              English
            </p>
            <p
              className="text-[16px] leading-relaxed"
              style={{ color: BROWN }}
            >
              {selectedDua.translation}
            </p>

            {/* Source */}
            <div className="flex items-center gap-2 mt-6">
              <BookOpen className="h-4 w-4" style={{ color: BROWN_ACCENT }} strokeWidth={2} />
              <p className="text-[13px]" style={{ color: BROWN_MUTED }}>
                Source: {selectedDua.source}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
