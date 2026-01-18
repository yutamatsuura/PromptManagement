/**
 * プロンプト一覧データ管理フック
 * スライス3-B: プロンプト検索API統合
 */

import { useState, useEffect, useCallback } from 'react';
import { searchPrompts, getAllTags } from '@/services/api/promptSearchService';
import { deletePrompt as deletePromptAPI, updatePrompt } from '@/services/api/promptService';
import type { Prompt, PromptFilter } from '@/types';
import { logger } from '@/lib/logger';

export const usePromptList = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);

  // フィルタ状態
  const [filter, setFilter] = useState<PromptFilter>({
    searchQuery: '',
    tags: [],
    tagMode: 'OR',
    // 重要: 初期状態では全件表示（お気に入りフィルタなし）
    isFavorite: undefined,
  });

  /**
   * 全タグ取得
   */
  const fetchAllTags = useCallback(async () => {
    try {
      const tags = await getAllTags();
      setAllTags(tags);
      logger.info('All tags fetched successfully', { count: tags.length });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to fetch all tags', { error: error.message });
    }
  }, []);

  /**
   * プロンプト一覧取得（フィルタ適用）
   * サーバー側でフィルタリング実施
   */
  const fetchPrompts = useCallback(async () => {
    try {
      setLoading(true);
      logger.debug('Fetching prompts with filter', { filter, hookName: 'usePromptList' });

      const result = await searchPrompts(filter);
      setPrompts(result);

      logger.info('Prompts fetched successfully', {
        count: result.length,
        filter,
        hookName: 'usePromptList',
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to fetch prompts', {
        error: error.message,
        hookName: 'usePromptList',
      });
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  /**
   * プロンプト削除
   */
  const deletePrompt = useCallback(async (id: string) => {
    try {
      logger.debug('Deleting prompt', { id });
      await deletePromptAPI(id);
      await fetchPrompts();

      logger.info('Prompt deleted successfully', { id });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to delete prompt', { error: error.message, id });
      throw error;
    }
  }, [fetchPrompts]);

  /**
   * お気に入りトグル
   */
  const toggleFavorite = useCallback(async (id: string) => {
    try {
      logger.debug('Toggling favorite', { id });

      const prompt = prompts.find(p => p.id === id);
      if (!prompt) {
        throw new Error('Prompt not found');
      }

      await updatePrompt(id, { is_favorite: !prompt.is_favorite });
      await fetchPrompts();

      logger.info('Favorite toggled successfully', { id, is_favorite: !prompt.is_favorite });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to toggle favorite', { error: error.message, id });
      throw error;
    }
  }, [prompts, fetchPrompts]);

  /**
   * フィルタ更新
   */
  const updateFilter = useCallback((newFilter: Partial<PromptFilter>) => {
    setFilter((prev: PromptFilter) => ({ ...prev, ...newFilter }));
  }, []);

  /**
   * フィルタリセット
   */
  const resetFilter = useCallback(() => {
    setFilter({
      searchQuery: '',
      tags: [],
      tagMode: 'OR',
      isFavorite: undefined,
    });
  }, []);

  // 初回マウント時
  useEffect(() => {
    logger.debug('Hook mounted', { hookName: 'usePromptList' });
    fetchAllTags();
  }, [fetchAllTags]);

  // フィルタ変更時に再検索
  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  return {
    prompts,
    loading,
    error,
    filter,
    allTags,
    updateFilter,
    resetFilter,
    deletePrompt,
    toggleFavorite,
    refetch: fetchPrompts,
  };
};
