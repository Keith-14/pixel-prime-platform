import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { User, Briefcase, Plane } from 'lucide-react';

type UserRole = 'normal_user' | 'seller' | 'travel_partner';

const profileOptions = [
  {
    role: 'normal_user' as UserRole,
    icon: User,
    title: 'Normal User',
    description: 'Browse and purchase products & tours',
    color: 'bg-sage'
  },
  {
    role: 'seller' as UserRole,
    icon: Briefcase,
    title: 'Seller',
    description: 'List and sell your products',
    color: 'bg-sage-dark'
  },
  {
    role: 'travel_partner' as UserRole,
    icon: Plane,
    title: 'Travel Partner',
    description: 'Offer tour packages to users',
    color: 'bg-sage-dark'
  }
];

export const Register = () => {
  const [step, setStep] = useState<'profile' | 'details'>('profile');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignIn, setIsSignIn] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('details');
  };

  const handleSubmit = async () => {
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
          toast.error(error.message);
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
          toast.error(error.message);
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

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center max-w-md mx-auto relative overflow-hidden">
      {/* Islamic pattern background */}
      <div className="absolute inset-0 opacity-30">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23B8A082' fill-opacity='0.4'%3E%3Cpath d='M30 30c0-16.569-13.431-30-30-30v30h30zM0 30v30h30c0-16.569-13.431-30-30-30z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236B8E7A' fill-opacity='0.15'%3E%3Cpath d='M20 40c11.046 0 20-8.954 20-20s-8.954-20-20-20-20 8.954-20 20 8.954 20 20 20zm20 0c11.046 0 20-8.954 20-20s-8.954-20-20-20-20 8.954-20 20 8.954 20 20 20z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px'
          }}
        />
      </div>

      <div className="relative z-10 w-full px-6">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <svg width="64" height="80" viewBox="0 0 80 100" className="text-sage">
              <g fill="currentColor">
                <circle cx="40" cy="8" r="6" />
                <circle cx="60" cy="25" r="5" />
                <circle cx="68" cy="45" r="5" />
                <circle cx="60" cy="65" r="5" />
                <circle cx="40" cy="75" r="5" />
                <circle cx="20" cy="65" r="5" />
                <circle cx="12" cy="45" r="5" />
                <circle cx="20" cy="25" r="5" />
                <circle cx="40" cy="15" r="5" />
                <circle cx="45" cy="20" r="4" />
                <circle cx="50" cy="30" r="4" />
                <circle cx="50" cy="40" r="4" />
                <circle cx="50" cy="50" r="4" />
                <circle cx="45" cy="60" r="4" />
                <circle cx="35" cy="60" r="4" />
                <circle cx="30" cy="50" r="4" />
                <circle cx="30" cy="40" r="4" />
                <circle cx="30" cy="30" r="4" />
                <circle cx="35" cy="20" r="4" />
                <circle cx="40" cy="85" r="4" />
                <circle cx="40" cy="92" r="3" />
              </g>
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-sage mb-1">BARAKAH</h1>
          <p className="text-xs text-sage/80 font-medium tracking-wide">
            FAITH. LIFESTYLE. COMMUNITY.
          </p>
        </div>

        {/* Profile Selection */}
        {step === 'profile' && !isSignIn && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-sage mb-2">Choose Your Profile</h2>
              <p className="text-sm text-sage/70">
                Select the type of account you want to create
              </p>
            </div>

            {profileOptions.map(({ role, icon: Icon, title, description, color }) => (
              <Card 
                key={role}
                onClick={() => handleRoleSelect(role)}
                className="p-4 rounded-2xl cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-sage"
              >
                <div className="flex items-center space-x-4">
                  <div className={`${color} text-primary-foreground p-3 rounded-xl`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{title}</h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                </div>
              </Card>
            ))}

            <div className="text-center pt-4">
              <p className="text-sm text-sage/70">
                Already have an account?{' '}
                <button 
                  onClick={() => setIsSignIn(true)}
                  className="text-sage font-semibold underline"
                >
                  Sign In
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
                {isSignIn ? 'Welcome Back' : 'Create Your Account'}
              </h2>
              <p className="text-sm text-sage/70">
                {isSignIn 
                  ? 'Enter your credentials to sign in' 
                  : `Sign up as ${profileOptions.find(p => p.role === selectedRole)?.title}`
                }
              </p>
            </div>

            <div className="space-y-4">
              {!isSignIn && (
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-background border-sage/30 rounded-xl h-12 text-center placeholder:text-sage/50"
                />
              )}
              
              <Input
                type="email"
                placeholder="yourname@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background border-sage/30 rounded-xl h-12 text-center placeholder:text-sage/50"
              />

              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background border-sage/30 rounded-xl h-12 text-center placeholder:text-sage/50"
              />

              <Button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-sage hover:bg-sage-dark text-primary-foreground rounded-xl h-12 font-medium"
              >
                {loading ? 'Please wait...' : isSignIn ? 'Sign In' : 'Create Account'}
              </Button>

              <Button 
                onClick={handleBack}
                variant="ghost"
                className="w-full rounded-xl h-12 font-medium"
              >
                Back
              </Button>

              {isSignIn && (
                <div className="text-center pt-2">
                  <p className="text-sm text-sage/70">
                    Don't have an account?{' '}
                    <button 
                      onClick={() => {
                        setIsSignIn(false);
                        setStep('profile');
                      }}
                      className="text-sage font-semibold underline"
                    >
                      Sign Up
                    </button>
                  </p>
                </div>
              )}
            </div>

            <p className="text-xs text-sage/60 text-center px-4 leading-relaxed">
              By continuing, you agree to our{' '}
              <span className="underline">Terms of Service</span> and{' '}
              <span className="underline">Privacy Policy</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};