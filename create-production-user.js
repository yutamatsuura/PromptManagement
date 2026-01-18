/**
 * 本番用ユーザー作成スクリプト
 * Email: matsuura.yuta@gmail.com
 * Password: ia0110299
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// frontend/.env.local から環境変数を読み込む
dotenv.config({ path: join(__dirname, 'frontend', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 環境変数が設定されていません');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '設定済み' : '未設定');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createProductionUser() {
  try {
    console.log('🚀 本番用ユーザー作成開始...\n');

    const email = 'matsuura.yuta@gmail.com';
    const password = 'ia0110299';

    // ユーザー作成
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('❌ ユーザー作成失敗:', error.message);
      process.exit(1);
    }

    console.log('✅ 本番用ユーザー作成成功！');
    console.log('\n📧 ログイン情報:');
    console.log('  Email:', email);
    console.log('  Password:', password);
    console.log('\n👤 ユーザーID:', data.user?.id);
    
    if (data.user?.email_confirmed_at) {
      console.log('✅ メール確認済み');
    } else {
      console.log('\n⚠️  メール確認が必要な場合があります');
      console.log('   Supabaseの設定で確認メールを無効化している場合は不要です');
    }

  } catch (err) {
    console.error('❌ エラー:', err);
    process.exit(1);
  }
}

createProductionUser();
