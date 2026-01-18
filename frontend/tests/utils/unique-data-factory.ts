/**
 * ユニークデータ生成ユーティリティ
 * テストケースの完全分離を保証
 */

export const uniqueDataFactory = {
  /**
   * ユニークなメールアドレスを生成
   * 形式: test{timestamp}@gmail.com
   *
   * 注: Supabaseは一部のドメイン（example.com等）を拒否するため、
   * 実証済みの@gmail.comドメインを使用
   */
  generateEmail(): string {
    const timestamp = Date.now();
    return `test${timestamp}@gmail.com`;
  },

  /**
   * テスト用パスワード生成（固定値で十分）
   */
  generatePassword(): string {
    return 'TestPass123!';
  },

  /**
   * ユニークなユーザーデータセット生成
   */
  generateUserData(): { email: string; password: string } {
    return {
      email: this.generateEmail(),
      password: this.generatePassword(),
    };
  },
};
