/**
 * E2Eテスト用データ投入スクリプト（Node.js版）
 * 環境変数を.env.localから読み込んでSupabaseに接続
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// .env.localを読み込む
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env.local') });

// 環境変数確認
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 環境変数が設定されていません');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
  process.exit(1);
}

// Supabaseクライアント作成
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedTestData() {
  try {
    console.log('🔐 テストアカウントでログイン中...');

    // テストアカウントでログイン
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@promptmanagement.local',
      password: 'TestPass123!',
    });

    if (authError || !authData.user) {
      throw new Error(`ログイン失敗: ${authError?.message}`);
    }

    console.log('✅ ログイン成功');
    console.log(`   ユーザーID: ${authData.user.id}`);

    // 既存のテストデータを削除（クリーンアップ）
    console.log('🗑️  既存のテストデータを削除中...');
    const { error: deleteError } = await supabase
      .from('prompts')
      .delete()
      .like('title', '[E2E-TEST]%');

    if (deleteError) {
      console.warn('⚠️  既存データ削除時の警告:', deleteError.message);
    } else {
      console.log('✅ 既存データ削除完了');
    }

    // テストデータ作成
    console.log('📝 テストデータ投入中...');
    const testPrompts = [
      {
        title: '[E2E-TEST] AI関連のプロンプト',
        description: 'AI技術に関するプロンプト',
        content: 'あなたはAI開発の専門家です。最新のAI技術について説明してください。',
        tags: ['AI'],
        is_favorite: false,
        user_id: authData.user.id,
      },
      {
        title: '[E2E-TEST] プログラミング学習プロンプト',
        description: 'プログラミング教育用プロンプト',
        content: 'プログラミング初心者に向けて、基礎から丁寧に教えてください。',
        tags: ['プログラミング'],
        is_favorite: false,
        user_id: authData.user.id,
      },
      {
        title: '[E2E-TEST] AI×プログラミングプロンプト',
        description: 'AI開発とプログラミングの両方',
        content: 'AIを活用したプログラミングについて解説してください。',
        tags: ['AI', 'プログラミング'],
        is_favorite: true,
        user_id: authData.user.id,
      },
      {
        title: '[E2E-TEST] データベース設計プロンプト',
        description: 'データベース設計に関するプロンプト',
        content: 'PostgreSQLを使ったデータベース設計のベストプラクティスを教えてください。',
        tags: ['データベース', 'プログラミング'],
        is_favorite: false,
        user_id: authData.user.id,
      },
    ];

    const { data: insertedData, error: insertError } = await supabase
      .from('prompts')
      .insert(testPrompts)
      .select();

    if (insertError) {
      throw new Error(`テストデータ投入失敗: ${insertError.message}`);
    }

    console.log('✅ テストデータ投入成功');
    console.log(`   作成件数: ${insertedData?.length || 0}件`);
    console.log('   タグ: AI, プログラミング, データベース');
    console.log('');
    console.log('📊 投入データ詳細:');
    insertedData?.forEach((prompt, index) => {
      console.log(`   ${index + 1}. ${prompt.title}`);
      console.log(`      タグ: ${prompt.tags.join(', ')}`);
      console.log(`      お気に入り: ${prompt.is_favorite ? 'はい' : 'いいえ'}`);
    });

    // ログアウト
    await supabase.auth.signOut();
    console.log('');
    console.log('✅ 完了');

    return insertedData;
  } catch (error) {
    console.error('❌ エラー:', error);
    throw error;
  }
}

// スクリプト実行
seedTestData()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ スクリプト実行失敗:', error);
    process.exit(1);
  });
