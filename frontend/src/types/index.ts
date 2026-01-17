/**
 * 型定義の単一真実源
 * バックエンド（Supabase）と完全同期
 */

// ===== ユーザー関連 =====
export interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
}

// ===== プロンプト関連 =====
export interface Prompt {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  content: string;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromptInput {
  title: string;
  description?: string;
  content: string;
  tags: string[];
  is_favorite: boolean;
}

// ===== フィルタ関連 =====
export interface PromptFilter {
  searchQuery?: string;
  tags?: string[];
  tagMode?: 'AND' | 'OR';
  isFavorite?: boolean;
}

// ===== 統計関連 =====
export interface Statistics {
  total_prompts: number;
  total_tags: number;
  favorite_count: number;
}

// ===== 認証関連 =====
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// ===== エクスポートデータ関連 =====
export interface ExportData {
  version: string;
  exported_at: string;
  prompts: Prompt[];
}
