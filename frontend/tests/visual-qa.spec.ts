/**
 * ビジュアル品質保証テスト
 * レイアウトが適切に表示されているかスクリーンショットで確認
 */

import { test, expect } from '@playwright/test';

test.describe('ビジュアル品質保証', () => {
  test('ログインページのレイアウト確認', async ({ page }) => {
    await page.goto('http://localhost:3347/login');
    await page.waitForLoadState('networkidle');

    // スクリーンショット撮影
    await page.screenshot({
      path: 'tests/screenshots/login-page.png',
      fullPage: true
    });

    // 基本的な要素の存在確認
    await expect(page.getByLabel('メールアドレス')).toBeVisible();
    await expect(page.getByLabel('パスワード')).toBeVisible();
    await expect(page.getByRole('button', { name: 'ログイン' })).toBeVisible();
  });

  test('ダッシュボードページのレイアウト確認', async ({ page }) => {
    // まずログイン
    await page.goto('http://localhost:3347/login');
    await page.waitForLoadState('networkidle');

    await page.getByLabel('メールアドレス').fill('test@promptmanagement.local');
    await page.getByLabel('パスワード').fill('TestPass123!');
    await page.getByRole('button', { name: 'ログイン' }).click();

    // ダッシュボードに遷移するまで待機
    await page.waitForURL('http://localhost:3347/');
    await page.waitForLoadState('networkidle');

    // スクリーンショット撮影
    await page.screenshot({
      path: 'tests/screenshots/dashboard-page.png',
      fullPage: true
    });

    // 基本的な要素の存在確認
    await expect(page.getByRole('heading', { name: 'プロンプト一覧' })).toBeVisible();
  });

  test('設定ページのレイアウト確認', async ({ page }) => {
    // ログイン
    await page.goto('http://localhost:3347/login');
    await page.waitForLoadState('networkidle');

    await page.getByLabel('メールアドレス').fill('test@promptmanagement.local');
    await page.getByLabel('パスワード').fill('TestPass123!');
    await page.getByRole('button', { name: 'ログイン' }).click();

    await page.waitForURL('http://localhost:3347/');

    // 設定ページに遷移
    await page.getByRole('button', { name: '設定' }).click();
    await page.waitForURL('http://localhost:3347/settings');
    await page.waitForLoadState('networkidle');

    // スクリーンショット撮影
    await page.screenshot({
      path: 'tests/screenshots/settings-page.png',
      fullPage: true
    });

    // 基本的な要素の存在確認
    await expect(page.getByRole('heading', { name: '設定' })).toBeVisible();
  });
});
