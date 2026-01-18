-- E2E-LIST-003用のテストデータ投入
-- テストアカウント: test@promptmanagement.local

-- 既存のテストデータを削除（クリーンアップ）
DELETE FROM prompts WHERE title LIKE '[E2E-TEST]%';

-- テストデータ投入
INSERT INTO prompts (title, description, content, tags, is_favorite, user_id, created_at, updated_at)
VALUES
  (
    '[E2E-TEST] AI関連のプロンプト',
    'AI技術に関するプロンプト',
    'あなたはAI開発の専門家です。最新のAI技術について説明してください。',
    ARRAY['AI'],
    false,
    (SELECT id FROM auth.users WHERE email = 'test@promptmanagement.local' LIMIT 1),
    NOW(),
    NOW()
  ),
  (
    '[E2E-TEST] プログラミング学習プロンプト',
    'プログラミング教育用プロンプト',
    'プログラミング初心者に向けて、基礎から丁寧に教えてください。',
    ARRAY['プログラミング'],
    false,
    (SELECT id FROM auth.users WHERE email = 'test@promptmanagement.local' LIMIT 1),
    NOW(),
    NOW()
  ),
  (
    '[E2E-TEST] AI×プログラミングプロンプト',
    'AI開発とプログラミングの両方',
    'AIを活用したプログラミングについて解説してください。',
    ARRAY['AI', 'プログラミング'],
    true,
    (SELECT id FROM auth.users WHERE email = 'test@promptmanagement.local' LIMIT 1),
    NOW(),
    NOW()
  ),
  (
    '[E2E-TEST] データベース設計プロンプト',
    'データベース設計に関するプロンプト',
    'PostgreSQLを使ったデータベース設計のベストプラクティスを教えてください。',
    ARRAY['データベース', 'プログラミング'],
    false,
    (SELECT id FROM auth.users WHERE email = 'test@promptmanagement.local' LIMIT 1),
    NOW(),
    NOW()
  );
