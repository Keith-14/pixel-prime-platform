import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Users } from 'lucide-react';

const ONBOARDING_KEY = 'barakah_onboarding_completed';
const ONBOARDING_SLIDE_KEY = 'barakah_onboarding_slide';
const ONBOARDING_DESTINATION_KEY = 'barakah_onboarding_destination';

const slides = [
  {
    icon: BookOpen,
    title: 'Quran & Spiritual Growth',
    description: 'Access the complete Quran with audio recitations, translations, and daily verses to strengthen your connection with Allah.',
    color: 'bg-primary'
  },
  {
    icon: Clock,
    title: 'Prayer Times & Tracking',
    description: 'Never miss a prayer with accurate times based on your location. Track your daily prayers and build a consistent streak.',
    color: 'bg-primary'
  },
  {
    icon: Users,
    title: 'Community & Marketplace',
    description: 'Connect with fellow Muslims in the Forum, explore Hajj packages, and shop from trusted sellers in our marketplace.',
    color: 'bg-primary'
  }
];

export const Onboarding = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');

  // Check if onboarding was already completed
  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (completed === 'true') {
      const destination = localStorage.getItem(ONBOARDING_DESTINATION_KEY) || '/';
      localStorage.removeItem(ONBOARDING_DESTINATION_KEY);
      navigate(destination, { replace: true });
      return;
    }

    // Resume from saved slide if app was closed mid-onboarding
    const savedSlide = localStorage.getItem(ONBOARDING_SLIDE_KEY);
    if (savedSlide) {
      const slideIndex = parseInt(savedSlide, 10);
      if (slideIndex >= 0 && slideIndex < slides.length) {
        setCurrentSlide(slideIndex);
      }
    }
  }, [navigate]);

  // Save current slide to localStorage
  useEffect(() => {
    localStorage.setItem(ONBOARDING_SLIDE_KEY, currentSlide.toString());
  }, [currentSlide]);

  const handleNext = () => {
    if (isAnimating) return;

    if (currentSlide < slides.length - 1) {
      setSlideDirection('left');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide(prev => prev + 1);
        setIsAnimating(false);
      }, 300);
    } else {
      // Complete onboarding
      localStorage.setItem(ONBOARDING_KEY, 'true');
      localStorage.removeItem(ONBOARDING_SLIDE_KEY);
      const destination = localStorage.getItem(ONBOARDING_DESTINATION_KEY) || '/';
      localStorage.removeItem(ONBOARDING_DESTINATION_KEY);
      navigate(destination, { replace: true });
    }
  };

  const handleDotClick = (index: number) => {
    if (isAnimating || index === currentSlide) return;
    
    setSlideDirection(index > currentSlide ? 'left' : 'right');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsAnimating(false);
    }, 300);
  };

  const CurrentIcon = slides[currentSlide].icon;

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center max-w-md mx-auto relative overflow-hidden px-6">
      {/* Islamic pattern background */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23B8A082' fill-opacity='0.4'%3E%3Cpath d='M30 30c0-16.569-13.431-30-30-30v30h30zM0 30v30h30c0-16.569-13.431-30-30-30z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Slide Content */}
        <div 
          className={`w-full text-center transition-all duration-300 ease-out ${
            isAnimating 
              ? slideDirection === 'left' 
                ? 'opacity-0 -translate-x-8' 
                : 'opacity-0 translate-x-8'
              : 'opacity-100 translate-x-0'
          }`}
        >
          {/* Icon */}
          <div className={`${slides[currentSlide].color} w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center shadow-lg`}>
            <CurrentIcon className="h-12 w-12 text-primary-foreground" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {slides[currentSlide].title}
          </h1>

          {/* Description */}
          <p className="text-muted-foreground leading-relaxed px-4 mb-12">
            {slides[currentSlide].description}
          </p>
        </div>

        {/* Indicator Dots */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'w-8 h-2 bg-primary'
                  : 'w-2 h-2 bg-primary/30 hover:bg-primary/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Navigation Button */}
        <Button
          onClick={handleNext}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-14 font-semibold text-lg shadow-lg"
        >
          {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
        </Button>

        {/* Skip option for non-last slides */}
        {currentSlide < slides.length - 1 && (
          <button
            onClick={() => {
              localStorage.setItem(ONBOARDING_KEY, 'true');
              localStorage.removeItem(ONBOARDING_SLIDE_KEY);
              const destination = localStorage.getItem(ONBOARDING_DESTINATION_KEY) || '/';
              localStorage.removeItem(ONBOARDING_DESTINATION_KEY);
              navigate(destination, { replace: true });
            }}
            className="mt-4 text-muted-foreground text-sm hover:text-foreground transition-colors"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
};
