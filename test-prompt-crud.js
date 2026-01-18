/**
 * プロンプトCRUD機能 統合テスト（スライス3-A）
 *
 * 実データ主義に基づき、実際のSupabase環境でテストを実施
 * モックは一切使用しない
 *
 * テスト実行コマンド:
 * node test-prompt-crud.js
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
 * タスク3A.1: プロンプト作成テスト
 */
async function testCreatePrompt() {
  console.log('\n=== タスク3A.1: プロンプト作成テスト ===');

  const testPromptIds = [];

  try {
    // 認証ユーザー取得
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('ユーザーが認証されていません');
    }

    // プロンプト作成
    console.log('📝 プロンプト作成中...');
    const { data: newPrompt, error } = await supabase
      .from('prompts')
      .insert([
        {
          user_id: user.id,
          title: 'CRUD作成テスト',
          content: 'これはCRUD機能のテストプロンプトです',
          tags: ['テスト', 'CRUD'],
          is_favorite: false,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`プロンプト作成に失敗: ${error.message}`);
    }

    testPromptIds.push(newPrompt.id);
    console.log('✅ プロンプト作成成功');
    console.log(`   ID: ${newPrompt.id}`);
    console.log(`   タイトル: ${newPrompt.title}`);
    console.log(`   タグ: ${newPrompt.tags.join(', ')}`);

    // 検証: 作成されたデータを確認
    if (!newPrompt.id || !newPrompt.title || !newPrompt.content) {
      throw new Error('作成されたプロンプトに必須フィールドが不足しています');
    }

    return true;
  } catch (error) {
    console.error(`❌ プロンプト作成テスト失敗: ${error.message}`);
    return false;
  } finally {
    // クリーンアップ
    if (testPromptIds.length > 0) {
      await deleteTestPrompts(testPromptIds);
    }
  }
}

/**
 * タスク3A.2: プロンプト一覧取得テスト
 */
async function testGetPrompts() {
  console.log('\n=== タスク3A.2: プロンプト一覧取得テスト ===');

  const testPromptIds = [];

  try {
    // 認証ユーザー取得
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('ユーザーが認証されていません');
    }

    // テストデータ作成
    console.log('📝 テストデータ作成中...');
    const { data: prompt1 } = await supabase
      .from('prompts')
      .insert([
        {
          user_id: user.id,
          title: 'CRUD一覧テスト1',
          content: 'テストプロンプト1',
          tags: ['テスト'],
          is_favorite: false,
        },
      ])
      .select()
      .single();

    const { data: prompt2 } = await supabase
      .from('prompts')
      .insert([
        {
          user_id: user.id,
          title: 'CRUD一覧テスト2',
          content: 'テストプロンプト2',
          tags: ['テスト'],
          is_favorite: true,
        },
      ])
      .select()
      .single();

    testPromptIds.push(prompt1.id, prompt2.id);
    console.log('✅ テストデータ作成完了');

    // プロンプト一覧取得
    console.log('\n📊 プロンプト一覧取得テスト...');
    const { data: prompts, error } = await supabase
      .from('prompts')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`プロンプト一覧取得に失敗: ${error.message}`);
    }

    console.log(`✅ プロンプト一覧取得成功: ${prompts.length}件`);
    console.log(`   期待: 2件以上（テストデータ含む）`);

    // 検証: テストデータが含まれているか
    const foundPrompt1 = prompts.find(p => p.id === prompt1.id);
    const foundPrompt2 = prompts.find(p => p.id === prompt2.id);

    if (!foundPrompt1 || !foundPrompt2) {
      throw new Error('作成したテストデータが一覧に含まれていません');
    }

    return true;
  } catch (error) {
    console.error(`❌ プロンプト一覧取得テスト失敗: ${error.message}`);
    return false;
  } finally {
    // クリーンアップ
    if (testPromptIds.length > 0) {
      await deleteTestPrompts(testPromptIds);
    }
  }
}

/**
 * タスク3A.3: プロンプト更新テスト
 */
