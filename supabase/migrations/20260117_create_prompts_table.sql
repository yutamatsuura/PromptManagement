-- prompts テーブル
CREATE TABLE prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title VARCHAR(200) NOT NULL,
  description VARCHAR(500),
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_prompts_user_id ON prompts(user_id);
CREATE INDEX idx_prompts_tags ON prompts USING GIN(tags);
CREATE INDEX idx_prompts_is_favorite ON prompts(is_favorite);

-- Row Level Security (RLS) ポリシー
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- SELECT: 自分のプロンプトのみ閲覧可能
CREATE POLICY "Users can view their own prompts"
  ON prompts FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: 認証済みユーザーのみ作成可能
CREATE POLICY "Users can create their own prompts"
  ON prompts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: 自分のプロンプトのみ更新可能
CREATE POLICY "Users can update their own prompts"
  ON prompts FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE: 自分のプロンプトのみ削除可能
CREATE POLICY "Users can delete their own prompts"
  ON prompts FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
