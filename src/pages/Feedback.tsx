import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const Feedback = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [overall, setOverall] = useState(0);
  const [ease, setEase] = useState(0);
  const [mostUsed, setMostUsed] = useState('');
  const [missing, setMissing] = useState('');
  const [bugs, setBugs] = useState('');
  const [recommend, setRecommend] = useState('');
  const [comments, setComments] = useState('');
  const [mainUse, setMainUse] = useState('');
  const [oneImprovement, setOneImprovement] = useState('');
  const [firstOpenConfusion, setFirstOpenConfusion] = useState('');
  const [notificationsTiming, setNotificationsTiming] = useState('');
  const [stateCountry, setStateCountry] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overall) {
      toast({ title: 'Please rate your overall experience', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    // Field order here is the source of truth for the Google Sheet columns.
    const payload: Record<string, string | number | null> = {
      submitted_at: new Date().toISOString(),
      user_id: user?.uid ?? null,
      user_email: user?.email ?? null,
      overall_rating: overall,
      ease_of_use: ease || null,
      most_used_feature: mostUsed || null,
      main_use: mainUse || null,
      one_improvement: oneImprovement || null,
      first_open_confusion: firstOpenConfusion || null,
      notifications_timing: notificationsTiming || null,
      state_country: stateCountry || null,
      missing_features: missing || null,
      bugs_encountered: bugs || null,
      would_recommend: recommend || null,
      additional_comments: comments || null,
    };
    // Supabase insert excludes submitted_at (no such column there).
    const { submitted_at: _ts, ...dbPayload } = payload;
    const { error } = await supabase.from('app_feedback').insert(dbPayload);

    // Mirror to Google Sheets via Apps Script webhook (fire-and-forget, no-cors).
    try {
      await fetch(
        'https://script.google.com/macros/s/AKfycbzMLlcY62HxdFf6brSiY5V3753L38OhB3kHitcfZVAM3bkz4qrXUXOjPXp4Kt_RYMFh/exec',
        {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
        }
      );
    } catch (e) {
      console.warn('Sheets webhook failed', e);
    }
    setSubmitting(false);
    if (error) {
      toast({ title: 'Could not submit feedback', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Thank you for your feedback!', description: 'Your input helps us improve Barakah.' });
    navigate('/');
  };

  const StarRow = ({ value, onChange }: { value: number; onChange: (n: number) => void }) => (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="transition-transform active:scale-90"
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <Star
            className="h-8 w-8"
            fill={n <= value ? '#CE5728' : 'transparent'}
            color={n <= value ? '#CE5728' : '#A98A78'}
            strokeWidth={1.75}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen max-w-md mx-auto pb-24" style={{ background: '#FFF5E5' }}>
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b" style={{ background: '#FFF5E5', borderColor: '#E8D5C4' }}>
        <button onClick={() => navigate(-1)} className="p-1 -ml-1" aria-label="Back">
          <ChevronLeft className="h-6 w-6" style={{ color: '#2C1309' }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: '#2C1309' }}>Your Feedback</h1>
      </header>

      <form onSubmit={handleSubmit} className="px-5 py-5 space-y-6">
        <p className="text-sm" style={{ color: '#5F5A4F' }}>
          Help us make Barakah better. Your responses are anonymous and used only to improve the app.
        </p>

        <div className="space-y-2">
          <Label className="text-[15px] font-semibold" style={{ color: '#2C1309' }}>
            Overall, how would you rate Barakah? <span className="text-red-500">*</span>
          </Label>
          <StarRow value={overall} onChange={setOverall} />
        </div>

        <div className="space-y-2">
          <Label className="text-[15px] font-semibold" style={{ color: '#2C1309' }}>
            How easy is the app to use?
          </Label>
          <StarRow value={ease} onChange={setEase} />
        </div>

        <div className="space-y-2">
          <Label className="text-[15px] font-semibold" style={{ color: '#2C1309' }}>
            Which feature do you use the most?
          </Label>
          <Input
            value={mostUsed}
            onChange={(e) => setMostUsed(e.target.value)}
            placeholder="e.g. Prayer Times, Quran, Qibla…"
            className="bg-white border-[#E8D5C4]"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[15px] font-semibold" style={{ color: '#2C1309' }}>
            What do you mainly use Barakah for?
          </Label>
          <Input
            value={mainUse}
            onChange={(e) => setMainUse(e.target.value)}
            placeholder="Short answer…"
            className="bg-white border-[#E8D5C4]"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[15px] font-semibold" style={{ color: '#2C1309' }}>
            What is the one thing you would improve about Barakah?
          </Label>
          <Textarea
            value={oneImprovement}
            onChange={(e) => setOneImprovement(e.target.value)}
            placeholder="Share your thoughts…"
            rows={4}
            className="bg-white border-[#E8D5C4]"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[15px] font-semibold" style={{ color: '#2C1309' }}>
            Was anything confusing when you first opened the app?
          </Label>
          <Textarea
            value={firstOpenConfusion}
            onChange={(e) => setFirstOpenConfusion(e.target.value)}
            placeholder="Tell us what felt unclear…"
            rows={4}
            className="bg-white border-[#E8D5C4]"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[15px] font-semibold" style={{ color: '#2C1309' }}>
            Are notifications arriving at the correct time?
          </Label>
          <RadioGroup value={notificationsTiming} onValueChange={setNotificationsTiming} className="flex flex-col gap-2">
            {['Yes', 'Sometimes late', 'Incorrect', 'Not tested'].map((opt) => (
              <div key={opt} className="flex items-center gap-2">
                <RadioGroupItem value={opt} id={`notif-${opt}`} />
                <Label htmlFor={`notif-${opt}`} className="text-sm" style={{ color: '#2C1309' }}>{opt}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label className="text-[15px] font-semibold" style={{ color: '#2C1309' }}>
            Which state and country are you from?
          </Label>
          <Input
            value={stateCountry}
            onChange={(e) => setStateCountry(e.target.value)}
            placeholder="e.g. Maharashtra, India"
            className="bg-white border-[#E8D5C4]"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[15px] font-semibold" style={{ color: '#2C1309' }}>
            What features would you like us to add?
          </Label>
          <Textarea
            value={missing}
            onChange={(e) => setMissing(e.target.value)}
            placeholder="Tell us what's missing…"
            rows={3}
            className="bg-white border-[#E8D5C4]"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[15px] font-semibold" style={{ color: '#2C1309' }}>
            Have you encountered any bugs or issues?
          </Label>
          <Textarea
            value={bugs}
            onChange={(e) => setBugs(e.target.value)}
            placeholder="Describe what happened…"
            rows={3}
            className="bg-white border-[#E8D5C4]"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[15px] font-semibold" style={{ color: '#2C1309' }}>
            Would you recommend Barakah to friends or family?
          </Label>
          <RadioGroup value={recommend} onValueChange={setRecommend} className="flex gap-4">
            {['Yes', 'Maybe', 'No'].map((opt) => (
              <div key={opt} className="flex items-center gap-2">
                <RadioGroupItem value={opt} id={`rec-${opt}`} />
                <Label htmlFor={`rec-${opt}`} className="text-sm" style={{ color: '#2C1309' }}>{opt}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label className="text-[15px] font-semibold" style={{ color: '#2C1309' }}>
            Anything else you'd like to share?
          </Label>
          <Textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Your thoughts…"
            rows={3}
            className="bg-white border-[#E8D5C4]"
          />
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full h-12 rounded-full text-white font-semibold"
          style={{ background: 'linear-gradient(135deg, #78351A, #CE5728)' }}
        >
          {submitting ? 'Submitting…' : 'Submit Feedback'}
        </Button>
      </form>
    </div>
  );
};

export default Feedback;