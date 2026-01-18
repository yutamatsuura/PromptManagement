/**
 * Supabase Client初期化
 * 環境変数からSupabase URLと匿名キーを取得して初期化
 */

import { createClient } from '@supabase/supabase-js';

// Vite環境変数から取得
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase環境変数が設定されていません。VITE_SUPABASE_URLとVITE_SUPABASE_ANON_KEYを.env.localに設定してください。'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
