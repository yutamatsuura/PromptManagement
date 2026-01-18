/**
 * Supabase認証サービス
 * 認証基盤（スライス1）の全エンドポイント実装
 */

import { supabase } from '../../lib/supabase';
import type { User } from '../../types';

/**
 * 認証エラー型
 */
export class AuthError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

/**
 * Supabaseユーザーを型定義Userに変換
 */
function mapSupabaseUserToUser(supabaseUser: {
  id: string;
  email?: string;
  created_at?: string;
  last_sign_in_at?: string;
}): User {
  if (!supabaseUser.email) {
    throw new AuthError('ユーザー情報にメールアドレスがありません');
  }

  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    created_at: supabaseUser.created_at || new Date().toISOString(),
    last_sign_in_at: supabaseUser.last_sign_in_at,
  };
}

/**
 * 認証サービス
 */
export const authService = {
  /**
   * タスク1.2: 新規登録
   * Supabase Auth signup()を使用
   */
  async signUp(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new AuthError(
        error.message === 'User already registered'
          ? 'このメールアドレスは既に使用されています'
          : error.message,
        error.status?.toString()
      );
    }

    if (!data.user) {
      throw new AuthError('アカウント作成に失敗しました');
    }

    return mapSupabaseUserToUser(data.user);
  },

  /**
   * タスク1.3: ログイン
   * Supabase Auth signInWithPassword()を使用
   */
  async signIn(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new AuthError(
        error.message === 'Invalid login credentials'
          ? 'メールアドレスまたはパスワードが正しくありません'
          : error.message,
        error.status?.toString()
      );
    }

    if (!data.user) {
      throw new AuthError('ログインに失敗しました');
    }

    return mapSupabaseUserToUser(data.user);
  },

  /**
   * タスク1.4: ログアウト
   * Supabase Auth signOut()を使用
   */
  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new AuthError('ログアウトに失敗しました: ' + error.message, error.status?.toString());
    }
  },

  /**
   * タスク1.5: セッション取得
   * Supabase Auth getSession()を使用
   */
  async getSession(): Promise<User | null> {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw new AuthError('セッション取得に失敗しました: ' + error.message, error.status?.toString());
    }

    if (!data.session?.user) {
      return null;
    }

    return mapSupabaseUserToUser(data.session.user);
  },

  /**
   * タスク1.6: パスワードリセット
   * Supabase Auth resetPasswordForEmail()を使用
   */
  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw new AuthError(
        error.message === 'User not found'
          ? 'このメールアドレスのユーザーは存在しません'
          : 'パスワードリセットメール送信に失敗しました: ' + error.message,
        error.status?.toString()
      );
    }
  },

  /**
   * リアルタイム認証状態監視
   * Supabase Auth onAuthStateChange()を使用
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        callback(mapSupabaseUserToUser(session.user));
      } else {
        callback(null);
      }
    });

    // クリーンアップ関数を返す
    return () => {
      data.subscription.unsubscribe();
    };
  },
};
