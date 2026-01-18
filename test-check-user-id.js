/**
 * user_id確認スクリプト
 * E2E-FORM-002のデータが誰のものか確認
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

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUserId() {
  console.log('🔍 user_id確認\n');

  // 1. ログイン
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

  // 2. E2Eテストで作成されたプロンプトを全件取得（admin権限）
  console.log('\n📌 Step 2: E2Eテストで作成されたプロンプトを確認');
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('id, title, user_id, created_at')
    .or('title.like.E2Eテスト_%,title.like.テスト_%')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ 取得失敗:', error.message);
    process.exit(1);
  }

  console.log('✅ 取得成功');
  console.log(`   件数: ${prompts.length}`);
  console.log('\n   詳細:');
  prompts.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.title}`);
    console.log(`      ID: ${p.id}`);
    console.log(`      User ID: ${p.user_id}`);
    console.log(`      作成日時: ${p.created_at}`);
    console.log(`      現在のユーザーと一致: ${p.user_id === signInData.user.id ? '✅' : '❌'}`);
    console.log('');
  });

  // 3. 自分のプロンプトのみ取得（RLS適用）
  console.log('\n📌 Step 3: 自分のプロンプトのみ取得（RLS適用）');
  const { data: myPrompts, error: myError } = await supabase
    .from('prompts')
    .select('id, title, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (myError) {
    console.error('❌ 取得失敗:', myError.message);
    process.exit(1);
  }

  console.log('✅ 取得成功');
  console.log(`   件数: ${myPrompts.length}`);
  console.log('\n   詳細:');
  myPrompts.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.title}`);
  });

  console.log('\n✅ チェック完了');
}

checkUserId().catch((err) => {
  console.error('❌ 予期しないエラー:', err);
  process.exit(1);
});
