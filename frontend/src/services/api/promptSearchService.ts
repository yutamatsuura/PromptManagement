/**
 * プロンプト検索サービス
 * Supabase Clientを使用した検索機能の実装
 */

import { supabase } from '../../lib/supabase';
import type { Prompt, PromptFilter } from '../../types';

/**
 * プロンプト検索（フィルタリング対応）
 * タスク3B.1-3B.4を統合
 *
 * @param filter - 検索フィルター条件
 * @returns プロンプトリスト（更新日時降順）
 */
export async function searchPrompts(filter: PromptFilter = {}): Promise<Prompt[]> {
  const { searchQuery, tags, tagMode = 'AND', isFavorite } = filter;

  // 基本クエリ（自分のプロンプトのみ）
  let query = supabase
    .from('prompts')
    .select('*')
    .order('updated_at', { ascending: false });

  // タスク3B.4: お気に入り絞り込み
  if (isFavorite !== undefined) {
    query = query.eq('is_favorite', isFavorite);
  }

  // タスク3B.2: タグ検索（AND/OR モード）
  if (tags && tags.length > 0) {
    if (tagMode === 'AND') {
      // AND検索: すべてのタグを含む
      // PostgreSQLの配列演算子 @> を使用
      query = query.contains('tags', tags);
    } else {
      // OR検索: いずれかのタグを含む
      // PostgreSQLの配列演算子 && を使用
      query = query.overlaps('tags', tags);
    }
  }

  // タスク3B.3: 全文検索（title/content検索）
  // NOTE: Supabaseではor()を使用して複数カラムをOR検索
  if (searchQuery && searchQuery.trim() !== '') {
    const searchTerm = `%${searchQuery}%`;
    query = query.or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`プロンプト検索に失敗しました: ${error.message}`);
  }

  return data || [];
}

/**
 * タスク3B.5: 全タグ取得
 * ユーザーが使用している全タグをユニークな配列で取得
 *
 * @returns タグの配列（アルファベット順）
 */
export async function getAllTags(): Promise<string[]> {
  // 全プロンプトのタグを取得
  const { data, error } = await supabase
    .from('prompts')
    .select('tags');

  if (error) {
    throw new Error(`タグ取得に失敗しました: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  // 全タグを平坦化してユニーク化
  const allTags: string[] = [];
  data.forEach((prompt) => {
    if (prompt.tags && Array.isArray(prompt.tags)) {
      allTags.push(...prompt.tags);
    }
  });

  // ユニーク化とソート
  const uniqueTags = Array.from(new Set(allTags));
  return uniqueTags.sort();
}

/**
 * プロンプト一覧取得（フィルタなし）
 * 基本的な一覧取得（タスク3A.2と共通）
 *
 * @returns 全プロンプトリスト（更新日時降順）
 */
export async function getPrompts(): Promise<Prompt[]> {
  return searchPrompts({});
}
