/**
 * プロンプト一覧・検索ページ（P-002）
 * HTMLモックアップのMUI変換コメントに厳密に従った実装
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { MainLayout } from '@/layouts/MainLayout';
import { usePromptList } from '@/hooks/usePromptList';
import { logger } from '@/lib/logger';
import type { Prompt } from '@/types';
import { useNotificationStore } from '@/stores/notificationStore';

export const PromptListPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    prompts,
    loading,
    filter,
    allTags,
    updateFilter,
    deletePrompt,
  } = usePromptList();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { showSuccess, showError } = useNotificationStore();

  /**
   * タグフィルタトグル
   */
  const handleTagToggle = (tag: string) => {
    const currentTags = filter.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t: string) => t !== tag)
      : [...currentTags, tag];

    updateFilter({ tags: newTags });
  };

  /**
   * お気に入りフィルタトグル
   */
  const handleFavoriteToggle = () => {
    updateFilter({ isFavorite: !filter.isFavorite });
  };

  /**
   * プロンプトコピー
   */
  const handleCopy = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);

      // 2秒後にリセット
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);

      logger.info('Prompt copied to clipboard', { id });
      showSuccess('プロンプトをクリップボードにコピーしました');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to copy prompt', { error: error.message, id });
      showError('コピーに失敗しました。HTTPS環境でご利用ください。');
    }
  };

  /**
   * プロンプト削除
   */
  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`「${title}」を削除してもよろしいですか?`)) {
      try {
        await deletePrompt(id);
        showSuccess('プロンプトを削除しました');
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error('Failed to delete prompt', { error: error.message, id });
        showError('削除に失敗しました。');
      }
    }
  };

  /**
   * 編集ページへ遷移
   */
  const handleEdit = (id: string) => {
    navigate(`/prompts/edit/${id}`);
  };

  if (loading) {
    return (
      <MainLayout>
        <Container maxWidth="xl" sx={{ py: 5 }}>
          <Typography>Loading...</Typography>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* MUI: Container maxWidth="xl" sx={{ py: 3 }} */}
      <Container maxWidth="xl" sx={{ py: 3 }}>

        {/* 検索・フィルタセクション（折りたたみ式） */}
        <Accordion
          defaultExpanded={false}
          sx={{
            border: 3,
            borderColor: 'white',
            borderRadius: 1,
            mb: 2,
            '&:before': {
              display: 'none',
            },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
            sx={{
              backgroundColor: '#002140',
              borderBottom: 3,
              borderColor: 'primary.main',
              '& .MuiAccordionSummary-content': {
                margin: '12px 0',
              },
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                letterSpacing: 1,
                color: 'white',
                fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
              }}
            >
              検索・フィルター
            </Typography>
          </AccordionSummary>

          <AccordionDetails sx={{ p: 2 }}>
            {/* テキスト検索 */}
            <TextField
              variant="outlined"
              fullWidth
              size="small"
              placeholder="タイトル、説明、または内容で検索..."
              value={filter.searchQuery || ''}
              onChange={(e) => updateFilter({ searchQuery: e.target.value })}
              sx={{
                mb: 1.5,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#003A5C',
                  color: 'white',
                  '& fieldset': {
                    borderWidth: 3,
                  },
                },
                '& .MuiInputBase-input::placeholder': {
                  color: 'white',
                  opacity: 0.7,
                },
                '& .MuiInputBase-input': {
                  fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
                },
              }}
            />

            {/* タグフィルター */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
              {allTags.map((tag) => {
                const isActive = filter.tags?.includes(tag) || false;

                return (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    variant="outlined"
                    clickable
                    onClick={() => handleTagToggle(tag)}
                    sx={{
                      borderWidth: 2,
                      borderColor: isActive ? 'primary.main' : 'white',
                      backgroundColor: isActive ? 'primary.main' : '#003A5C',
                      color: isActive ? '#001529' : 'white',
                      fontWeight: 600,
                      letterSpacing: 0.5,
                      fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
                      '&:hover': {
                        backgroundColor: isActive ? 'primary.dark' : '#004A6C',
                      },
                    }}
                  />
                );
              })}
            </Box>

            {/* お気に入り絞り込み */}
            <Button
              variant="outlined"
              size="small"
              onClick={handleFavoriteToggle}
              sx={{
                borderWidth: 3,
                borderColor: filter.isFavorite ? 'primary.main' : 'white',
                backgroundColor: filter.isFavorite ? 'primary.main' : '#003A5C',
                color: filter.isFavorite ? '#001529' : 'white',
                fontWeight: 700,
                px: 2,
                py: 1,
                fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
                '&:hover': {
                  backgroundColor: filter.isFavorite ? 'primary.dark' : '#004A6C',
                  borderColor: filter.isFavorite ? 'primary.main' : 'white',
                },
              }}
            >
              ★ お気に入りのみ
            </Button>
          </AccordionDetails>
        </Accordion>

        {/* プロンプト一覧テーブル */}
        <TableContainer
          component={Paper}
          sx={{
            border: 3,
            borderColor: 'white',
            borderRadius: 1,
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#002140' }}>
                <TableCell
                  sx={{
                    color: 'white',
                    fontWeight: 700,
                    borderBottom: 3,
                    borderColor: 'primary.main',
                    py: 1,
                    width: '3%',
                    fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
                  }}
                >
                  ★
                </TableCell>
                <TableCell
                  sx={{
                    color: 'white',
                    fontWeight: 700,
                    borderBottom: 3,
                    borderColor: 'primary.main',
                    py: 1,
                    width: '20%',
                    fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
                  }}
                >
                  タイトル
                </TableCell>
                <TableCell
                  sx={{
                    color: 'white',
                    fontWeight: 700,
                    borderBottom: 3,
                    borderColor: 'primary.main',
                    py: 1,
                    width: '55%',
                    fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
                  }}
                >
                  プロンプト
                </TableCell>
                <TableCell
                  sx={{
                    color: 'white',
                    fontWeight: 700,
                    borderBottom: 3,
                    borderColor: 'primary.main',
                    py: 1,
                    width: '10%',
                    fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
                  }}
                >
                  タグ
                </TableCell>
                <TableCell
                  sx={{
                    color: 'white',
                    fontWeight: 700,
                    borderBottom: 3,
                    borderColor: 'primary.main',
                    py: 1,
                    width: '12%',
                    fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
                  }}
                >
                  操作
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {prompts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 3, fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif' }}>
                    プロンプトが見つかりませんでした。
                  </TableCell>
                </TableRow>
              ) : (
                prompts.map((prompt: Prompt) => (
                  <TableRow
                    key={prompt.id}
                    sx={{
                      '&:hover': { backgroundColor: '#002140' },
                      borderBottom: 2,
                      borderColor: 'white',
                    }}
                  >
                    {/* お気に入り */}
                    <TableCell sx={{ py: 1, borderBottom: 2, borderColor: 'white' }}>
                      {prompt.is_favorite && (
                        <Chip
                          label="★"
                          size="small"
                          color="primary"
                          sx={{
                            borderWidth: 2,
                            borderColor: 'white',
                            fontWeight: 700,
                            height: 24,
                          }}
                        />
                      )}
                    </TableCell>

                    {/* タイトル */}
                    <TableCell sx={{ py: 1, borderBottom: 2, borderColor: 'white' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
                        }}
                      >
                        {prompt.title}
                      </Typography>
                    </TableCell>

                    {/* プロンプト本文（コピー可能） */}
                    <TableCell
                      sx={{
                        py: 1,
                        borderBottom: 2,
                        borderColor: 'white',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: '#003A5C',
                        },
                      }}
                      onClick={() => handleCopy(prompt.id, prompt.content)}
                      title="クリックでコピー"
                    >
                      <Box
                        component="pre"
                        sx={{
                          margin: 0,
                          padding: 1,
                          fontFamily: '"Source Code Pro", "Consolas", "Courier New", monospace',
                          fontSize: '0.75rem',
                          lineHeight: 1.4,
                          maxHeight: 60,
                          overflowY: 'auto',
                          color: '#E1F5FE',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          backgroundColor: copiedId === prompt.id ? '#004A6C' : 'transparent',
                          transition: 'background-color 0.2s',
                        }}
                      >
                        {prompt.content}
                      </Box>
                    </TableCell>

                    {/* タグ */}
                    <TableCell sx={{ py: 1, borderBottom: 2, borderColor: 'white' }}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {prompt.tags.map((tag: string) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            sx={{
                              borderWidth: 1,
                              borderColor: 'primary.main',
                              fontWeight: 600,
                              height: 18,
                              fontSize: '0.65rem',
                              fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
                            }}
                          />
                        ))}
                      </Box>
                    </TableCell>

                    {/* アクション */}
                    <TableCell sx={{ py: 1, borderBottom: 2, borderColor: 'white' }}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleEdit(prompt.id)}
                          sx={{
                            minWidth: 50,
                            py: 0.25,
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
                          }}
                        >
                          編集
                        </Button>

                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          onClick={() => handleDelete(prompt.id, prompt.title)}
                          sx={{
                            minWidth: 50,
                            py: 0.25,
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
                          }}
                        >
                          削除
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

      </Container>
    </MainLayout>
  );
};

export default PromptListPage;
