# 本番環境セットアップガイド

## 🔑 必要な設定

システムを本番環境で稼働させるには、以下の設定が必要です：

### 1. GitHub Personal Access Token

GitHub設定で新しいPersonal Access Tokenを生成：

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token" をクリック
3. 必要な権限を選択：
   - `repo` (full repository access)
   - `workflow` (workflow access)
   - `read:org` (organization read access)
4. 生成されたトークンを`.env`ファイルに設定：

```bash
GITHUB_TOKEN=your_actual_token_here
```

### 2. Claude API Key

Claude AI APIキーを設定：

```bash
CLAUDE_API_KEY=your_claude_api_key_here
```

### 3. Webhook Secret (✅ 完了)

本番用のWebhook Secretは既に生成済みです：
```
WEBHOOK_SECRET=fb4fff4d2cce5e157da75d110128f952ee0be518bd9e6c4829cc0fa1cdc4dd62
```

## 🚀 デプロイ手順

### 1. 環境変数の設定
```bash
# .envファイルを編集
cp .env.example .env
# 上記の値を設定
```

### 2. 依存関係のインストール
```bash
npm install --production
```

### 3. システム検証
```bash
# 自動検証スクリプトを実行
./scripts/verify-production.sh
```

### 4. システム起動
```bash
# 本番起動スクリプトを実行
./scripts/start-production.sh
```

### 5. GitHub Webhook 設定

詳細な手順は `WEBHOOK_SETUP.md` を参照してください。

## 📊 稼働確認

```bash
# システム監視ダッシュボード
./scripts/monitor-system.sh

# リアルタイム監視
./scripts/monitor-system.sh realtime

# 個別チェック
./scripts/monitor-system.sh health
./scripts/monitor-system.sh stats
./scripts/monitor-system.sh logs
```

## 🔒 セキュリティ

- `.env`ファイルをバージョン管理に含めない
- 定期的にAPIキーとトークンをローテーション
- ログファイルに機密情報が含まれていないか確認

## 🐳 Docker デプロイ

```bash
# Docker イメージビルド
npm run docker:build

# Docker Compose で起動
npm run docker:compose
```

環境変数は`docker/.env`または`docker-compose.yml`で設定してください。