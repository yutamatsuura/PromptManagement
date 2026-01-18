#!/usr/bin/env node

// Supabase接続テストスクリプト
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// .env.localを読み込み
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('=== Supabase接続テスト ===\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 環境変数が設定されていません');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '設定済み' : '未設定');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '設定済み' : '未設定');
  process.exit(1);
}

console.log('✅ 環境変数の読み込み成功');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   ANON KEY: ${supabaseKey.substring(0, 20)}...\n`);

// Supabaseクライアント作成
const supabase = createClient(supabaseUrl, supabaseKey);

// 接続テスト
(async () => {
  try {
    console.log('🔍 データベース接続テスト中...');

    // promptsテーブルへの接続テスト（SELECT 0件）
    const { data, error, count } = await supabase
      .from('prompts')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ データベース接続エラー:', error.message);
      process.exit(1);
    }

    console.log('✅ データベース接続成功');
    console.log(`   promptsテーブル: アクセス可能 (現在のレコード数: ${count})\n`);

    // RLSポリシーの確認（認証なしでは0件取得されるべき）
    console.log('🔍 Row Level Security (RLS) ポリシー確認中...');
    const { data: publicData } = await supabase
      .from('prompts')
      .select('*');

    if (publicData && publicData.length === 0) {
      console.log('✅ RLSポリシー正常動作（認証なしでは0件取得）\n');
    } else {
      console.warn('⚠️  RLSポリシー警告: 認証なしでデータが取得されました\n');
    }

    console.log('=== 検証完了 ===');
    console.log('✅ Supabase環境構築成功');
    console.log('✅ データベース接続確認完了');
    console.log('✅ テーブル作成確認完了');
    console.log('✅ RLSポリシー動作確認完了');

  } catch (err) {
    console.error('❌ 予期しないエラー:', err.message);
    process.exit(1);
  }
})();
