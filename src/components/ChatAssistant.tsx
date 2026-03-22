import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Mic, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import chatAvatar from '@/assets/chat-avatar.png';
import ReactMarkdown from 'react-markdown';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    onError(data.error || 'Failed to connect');
    return;
  }

  if (!resp.body) { onError('No response'); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (json === '[DONE]') { onDone(); return; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + '\n' + buffer;
        break;
      }
    }
  }
  onDone();
}

interface ChatAssistantProps {
  open: boolean;
  onClose: () => void;
}

export const ChatAssistant = ({ open, onClose }: ChatAssistantProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const userName = user?.displayName?.split(' ')[0] || '';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');

    const userMsg: Msg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    let assistantSoFar = '';
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: newMessages,
        onDelta: upsert,
        onDone: () => setIsLoading(false),
        onError: (err) => {
          setMessages(prev => [...prev, { role: 'assistant', content: err }]);
          setIsLoading(false);
        },
      });
    } catch {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col font-arabic" style={{ background: 'linear-gradient(180deg, hsl(145 30% 18%) 0%, hsl(0 0% 4%) 35%)' }}>
      {/* Header */}
      <div className="relative px-5 pt-6 pb-4 text-center">
        <button
          onClick={onClose}
          className="absolute right-4 top-6 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h1 className="text-2xl font-bold text-[#ffebc9] font-heading">
          As-Salaam-Alaikum{userName ? `, ${userName}` : ''}!
        </h1>
        <p className="text-sm text-muted-foreground mt-1">How can I assist you today?</p>

        {/* Avatar */}
        <div className="mt-4 flex justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 border-2 border-primary/30 flex items-center justify-center overflow-hidden shadow-[0_0_30px_-5px_hsl(145_70%_45%/0.4)]">
            <img src={chatAvatar} alt="Assistant" className="w-20 h-20 object-contain" />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-card/80 text-foreground rounded-br-md'
                : 'bg-[#ffebc9]/10 text-[#ffebc9] border border-[#ffebc9]/20 rounded-bl-md'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm prose-invert max-w-none [&_p]:m-0">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : msg.content}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex justify-start">
            <div className="bg-[#ffebc9]/10 border border-[#ffebc9]/20 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 pb-24 pt-2">
        <div className="flex items-center gap-2 bg-card/60 border border-primary/20 rounded-2xl px-4 py-2 backdrop-blur-sm">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Write Something Here"
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
          />
          <button
            onClick={send}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-40"
          >
            {input.trim() ? <Send className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
