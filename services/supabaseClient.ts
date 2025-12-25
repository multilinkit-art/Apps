import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const authService = {
  signUp: async (email: string, password: string) => {
    return await supabase.auth.signUp({ email, password });
  },

  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  },

  signOut: async () => {
    return await supabase.auth.signOut();
  },

  getCurrentSession: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }
};

export const linksService = {
  createLink: async (data: any) => {
    const { data: link, error } = await supabase
      .from('shortened_links')
      .insert([data])
      .select()
      .maybeSingle();

    if (error) throw error;
    return link;
  },

  getLinks: async (userId: string) => {
    const { data, error } = await supabase
      .from('shortened_links')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  deleteLink: async (id: string) => {
    const { error } = await supabase
      .from('shortened_links')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
