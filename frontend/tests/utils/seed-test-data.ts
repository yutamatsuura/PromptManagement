/**
 * E2Eテスト用データ投入スクリプト
 * E2E-LIST-003のためのテストデータを作成
 */

import { supabase } from '../../src/lib/supabase';

/**
 * テストデータの投入
 * E2E-LIST-003で必要なタグ付きプロンプトを作成
 */
export async function seedTestData() {
  try {
    // テストアカウントでログイン
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@promptmanagement.local',
      password: 'TestPass123!',
    });

    if (authError || !authData.user) {
      throw new Error(`ログイン失敗: ${authError?.message}`);
    }

    console.log('✅ テストアカウントでログイン成功');

    // 既存のテストデータを削除（クリーンアップ）
    const { error: deleteError } = await supabase
      .from('prompts')
      .delete()
      .like('title', '[E2E-TEST]%');

    if (deleteError) {
      console.warn('既存データ削除時の警告:', deleteError.message);
    }

    // テストデータ作成
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

    // ログアウト
    await supabase.auth.signOut();

    return insertedData;
  } catch (error) {
    console.error('❌ テストデータ投入失敗:', error);
    throw error;
  }
}

// スクリプトとして直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTestData()
    .then(() => {
      console.log('✅ 完了');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ エラー:', error);
      process.exit(1);
    });
}
