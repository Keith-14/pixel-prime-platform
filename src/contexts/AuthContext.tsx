import { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth, onAuthStateChanged, signUpWithEmail, signInWithEmail, signInWithGoogle, firebaseSignOut } from '@/lib/firebase';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

type UserRole = 'normal_user' | 'seller' | 'travel_partner' | null;

interface AuthContextType {
  user: User | null;
  userRole: UserRole;
  loading: boolean;
  signUp: (email: string, password: string, role: UserRole, fullName: string) => Promise<{ error: any; role?: UserRole }>;
  signIn: (email: string, password: string) => Promise<{ error: any; role?: UserRole }>;
  signInWithGoogle: () => Promise<{ error: any; role?: UserRole }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        await fetchUserRole(firebaseUser.uid);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        return;
      }

      setUserRole(data?.role as UserRole || null);
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
    }
  };

  const signUp = async (email: string, password: string, role: UserRole, fullName: string) => {
    try {
      const userCredential = await signUpWithEmail(email, password);
      const firebaseUser = userCredential.user;

      if (!firebaseUser) return { error: { message: 'User creation failed' } };

      // Insert user role into Supabase
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: firebaseUser.uid, role });

      if (roleError) return { error: roleError, role: undefined };

      // Insert profile into Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ 
          user_id: firebaseUser.uid, 
          full_name: fullName 
        });

      if (profileError) return { error: profileError, role: undefined };

      setUserRole(role);
      return { error: null, role };
    } catch (error: any) {
      return { error: { message: error.message || 'Sign up failed' }, role: undefined };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmail(email, password);
      const firebaseUser = userCredential.user;

      if (!firebaseUser) return { error: { message: 'Sign in failed' }, role: undefined };

      // Fetch user role from Supabase
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', firebaseUser.uid)
        .maybeSingle();

      if (roleError) return { error: roleError, role: undefined };
      if (!roleData) return { error: { message: 'User role not found. Please sign up first.' }, role: undefined };

      const role = roleData?.role as UserRole;
      setUserRole(role);
      return { error: null, role };
    } catch (error: any) {
      return { error: { message: error.message || 'Sign in failed' }, role: undefined };
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      const firebaseUser = result.user;

      if (!firebaseUser) return { error: { message: 'Google sign in failed' }, role: undefined };

      // Check if user role exists in Supabase
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', firebaseUser.uid)
        .maybeSingle();

      if (roleError && roleError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is expected for new users
        return { error: roleError, role: undefined };
      }

      if (roleData) {
        const role = roleData.role as UserRole;
        setUserRole(role);
        return { error: null, role };
      }

      // New Google user - they need to select a role
      // Return null role to indicate role selection is needed
      return { error: null, role: null };
    } catch (error: any) {
      return { error: { message: error.message || 'Google sign in failed' }, role: undefined };
    }
  };

  const handleSignOut = async () => {
    await firebaseSignOut();
    setUserRole(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userRole, 
      loading, 
      signUp, 
      signIn, 
      signInWithGoogle: handleGoogleSignIn, 
      signOut: handleSignOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
