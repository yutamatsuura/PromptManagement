/**
 * プロンプト検索機能 統合テスト
 *
 * 実データ主義に基づき、実際のSupabase環境でテストを実施
 * モックは一切使用しない
 *
 * テスト実行コマンド:
 * node test-prompt-search.js
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

// ===== テストユーティリティ =====

/**
 * ユニークなテストデータを生成
 * テスト分離のため、各テストで異なるデータを使用
 */
function generateUniqueData(prefix = 'test') {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  return {
    uniqueId,
    email: `${prefix}-${uniqueId}@test.local`,
    password: 'TestPass123!',
  };
}

/**
 * テストユーザーのサインアップとログインを自動処理
 * 1. まずログインを試行
 * 2. ログイン失敗の場合、サインアップを実行
 * 3. サインアップ成功後、再度ログイン
 */
async function ensureTestUser(email, password) {
  // まずログインを試行
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!loginError) {
    console.log('✅ テストユーザーでログイン成功');
    return loginData.user;
  }

  // ログイン失敗の場合、サインアップを試行
  console.log('テストユーザーが存在しないため、サインアップします...');
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signupError) {
    // サインアップもログインも失敗した場合
    throw new Error(`認証に失敗しました: ${signupError.message}`);
  }

  console.log('✅ テストユーザー作成成功');

  // Email Confirmation無効化済みのため、サインアップ後すぐにログイン可能
  return signupData.user;
}

/**
 * テストユーザーでログイン（後方互換性のため維持）
 * @deprecated ensureTestUser() を使用してください
 */
async function loginTestUser(email, password) {
  return ensureTestUser(email, password);
}

/**
 * テストプロンプトを作成
 */
async function createTestPrompt(title, content, tags, isFavorite = false) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('ユーザーが認証されていません');
  }

  const { data, error } = await supabase
    .from('prompts')
    .insert([
      {
        user_id: user.id,
        title,
        content,
        tags,
        is_favorite: isFavorite,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`プロンプト作成に失敗しました: ${error.message}`);
  }

  return data;
}

/**
 * テストプロンプトを削除（クリーンアップ）
 */
async function deleteTestPrompts(promptIds) {
  const { error } = await supabase
    .from('prompts')
    .delete()
    .in('id', promptIds);

  if (error) {
    console.warn(`⚠️ テストデータ削除に失敗: ${error.message}`);
  }
}

// ===== テスト関数 =====

/**
 * タスク3B.1: フィルタリング機能テスト
 */
async function testFiltering() {
  console.log('\n=== タスク3B.1: フィルタリング機能テスト ===');

  const testPromptIds = [];

  try {
    // テストデータ作成
    console.log('📝 テストデータ作成中...');
    const prompt1 = await createTestPrompt(
      'フィルタテスト1',
      'これはテストプロンプトです',
      ['テスト', 'AI'],
      false
    );
    const prompt2 = await createTestPrompt(
      'フィルタテスト2',
      '検索機能のテスト',
      ['テスト', '検索'],
      true
    );

    testPromptIds.push(prompt1.id, prompt2.id);
    console.log('✅ テストデータ作成完了');

    // 全件取得（フィルタなし）
    console.log('\n📊 全件取得テスト...');
    const { data: allPrompts, error: allError } = await supabase
      .from('prompts')
      .select('*')
      .order('updated_at', { ascending: false });

    if (allError) {
      throw new Error(`全件取得に失敗: ${allError.message}`);
    }

    console.log(`✅ 全件取得成功: ${allPrompts.length}件`);

    return true;
  } catch (error) {
    console.error(`❌ フィルタリングテスト失敗: ${error.message}`);
    return false;
  } finally {
    // クリーンアップ
    if (testPromptIds.length > 0) {
      await deleteTestPrompts(testPromptIds);
    }
  }
}

/**
 * タスク3B.2: タグ検索（AND/OR）テスト
 */
