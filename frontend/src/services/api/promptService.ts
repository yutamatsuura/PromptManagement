/**
 * プロンプトCRUDサービス（Supabase実装）
 * スライス3-A: プロンプト作成・読取・更新・削除
 *
 * 実データ主義: モックなし、実際のSupabaseデータベースを使用
 */

import { supabase } from '../../lib/supabase';
import type { Prompt, PromptInput } from '../../types';

/**
 * タスク3A.1: プロンプト作成
 *
 * @param data - プロンプト入力データ
 * @returns 作成されたプロンプト
 */
export async function createPrompt(data: PromptInput): Promise<Prompt> {
  // 認証ユーザー取得
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('ユーザーが認証されていません');
  }

  // プロンプト作成
  const { data: prompt, error } = await supabase
    .from('prompts')
    .insert([
      {
        user_id: user.id,
        title: data.title,
        description: data.description,
        content: data.content,
        tags: data.tags,
        is_favorite: data.is_favorite,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`プロンプト作成に失敗しました: ${error.message}`);
  }

  return prompt;
}

/**
 * タスク3A.2: プロンプト一覧取得
 *
 * @returns プロンプト一覧（更新日時降順）
 */
export async function getPrompts(): Promise<Prompt[]> {
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`プロンプト一覧取得に失敗しました: ${error.message}`);
  }

  return data || [];
}

/**
 * タスク3A.2-補助: 特定プロンプト取得
 *
 * @param id - プロンプトID
 * @returns プロンプト
 */
export async function getPromptById(id: string): Promise<Prompt> {
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`プロンプト取得に失敗しました: ${error.message}`);
  }

  return data;
}

/**
 * タスク3A.3: プロンプト更新
 *
 * @param id - プロンプトID
 * @param data - 更新データ
 * @returns 更新されたプロンプト
 */
export async function updatePrompt(
  id: string,
  data: Partial<PromptInput>
): Promise<Prompt> {
  const { data: prompt, error } = await supabase
    .from('prompts')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`プロンプト更新に失敗しました: ${error.message}`);
  }

  return prompt;
}

/**
 * タスク3A.4: プロンプト削除
 *
 * @param id - プロンプトID
 */
export async function deletePrompt(id: string): Promise<void> {
  const { error } = await supabase
    .from('prompts')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`プロンプト削除に失敗しました: ${error.message}`);
  }
}
