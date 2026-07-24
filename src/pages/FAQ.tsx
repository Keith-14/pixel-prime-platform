import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';

const CREAM_BG = '#FFF5E5';
const CREAM_SOFT = '#FFF2DF';
const CARD_BG = '#FFFFFF';
const HEADER_TEXT = '#2C1309';
const BROWN = '#A35233';
const BROWN_DARK = '#5C2A14';
const MUTED_TEXT = '#8B6E4A';
const SOFT_BORDER = '#E8D2A8';

const faqs = [
  {
    id: 1,
    question: "What is Barakah?",
    answer: "Barakah is a comprehensive Islamic app that helps Muslims practice their faith with features like prayer times, Quran reading, Islamic shopping, and community features."
  },
  {
    id: 2,
    question: "Is Barakah free to use?",
    answer: "Yes, Barakah offers many free features including prayer times, basic Quran reading, and community features. Premium features are available with subscription."
  },
  {
    id: 3,
    question: "What is Barakah?",
    answer: "Barakah means blessing in Arabic and represents the divine grace that brings growth, prosperity, and increase in all aspects of life."
  },
  {
    id: 4,
    question: "How accurate are the prayer times?",
    answer: "Our prayer times are calculated using precise astronomical calculations based on your location and follow standard Islamic prayer time calculations."
  },
  {
    id: 5,
    question: "What can I buy from the Barakah store?",
    answer: "The Barakah store offers Islamic items including prayer beads (tasbih), Islamic books, prayer mats, Islamic clothing, and other faith-based products."
  },
];

export const FAQ = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (id: number) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <Layout pageBackgroundColor={CREAM_BG}>
      <div className="min-h-screen px-4 py-6 space-y-6" style={{ backgroundColor: CREAM_BG }}>
        <div>
          <p className="text-xs font-bold tracking-wide uppercase" style={{ color: BROWN }}>
            Help and Support
          </p>
          <h1 className="text-2xl font-bold mt-1" style={{ color: HEADER_TEXT }}>
            FAQ's
          </h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4"
            style={{ color: MUTED_TEXT }}
          />
          <Input 
            placeholder="Search" 
            className="h-12 pl-11 rounded-full shadow-none focus-visible:ring-1 focus-visible:ring-[#A35233]/30 focus-visible:ring-offset-0"
            style={{
              backgroundColor: CARD_BG,
              borderColor: SOFT_BORDER,
              color: HEADER_TEXT,
            }}
          />
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqs.map((faq) => (
            <Card
              key={faq.id}
              className="rounded-2xl overflow-hidden shadow-none"
              style={{
                backgroundColor: CARD_BG,
                borderColor: SOFT_BORDER,
                boxShadow: '0 2px 8px rgba(92, 42, 20, 0.05)',
              }}
            >
              <Collapsible 
                open={openItems.includes(faq.id)}
                onOpenChange={() => toggleItem(faq.id)}
              >
                <CollapsibleTrigger className="w-full p-4 text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold" style={{ color: BROWN_DARK }}>
                      {faq.id}. {faq.question}
                    </span>
                    <Plus 
                      className={`h-5 w-5 transition-transform ${
                        openItems.includes(faq.id) ? 'rotate-45' : ''
                      }`} 
                      style={{ color: BROWN }}
                    />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4">
                  <div className="h-px mb-3" style={{ backgroundColor: CREAM_SOFT }} />
                  <p className="text-sm leading-relaxed" style={{ color: MUTED_TEXT }}>
                    {faq.answer}
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};