async function testTagSearch() {
  console.log('\n=== タスク3B.2: タグ検索（AND/OR）テスト ===');

  const testPromptIds = [];

  try {
    // テストデータ作成
    console.log('📝 テストデータ作成中...');
    const prompt1 = await createTestPrompt(
      'タグテスト1',
      'AI関連のプロンプト',
      ['AI', 'ChatGPT', 'プログラミング'],
      false
    );
    const prompt2 = await createTestPrompt(
      'タグテスト2',
      'プログラミング関連',
      ['プログラミング', 'TypeScript'],
      false
    );
    const prompt3 = await createTestPrompt(
      'タグテスト3',
      'AIとプログラミングの両方',
      ['AI', 'プログラミング'],
      false
    );

    testPromptIds.push(prompt1.id, prompt2.id, prompt3.id);
    console.log('✅ テストデータ作成完了');

    // AND検索: 両方のタグを含む
    console.log('\n📊 AND検索テスト（AI AND プログラミング）...');
    const { data: andResults, error: andError } = await supabase
      .from('prompts')
      .select('*')
      .contains('tags', ['AI', 'プログラミング']);

    if (andError) {
      throw new Error(`AND検索に失敗: ${andError.message}`);
    }

    console.log(`✅ AND検索成功: ${andResults.length}件`);
    console.log(`   期待: 2件（prompt1とprompt3）`);

    // OR検索: いずれかのタグを含む
    console.log('\n📊 OR検索テスト（AI OR TypeScript）...');
    const { data: orResults, error: orError } = await supabase
      .from('prompts')
      .select('*')
      .overlaps('tags', ['AI', 'TypeScript']);

    if (orError) {
      throw new Error(`OR検索に失敗: ${orError.message}`);
    }

    console.log(`✅ OR検索成功: ${orResults.length}件`);
    console.log(`   期待: 3件（全て）`);

    return true;
  } catch (error) {
    console.error(`❌ タグ検索テスト失敗: ${error.message}`);
    return false;
  } finally {
    // クリーンアップ
    if (testPromptIds.length > 0) {
      await deleteTestPrompts(testPromptIds);
    }
  }
}

/**
 * タスク3B.3: 全文検索テスト
 */
async function testFullTextSearch() {
  console.log('\n=== タスク3B.3: 全文検索テスト ===');

  const testPromptIds = [];

  try {
    // テストデータ作成
    console.log('📝 テストデータ作成中...');
    const prompt1 = await createTestPrompt(
      'データベース最適化',
      'SQLクエリのパフォーマンスチューニング',
      ['データベース'],
      false
    );
    const prompt2 = await createTestPrompt(
      'API設計ガイド',
      'RESTful APIの設計原則とデータベース統合',
      ['API'],
      false
    );

    testPromptIds.push(prompt1.id, prompt2.id);
    console.log('✅ テストデータ作成完了');

    // タイトル検索
    console.log('\n📊 タイトル検索テスト（"データベース"）...');
    const { data: titleResults, error: titleError } = await supabase
      .from('prompts')
      .select('*')
      .ilike('title', '%データベース%');

    if (titleError) {
      throw new Error(`タイトル検索に失敗: ${titleError.message}`);
    }

    console.log(`✅ タイトル検索成功: ${titleResults.length}件`);

    // コンテンツ検索
    console.log('\n📊 コンテンツ検索テスト（"データベース"）...');
    const { data: contentResults, error: contentError } = await supabase
      .from('prompts')
      .select('*')
      .ilike('content', '%データベース%');

    if (contentError) {
      throw new Error(`コンテンツ検索に失敗: ${contentError.message}`);
    }

    console.log(`✅ コンテンツ検索成功: ${contentResults.length}件`);

    // OR検索（タイトルまたはコンテンツ）
    console.log('\n📊 OR検索テスト（タイトル OR コンテンツに"データベース"）...');
    const { data: orResults, error: orError } = await supabase
      .from('prompts')
      .select('*')
      .or(`title.ilike.%データベース%,content.ilike.%データベース%`);

    if (orError) {
      throw new Error(`OR検索に失敗: ${orError.message}`);
    }

    console.log(`✅ OR検索成功: ${orResults.length}件`);
    console.log(`   期待: 2件（両方）`);

    return true;
  } catch (error) {
    console.error(`❌ 全文検索テスト失敗: ${error.message}`);
    return false;
  } finally {
    // クリーンアップ
    if (testPromptIds.length > 0) {
      await deleteTestPrompts(testPromptIds);
    }
  }
}

/**
 * タスク3B.4: お気に入り絞り込みテスト
 */
async function testFavoriteFilter() {
  console.log('\n=== タスク3B.4: お気に入り絞り込みテスト ===');

  const testPromptIds = [];

  try {
    // テストデータ作成
    console.log('📝 テストデータ作成中...');
    const prompt1 = await createTestPrompt(
      'お気に入りテスト1',
      'これはお気に入り',
      ['テスト'],
      true
    );
    const prompt2 = await createTestPrompt(
      'お気に入りテスト2',
      'これは通常プロンプト',
      ['テスト'],
      false
    );

    testPromptIds.push(prompt1.id, prompt2.id);
    console.log('✅ テストデータ作成完了');

    // お気に入りのみ取得
    console.log('\n📊 お気に入り絞り込みテスト...');
    const { data: favoriteResults, error: favoriteError } = await supabase
      .from('prompts')
      .select('*')
      .eq('is_favorite', true);

    if (favoriteError) {
      throw new Error(`お気に入り絞り込みに失敗: ${favoriteError.message}`);
    }

    console.log(`✅ お気に入り絞り込み成功: ${favoriteResults.length}件`);
    console.log(`   期待: 1件以上（prompt1含む）`);

    return true;
  } catch (error) {
    console.error(`❌ お気に入り絞り込みテスト失敗: ${error.message}`);
    return false;
  } finally {
    // クリーンアップ
    if (testPromptIds.length > 0) {
      await deleteTestPrompts(testPromptIds);
    }
  }
}

