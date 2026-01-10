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
    // Login/Register page
    'login.create_account': 'Create an account',
    'login.enter_email': 'Enter your email to signup for this app',
    'login.email_placeholder': 'yourname@email.com',
    'login.continue': 'Continue',
    'login.or': 'or',
    'login.google': 'Continue with Google',
    'login.apple': 'Continue with Apple',
    'login.terms': 'By continuing, you agree to our',
    'login.terms_of_service': 'Terms of Service',
    'login.and': 'and',
    'login.privacy_policy': 'Privacy Policy',
    'login.tagline': 'FAITH. LIFESTYLE. COMMUNITY.',
    'login.choose_profile': 'Choose Your Profile',
    'login.select_account_type': 'Select the type of account you want to create',
    'login.normal_user': 'Normal User',
    'login.normal_user_desc': 'Browse and purchase products & tours',
    'login.seller': 'Seller',
    'login.seller_desc': 'List and sell your products',
    'login.travel_partner': 'Travel Partner',
    'login.travel_partner_desc': 'Offer tour packages to users',
    'login.already_have_account': 'Already have an account?',
    'login.sign_in': 'Sign In',
    'login.sign_up': 'Sign Up',
    'login.welcome_back': 'Welcome Back',
    'login.enter_credentials': 'Enter your credentials to sign in',
    'login.create_your_account': 'Create Your Account',
    'login.sign_up_as': 'Sign up as',
    'login.full_name': 'Full Name',
    'login.password': 'Password',
    'login.create_account_btn': 'Create Account',
    'login.back': 'Back',
    'login.dont_have_account': "Don't have an account?",
    'login.please_wait': 'Please wait...',
    
    // Home page
    'home.greeting': 'As-Salaam-Alaikum',
    'home.title': 'Barakah Home',
    'home.getting_location': 'Getting location...',
    'home.tap_retry': 'Tap to retry',
    'home.current_time': 'Current Time',
    'home.next_prayer': 'Next Prayer',
    'home.next_prayer_at': 'Next prayer at',
    
    // Prayer names
    'prayer.fajr': 'Fajr',
    'prayer.dhuhr': 'Dhuhr',
    'prayer.asr': 'Asr',
    'prayer.maghrib': 'Maghrib',
    'prayer.isha': 'Isha',
    'prayer.upcoming': 'Upcoming',
    'prayer.time': 'Time',
    'prayer.next': 'Next',
    
    // Quick actions
    'action.qibla': 'Qibla',
    'action.quran': 'Quran',
    'action.track': 'Track',
    'action.makkah_live': 'Makkah Live',
    'action.prayer': 'Prayer',
    'action.zakat': 'Zakat',
    'action.store': 'Store',
    'action.travel': 'Travel',
    
    // Bottom Navigation
    'nav.home': 'Home',
    'nav.store': 'Store',
    'nav.guftagu': 'Ummah',
    'nav.places': 'Places',
    'nav.account': 'Account',
    
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
    'languageSelector.title': 'Language',
  },
  ur: {
    // Login/Register page
    'login.create_account': 'اکاؤنٹ بنائیں',
    'login.enter_email': 'اس ایپ کے لیے اپنا ای میل درج کریں',
    'login.email_placeholder': 'آپ کا نام@ای میل.کوم',
    'login.continue': 'جاری رکھیں',
    'login.or': 'یا',
    'login.google': 'گوگل کے ساتھ جاری رکھیں',
    'login.apple': 'ایپل کے ساتھ جاری رکھیں',
    'login.terms': 'جاری رکھنے سے آپ ہماری',
    'login.terms_of_service': 'سروس کی شرائط',
    'login.and': 'اور',
    'login.privacy_policy': 'رازداری کی پالیسی',
    'login.tagline': 'ایمان. طرز زندگی. کمیونٹی.',
    'login.choose_profile': 'اپنا پروفائل منتخب کریں',
    'login.select_account_type': 'اکاؤنٹ کی قسم منتخب کریں جو آپ بنانا چاہتے ہیں',
    'login.normal_user': 'عام صارف',
    'login.normal_user_desc': 'مصنوعات اور ٹورز براؤز کریں اور خریدیں',
    'login.seller': 'بیچنے والا',
    'login.seller_desc': 'اپنی مصنوعات کی فہرست بنائیں اور بیچیں',
    'login.travel_partner': 'ٹریول پارٹنر',
    'login.travel_partner_desc': 'صارفین کو ٹور پیکجز پیش کریں',
    'login.already_have_account': 'پہلے سے اکاؤنٹ ہے؟',
    'login.sign_in': 'سائن ان',
    'login.sign_up': 'سائن اپ',
    'login.welcome_back': 'واپس خوش آمدید',
    'login.enter_credentials': 'سائن ان کرنے کے لیے اپنی معلومات درج کریں',
    'login.create_your_account': 'اپنا اکاؤنٹ بنائیں',
    'login.sign_up_as': 'بطور سائن اپ کریں',
    'login.full_name': 'پورا نام',
    'login.password': 'پاس ورڈ',
    'login.create_account_btn': 'اکاؤنٹ بنائیں',
    'login.back': 'واپس',
    'login.dont_have_account': 'اکاؤنٹ نہیں ہے؟',
    'login.please_wait': 'براہ کرم انتظار کریں...',
    
    // Home page
    'home.greeting': 'السلام علیکم',
    'home.title': 'برکت ہوم',
    'home.getting_location': 'مقام حاصل کیا جا رہا ہے...',
    'home.tap_retry': 'دوبارہ کوشش کریں',
    'home.current_time': 'موجودہ وقت',
    'home.next_prayer': 'اگلی نماز',
    'home.next_prayer_at': 'اگلی نماز',
    
    // Prayer names
    'prayer.fajr': 'فجر',
    'prayer.dhuhr': 'ظہر',
    'prayer.asr': 'عصر',
    'prayer.maghrib': 'مغرب',
    'prayer.isha': 'عشاء',
    'prayer.upcoming': 'آنے والی',
    'prayer.time': 'وقت',
    'prayer.next': 'اگلی',
    
    // Quick actions
    'action.qibla': 'قبلہ',
    'action.quran': 'قرآن',
    'action.track': 'ٹریک',
    'action.makkah_live': 'مکہ لائیو',
    'action.prayer': 'نماز',
    'action.zakat': 'زکوٰۃ',
    'action.store': 'سٹور',
    'action.travel': 'سفر',
    
    // Bottom Navigation
    'nav.home': 'ہوم',
    'nav.store': 'سٹور',
    'nav.guftagu': 'امہ',
    'nav.places': 'مقامات',
    'nav.account': 'اکاؤنٹ',
    
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
    'languageSelector.title': 'زبان',
  },
  ar: {
    // Login/Register page
    'login.create_account': 'إنشاء حساب',
    'login.enter_email': 'أدخل بريدك الإلكتروني للتسجيل',
    'login.email_placeholder': 'اسمك@البريد.كوم',
    'login.continue': 'متابعة',
    'login.or': 'أو',
    'login.google': 'المتابعة مع جوجل',
    'login.apple': 'المتابعة مع أبل',
    'login.terms': 'بالمتابعة، فإنك توافق على',
    'login.terms_of_service': 'شروط الخدمة',
    'login.and': 'و',
    'login.privacy_policy': 'سياسة الخصوصية',
    'login.tagline': 'الإيمان. أسلوب الحياة. المجتمع.',
    'login.choose_profile': 'اختر ملفك الشخصي',
    'login.select_account_type': 'حدد نوع الحساب الذي تريد إنشاءه',
    'login.normal_user': 'مستخدم عادي',
    'login.normal_user_desc': 'تصفح وشراء المنتجات والجولات',
    'login.seller': 'بائع',
    'login.seller_desc': 'قم بإدراج وبيع منتجاتك',
    'login.travel_partner': 'شريك السفر',
    'login.travel_partner_desc': 'قدم باقات سياحية للمستخدمين',
    'login.already_have_account': 'لديك حساب بالفعل؟',
    'login.sign_in': 'تسجيل الدخول',
    'login.sign_up': 'التسجيل',
    'login.welcome_back': 'مرحباً بعودتك',
    'login.enter_credentials': 'أدخل بياناتك لتسجيل الدخول',
    'login.create_your_account': 'أنشئ حسابك',
    'login.sign_up_as': 'التسجيل كـ',
    'login.full_name': 'الاسم الكامل',
    'login.password': 'كلمة المرور',
    'login.create_account_btn': 'إنشاء حساب',
    'login.back': 'رجوع',
    'login.dont_have_account': 'ليس لديك حساب؟',
    'login.please_wait': 'يرجى الانتظار...',
    
    // Home page
    'home.greeting': 'السلام عليكم',
    'home.title': 'بركة الرئيسية',
    'home.getting_location': 'جارٍ تحديد الموقع...',
    'home.tap_retry': 'انقر لإعادة المحاولة',
    'home.current_time': 'الوقت الحالي',
    'home.next_prayer': 'الصلاة التالية',
    'home.next_prayer_at': 'الصلاة التالية',
    
    // Prayer names
    'prayer.fajr': 'الفجر',
    'prayer.dhuhr': 'الظهر',
    'prayer.asr': 'العصر',
    'prayer.maghrib': 'المغرب',
    'prayer.isha': 'العشاء',
    'prayer.upcoming': 'القادمة',
    'prayer.time': 'وقت',
    'prayer.next': 'التالية',
    
    // Quick actions
    'action.qibla': 'القبلة',
    'action.quran': 'القرآن',
    'action.track': 'تتبع',
    'action.makkah_live': 'مكة مباشر',
    'action.prayer': 'الصلاة',
    'action.zakat': 'الزكاة',
    'action.store': 'المتجر',
    'action.travel': 'السفر',
    
    // Bottom Navigation
    'nav.home': 'الرئيسية',
    'nav.store': 'المتجر',
    'nav.guftagu': 'الأمة',
    'nav.places': 'الأماكن',
    'nav.account': 'الحساب',
    
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
    'languageSelector.title': 'اللغة',
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
