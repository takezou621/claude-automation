#!/bin/bash

# Claude Smart Automation Setup Script
# 新しいリポジトリでClaude Smart Automationをセットアップします

set -e

# 色付きログ出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# ログ関数
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

log_header() {
    echo -e "${PURPLE}$1${NC}"
}

# ヘルプ表示
show_help() {
    cat << EOF
Claude Smart Automation Setup Script

使用方法:
    $0 <owner> <repo> [options]

引数:
    owner    GitHubユーザー名または組織名
    repo     リポジトリ名

オプション:
    -h, --help       このヘルプを表示
    -v, --verbose    詳細ログを表示
    --dry-run        実際の変更を行わずに実行内容を表示

例:
    $0 username my-repo
    $0 myorg my-project --verbose

必要なツール:
    - GitHub CLI (gh) v2.0+
    - git
    - curl

詳細情報:
    https://github.com/takezou621/claude-automation
EOF
}

# 引数解析
VERBOSE=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -*)
            log_error "不明なオプション: $1"
            show_help
            exit 1
            ;;
        *)
            if [ -z "$OWNER" ]; then
                OWNER=$1
            elif [ -z "$REPO" ]; then
                REPO=$1
            else
                log_error "余分な引数: $1"
                show_help
                exit 1
            fi
            shift
            ;;
    esac
done

# 引数チェック
if [ -z "$OWNER" ] || [ -z "$REPO" ]; then
    log_error "ownerとrepoの両方を指定してください"
    show_help
    exit 1
fi

# バナー表示
cat << 'EOF'
  ______ _                 _        
 /  ____| |               | |       