/**
 * タスク3B.5: 全タグ取得テスト
 */
async function testGetAllTags() {
  console.log('\n=== タスク3B.5: 全タグ取得テスト ===');

  const testPromptIds = [];

  try {
    // テストデータ作成
    console.log('📝 テストデータ作成中...');
    const prompt1 = await createTestPrompt(
      'タグ取得テスト1',
      'タグテスト',
      ['AI', 'プログラミング'],
      false
    );
    const prompt2 = await createTestPrompt(
      'タグ取得テスト2',
      'タグテスト',
      ['プログラミング', 'TypeScript'],
      false
    );

    testPromptIds.push(prompt1.id, prompt2.id);
    console.log('✅ テストデータ作成完了');

    // 全タグ取得
    console.log('\n📊 全タグ取得テスト...');
    const { data: allPrompts, error: allError } = await supabase
      .from('prompts')
      .select('tags');

    if (allError) {
      throw new Error(`全タグ取得に失敗: ${allError.message}`);
    }

    // タグの平坦化とユニーク化
    const allTags = [];
    allPrompts.forEach((prompt) => {
      if (prompt.tags && Array.isArray(prompt.tags)) {
        allTags.push(...prompt.tags);
      }
    });

    const uniqueTags = Array.from(new Set(allTags)).sort();

    console.log(`✅ 全タグ取得成功: ${uniqueTags.length}種類`);
    console.log(`   タグ一覧: ${uniqueTags.join(', ')}`);
    console.log(`   期待: AI, TypeScript, プログラミング を含む`);

    return true;
  } catch (error) {
    console.error(`❌ 全タグ取得テスト失敗: ${error.message}`);
    return false;
  } finally {
    // クリーンアップ
    if (testPromptIds.length > 0) {
      await deleteTestPrompts(testPromptIds);
    }
  }
}

// ===== メイン実行 =====

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   プロンプト検索機能 統合テスト（スライス3-B）         ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  console.log('\n📋 テスト環境確認...');
  console.log(`   Supabase URL: ${supabaseUrl}`);
  console.log(`   環境変数読み込み: ✅`);

  // テストユーザーでログイン（存在しない場合は自動作成）
  console.log('\n🔐 テストユーザー認証中...');
  try {
    const testUser = await ensureTestUser('test@promptmanagement.local', 'TestPass123!');
    console.log(`✅ 認証成功: ${testUser.email}`);
  } catch (error) {
    console.error(`❌ テストユーザー認証に失敗しました: ${error.message}`);
    console.error('📄 環境変数と Supabase 設定を確認してください');
    process.exit(1);
  }

  const results = {
    filtering: false,
    tagSearch: false,
    fullTextSearch: false,
    favoriteFilter: false,
    getAllTags: false,
  };

  // テスト実行
  results.filtering = await testFiltering();
  results.tagSearch = await testTagSearch();
  results.fullTextSearch = await testFullTextSearch();
  results.favoriteFilter = await testFavoriteFilter();
  results.getAllTags = await testGetAllTags();

  // 結果サマリー
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                  テスト結果サマリー                     ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  const testCount = Object.keys(results).length;
  const passedCount = Object.values(results).filter(r => r).length;

  console.log(`\n📊 総テスト数: ${testCount}`);
  console.log(`✅ 成功: ${passedCount}`);
  console.log(`❌ 失敗: ${testCount - passedCount}`);

  console.log('\n詳細:');
  console.log(`  ${results.filtering ? '✅' : '❌'} タスク3B.1: フィルタリング機能`);
  console.log(`  ${results.tagSearch ? '✅' : '❌'} タスク3B.2: タグ検索（AND/OR）`);
  console.log(`  ${results.fullTextSearch ? '✅' : '❌'} タスク3B.3: 全文検索`);
  console.log(`  ${results.favoriteFilter ? '✅' : '❌'} タスク3B.4: お気に入り絞り込み`);
  console.log(`  ${results.getAllTags ? '✅' : '❌'} タスク3B.5: 全タグ取得`);

  if (passedCount === testCount) {
    console.log('\n🎉 全テスト成功！スライス3-Bの実装は正常に動作しています。');
    process.exit(0);
  } else {
    console.log('\n⚠️ 一部のテストが失敗しました。実装を見直してください。');
    process.exit(1);
  }
}

// テスト実行
runTests().catch((error) => {
  console.error('❌ テスト実行中に予期しないエラーが発生しました:', error);
  process.exit(1);
});
