import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { User, Briefcase, Plane, Chrome } from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { BarakahLogo } from '@/components/BarakahLogo';
import { Separator } from '@/components/ui/separator';

type UserRole = 'normal_user' | 'seller' | 'travel_partner';

export const Register = () => {
  const [step, setStep] = useState<'profile' | 'details'>('profile');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignIn, setIsSignIn] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { signUp, signIn, signInWithGoogle, completeAccountSetup } = useAuth();
  const { t } = useLanguage();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error, role } = await signInWithGoogle();
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // If role is null, the user signed in but still needs to pick a role + name.
    if (role === null) {
      toast.message('Finish setup', {
        description: 'Please choose your account type to continue.'
      });
      setNeedsSetup(true);
      setIsSignIn(false);
      setStep('profile');
      setSelectedRole(null);
      setFullName('');
      setLoading(false);
      return;
    }

    if (role === 'seller') {
      navigate('/seller-dashboard');
    } else if (role === 'travel_partner') {
      navigate('/business-account');
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  const profileOptions = [
    {
      role: 'normal_user' as UserRole,
      icon: User,
      titleKey: 'login.normal_user',
      descKey: 'login.normal_user_desc',
      color: 'bg-sage'
    },
    {
      role: 'seller' as UserRole,
      icon: Briefcase,
      titleKey: 'login.seller',
      descKey: 'login.seller_desc',
      color: 'bg-sage-dark'
    },
    {
      role: 'travel_partner' as UserRole,
      icon: Plane,
      titleKey: 'login.travel_partner',
      descKey: 'login.travel_partner_desc',
      color: 'bg-sage-dark'
    }
  ];

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('details');
  };

  const handleSubmit = async () => {
    // Completing setup for an existing Firebase account (role/profile missing)
    if (needsSetup) {
      if (!selectedRole) {
        toast.error('Please select a profile type');
        return;
      }

      if (!fullName) {
        toast.error('Please enter your full name');
        return;
      }

      setLoading(true);
      try {
        const { error, role } = await completeAccountSetup(selectedRole, fullName);
        if (error) {
          toast.error(error.message);
          return;
        }

        toast.success('Account setup completed!');
        setNeedsSetup(false);

        if (role === 'seller') {
          navigate('/seller-dashboard');
        } else if (role === 'travel_partner') {
          navigate('/business-account');
        } else {
          navigate('/');
        }
      } catch {
        toast.error('An error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!isSignIn && !selectedRole) {
      toast.error('Please select a profile type');
      return;
    }

    setLoading(true);

    try {
      if (isSignIn) {
        const { error, role } = await signIn(email, password);
        if (error) {
          // If the user accidentally tried to sign in with a provider that can't use password,
          // or if the message is misleading, keep guidance friendly.
          if (String(error.message).includes('auth/user-not-found')) {
            toast.error('No account found for this email. Please create an account first.');
            setIsSignIn(false);
            setStep('profile');
          } else {
            toast.error(error.message);
          }
        } else if (role === null) {
          // Signed in successfully, but the account is missing role/profile rows.
          toast.message('Finish setup', {
            description: 'Please choose your account type to continue.'
          });
          setNeedsSetup(true);
          setIsSignIn(false);
          setStep('profile');
          setSelectedRole(null);
          setFullName('');
        } else {
          toast.success('Signed in successfully!');
          // Redirect based on role
          if (role === 'seller') {
            navigate('/seller-dashboard');
          } else if (role === 'travel_partner') {
            navigate('/business-account');
          } else {
            navigate('/');
          }
        }
      } else {
        if (!fullName) {
          toast.error('Please enter your full name');
          setLoading(false);
          return;
        }

        const { error, role } = await signUp(email, password, selectedRole, fullName);
        if (error) {
          // Common confusion: trying to create an account that already exists.
          if (String(error.message).includes('auth/email-already-in-use')) {
            toast.error('This email already has an account. Please sign in instead.');
            setIsSignIn(true);
            setStep('details');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Account created successfully!');
          // Store destination for after onboarding
          let destination = '/';
          if (role === 'seller') {
            destination = '/seller-dashboard';
          } else if (role === 'travel_partner') {
            destination = '/business-account';
          }
          localStorage.setItem('barakah_onboarding_destination', destination);
          // New users go to onboarding first
          navigate('/onboarding');
        }
      }
    } catch (error: any) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'details' && !isSignIn) {
      setStep('profile');
    } else {
      setIsSignIn(false);
      setStep('profile');
    }
  };

  const getSelectedRoleTitle = () => {
    const option = profileOptions.find(p => p.role === selectedRole);
    return option ? t(option.titleKey) : '';
  };

  return (
    <div className="min-h-screen flex items-center justify-center max-w-md mx-auto relative overflow-hidden">
      {/* Background with sage green tint #6a8b74 */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Dark green-tinted base */}
        <div 
          className="absolute inset-0"
          style={{ 
            background: 'linear-gradient(180deg, rgba(40, 55, 45, 1) 0%, rgba(25, 35, 28, 1) 50%, rgba(15, 20, 16, 1) 100%)' 
          }}
        />
        
        {/* Sage green overlay for the tint */}
        <div 
          className="absolute inset-0"
          style={{ 
            background: 'rgba(106, 139, 116, 0.08)' 
          }}
        />
        
        {/* Subtle lighter glow at top center */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[50%]"
          style={{ 
            background: 'radial-gradient(ellipse at top, rgba(106, 139, 116, 0.15) 0%, transparent 70%)' 
          }}
        />
      </div>

      {/* Language Selector */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector />
      </div>

      <div className="relative z-10 w-full px-6">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <BarakahLogo size="lg" />
          </div>
          
          <h1 className="text-3xl font-bold text-sage mb-1">BARAKAH</h1>
          <p className="text-xs text-sage/80 font-medium tracking-wide">
            {t('login.tagline')}
          </p>
        </div>

        {/* Profile Selection */}
        {step === 'profile' && !isSignIn && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-sage mb-2">{t('login.choose_profile')}</h2>
              <p className="text-sm text-sage/70">
                {t('login.select_account_type')}
              </p>
            </div>

            {profileOptions.map(({ role, icon: Icon, titleKey, descKey, color }) => (
              <Card 
                key={role}
                onClick={() => handleRoleSelect(role)}
                className="p-4 rounded-2xl cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-sage"
              >
                <div className="flex items-center space-x-4">
                  <div className={`${color} p-3 rounded-xl`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{t(titleKey)}</h3>
                    <p className="text-sm text-muted-foreground">{t(descKey)}</p>
                  </div>
                </div>
              </Card>
            ))}

            <div className="flex items-center gap-4 my-4">
              <Separator className="flex-1 bg-sage/30" />
              <span className="text-sm text-sage/70">{t('login.or')}</span>
              <Separator className="flex-1 bg-sage/30" />
            </div>

            <Button 
              onClick={handleGoogleSignIn}
              disabled={loading}
              variant="outline"
              className="w-full rounded-xl h-12 font-medium border-sage/30 hover:bg-sage/10"
            >
              <Chrome className="h-5 w-5 mr-2" />
              {t('login.google')}
            </Button>

            <div className="text-center pt-4">
              <p className="text-sm text-sage/70">
                {t('login.already_have_account')}{' '}
                <button 
                  onClick={() => setIsSignIn(true)}
                  className="text-sage font-semibold underline"
                >
                  {t('login.sign_in')}
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Sign In / Sign Up Form */}
        {(step === 'details' || isSignIn) && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-sage mb-2">
                {isSignIn ? t('login.welcome_back') : t('login.create_your_account')}
              </h2>
              <p className="text-sm text-sage/70">
                {isSignIn 
                  ? t('login.enter_credentials')
                  : `${t('login.sign_up_as')} ${getSelectedRoleTitle()}`
                }
              </p>
            </div>

            <div className="space-y-4">
              {!isSignIn && (
                <Input
                  type="text"
                  placeholder={t('login.full_name')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-background border-sage/30 rounded-xl h-12 text-center placeholder:text-sage/50"
                />
              )}
              
              {!needsSetup && (
                <>
                  <Input
                    type="email"
                    placeholder={t('login.email_placeholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background border-sage/30 rounded-xl h-12 text-center placeholder:text-sage/50"
                  />

                  <Input
                    type="password"
                    placeholder={t('login.password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background border-sage/30 rounded-xl h-12 text-center placeholder:text-sage/50"
                  />
                </>
              )}

              <Button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-sage hover:bg-sage-dark text-primary-foreground rounded-xl h-12 font-medium"
              >
                {loading
                  ? t('login.please_wait')
                  : needsSetup
                    ? 'Finish setup'
                    : isSignIn
                      ? t('login.sign_in')
                      : t('login.create_account_btn')}
              </Button>

              <Button 
                onClick={handleBack}
                variant="ghost"
                className="w-full rounded-xl h-12 font-medium"
              >
                {t('login.back')}
              </Button>

              <div className="flex items-center gap-4 my-2">
                <Separator className="flex-1 bg-sage/30" />
                <span className="text-sm text-sage/70">{t('login.or')}</span>
                <Separator className="flex-1 bg-sage/30" />
              </div>

              <Button 
                onClick={handleGoogleSignIn}
                disabled={loading}
                variant="outline"
                className="w-full rounded-xl h-12 font-medium border-sage/30 hover:bg-sage/10"
              >
                <Chrome className="h-5 w-5 mr-2" />
                {t('login.google')}
              </Button>

              {isSignIn && (
                <div className="text-center pt-2">
                  <p className="text-sm text-sage/70">
                    {t('login.dont_have_account')}{' '}
                    <button 
                      onClick={() => {
                        setIsSignIn(false);
                        setStep('profile');
                      }}
                      className="text-sage font-semibold underline"
                    >
                      {t('login.sign_up')}
                    </button>
                  </p>
                </div>
              )}
            </div>

            <p className="text-xs text-sage/60 text-center px-4 leading-relaxed">
              {t('login.terms')}{' '}
              <span className="underline">{t('login.terms_of_service')}</span> {t('login.and')}{' '}
              <span className="underline">{t('login.privacy_policy')}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};