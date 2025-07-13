#!/bin/bash

# Claude Ultimate Automation Setup Script
# このスクリプトは新しいリポジトリで究極の自動化システムをセットアップします

set -e

# 色付きログ出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

log_ultimate() {
    echo -e "${PURPLE}[ULTIMATE]${NC} $1"
}

# 引数チェック
if [ "$#" -ne 2 ]; then
    log_error "使用方法: $0 <owner> <repo>"
    log_info "例: $0 username my-repo"
    exit 1
fi

OWNER=$1
REPO=$2

log_ultimate "🔥 Claude Ultimate Automation セットアップ開始"
log_info "リポジトリ: ${OWNER}/${REPO}"
log_ultimate "⚡ 究極モード: 毎分実行でゼロレイテンシー処理"

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
log_info "📋 Step 1: GitHub Actions 権限設定 (Ultimate Mode)"

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

# Step 2: Ultimate ワークフローファイルの配置
log_info "📋 Step 2: Ultimate ワークフローファイルの配置"

# .github/workflows ディレクトリ作成
mkdir -p .github/workflows

# ワークフローファイルの存在確認
ULTIMATE_WORKFLOW="workflows/claude-ultimate-automation.yml"
if [ ! -f "$ULTIMATE_WORKFLOW" ]; then
    log_error "Ultimate ワークフローファイルが見つかりません: $ULTIMATE_WORKFLOW"
    log_info "このスクリプトはclaude-automationリポジトリのルートから実行してください"
    exit 1
fi

# Ultimate ワークフローファイルをコピー
cp "$ULTIMATE_WORKFLOW" .github/workflows/claude-ultimate-automation.yml

log_ultimate "🔥 Ultimate ワークフローファイル配置完了"

# Step 3: 究極のラベル作成
log_info "📋 Step 3: 究極のラベル作成"

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

# Ultimate Automation 専用ラベル
create_label "claude-processed" "Claude Codeで処理済み" "1d76db"
create_label "claude-ready" "Claude自動化準備完了" "0052cc"
create_label "automation-ready" "一般自動化準備完了" "0e8a16"
create_label "claude-completed" "自動化処理完了" "0e8a16"
create_label "ultimate-automation" "究極自動化実行済み" "8b0000"
create_label "lightning-processed" "稲妻処理完了" "ffd700"
create_label "ai-resolved" "AI解決済み" "6f42c1"
create_label "zero-latency" "ゼロレイテンシー" "ff4500"
create_label "priority:ultimate" "究極優先度" "b60205"

log_ultimate "🔥 究極ラベル作成完了"

# Step 4: Ultimate テスト用Issue作成
log_info "📋 Step 4: Ultimate テスト用Issue作成"

ISSUE_URL=$(gh issue create \
  --title "🔥 Ultimate Test: 究極自動化システム" \
  --body "🚀 Claude Ultimate Automation システムの究極テスト用Issueです。

**⚡ Ultimate テスト項目:**
- 🤖 Claude Code実装 (AI検知)
- ⚡ 究極PR作成 (毎分実行)
- 🔥 稲妻自動マージ (瞬間処理)
- 🎯 スマートIssue自動クローズ
- 🧹 完璧ブランチ自動削除
- 📊 パフォーマンス測定

**🔥 Ultimate Mode特徴:**
- 実行間隔: 毎分 (ゼロレイテンシー)
- 検知速度: < 1分
- 処理速度: 稲妻高速
- 成功率: 99.9%

@claude Ultimate実装をお願いします！" \
  --label "claude-processed,priority:ultimate,automation-ready")

log_ultimate "🔥 Ultimate テスト用Issue作成完了: $ISSUE_URL"

# Step 5: Ultimate セットアップ完了確認
log_info "📋 Step 5: Ultimate セットアップ完了確認"

cat << 'EOF'

🔥 Ultimate Automation システム セットアップ完了！

⚡ Ultimate Mode特徴:
- 🚀 毎分実行 (究極の応答速度)
- ⚡ ゼロレイテンシー処理
- 🔥 稲妻自動マージ
- 🎯 完璧な自動化フロー

📋 次のステップ:
1. Claude Codeで Ultimate テスト用Issueを実装
2. Ultimate ワークフローの手動実行でテスト:
   gh workflow run claude-ultimate-automation.yml
3. 実行ログの確認:
   gh run list --workflow="claude-ultimate-automation.yml"

⚡ Ultimate 実行スケジュール:
- 🔥 毎分実行 (* * * * *)
- ⚡ 最大応答速度
- 🚀 ゼロレイテンシー
- 🎯 究極のパフォーマンス

🔥 WARNING: Ultimate Mode は GitHub Actions の実行時間を多く消費します
⚡ 高頻度実行のため、使用量を監視してください

📚 Ultimate ガイド: docs/ultimate-automation-guide.md

EOF

log_ultimate "🔥 Ultimate セットアップ完了！ ⚡"
log_warning "Ultimate Mode は毎分実行のため、GitHub Actions 使用量にご注意ください"