import { createContext, useContext, useEffect, useState, ReactNode } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Session, User } from "@supabase/supabase-js";

 interface Subscription {
   id: string;
   user_id: string;
   stripe_subscription_id: string;
   stripe_customer_id: string;
   status: string;
   price_id: string;
   current_period_start: string;
   current_period_end: string;
   cancel_at_period_end: boolean;
 }

 interface AuthContextType {
   session: Session | null;
   user: User | null;
   subscription?: Subscription | null; // Optional to maintain backward compatibility
   signOut: () => Promise<void>;
   loading: boolean;
   refreshSubscription?: () => Promise<void>; // Optional method
 }

 const AuthContext = createContext<AuthContextType>({
   session: null,
   user: null,
   subscription: null,
   signOut: async () => {},
   loading: true,
   refreshSubscription: async () => {},
 });

 export const useAuth = () => useContext(AuthContext);

 interface AuthProviderProps {
   children: ReactNode;
 }

 export const AuthProvider = ({ children }: AuthProviderProps) => {
   const [session, setSession] = useState<Session | null>(null);
   const [user, setUser] = useState<User | null>(null);
   const [subscription, setSubscription] = useState<Subscription | null>(null);
   const [loading, setLoading] = useState(true);

   // Subscription-toiminnot - ei blokkaa normaalia käyttöä
   const fetchSubscription = async (userId: string) => {
     try {
       const { data, error } = await supabase
         .from('subscriptions')
         .select('*')
         .eq('user_id', userId)
         .eq('status', 'active')
         .single();

       if (error && error.code !== 'PGRST116') { // PGRST116 = ei löytynyt
         console.log('No active subscription found (this is normal)');
       }

       setSubscription(data || null);
     } catch (error) {
       console.log('Subscription check failed (non-critical):', error);
     }
   };

   const refreshSubscription = async () => {
     if (user) {
       await fetchSubscription(user.id);
     }
   };

   useEffect(() => {
     // Haetaan nykyinen sessio
     const getSession = async () => {
       try {
         const { data, error } = await supabase.auth.getSession();
         if (error) {
           throw error;
         }
         setSession(data.session);
         setUser(data.session?.user ?? null);
         // Haetaan tilaus jos käyttäjä löytyy (ei-blokkaavasti)
         if (data.session?.user) {
           fetchSubscription(data.session.user.id);
         }
       } catch (error) {
         console.error("Error fetching session:", error);
       } finally {
         setLoading(false);
       }
     };

     getSession();

     // Kuunnellaan autentikaation muutoksia
     const { data: authListener } = supabase.auth.onAuthStateChange(
       (event, newSession) => {
         console.log("Auth state changed:", event);
         setSession(newSession);
         setUser(newSession?.user ?? null);
         setLoading(false);
         // Haetaan tilaus jos käyttäjä löytyy (ei-blokkaavasti)
         if (newSession?.user) {
           fetchSubscription(newSession.user.id);
         }
       }
     );

     // Siivotaan listener unmount-vaiheessa
     return () => {
       authListener.subscription.unsubscribe();
     };
   }, []);

   const signOut = async () => {
     try {
       await supabase.auth.signOut();
       // Force navigation to login page after signing out
       window.location.href = "/auth";
     } catch (error) {
       console.error("Error signing out:", error);
     }
   };

   const value = {
     session,
     user,
     subscription,
     signOut,
     loading,
     refreshSubscription,
   };

   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
 };
