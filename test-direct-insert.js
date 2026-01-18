/**
 * Supabase直接INSERT テストスクリプト
 * E2E-FORM-002のエラー調査用
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

async function testDirectInsert() {
  console.log('🔍 Supabase直接INSERT テスト開始\n');

  // 1. 認証状態確認
  console.log('📌 Step 1: 認証状態確認');
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error('❌ 認証エラー:', authError.message);
    console.log('\n⚠️  test@promptmanagement.local でログインしてください');

    // ログイン試行
    console.log('\n📌 Step 1-1: 自動ログイン試行');
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
  } else if (!user) {
    console.error('❌ ユーザーが認証されていません');
    process.exit(1);
  } else {
    console.log('✅ 認証済みユーザー:', user.email);
    console.log('   User ID:', user.id);
  }

  // 最新のユーザー情報を再取得
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // 2. テストデータ作成
  console.log('\n📌 Step 2: テストデータ作成');
  const testData = {
    user_id: currentUser.id,
    title: `テスト_直接INSERT_${Date.now()}`,
    description: 'Supabase直接INSERTテスト',
    content: 'これは直接INSERTのテストです。',
    tags: ['TEST', 'DIRECT'],
    is_favorite: true,
  };

  console.log('   テストデータ:', JSON.stringify(testData, null, 2));

  // 3. INSERT実行
  console.log('\n📌 Step 3: INSERT実行');
  const { data, error } = await supabase
    .from('prompts')
    .insert([testData])
    .select()
    .single();

  if (error) {
    console.error('❌ INSERT失敗:', error.message);
    console.error('   エラー詳細:', JSON.stringify(error, null, 2));
    process.exit(1);
  }

  console.log('✅ INSERT成功');
  console.log('   作成されたプロンプト:', JSON.stringify(data, null, 2));

  // 4. SELECT確認
  console.log('\n📌 Step 4: SELECT確認（作成したデータを取得）');
  const { data: prompts, error: selectError } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', data.id);

  if (selectError) {
    console.error('❌ SELECT失敗:', selectError.message);
    process.exit(1);
  }

  console.log('✅ SELECT成功');
  console.log('   取得件数:', prompts.length);
  if (prompts.length > 0) {
    console.log('   データ:', JSON.stringify(prompts[0], null, 2));
  }

  // 5. 全件取得確認
  console.log('\n📌 Step 5: 全件取得確認');
  const { data: allPrompts, error: allError } = await supabase
    .from('prompts')
    .select('id, title, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (allError) {
    console.error('❌ 全件取得失敗:', allError.message);
    process.exit(1);
  }

  console.log('✅ 全件取得成功');
  console.log('   最新5件のプロンプト:');
  allPrompts.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.title} (${p.id})`);
  });

  console.log('\n✅ テスト完了');
}

testDirectInsert().catch((err) => {
  console.error('❌ 予期しないエラー:', err);
  process.exit(1);
});
