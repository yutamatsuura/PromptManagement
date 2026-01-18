/**
 * [E2E-TEST]データのuser_id確認スクリプト
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env.local を読み込み
dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 環境変数が設定されていません');
  process.exit(1);
}

// Supabase Admin APIを使用（service_role key が必要だが、ここではanon keyで試す）
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkE2ETestData() {
  console.log('🔍 [E2E-TEST]データのuser_id確認\n');

  // 1. test@promptmanagement.local でログイン
  console.log('📌 Step 1: ログイン');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'test@promptmanagement.local',
    password: 'TestPass123!',
  });

  if (signInError) {
    console.error('❌ ログイン失敗:', signInError.message);
    process.exit(1);
  }

  console.log('✅ ログイン成功:', signInData.user.email);
  console.log('   User ID:', signInData.user.id);

  // 2. [E2E-TEST]プレフィックス付きデータを取得
  console.log('\n📌 Step 2: [E2E-TEST]プレフィックス付きデータを取得');
  const { data: e2eTestPrompts, error } = await supabase
    .from('prompts')
    .select('id, title, user_id, created_at')
    .like('title', '[E2E-TEST]%')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ 取得失敗:', error.message);
    process.exit(1);
  }

  console.log('✅ 取得成功');
  console.log(`   件数: ${e2eTestPrompts.length}`);
  console.log('\n   詳細:');
  e2eTestPrompts.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.title}`);
    console.log(`      ID: ${p.id}`);
    console.log(`      User ID: ${p.user_id}`);
    console.log(`      作成日時: ${p.created_at}`);
    console.log(`      現在のユーザーと一致: ${p.user_id === signInData.user.id ? '✅' : '❌'}`);
    console.log('');
  });

  // 3. 現在のユーザーで一覧取得（RLS適用）
  console.log('\n📌 Step 3: 現在のユーザーで一覧取得（RLS適用）');
  const { data: myPrompts, error: myError } = await supabase
    .from('prompts')
    .select('id, title, user_id')
    .order('updated_at', { ascending: false });

  if (myError) {
    console.error('❌ 取得失敗:', myError.message);
    process.exit(1);
  }

  console.log('✅ 取得成功');
  console.log(`   件数: ${myPrompts.length}`);
  console.log('\n   タイトル一覧:');
  myPrompts.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.title}`);
  });

  console.log('\n✅ チェック完了');
}

checkE2ETestData().catch((err) => {
  console.error('❌ 予期しないエラー:', err);
  process.exit(1);
});
