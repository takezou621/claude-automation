# 🚀 Quick Start Guide

GitHub自動化システムを5分で始めましょう！

## 📋 前提条件

- Node.js 18.0.0以上
- GitHub Personal Access Token
- GitHub Actions有効なリポジトリ

## 🔧 セットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数の設定
```bash
# .env.exampleをコピー
cp .env.example .env

# .envファイルを編集
nano .env
```

### 3. 必要な設定
```env
# GitHub設定
GITHUB_TOKEN=ghp_your_token_here
GITHUB_OWNER=your-username
GITHUB_REPO=your-repo-name

# 自動化設定
AUTO_REVIEW=true
AUTO_LABEL=true
AUTO_ASSIGN=false
```

## 🚀 初期化

```bash
# システムの初期化
npm run automation:init
```

初期化により以下が実行されます：
- GitHub API接続テスト
- 基本ラベルの作成
- システムの準備確認

## 📊 基本的な使い方

### ヘルスチェック
```bash
npm run automation:health
```

### 統計の確認
```bash
npm run automation:stats
```

### 個別のPRレビュー
```bash
npm run cli review 123
```

### 個別のイシュー分類
```bash
npm run cli classify 456
```

### 一括処理
```bash
npm run automation:batch
```

### インタラクティブモード
```bash
npm run automation:interactive
```

## 🎯 実用的な運用例

### 1. 日次チェック
```bash
#!/bin/bash
# daily-check.sh
echo "Starting daily automation check..."
npm run automation:health
npm run automation:batch
npm run automation:stats
```

### 2. 新しいPRの自動処理
```bash
# 新しいPRが作成されたら実行
npm run cli review $PR_NUMBER
```

### 3. 新しいイシューの自動分類
```bash
# 新しいイシューが作成されたら実行
npm run cli classify $ISSUE_NUMBER
```

## 📈 コスト監視

### 統計の確認
```bash
npm run automation:stats
```

### 月間コスト計算
```javascript
// 概算計算
const prReviews = 100; // 月間PRレビュー数
const issueClassifications = 50; // 月間イシュー分類数

const costPerPR = 0.001; // $0.001
const costPerIssue = 0.0005; // $0.0005

const monthlyCost = (prReviews * costPerPR) + (issueClassifications * costPerIssue);
console.log(`月間コスト: $${monthlyCost.toFixed(3)}`);
```

## 🔧 設定カスタマイズ

### 自動化機能の有効/無効
```bash
# PRレビューを無効にする
export AUTO_REVIEW=false

# イシューラベリングを無効にする
export AUTO_LABEL=false
```


## 🛠️ トラブルシューティング

### 1. API接続エラー
```bash
# 設定確認
npm run cli config

# 接続テスト
npm run automation:health
```

### 2. レート制限
```bash
# レート制限状況確認
npm run automation:health
```

### 3. 権限エラー
```bash
# GitHubトークンの権限を確認
# 必要な権限: repo, issues, pull_requests
```

## 📚 詳細なドキュメント

詳細な使い方は`README_FREE.md`を参照してください。

## 🔄 GitHub Actions統合

```yaml
# .github/workflows/auto-review.yml
name: Auto Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run cli review ${{ github.event.pull_request.number }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_OWNER: ${{ github.repository_owner }}
          GITHUB_REPO: ${{ github.event.repository.name }}
```

## 🎉 完了！

これでGitHub自動化システムが使用できます。

質問や問題がある場合は、GitHubイシューで報告してください。