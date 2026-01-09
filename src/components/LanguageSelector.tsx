import { useLanguage, Language } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const languages: { code: Language; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ur', label: 'Urdu', nativeLabel: 'اردو' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
];

export const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();

  const currentLang = languages.find((l) => l.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl bg-foreground/95 border-primary/25 text-primary hover:bg-foreground hover:text-primary"
        >
          <Globe className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">{currentLang?.nativeLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="center" 
        className="w-48 rounded-xl border border-border bg-popover text-primary shadow-lg"
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex items-center justify-between px-4 py-3 cursor-pointer rounded-lg text-primary focus:bg-primary/10 focus:text-primary hover:bg-primary/5 hover:text-primary ${
              language === lang.code ? 'bg-primary/15 font-semibold' : ''
            }`}
          >
            <span className="font-medium">{lang.nativeLabel}</span>
            <span className="text-xs opacity-70">{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