async function testUpdatePrompt() {
  console.log('\n=== タスク3A.3: プロンプト更新テスト ===');

  const testPromptIds = [];

  try {
    // 認証ユーザー取得
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('ユーザーが認証されていません');
    }

    // テストデータ作成
    console.log('📝 テストデータ作成中...');
    const { data: newPrompt } = await supabase
      .from('prompts')
      .insert([
        {
          user_id: user.id,
          title: 'CRUD更新テスト（更新前）',
          content: '更新前のコンテンツ',
          tags: ['テスト'],
          is_favorite: false,
        },
      ])
      .select()
      .single();

    testPromptIds.push(newPrompt.id);
    console.log('✅ テストデータ作成完了');

    // プロンプト更新
    console.log('\n🔄 プロンプト更新テスト...');
    const { data: updatedPrompt, error } = await supabase
      .from('prompts')
      .update({
        title: 'CRUD更新テスト（更新後）',
        content: '更新後のコンテンツ',
        tags: ['テスト', '更新'],
        is_favorite: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', newPrompt.id)
      .select()
      .single();

    if (error) {
      throw new Error(`プロンプト更新に失敗: ${error.message}`);
    }

    console.log('✅ プロンプト更新成功');
    console.log(`   更新前タイトル: ${newPrompt.title}`);
    console.log(`   更新後タイトル: ${updatedPrompt.title}`);
    console.log(`   お気に入り: ${newPrompt.is_favorite} → ${updatedPrompt.is_favorite}`);

    // 検証: 更新が反映されているか
    if (updatedPrompt.title !== 'CRUD更新テスト（更新後）') {
      throw new Error('タイトルが更新されていません');
    }
    if (updatedPrompt.is_favorite !== true) {
      throw new Error('お気に入りが更新されていません');
    }

    return true;
  } catch (error) {
    console.error(`❌ プロンプト更新テスト失敗: ${error.message}`);
    return false;
  } finally {
    // クリーンアップ
    if (testPromptIds.length > 0) {
      await deleteTestPrompts(testPromptIds);
    }
  }
}

/**
 * タスク3A.4: プロンプト削除テスト
 */
async function testDeletePrompt() {
  console.log('\n=== タスク3A.4: プロンプト削除テスト ===');

  try {
    // 認証ユーザー取得
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('ユーザーが認証されていません');
    }

    // テストデータ作成
    console.log('📝 テストデータ作成中...');
    const { data: newPrompt } = await supabase
      .from('prompts')
      .insert([
        {
          user_id: user.id,
          title: 'CRUD削除テスト',
          content: '削除されるプロンプト',
          tags: ['テスト'],
          is_favorite: false,
        },
      ])
      .select()
      .single();

    console.log('✅ テストデータ作成完了');
    console.log(`   削除対象ID: ${newPrompt.id}`);

    // プロンプト削除
    console.log('\n🗑️ プロンプト削除テスト...');
    const { error: deleteError } = await supabase
      .from('prompts')
      .delete()
      .eq('id', newPrompt.id);

    if (deleteError) {
      throw new Error(`プロンプト削除に失敗: ${deleteError.message}`);
    }

    console.log('✅ プロンプト削除成功');

    // 検証: 削除されたか確認
    console.log('\n🔍 削除確認...');
    const { data: deletedPrompt, error: selectError } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', newPrompt.id)
      .single();

    // 削除されていれば、selectエラーが発生するはず
    if (selectError && selectError.code === 'PGRST116') {
      console.log('✅ 削除確認完了（データが存在しない）');
      return true;
    } else if (deletedPrompt) {
      throw new Error('プロンプトが削除されていません');
    }

    return true;
  } catch (error) {
    console.error(`❌ プロンプト削除テスト失敗: ${error.message}`);
    return false;
  }
}

// ===== メイン実行 =====

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   プロンプトCRUD機能 統合テスト（スライス3-A）          ║');
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
    create: false,
    read: false,
    update: false,
    delete: false,
  };

  // テスト実行
  results.create = await testCreatePrompt();
  results.read = await testGetPrompts();
  results.update = await testUpdatePrompt();
  results.delete = await testDeletePrompt();

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
  console.log(`  ${results.create ? '✅' : '❌'} タスク3A.1: プロンプト作成`);
  console.log(`  ${results.read ? '✅' : '❌'} タスク3A.2: プロンプト一覧取得`);
  console.log(`  ${results.update ? '✅' : '❌'} タスク3A.3: プロンプト更新`);
  console.log(`  ${results.delete ? '✅' : '❌'} タスク3A.4: プロンプト削除`);

  if (passedCount === testCount) {
    console.log('\n🎉 全テスト成功！スライス3-Aの実装は正常に動作しています。');
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
