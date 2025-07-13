#!/bin/bash

# Claude Rapid Automation Setup Script
# このスクリプトは新しいリポジトリで高速自動化システムをセットアップします

set -e

# 色付きログ出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_rapid() {
    echo -e "${CYAN}[RAPID]${NC} $1"
}

# 引数チェック
if [ "$#" -ne 2 ]; then
    log_error "使用方法: $0 <owner> <repo>"
    log_info "例: $0 username my-repo"
    exit 1
fi

OWNER=$1
REPO=$2

log_rapid "⚡ Claude Rapid Automation セットアップ開始"
log_info "リポジトリ: ${OWNER}/${REPO}"
log_rapid "🚀 高速モード: 5分間隔で最適化された処理"

# GitHub CLI の確認
if ! command -v gh &> /dev/null; then
    log_error "GitHub CLI (gh) がインストールされていません"
    log_info "インストール: https://cli.github.com/"
    exit 1
fi

# GitHub認証確認
if ! gh auth status &> /dev/null; then
    log_error "GitHub CLI の認証が必要です"
    log_info "認証: gh auth login"
    exit 1
fi

log_success "GitHub CLI 認証確認完了"

# Step 1: GitHub Actions 権限設定
log_info "📋 Step 1: GitHub Actions 権限設定 (Rapid Mode)"

# 現在の権限確認
log_info "現在の権限設定を確認中..."
CURRENT_PERMISSIONS=$(gh api repos/${OWNER}/${REPO}/actions/permissions/workflow 2>/dev/null || echo "ERROR")

if [ "$CURRENT_PERMISSIONS" = "ERROR" ]; then
    log_error "リポジトリにアクセスできません。権限を確認してください。"
    exit 1
fi

echo "現在の設定: $CURRENT_PERMISSIONS"

# 権限を write に変更
log_info "権限を write に変更中..."
gh api --method PUT repos/${OWNER}/${REPO}/actions/permissions/workflow \
  --field default_workflow_permissions=write \
  --field can_approve_pull_request_reviews=true

# 変更確認
NEW_PERMISSIONS=$(gh api repos/${OWNER}/${REPO}/actions/permissions/workflow)
echo "新しい設定: $NEW_PERMISSIONS"

if [[ $NEW_PERMISSIONS == *'"default_workflow_permissions":"write"'* ]]; then
    log_success "GitHub Actions 権限設定完了"
else
    log_error "権限設定に失敗しました"
    exit 1
fi

# Step 2: Rapid ワークフローファイルの配置
log_info "📋 Step 2: Rapid ワークフローファイルの配置"

# .github/workflows ディレクトリ作成
mkdir -p .github/workflows

# ワークフローファイルの存在確認
RAPID_WORKFLOW="workflows/claude-rapid-automation.yml"
if [ ! -f "$RAPID_WORKFLOW" ]; then
    log_error "Rapid ワークフローファイルが見つかりません: $RAPID_WORKFLOW"
    log_info "このスクリプトはclaude-automationリポジトリのルートから実行してください"
    exit 1
fi

# Rapid ワークフローファイルをコピー
cp "$RAPID_WORKFLOW" .github/workflows/claude-rapid-automation.yml

log_rapid "⚡ Rapid ワークフローファイル配置完了"

# Step 3: 高速処理用ラベル作成
log_info "📋 Step 3: 高速処理用ラベル作成"

# ラベル作成関数
create_label() {
    local name=$1
    local description=$2
    local color=$3
    
    if gh label create "$name" --description "$description" --color "$color" 2>/dev/null; then
        log_success "ラベル作成: $name"
    else
        log_warning "ラベル既存または作成失敗: $name"
    fi
}

# Rapid Automation 専用ラベル
create_label "claude-processed" "Claude Codeで処理済み" "1d76db"
create_label "claude-ready" "Claude自動化準備完了" "0052cc"
create_label "automation-ready" "一般自動化準備完了" "0e8a16"
create_label "rapid-process" "高速処理対象" "ff6600"
create_label "claude-completed" "自動化処理完了" "0e8a16"
create_label "rapid-automation" "高速自動化実行済み" "ff8c00"
create_label "priority:rapid" "高速優先度" "d93f0b"

log_rapid "⚡ 高速処理ラベル作成完了"

# Step 4: Rapid テスト用Issue作成
log_info "📋 Step 4: Rapid テスト用Issue作成"

ISSUE_URL=$(gh issue create \
  --title "⚡ Rapid Test: 高速自動化システム" \
  --body "🚀 Claude Rapid Automation システムの高速テスト用Issueです。

**⚡ Rapid テスト項目:**
- 🤖 Claude Code実装 (高速検知)
- ⚡ 高速PR作成 (5分間隔)
- 🚀 迅速自動マージ (最適化済み)
- 🎯 効率的Issue自動クローズ
- 🧹 高速ブランチ自動削除

**🚀 Rapid Mode特徴:**
- 実行間隔: 5分ごと (高速処理)
- バランス: 速度と効率の最適化
- リソース効率: 最適化済み
- 応答性: 高速レスポンス

@claude Rapid実装をお願いします！" \
  --label "claude-processed,priority:rapid,rapid-process")

log_rapid "⚡ Rapid テスト用Issue作成完了: $ISSUE_URL"

# Step 5: Rapid セットアップ完了確認
log_info "📋 Step 5: Rapid セットアップ完了確認"

cat << 'EOF'

⚡ Rapid Automation システム セットアップ完了！

🚀 Rapid Mode特徴:
- ⚡ 5分間隔実行 (高速処理)
- 🚀 迅速レスポンス
- 🎯 効率的リソース使用
- ⚡ 最適化された速度

📋 次のステップ:
1. Claude Codeで Rapid テスト用Issueを実装
2. Rapid ワークフローの手動実行でテスト:
   gh workflow run claude-rapid-automation.yml
3. 実行ログの確認:
   gh run list --workflow="claude-rapid-automation.yml"

⚡ Rapid 実行スケジュール:
- 🚀 5分間隔実行 (*/5 * * * *)
- ⚡ 高速レスポンス
- 🎯 効率的処理
- 🚀 最適化されたバランス

💡 推奨用途:
- 高速開発プロジェクト
- 迅速なフィードバックが必要な場合
- Ultimate より効率的、Smart より高速

📚 Rapid ガイド: docs/rapid-automation-guide.md

EOF

log_rapid "⚡ Rapid セットアップ完了！ 🚀"
log_info "Rapid Mode は速度と効率のバランスを最適化しています"