# セットアップガイド

このドキュメントでは、Claude Smart Automationを新しいリポジトリに導入する詳細な手順を説明します。

## 📋 目次

- [前提条件](#前提条件)
- [自動セットアップ](#自動セットアップ)
- [手動セットアップ](#手動セットアップ)
- [設定の確認](#設定の確認)
- [初回テスト](#初回テスト)

## 前提条件

### 必要なツール

| ツール | バージョン | 用途 |
|--------|-----------|------|
| [GitHub CLI](https://cli.github.com/) | v2.0+ | GitHubとのAPI通信 |
| [Git](https://git-scm.com/) | v2.0+ | バージョン管理 |
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | 最新版 | AI支援開発 |

### 必要な権限

- **リポジトリ**: 管理者権限（Admin）が必要
- **GitHub Actions**: 有効化済み
- **GitHub CLI**: 認証済み

### 権限確認コマンド

```bash
# GitHub CLI認証状況確認
gh auth status

# リポジトリアクセス確認
gh repo view <owner>/<repo>

# GitHub Actions確認
gh api repos/<owner>/<repo>/actions/permissions
```

## 自動セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/takezou621/claude-automation.git
cd claude-automation
```

### 2. セットアップスクリプト実行

```bash
# 基本的な実行
./scripts/setup.sh <owner> <repo>

# 詳細ログ付き実行
./scripts/setup.sh <owner> <repo> --verbose

# 実行内容確認（実際の変更なし）
./scripts/setup.sh <owner> <repo> --dry-run
```

### 3. セットアップ内容

自動セットアップでは以下が実行されます：

1. **依存ツール確認**: GitHub CLI、Git等の確認
2. **権限設定**: GitHub Actions の write 権限設定
3. **ワークフロー配置**: `.github/workflows/claude-smart-automation.yml` の配置
4. **ラベル作成**: 必要なラベルの自動作成
5. **テストIssue作成**: 動作確認用Issueの作成

## 手動セットアップ

自動セットアップが使用できない場合の手動手順です。

### Step 1: GitHub Actions 権限設定

#### 1.1 現在の権限確認

```bash
gh api repos/<owner>/<repo>/actions/permissions/workflow
```

期待される出力例：
```json
{"default_workflow_permissions":"read","can_approve_pull_request_reviews":false}
```

#### 1.2 権限を write に変更

```bash
gh api --method PUT repos/<owner>/<repo>/actions/permissions/workflow \
  --field default_workflow_permissions=write \
  --field can_approve_pull_request_reviews=true
```

#### 1.3 変更確認

```bash
gh api repos/<owner>/<repo>/actions/permissions/workflow
```

期待される出力：
```json
{"default_workflow_permissions":"write","can_approve_pull_request_reviews":true}
```

### Step 2: ワークフローファイル配置

#### 2.1 ディレクトリ作成

```bash
mkdir -p .github/workflows
```

#### 2.2 ワークフローファイルコピー

```bash
# claude-automationリポジトリから
cp workflows/claude-smart-automation.yml .github/workflows/
```

または、直接作成：

```yaml
# .github/workflows/claude-smart-automation.yml
name: Claude Smart Automation

on:
  schedule:
    # 平日夜間実行 (23:00, 02:00, 05:00 JST)
    - cron: '0 14,17,20 * * 1-5'
    # 土日昼間実行 (10:00, 14:00, 18:00, 22:00 JST)
    - cron: '0 1,5,9,13 * * 0,6'
  workflow_dispatch:

jobs:
  smart-automation:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
      actions: read
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        fetch-depth: 0
        ref: main
    
    - name: Smart Automation Processing
      uses: actions/github-script@v7
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
        script: |
          # (完全なスクリプトはworkflows/claude-smart-automation.ymlを参照)
```

### Step 3: 必要なラベル作成

```bash
# 必須ラベル作成
gh label create "claude-processed" --description "Claude Codeで処理済み" --color "1d76db"
gh label create "claude-completed" --description "自動化処理完了" --color "0e8a16"
gh label create "smart-automation" --description "スマート自動化実行済み" --color "b60205"

# 優先度ラベル作成
gh label create "priority:high" --description "高優先度" --color "d93f0b"
gh label create "priority:medium" --description "中優先度" --color "fbca04"
gh label create "priority:low" --description "低優先度" --color "0052cc"
```

### Step 4: テスト用Issue作成

```bash
gh issue create \
  --title "テスト: Claude Smart Automation" \
  --body "Claude Smart Automationのテスト用Issueです。

@claude テスト実装をお願いします。" \
  --label "claude-processed,priority:high"
```

## 設定の確認

### 権限設定確認

```bash
# GitHub Actions権限確認
gh api repos/<owner>/<repo>/actions/permissions/workflow

# 期待される出力
# {"default_workflow_permissions":"write","can_approve_pull_request_reviews":true}
```

### ワークフロー確認

```bash
# ワークフローファイル存在確認
ls -la .github/workflows/claude-smart-automation.yml

# ワークフロー構文確認
gh workflow list
```

### ラベル確認

```bash
# 作成されたラベル確認
gh label list | grep -E "(claude|priority)"
```

期待される出力：
```
claude-completed    自動化処理完了              0e8a16
claude-processed    Claude Codeで処理済み       1d76db
priority:high       高優先度                   d93f0b
priority:low        低優先度                   0052cc
priority:medium     中優先度                   fbca04
smart-automation    スマート自動化実行済み       b60205
```

## 初回テスト

### 1. Claude Codeでの実装

1. テスト用Issueに対してClaude Codeで実装
2. 実装ブランチの作成・プッシュ

### 2. ワークフローの手動実行

```bash
# 手動でワークフロー実行
gh workflow run claude-smart-automation.yml

# 実行状況確認
gh run list --workflow="claude-smart-automation.yml" --limit 5
```

### 3. 実行ログの確認

```bash
# 最新の実行ログ確認
RUN_ID=$(gh run list --workflow="claude-smart-automation.yml" --limit 1 --json databaseId --jq '.[0].databaseId')
gh run view $RUN_ID --log
```

### 4. 結果の確認

期待される結果：
- [x] PR自動作成
- [x] PR自動マージ
- [x] Issue自動クローズ
- [x] ブランチ自動削除
- [x] 適切なラベル付け

## トラブルシューティング

よくある問題と解決方法については [troubleshooting.md](troubleshooting.md) を参照してください。

## 次のステップ

- [使用方法](usage.md) - 基本的な使用方法
- [カスタマイズ](customization.md) - 設定のカスタマイズ
- [FAQ](faq.md) - よくある質問