| |     | | __ _ _   _  __| | ___   
| |     | |/ _` | | | |/ _` |/ _ \  
| |____| | (_| | |_| | (_| |  __/  
 \_____|_|\__,_|\__,_|\__,_|\___|  
                                   
   Smart Automation Setup          
EOF

log_header "🚀 Claude Smart Automation セットアップ開始"
log_info "リポジトリ: ${OWNER}/${REPO}"

if [ "$DRY_RUN" = true ]; then
    log_warning "DRY-RUN モード: 実際の変更は行いません"
fi

if [ "$VERBOSE" = true ]; then
    log_info "詳細ログモードが有効です"
fi

# 依存ツールの確認
log_header "📋 Step 1: 依存ツールの確認"

# GitHub CLI の確認
if ! command -v gh &> /dev/null; then
    log_error "GitHub CLI (gh) がインストールされていません"
    log_info "インストール方法: https://cli.github.com/"
    exit 1
fi

GH_VERSION=$(gh --version | head -n1 | awk '{print $3}')
log_success "GitHub CLI バージョン: $GH_VERSION"

# Git の確認
if ! command -v git &> /dev/null; then
    log_error "Git がインストールされていません"
    exit 1
fi

GIT_VERSION=$(git --version | awk '{print $3}')
log_success "Git バージョン: $GIT_VERSION"

# GitHub認証確認
if ! gh auth status &> /dev/null; then
    log_error "GitHub CLI の認証が必要です"
    log_info "認証コマンド: gh auth login"
    exit 1
fi

GITHUB_USER=$(gh api user --jq '.login')
log_success "GitHub認証確認完了: $GITHUB_USER"

# リポジトリアクセス確認
log_header "📋 Step 2: リポジトリアクセス確認"

if ! gh repo view ${OWNER}/${REPO} &> /dev/null; then
    log_error "リポジトリ ${OWNER}/${REPO} にアクセスできません"
    log_info "リポジトリが存在し、適切な権限があることを確認してください"
    exit 1
fi

log_success "リポジトリアクセス確認完了"

# 現在の権限確認
log_header "📋 Step 3: GitHub Actions 権限設定"

log_info "現在の権限設定を確認中..."
if [ "$VERBOSE" = true ]; then
    CURRENT_PERMISSIONS=$(gh api repos/${OWNER}/${REPO}/actions/permissions/workflow 2>/dev/null || echo "ERROR")
    echo "現在の設定: $CURRENT_PERMISSIONS"
fi

if [ "$DRY_RUN" = false ]; then
    log_info "権限を write に変更中..."
    gh api --method PUT repos/${OWNER}/${REPO}/actions/permissions/workflow \
      --field default_workflow_permissions=write \
      --field can_approve_pull_request_reviews=true

    # 変更確認
    NEW_PERMISSIONS=$(gh api repos/${OWNER}/${REPO}/actions/permissions/workflow)
    if [ "$VERBOSE" = true ]; then
        echo "新しい設定: $NEW_PERMISSIONS"
    fi

    if [[ $NEW_PERMISSIONS == *'"default_workflow_permissions":"write"'* ]]; then
        log_success "GitHub Actions 権限設定完了"
    else
        log_error "権限設定に失敗しました"
        exit 1
    fi
else
    log_info "[DRY-RUN] 権限設定をスキップしました"
fi

# ワークフローファイルの配置
log_header "📋 Step 4: ワークフローファイルの配置"

# .github/workflows ディレクトリ作成
mkdir -p .github/workflows

# ワークフローファイルの存在確認とコピー
WORKFLOW_SOURCE_AUTOMATION="workflows/claude-smart-automation.yml"
WORKFLOW_DEST_AUTOMATION=".github/workflows/claude-smart-automation.yml"
WORKFLOW_SOURCE_REVIEW="workflows/claude-code-review.yml"
WORKFLOW_DEST_REVIEW=".github/workflows/claude-code-review.yml"

if [ -f "$WORKFLOW_SOURCE" ]; then
    if [ "$DRY_RUN" = false ]; then
        cp "$WORKFLOW_SOURCE" "$WORKFLOW_DEST"
        log_success "ワークフローファイル配置完了"
    else
        log_info "[DRY-RUN] ワークフローファイルの配置をスキップしました"
    fi
else
    log_error "ワークフローファイルが見つかりません: $WORKFLOW_SOURCE"
    log_info "このスクリプトはclaude-automationリポジトリのルートから実行してください"
    exit 1
fi

# 必要なラベル作成
log_header "📋 Step 5: 必要なラベル作成"

# ラベル作成関数
create_label() {
    local name=$1
    local description=$2
    local color=$3
    
    if [ "$DRY_RUN" = false ]; then
        if gh label create "$name" --description "$description" --color "$color" 2>/dev/null; then
            log_success "ラベル作成: $name"
        else
            log_warning "ラベル既存または作成失敗: $name"
        fi
    else
        log_info "[DRY-RUN] ラベル作成: $name ($description)"
    fi
}

create_label "claude-processed" "Claude Codeで処理済み" "1d76db"
create_label "claude-completed" "自動化処理完了" "0e8a16"
create_label "smart-automation" "スマート自動化実行済み" "b60205"
create_label "priority:high" "高優先度" "d93f0b"
create_label "priority:medium" "中優先度" "fbca04"
create_label "priority:low" "低優先度" "0052cc"

log_success "ラベル作成完了"

# テスト用Issue作成
log_header "📋 Step 6: テスト用Issue作成"

if [ "$DRY_RUN" = false ]; then
    ISSUE_URL=$(gh issue create \
      --title "テスト: Claude Smart Automation" \
      --body "## Claude Smart Automation セットアップテスト

このIssueは自動セットアップ完了後のテスト用です。

**テスト項目:**
- [x] ✅ セットアップ完了
- [ ] 🤖 Claude Code実装
- [ ] 📝 自動PR作成
- [ ] 🔄 自動マージ
- [ ] 🔒 Issue自動クローズ
- [ ] 🧹 ブランチ自動削除

**次のステップ:**
1. Claude Codeでこのissueに対する実装を行ってください
2. 実装後、自動化ワークフローが動作することを確認してください

**実行時刻:** $(date '+%Y-%m-%d %H:%M:%S')

**セットアップ情報:**
- リポジトリ: ${OWNER}/${REPO}
- セットアップ実行者: $GITHUB_USER

@claude このテストissueの実装をお願いします。
簡単なREADME更新やファイル追加で構いません。" \
      --label "claude-processed,priority:high")

    log_success "テスト用Issue作成完了: $ISSUE_URL"
else
    log_info "[DRY-RUN] テスト用Issue作成をスキップしました"
fi

# セットアップ完了メッセージ
log_header "🎉 セットアップ完了！"

cat << EOF

✅ Claude Smart Automation セットアップが完了しました！

📋 実行された内容:
$([ "$DRY_RUN" = false ] && echo "✅" || echo "⏸️") GitHub Actions権限設定 (write権限)
$([ "$DRY_RUN" = false ] && echo "✅" || echo "⏸️") ワークフローファイル配置
$([ "$DRY_RUN" = false ] && echo "✅" || echo "⏸️") 必要なラベル作成
$([ "$DRY_RUN" = false ] && echo "✅" || echo "⏸️") テスト用Issue作成

📋 次のステップ:
1. Claude Codeでテスト用Issueを実装
2. 自動化ワークフローの動作確認:
   gh workflow run claude-smart-automation.yml
3. 実行ログの確認:
   gh run list --workflow="claude-smart-automation.yml"

⏰ 自動実行スケジュール:
- 平日: 23:00, 02:00, 05:00 JST (夜間実行)
- 土日: 10:00, 14:00, 18:00, 22:00 JST (昼間実行)

📚 詳細ドキュメント:
- セットアップガイド: docs/setup.md
- 使用方法: docs/usage.md
- トラブルシューティング: docs/troubleshooting.md

🌐 プロジェクトURL:
https://github.com/takezou621/claude-automation

EOF

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}[DRY-RUN] 実際の変更は行われませんでした${NC}"
    echo -e "${YELLOW}実際に実行するには --dry-run オプションを外してください${NC}"
fi

log_success "🚀 Happy Automating with Claude!"