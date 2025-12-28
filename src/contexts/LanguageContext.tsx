import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'ur' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  direction: 'ltr' | 'rtl';
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Login page
    'login.create_account': 'Create an account',
    'login.enter_email': 'Enter your email to signup for this app',
    'login.email_placeholder': 'yourname@email.com',
    'login.continue': 'Continue',
    'login.or': 'or',
    'login.google': 'Continue with Google',
    'login.apple': 'Continue with Apple',
    'login.terms': 'By clicking continue, you agree to our',
    'login.terms_of_service': 'Terms of Service',
    'login.and': 'and',
    'login.privacy_policy': 'Privacy Policy',
    'login.tagline': 'FAITH. LIFESTYLE. COMMUNITY.',
    
    // Home page
    'home.greeting': 'As-Salaam-Alaikum',
    'home.title': 'Barakah Home',
    'home.getting_location': 'Getting location...',
    'home.tap_retry': 'Tap to retry',
    
    // Quick actions
    'action.qibla': 'Qibla',
    'action.quran': 'Quran',
    'action.track': 'Track',
    'action.mood': 'Mood',
    'action.prayer': 'Prayer',
    'action.zakat': 'Zakat',
    'action.store': 'Store',
    'action.progress': 'Progress',
    
    // Menu
    'menu.home': 'Home',
    'menu.prayer_times': 'Prayer Times',
    'menu.qibla': 'Qibla',
    'menu.quran': 'Quran',
    'menu.makkah_live': 'Makkah Live',
    'menu.zakat': 'Zakat Calculator',
    'menu.shop': 'Shop',
    'menu.progress': 'Progress',
    'menu.account': 'Account',
    'menu.sign_out': 'Sign Out',
    
    // Language selector
    'language.select': 'Select Language',
    'language.english': 'English',
    'language.urdu': 'Urdu',
    'language.arabic': 'Arabic',
  },
  ur: {
    // Login page
    'login.create_account': 'اکاؤنٹ بنائیں',
    'login.enter_email': 'اس ایپ کے لیے اپنا ای میل درج کریں',
    'login.email_placeholder': 'آپ کا نام@ای میل.کوم',
    'login.continue': 'جاری رکھیں',
    'login.or': 'یا',
    'login.google': 'گوگل کے ساتھ جاری رکھیں',
    'login.apple': 'ایپل کے ساتھ جاری رکھیں',
    'login.terms': 'جاری رکھیں پر کلک کرکے، آپ ہماری',
    'login.terms_of_service': 'سروس کی شرائط',
    'login.and': 'اور',
    'login.privacy_policy': 'رازداری کی پالیسی',
    'login.tagline': 'ایمان. طرز زندگی. کمیونٹی.',
    
    // Home page
    'home.greeting': 'السلام علیکم',
    'home.title': 'برکت ہوم',
    'home.getting_location': 'مقام حاصل کیا جا رہا ہے...',
    'home.tap_retry': 'دوبارہ کوشش کریں',
    
    // Quick actions
    'action.qibla': 'قبلہ',
    'action.quran': 'قرآن',
    'action.track': 'ٹریک',
    'action.mood': 'موڈ',
    'action.prayer': 'نماز',
    'action.zakat': 'زکوٰۃ',
    'action.store': 'سٹور',
    'action.progress': 'پیش رفت',
    
    // Menu
    'menu.home': 'ہوم',
    'menu.prayer_times': 'نماز کے اوقات',
    'menu.qibla': 'قبلہ',
    'menu.quran': 'قرآن',
    'menu.makkah_live': 'مکہ لائیو',
    'menu.zakat': 'زکوٰۃ کیلکولیٹر',
    'menu.shop': 'دکان',
    'menu.progress': 'پیش رفت',
    'menu.account': 'اکاؤنٹ',
    'menu.sign_out': 'سائن آؤٹ',
    
    // Language selector
    'language.select': 'زبان منتخب کریں',
    'language.english': 'انگریزی',
    'language.urdu': 'اردو',
    'language.arabic': 'عربی',
  },
  ar: {
    // Login page
    'login.create_account': 'إنشاء حساب',
    'login.enter_email': 'أدخل بريدك الإلكتروني للتسجيل',
    'login.email_placeholder': 'اسمك@البريد.كوم',
    'login.continue': 'متابعة',
    'login.or': 'أو',
    'login.google': 'المتابعة مع جوجل',
    'login.apple': 'المتابعة مع أبل',
    'login.terms': 'بالنقر على متابعة، فإنك توافق على',
    'login.terms_of_service': 'شروط الخدمة',
    'login.and': 'و',
    'login.privacy_policy': 'سياسة الخصوصية',
    'login.tagline': 'الإيمان. أسلوب الحياة. المجتمع.',
    
    // Home page
    'home.greeting': 'السلام عليكم',
    'home.title': 'بركة الرئيسية',
    'home.getting_location': 'جارٍ تحديد الموقع...',
    'home.tap_retry': 'انقر لإعادة المحاولة',
    
    // Quick actions
    'action.qibla': 'القبلة',
    'action.quran': 'القرآن',
    'action.track': 'تتبع',
    'action.mood': 'المزاج',
    'action.prayer': 'الصلاة',
    'action.zakat': 'الزكاة',
    'action.store': 'المتجر',
    'action.progress': 'التقدم',
    
    // Menu
    'menu.home': 'الرئيسية',
    'menu.prayer_times': 'أوقات الصلاة',
    'menu.qibla': 'القبلة',
    'menu.quran': 'القرآن',
    'menu.makkah_live': 'مكة مباشر',
    'menu.zakat': 'حاسبة الزكاة',
    'menu.shop': 'المتجر',
    'menu.progress': 'التقدم',
    'menu.account': 'الحساب',
    'menu.sign_out': 'تسجيل الخروج',
    
    // Language selector
    'language.select': 'اختر اللغة',
    'language.english': 'الإنجليزية',
    'language.urdu': 'الأردية',
    'language.arabic': 'العربية',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('barakah-language');
    return (saved as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('barakah-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const direction = language === 'en' ? 'ltr' : 'rtl';

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [language, direction]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, direction }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
