/**
 * モック認証サービス
 * Supabase未設定時のテスト用
 */

import type { User } from '../../types';

// モックユーザーデータ
const MOCK_USERS = [
  {
    id: 'user-001',
    email: 'test@promptmanagement.local',
    password: 'TestPass123!',
    created_at: new Date().toISOString(),
  },
];

// セッションストレージキー
const SESSION_KEY = 'mock_auth_session';

export const mockAuthService = {
  async signIn(email: string, password: string): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 500)); // 疑似遅延

    const user = MOCK_USERS.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      throw new Error('メールアドレスまたはパスワードが正しくありません');
    }

    const session = {
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: new Date().toISOString(),
      },
    };

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

    return session.user;
  },

  async signUp(email: string, password: string): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 500)); // 疑似遅延

    // メールアドレス重複チェック
    const exists = MOCK_USERS.find((u) => u.email === email);
    if (exists) {
      throw new Error('このメールアドレスは既に使用されています');
    }

    const newUser = {
      id: `user-${Date.now()}`,
      email,
      password,
      created_at: new Date().toISOString(),
    };

    MOCK_USERS.push(newUser);

    const session = {
      user: {
        id: newUser.id,
        email: newUser.email,
        created_at: newUser.created_at,
        last_sign_in_at: new Date().toISOString(),
      },
    };

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

    return session.user;
  },

  async signOut(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300)); // 疑似遅延
    sessionStorage.removeItem(SESSION_KEY);
  },

  async resetPassword(email: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500)); // 疑似遅延

    const user = MOCK_USERS.find((u) => u.email === email);
    if (!user) {
      throw new Error('このメールアドレスのユーザーは存在しません');
    }

    // 実際にはメール送信処理が入るが、モックでは何もしない
    console.warn('[MOCK] パスワードリセットメール送信:', email);
  },

  getCurrentUser(): User | null {
    const sessionData = sessionStorage.getItem(SESSION_KEY);
    if (!sessionData) return null;

    try {
      const session = JSON.parse(sessionData);
      return session.user;
    } catch {
      return null;
    }
  },
};
