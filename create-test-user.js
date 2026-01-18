/**
 * テストユーザー作成スクリプト
 *
 * CLAUDE.mdに記載されているテストユーザーを作成します。
 *
 * テストユーザー:
 * - Email: test@promptmanagement.local
 * - Password: TestPass123!
 *
 * 実行コマンド:
 * node create-test-user.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 環境変数を読み込み
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 環境変数エラー: VITE_SUPABASE_URL または VITE_SUPABASE_ANON_KEY が設定されていません');
  console.error('📄 .env.local ファイルを確認してください');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestUser() {
  console.log('=== テストユーザー作成 ===\n');

  const testEmail = 'test@promptmanagement.local';
  const testPassword = 'TestPass123!';

  try {
    console.log('📝 テストユーザー作成中...');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: undefined, // メール確認不要
      },
    });

    if (error) {
      // ユーザーが既に存在する場合
      if (error.message.includes('already registered')) {
        console.log('ℹ️  テストユーザーは既に存在します');
        console.log('   ログインテストを実行してください');
        return;
      }

      throw error;
    }

    console.log('\n✅ テストユーザー作成成功！');
    console.log(`   ユーザーID: ${data.user?.id}`);
    console.log(`   Email: ${data.user?.email}`);

    console.log('\n📧 メール確認について:');
    console.log('   Supabaseの設定によっては、メール確認が必要な場合があります。');
    console.log('   Supabaseダッシュボードの「Authentication」→「Users」から、');
    console.log('   テストユーザーのメール確認状態を確認してください。');

  } catch (err) {
    console.error('❌ テストユーザー作成に失敗しました:', err.message);
    process.exit(1);
  }
}

createTestUser();
