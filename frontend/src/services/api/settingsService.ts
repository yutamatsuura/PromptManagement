/**
 * 設定ページサービス（Supabase実装）
 * スライス4: 統計・管理機能（統計情報、エクスポート、インポート、アカウント削除）
 *
 * 実データ主義: モックなし、実際のSupabaseデータベースを使用
 */

import { supabase } from '../../lib/supabase';
import type { Statistics, ExportData } from '../../types';

/**
 * タスク4.1: GET /api/statistics - 統計情報取得
 *
 * @returns 統計情報（総プロンプト数、タグ数、お気に入り数）
 */
export async function getStatistics(): Promise<Statistics> {
  // 認証ユーザー取得
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('ユーザーが認証されていません');
  }

  // プロンプト一覧取得
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('tags, is_favorite')
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`統計情報取得に失敗しました: ${error.message}`);
  }

  // 統計情報の計算
  const totalPrompts = prompts?.length || 0;
  const favoriteCount = prompts?.filter((p) => p.is_favorite).length || 0;

  // 全タグを抽出してユニーク化
  const allTags = new Set<string>();
  prompts?.forEach((prompt) => {
    prompt.tags?.forEach((tag: string) => allTags.add(tag));
  });

  return {
    total_prompts: totalPrompts,
    total_tags: allTags.size,
    favorite_count: favoriteCount,
  };
}

/**
 * タスク4.2: GET /api/export - データエクスポート
 *
 * @returns エクスポートデータ（JSON形式）
 */
export async function exportData(): Promise<ExportData> {
  // 認証ユーザー取得
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('ユーザーが認証されていません');
  }

  // 全プロンプト取得
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`データエクスポートに失敗しました: ${error.message}`);
  }

  // エクスポートデータ形式に変換
  return {
    version: '1.0',
    exported_at: new Date().toISOString(),
    prompts: prompts || [],
  };
}

/**
 * インポート結果インターフェース
 */
export interface ImportResult {
  success: boolean;
  imported_count: number;
  failed_count: number;
  errors?: string[];
}

/**
 * タスク4.3: POST /api/import - データインポート
 *
 * @param importData - インポートするデータ
 * @returns インポート結果
 */
export async function importData(importData: ExportData): Promise<ImportResult> {
  // 認証ユーザー取得
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('ユーザーが認証されていません');
  }

  // バリデーション
  if (!importData.version) {
    throw new Error('無効なインポートデータ形式: versionフィールドが必要です');
  }

  if (!Array.isArray(importData.prompts)) {
    throw new Error('無効なインポートデータ形式: promptsは配列である必要があります');
  }

  // 各プロンプトのバリデーションとユーザーID上書き
  const errors: string[] = [];
  const validPrompts: Array<{
    user_id: string;
    title: string;
    content: string;
    tags: string[];
    is_favorite: boolean;
  }> = [];

  importData.prompts.forEach((prompt, index) => {
    // 必須フィールド検証
    if (!prompt.title || !prompt.content) {
      errors.push(
        `プロンプト ${index + 1}: titleまたはcontentが不足しています`
      );
      return;
    }

    // ユーザーIDを現在のユーザーに上書き（セキュリティ）
    validPrompts.push({
      user_id: user.id,
      title: prompt.title,
      content: prompt.content,
      tags: prompt.tags || [],
      is_favorite: prompt.is_favorite ?? false,
    });
  });

  // バリデーションエラーがある場合
  if (errors.length > 0) {
    return {
      success: false,
      imported_count: 0,
      failed_count: importData.prompts.length,
      errors,
    };
  }

  // データベースへ一括挿入
  const { error: insertError } = await supabase
    .from('prompts')
    .insert(validPrompts);

  if (insertError) {
    return {
      success: false,
      imported_count: 0,
      failed_count: validPrompts.length,
      errors: [`データベース挿入エラー: ${insertError.message}`],
    };
  }

  return {
    success: true,
    imported_count: validPrompts.length,
    failed_count: 0,
  };
}

/**
 * タスク4.4: DELETE /api/account - アカウント削除
 *
 * この関数は以下の順序で処理を実行します:
 * 1. ユーザーの全プロンプトを削除
 * 2. Supabase Authでユーザーアカウントを削除
 *
 * 注意: この操作は取り消し不可能です
 */
export async function deleteAccount(): Promise<void> {
  // 認証ユーザー取得
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('ユーザーが認証されていません');
  }

  // Step 1: ユーザーの全プロンプトを削除
  const { error: deletePromptsError } = await supabase
    .from('prompts')
    .delete()
    .eq('user_id', user.id);

  if (deletePromptsError) {
    throw new Error(
      `プロンプト削除に失敗しました: ${deletePromptsError.message}`
    );
  }

  // Step 2: Supabase Authでユーザーアカウントを削除
  // 注意: この操作はクライアント側では制限されているため、
  // 実際のプロダクションではSupabase Edge Functionを使用する必要があります。
  // 現在は、ユーザー自身がアカウントを削除することはできないため、
  // signOutのみを実行します。
  const { error: signOutError } = await supabase.auth.signOut();

  if (signOutError) {
    throw new Error(`ログアウトに失敗しました: ${signOutError.message}`);
  }

  // 注意: 完全なアカウント削除はSupabaseの管理画面から手動で行う必要があります。
  // または、Supabase Edge Functionを使用してサーバーサイドで削除処理を実装します。
}
