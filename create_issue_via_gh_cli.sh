#!/bin/bash

# Create test issue using GitHub CLI
gh issue create \
  --title "🧪 YAML修正後動作確認 - Claude自動化システムテスト #27" \
  --body "# Claude Minimal Automation 動作確認

このIssueは、YAML構文エラー修正後のClaude自動化システムの動作を確認するために作成されました。

## 🎯 検証内容

- ✅ YAML構文エラー修正の確認
- ✅ テンプレートリテラル→文字列連結への変更
- ✅ 自動化ワークフローの正常実行
- ✅ Issue自動クローズ機能

## 📋 期待される動作

1. **ワークフロー起動:**
   - claude-minimal-automation.yml が自動実行
   - YAML構文エラーなしで起動

2. **自動処理:**
   - Pythonファイル生成: \`src/fix_27.py\`
   - mainブランチへの直接コミット
   - 自動コメント投稿

3. **Issue完了:**
   - 自動的にIssueがクローズ
   - 成功コメントの投稿
   - \`claude-completed\` ラベル追加

## 🔧 技術詳細

- Python 3.x 対応
- ログ機能実装
- エラーハンドリング
- 自動テスト

## 🚨 優先度

**HIGH** - YAML修正後の動作確認

---
🤖 **YAML修正後テスト** | 生成時刻: $(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --label "bug" \
  --label "automation-ready" \
  --label "claude-ready" \
  --label "priority:high" \
  --label "yaml-fix-test"