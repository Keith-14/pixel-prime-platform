import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { ChevronLeft, Play, Pause, Volume2, Search } from 'lucide-react';

interface Surah {
  surahName: string;
  surahNameArabic: string;
  surahNameArabicLong: string;
  surahNameTranslation: string;
  revelationPlace: string;
  totalAyah: number;
}

interface SurahDetail extends Surah {
  surahNo: number;
  arabic: { [key: string]: string };
  english: { [key: string]: string };
  audio: {
    [key: string]: {
      reciter: string;
      url: string;
      originalUrl: string;
    };
  };
}

export const Quran = () => {
  const [showTranslation, setShowTranslation] = useState(true);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<SurahDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSurah, setLoadingSurah] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [playingVerse, setPlayingVerse] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all surahs on component mount
  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const response = await fetch('https://quranapi.pages.dev/api/surah.json');
        const data = await response.json();
        setSurahs(data);
      } catch (error) {
        console.error('Error fetching surahs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSurahs();
  }, []);

  // Fetch specific surah details
  const fetchSurahDetails = async (surahNo: number) => {
    setLoadingSurah(true);
    try {
      const response = await fetch(`https://quranapi.pages.dev/api/${surahNo}.json`);
      const data = await response.json();
      setSelectedSurah(data);
    } catch (error) {
      console.error('Error fetching surah details:', error);
    } finally {
      setLoadingSurah(false);
    }
  };

  // Play audio for a verse
  const playAudio = (verseNo: string, audioUrl: string) => {
    // Stop current audio if playing
    if (currentAudio) {
      currentAudio.pause();
      setPlayingVerse(null);
    }

    // If clicking the same verse that's playing, just stop
    if (playingVerse === verseNo) {
      setCurrentAudio(null);
      return;
    }

    // Play new audio
    const audio = new Audio(audioUrl);
    audio.play();
    setCurrentAudio(audio);
    setPlayingVerse(verseNo);

    // Handle audio end
    audio.onended = () => {
      setPlayingVerse(null);
      setCurrentAudio(null);
    };
  };

  // Filter surahs based on search query
  const filteredSurahs = surahs.filter(surah => 
    surah.surahName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    surah.surahNameTranslation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    surah.surahNameArabic.includes(searchQuery)
  );

  if (loading) {
    return (
      <Layout>
        <div className="px-4 py-6 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-sage text-primary-foreground px-6 py-3 rounded-2xl">
              QURAN
            </h1>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="p-4 rounded-2xl">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // Show surah details view
  if (selectedSurah) {
    return (
      <Layout>
        <div className="px-4 py-6 space-y-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSurah(null)}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <div className="text-center flex-1">
              <h1 className="text-2xl font-bold bg-sage text-primary-foreground px-4 py-2 rounded-2xl inline-block">
                {selectedSurah.surahNameTranslation}
              </h1>
            </div>
          </div>

          <Card className="p-4 rounded-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-sage text-primary-foreground rounded-full flex items-center justify-center">
                <span className="text-lg font-bold">{selectedSurah.surahNo}</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-sage">
                  {selectedSurah.surahName}: {selectedSurah.surahNameTranslation}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedSurah.totalAyah} verses • {selectedSurah.revelationPlace}
                </p>
              </div>
            </div>

            {/* Translation Toggle */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Translation</span>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={showTranslation} 
                  onCheckedChange={setShowTranslation}
                />
                <span className="text-xs text-muted-foreground">
                  {showTranslation ? 'SHOW' : 'HIDE'}
                </span>
              </div>
            </div>

            {/* Verses */}
            {loadingSurah ? (
              <div className="space-y-4">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="text-center border-b border-sage-light pb-4">
                    <Skeleton className="w-8 h-8 rounded-full mx-auto mb-2" />
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mx-auto" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {Object.keys(selectedSurah.arabic).map((verseNo) => (
                  <div key={verseNo} className="text-center border-b border-sage-light pb-4">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <div className="w-8 h-8 bg-sage text-primary-foreground rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold">{verseNo}</span>
                      </div>
                      {selectedSurah.audio && selectedSurah.audio['1'] && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => playAudio(verseNo, selectedSurah.audio['1'].originalUrl)}
                          className="p-1 h-8 w-8"
                        >
                          {playingVerse === verseNo ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                    <p className="text-lg font-arabic mb-2" dir="rtl">
                      {selectedSurah.arabic[verseNo]}
                    </p>
                    {showTranslation && (
                      <p className="text-sm text-muted-foreground italic">
                        {selectedSurah.english[verseNo]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </Layout>
    );
  }

  // Show surahs list view
  return (
    <Layout>
      <div className="px-4 py-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-sage text-primary-foreground px-6 py-3 rounded-2xl">
            QURAN
          </h1>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search chapters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-2xl"
          />
        </div>

        <div className="space-y-3">
          {filteredSurahs.map((surah, index) => {
            // Find original index for surah number
            const originalIndex = surahs.findIndex(s => s.surahName === surah.surahName);
            return (
              <Card 
                key={originalIndex}
                className="p-4 rounded-2xl cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fetchSurahDetails(originalIndex + 1)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-sage text-primary-foreground rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">{originalIndex + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sage">
                      {surah.surahName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {surah.surahNameTranslation}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-arabic mb-1" dir="rtl">
                      {surah.surahNameArabic}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {surah.totalAyah} verses
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};