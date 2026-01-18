/**
 * 認証フロー統合テスト
 * スライス1: 認証基盤の完全なフローテスト
 *
 * 重要: モック使用禁止、実際のSupabase環境で動作確認
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from '../../../src/services/auth/authService';
import { uniqueDataFactory } from '../../utils/unique-data-factory';

describe('認証フロー統合テスト（スライス1）', () => {
  let testUserData: { email: string; password: string };

  beforeEach(() => {
    // 各テストで完全に独立したユーザーデータを生成
    testUserData = uniqueDataFactory.generateUserData();
  });

  describe('タスク1.2: 新規登録（signup）', () => {
    it('正常系: 新規ユーザーを作成できる', async () => {
      const user = await authService.signUp(testUserData.email, testUserData.password);

      expect(user).toBeDefined();
      expect(user.id).toBeTruthy();
      expect(user.email).toBe(testUserData.email);
      expect(user.created_at).toBeTruthy();
    }, 10000); // Supabase通信を考慮して10秒タイムアウト

    it('異常系: 同じメールアドレスで重複登録はエラー', async () => {
      // 1回目の登録
      await authService.signUp(testUserData.email, testUserData.password);

      // 2回目の登録（同じメールアドレス）
      await expect(
        authService.signUp(testUserData.email, testUserData.password)
      ).rejects.toThrow('既に使用されています');
    }, 15000);

    it('異常系: 不正なメールアドレスはエラー', async () => {
      await expect(
        authService.signUp('invalid-email', testUserData.password)
      ).rejects.toThrow();
    }, 10000);

    it('異常系: パスワードが短すぎる場合はエラー', async () => {
      await expect(
        authService.signUp(testUserData.email, 'short')
      ).rejects.toThrow();
    }, 10000);
  });

  describe('タスク1.3: ログイン（signIn）', () => {
    beforeEach(async () => {
      // 各テスト前にユニークユーザーを登録
      await authService.signUp(testUserData.email, testUserData.password);
      // 登録後のセッションをクリア（ログインテストのため）
      await authService.signOut();
    }, 10000);

    it('正常系: 登録済みユーザーでログインできる', async () => {
      const user = await authService.signIn(testUserData.email, testUserData.password);

      expect(user).toBeDefined();
      expect(user.id).toBeTruthy();
      expect(user.email).toBe(testUserData.email);
      expect(user.last_sign_in_at).toBeTruthy();
    }, 10000);

    it('異常系: 誤ったパスワードでログインできない', async () => {
      await expect(
        authService.signIn(testUserData.email, 'wrong-password')
      ).rejects.toThrow('正しくありません');
    }, 10000);

    it('異常系: 存在しないユーザーでログインできない', async () => {
      const nonExistentEmail = uniqueDataFactory.generateEmail();

      await expect(
        authService.signIn(nonExistentEmail, testUserData.password)
      ).rejects.toThrow();
    }, 10000);
  });

  describe('タスク1.5: セッション取得（getSession）', () => {
    it('正常系: ログイン後はセッションが取得できる', async () => {
      // ユーザー登録とログイン
      await authService.signUp(testUserData.email, testUserData.password);

      const session = await authService.getSession();

      expect(session).toBeDefined();
      expect(session?.email).toBe(testUserData.email);
    }, 10000);

    it('正常系: ログアウト後はセッションがnull', async () => {
      // ユーザー登録とログイン
      await authService.signUp(testUserData.email, testUserData.password);

      // ログアウト
      await authService.signOut();

      const session = await authService.getSession();
      expect(session).toBeNull();
    }, 10000);
  });

  describe('タスク1.4: ログアウト（signOut）', () => {
    beforeEach(async () => {
      // 各テスト前にログイン状態を作る
      await authService.signUp(testUserData.email, testUserData.password);
    }, 10000);

    it('正常系: ログアウトできる', async () => {
      await expect(authService.signOut()).resolves.not.toThrow();

      // ログアウト後はセッションがnull
      const session = await authService.getSession();
      expect(session).toBeNull();
    }, 10000);
  });

  describe('タスク1.6: パスワードリセット（resetPassword）', () => {
    beforeEach(async () => {
      // パスワードリセットテスト用にユーザー登録
      await authService.signUp(testUserData.email, testUserData.password);
      await authService.signOut();
    }, 10000);

    it('正常系: 登録済みメールアドレスでリセットメール送信できる', async () => {
      await expect(
        authService.resetPassword(testUserData.email)
      ).resolves.not.toThrow();
    }, 10000);

    it('正常系: 存在しないメールアドレスでもエラーを返さない（セキュリティのため）', async () => {
      const nonExistentEmail = uniqueDataFactory.generateEmail();

      // Supabaseのデフォルト動作: 存在しないユーザーでもエラーを返さない
      await expect(
        authService.resetPassword(nonExistentEmail)
      ).resolves.not.toThrow();
    }, 10000);
  });

  describe('認証フロー完全シナリオテスト', () => {
    it('新規登録→ログアウト→ログイン→セッション確認の一連フロー', async () => {
      // 1. 新規登録
      const signUpUser = await authService.signUp(testUserData.email, testUserData.password);
      expect(signUpUser.email).toBe(testUserData.email);

      // 2. セッション確認（登録直後はログイン済み）
      const sessionAfterSignUp = await authService.getSession();
      expect(sessionAfterSignUp).toBeDefined();

      // 3. ログアウト
      await authService.signOut();
      const sessionAfterSignOut = await authService.getSession();
      expect(sessionAfterSignOut).toBeNull();

      // 4. ログイン
      const signInUser = await authService.signIn(testUserData.email, testUserData.password);
      expect(signInUser.email).toBe(testUserData.email);

      // 5. セッション確認（ログイン後）
      const sessionAfterSignIn = await authService.getSession();
      expect(sessionAfterSignIn).toBeDefined();
      expect(sessionAfterSignIn?.email).toBe(testUserData.email);
    }, 30000); // 複数API呼び出しのため30秒タイムアウト
  });
});
