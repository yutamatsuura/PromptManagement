/**
 * PromptFormPage
 * プロンプト作成・編集ページ（P-003）
 * スライス3-A統合: 実API使用
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Switch,
  Chip,
  InputLabel,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { MainLayout } from '@/layouts/MainLayout';
import {
  createPrompt,
  getPromptById,
  updatePrompt,
} from '@/services/api/promptService';
import { getAllTags } from '@/services/api/promptSearchService';
import type { PromptInput } from '@/types';
import { logger } from '@/lib/logger';

export function PromptFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  // フォーム状態
  const [formData, setFormData] = useState<PromptInput>({
    title: '',
    content: '',
    tags: [],
    is_favorite: false,
  });

  // タグ入力用
  const [tagInput, setTagInput] = useState('');

  // 既存タグ一覧
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // エラー・成功メッセージ
  const [error, setError] = useState<string | null>(null);

  // ローディング状態
  const [loading, setLoading] = useState(false);

  // 文字数カウント
  const titleLength = formData.title.length;
  const contentLength = formData.content.length;

  // 初回マウント時: 既存タグ読み込み
  useEffect(() => {
    loadAvailableTags();
  }, []);

  // 編集モード時のデータ読み込み
  useEffect(() => {
    if (isEditMode && id) {
      loadPromptData(id);
    }
  }, [id, isEditMode]);

  /**
   * 既存タグ一覧読み込み
   */
  const loadAvailableTags = async () => {
    try {
      const tags = await getAllTags();
      setAvailableTags(tags);
      logger.info('Available tags loaded', { count: tags.length });
    } catch (err) {
      logger.error('Failed to load available tags', { error: err });
      // エラーでもフォームは使えるので、エラー表示はしない
    }
  };

  /**
   * プロンプトデータ読み込み
   * スライス3-A: GET /api/prompts/:id
   */
  const loadPromptData = async (promptId: string) => {
    try {
      setLoading(true);
      logger.debug('Loading prompt data', { id: promptId });
      const prompt = await getPromptById(promptId);

      setFormData({
        title: prompt.title,
        description: prompt.description,
        content: prompt.content,
        tags: prompt.tags,
        is_favorite: prompt.is_favorite,
      });
      logger.info('Prompt data loaded successfully', { id: promptId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'データの読み込みに失敗しました';
      setError(errorMessage);
      logger.error('Failed to load prompt data', { error: errorMessage, id: promptId });
    } finally {
      setLoading(false);
    }
  };

  /**
   * フォーム送信
   * スライス3-A: POST /api/prompts または PUT /api/prompts/:id
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // バリデーション
    if (!formData.title.trim()) {
      setError('タイトルは必須です');
      return;
    }
    if (!formData.content.trim()) {
      setError('プロンプト本文は必須です');
      return;
    }

    try {
      logger.debug('Submitting form', { isEditMode, id });
      setError(null);

      if (isEditMode && id) {
        // 編集
        await updatePrompt(id, formData);
        logger.info('Prompt updated successfully', { id });
      } else {
        // 新規作成
        await createPrompt(formData);
        logger.info('Prompt created successfully');
      }

      // P-002（プロンプト一覧）へリダイレクト
      navigate('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '保存に失敗しました';
      setError(errorMessage);
      logger.error('Failed to save prompt', { error: errorMessage, isEditMode, id });
    }
  };

  /**
   * キャンセル処理
   */
  const handleCancel = () => {
    logger.debug('Form cancelled');
    navigate('/');
  };

  /**
   * タグ追加
   */
  const handleTagAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newTag = tagInput.trim().toUpperCase();

      if (!newTag) return;
      if (formData.tags.length >= 10) {
        setError('タグは最大10個までです');
        return;
      }
      if (formData.tags.includes(newTag)) {
        setError('このタグは既に追加されています');
        return;
      }

      setFormData({
        ...formData,
        tags: [...formData.tags, newTag],
      });
      setTagInput('');
      setError(null);
      logger.debug('Tag added', { tag: newTag });
    }
  };

  /**
   * タグ削除
   */
  const handleTagDelete = (tagToDelete: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToDelete),
    });
    logger.debug('Tag deleted', { tag: tagToDelete });
  };

  /**
   * 既存タグから追加
   */
  const handleExistingTagClick = (tag: string) => {
    if (formData.tags.length >= 10) {
      setError('タグは最大10個までです');
      return;
    }
    if (formData.tags.includes(tag)) {
      setError('このタグは既に追加されています');
      return;
    }

    setFormData({
      ...formData,
      tags: [...formData.tags, tag],
    });
    setError(null);
    logger.debug('Existing tag added', { tag });
  };

  if (loading) {
    return (
      <MainLayout>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Container maxWidth="md" sx={{ py: 5 }}>
        {/* ページタイトル */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 900,
            letterSpacing: 2,
            textTransform: 'uppercase',
            mb: 4,
            borderBottom: 4,
            borderColor: 'primary.main',
            pb: 2,
          }}
        >
          {isEditMode ? 'プロンプト編集' : 'プロンプト作成'}
        </Typography>

        {/* エラーメッセージ */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* フォーム */}
        <Paper
          component="form"
          onSubmit={handleSubmit}
          sx={{
            border: 4,
            borderColor: 'white',
            borderRadius: 1,
            p: 4,
          }}
        >
          {/* タイトル入力 */}
          <Box mb={3}>
            <InputLabel
              sx={{
                mb: 1,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: 'white',
              }}
            >
              タイトル <span style={{ color: '#FF1744' }}>*</span>
            </InputLabel>
            <TextField
              variant="outlined"
              fullWidth
              required
              placeholder="プロンプトタイトルを入力してください（最大200文字）..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              inputProps={{ maxLength: 200 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderWidth: 4,
                  backgroundColor: '#003A5C',
                  color: 'white',
                  fontWeight: 600,
                },
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              align="right"
              sx={{ mt: 1, display: 'block' }}
            >
              {titleLength} / 200
            </Typography>
          </Box>

          {/* プロンプト本文入力 */}
          <Box mb={3}>
            <InputLabel
              sx={{
                mb: 1,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: 'white',
              }}
            >
              プロンプト本文 <span style={{ color: '#FF1744' }}>*</span>
            </InputLabel>
            <TextField
              variant="outlined"
              fullWidth
              multiline
              rows={12}
              required
              placeholder="プロンプト本文を入力してください（最大100000文字）..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              inputProps={{ maxLength: 100000 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderWidth: 4,
                  backgroundColor: '#003A5C',
                  color: '#E1F5FE',
                  fontFamily: 'monospace',
                  lineHeight: 1.8,
                },
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              align="right"
              sx={{ mt: 1, display: 'block' }}
            >
              {contentLength} / 100000
            </Typography>
          </Box>

          {/* タグ入力 */}
          <Box mb={3}>
            <InputLabel
              sx={{
                mb: 1,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: 'white',
              }}
            >
              タグ（最大10個）
            </InputLabel>
            <TextField
              variant="outlined"
              fullWidth
              placeholder="タグを入力してください...（Enterで追加）"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagAdd}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderWidth: 4,
                  backgroundColor: '#003A5C',
                  color: 'white',
                  fontWeight: 600,
                },
              }}
            />

            {/* 選択済みタグ表示エリア */}
            {formData.tags.length > 0 && (
              <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    onDelete={() => handleTagDelete(tag)}
                    sx={{
                      borderWidth: 3,
                      borderColor: 'primary.main',
                      fontWeight: 900,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                    }}
                  />
                ))}
              </Box>
            )}

            {/* よく使うタグ（既存タグから選択） */}
            {availableTags.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    mb: 1,
                    display: 'block',
                  }}
                >
                  よく使うタグから選択:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {availableTags
                    .filter((tag) => !formData.tags.includes(tag))
                    .map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                        clickable
                        onClick={() => handleExistingTagClick(tag)}
                        sx={{
                          borderWidth: 2,
                          borderColor: 'white',
                          backgroundColor: '#003A5C',
                          color: 'white',
                          fontWeight: 600,
                          letterSpacing: 0.5,
                          '&:hover': {
                            backgroundColor: '#004A6C',
                            borderColor: 'primary.main',
                          },
                        }}
                      />
                    ))}
                </Box>
              </Box>
            )}
          </Box>

          {/* お気に入り設定 */}
          <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <InputLabel
              sx={{
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: 'white',
              }}
            >
              お気に入り
            </InputLabel>
            <Switch
              checked={formData.is_favorite}
              onChange={(e) => setFormData({ ...formData, is_favorite: e.target.checked })}
              sx={{
                '& .MuiSwitch-switchBase': {
                  '&.Mui-checked': {
                    color: 'white',
                    '& + .MuiSwitch-track': {
                      backgroundColor: 'primary.main',
                    },
                  },
                },
                '& .MuiSwitch-track': {
                  border: '3px solid white',
                  backgroundColor: '#003A5C',
                },
              }}
            />
          </Box>

          {/* ボタンエリア */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={handleCancel}
              sx={{
                py: 2,
                px: 3.5,
                borderWidth: 4,
                fontWeight: 900,
                letterSpacing: 2,
                textTransform: 'uppercase',
                '&:hover': {
                  borderWidth: 4,
                  backgroundColor: 'white',
                  color: 'background.default',
                },
              }}
            >
              キャンセル
            </Button>

            <Button
              variant="contained"
              color="primary"
              type="submit"
              fullWidth
              sx={{
                py: 2,
                px: 3.5,
                borderWidth: 4,
                borderColor: 'primary.main',
                fontWeight: 900,
                letterSpacing: 2,
                textTransform: 'uppercase',
                '&:hover': {
                  backgroundColor: 'white',
                  borderColor: 'primary.main',
                  color: 'primary.main',
                },
              }}
            >
              保存
            </Button>
          </Box>
        </Paper>
      </Container>
    </MainLayout>
  );
}
