#!/bin/bash

# API統合完了検証スクリプト
# 実施日: 2026-01-18
# 目的: モック削除後の実API接続確認

echo "=================================="
echo "API統合完了検証スクリプト"
echo "=================================="
echo ""

# カラー定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. モック残存確認
echo "📋 1. モック残存確認"
echo "-----------------------------------"

echo -n "  @MOCK_TO_APIマーク: "
MOCK_MARKERS=$(grep -r "@MOCK_TO_API" frontend/src/ 2>/dev/null | wc -l)
if [ "$MOCK_MARKERS" -eq 0 ]; then
  echo -e "${GREEN}0件 ✓${NC}"
else
  echo -e "${RED}${MOCK_MARKERS}件 ✗${NC}"
fi

echo -n "  モックファイル: "
MOCK_FILES=$(find frontend/src -name "*mock*.ts" -o -name "*Mock*.ts" 2>/dev/null | wc -l)
if [ "$MOCK_FILES" -eq 0 ]; then
  echo -e "${GREEN}0件 ✓${NC}"
else
  echo -e "${RED}${MOCK_FILES}件 ✗${NC}"
fi

echo -n "  モック環境変数参照: "
MOCK_ENV=$(grep -r "VITE_USE_MOCK\|useMock\|mockMode" frontend/src/ 2>/dev/null | wc -l)
if [ "$MOCK_ENV" -eq 0 ]; then
  echo -e "${GREEN}0件 ✓${NC}"
else
  echo -e "${RED}${MOCK_ENV}件 ✗${NC}"
fi

echo ""

# 2. TypeScriptエラーチェック
echo "📋 2. TypeScriptエラーチェック"
echo "-----------------------------------"
cd frontend
TS_OUTPUT=$(npm run type-check 2>&1)
TS_EXIT_CODE=$?
if [ $TS_EXIT_CODE -eq 0 ]; then
  echo -e "  ${GREEN}TypeScriptエラー: 0件 ✓${NC}"
else
  echo -e "  ${RED}TypeScriptエラーあり ✗${NC}"
  echo "$TS_OUTPUT"
fi
cd ..

echo ""

# 3. ビルドエラーチェック
echo "📋 3. ビルドエラーチェック"
echo "-----------------------------------"
cd frontend
BUILD_OUTPUT=$(npm run build 2>&1)
BUILD_EXIT_CODE=$?
if [ $BUILD_EXIT_CODE -eq 0 ]; then
  echo -e "  ${GREEN}ビルド成功 ✓${NC}"
else
  echo -e "  ${RED}ビルドエラーあり ✗${NC}"
  echo "$BUILD_OUTPUT"
fi
cd ..

echo ""

# 4. サービスファイル確認
echo "📋 4. サービスファイル確認"
echo "-----------------------------------"

SERVICES=(
  "frontend/src/services/auth/authService.ts"
  "frontend/src/services/api/promptService.ts"
  "frontend/src/services/api/promptSearchService.ts"
  "frontend/src/services/api/settingsService.ts"
)

for SERVICE in "${SERVICES[@]}"; do
  SERVICE_NAME=$(basename "$SERVICE")
  echo -n "  $SERVICE_NAME: "
  
  if [ -f "$SERVICE" ]; then
    MOCK_IMPORTS=$(grep -c "from.*mock\|import.*Mock" "$SERVICE" 2>/dev/null || echo "0")
    SUPABASE_IMPORTS=$(grep -c "from.*supabase\|@supabase" "$SERVICE" 2>/dev/null || echo "0")
    
    if [ "$MOCK_IMPORTS" -eq 0 ] && [ "$SUPABASE_IMPORTS" -gt 0 ]; then
      echo -e "${GREEN}実API使用 ✓${NC}"
    else
      echo -e "${RED}モック残存の可能性 ✗${NC}"
    fi
  else
    echo -e "${RED}ファイルなし ✗${NC}"
  fi
done

echo ""

# 5. 環境変数確認
echo "📋 5. 環境変数確認"
echo "-----------------------------------"

if [ -f ".env.local" ]; then
  echo -n "  VITE_SUPABASE_URL: "
  if grep -q "VITE_SUPABASE_URL" .env.local; then
    echo -e "${GREEN}設定済み ✓${NC}"
  else
    echo -e "${RED}未設定 ✗${NC}"
  fi
  
  echo -n "  VITE_SUPABASE_ANON_KEY: "
  if grep -q "VITE_SUPABASE_ANON_KEY" .env.local; then
    echo -e "${GREEN}設定済み ✓${NC}"
  else
    echo -e "${RED}未設定 ✗${NC}"
  fi
  
  echo -n "  VITE_USE_MOCK: "
  if grep -q "VITE_USE_MOCK" .env.local; then
    echo -e "${RED}モック環境変数が残存 ✗${NC}"
  else
    echo -e "${GREEN}削除済み ✓${NC}"
  fi
else
  echo -e "  ${RED}.env.localファイルなし ✗${NC}"
fi

echo ""

# 6. 開発サーバー確認
echo "📋 6. 開発サーバー確認"
echo "-----------------------------------"

SERVER_RUNNING=$(lsof -i :3347 2>/dev/null | grep LISTEN)
if [ -n "$SERVER_RUNNING" ]; then
  echo -e "  ポート3347: ${GREEN}サーバー起動中 ✓${NC}"
  
  # HTTP接続テスト
  HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3347 2>/dev/null)
  if [ "$HTTP_RESPONSE" = "200" ]; then
    echo -e "  HTTP接続: ${GREEN}正常 (200 OK) ✓${NC}"
  else
    echo -e "  HTTP接続: ${YELLOW}応答コード $HTTP_RESPONSE${NC}"
  fi
else
  echo -e "  ポート3347: ${YELLOW}サーバー未起動${NC}"
  echo "  (開発サーバーを起動してください: cd frontend && npm run dev)"
fi

echo ""

# 7. 総合判定
echo "=================================="
echo "📊 総合判定"
echo "=================================="

TOTAL_CHECKS=6
PASSED_CHECKS=0

[ "$MOCK_MARKERS" -eq 0 ] && ((PASSED_CHECKS++))
[ "$MOCK_FILES" -eq 0 ] && ((PASSED_CHECKS++))
[ "$MOCK_ENV" -eq 0 ] && ((PASSED_CHECKS++))
[ $TS_EXIT_CODE -eq 0 ] && ((PASSED_CHECKS++))
[ $BUILD_EXIT_CODE -eq 0 ] && ((PASSED_CHECKS++))
[ -n "$SERVER_RUNNING" ] && ((PASSED_CHECKS++))

echo ""
echo "  合格チェック数: $PASSED_CHECKS / $TOTAL_CHECKS"
echo ""

if [ $PASSED_CHECKS -eq $TOTAL_CHECKS ]; then
  echo -e "${GREEN}🎉 全チェック合格！API統合完了が確認されました${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠️  一部のチェックで問題が検出されました${NC}"
  exit 1
fi
