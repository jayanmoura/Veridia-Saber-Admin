import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types/auth'; // Fix: type-only import
import type { Session } from '@supabase/supabase-js'; // Fix: type-only import

interface AuthContextType {
    session: Session | null;
    profile: UserProfile | null;
    loading: boolean;
    signIn: (email: string) => Promise<void>; // Magic link or internal logic if needed
    signOut: () => Promise<void>;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const isFetchingProfile = useRef(false);

    const fetchProfile = async (userId: string) => {
        if (isFetchingProfile.current) return;
        isFetchingProfile.current = true;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            setProfile(data as UserProfile);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
            isFetchingProfile.current = false;
        }
    };

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'TOKEN_REFRESHED') return;
            setSession(session);
            if (session) fetchProfile(session.user.id);
            else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const signIn = async (_email: string) => {
        // Implement sign in logic if needed here, mostly handled by Login component directly
        console.log("Sign in not implemented in context yet", _email);
    };

    const isAdmin = !!profile && (['Curador Mestre', 'Coordenador Científico', 'Gestor de Acervo'].includes(profile.role));

    return (
        <AuthContext.Provider value={{ session, profile, loading, signIn, signOut, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
