# 🚀 Deployment Guide

Claude Automation の本番環境への展開方法を説明します。

## 🎯 展開オプション

### 1. GitHub Actions（推奨）
最も簡単で cost-effective な方法

### 2. Webhook Server
リアルタイム処理が必要な場合

### 3. Docker Container
スケーラブルで管理しやすい方法

### 4. Serverless Function
コスト最適化と自動スケーリング

## 🔧 GitHub Actions展開

### セットアップ
1. **Secretsの設定**
```bash
# GitHub リポジトリの Settings → Secrets and variables → Actions
CLAUDE_API_KEY=your_claude_api_key_here
```

2. **ワークフローファイル**
```yaml
# .github/workflows/auto-review.yml (既に作成済み)
```

3. **テスト**
```bash
# 新しいPRを作成してテスト
git checkout -b test-automation
echo "# Test" > test.md
git add test.md
git commit -m "test: automation"
git push origin test-automation
# PRを作成 → 自動レビューが実行される
```

### 利点
- ✅ 完全無料（GitHub Actionsの制限内）
- ✅ 自動実行
- ✅ ログ完備
- ✅ 設定簡単

### 制限
- ⚠️ 月間2,000分の制限
- ⚠️ リアルタイム処理ではない

## 🌐 Webhook Server展開

### ローカル開発
```bash
# 環境変数設定
cp .env.example .env
# .envファイルを編集

# サーバー起動
npm run webhook:start
# または開発モード
npm run webhook:dev
```

### 本番環境
```bash
# PM2での管理
npm install -g pm2
pm2 start src/webhook-server.js --name "claude-automation"
pm2 save
pm2 startup
```

### GitHub Webhookの設定
1. **リポジトリ設定**
   - Settings → Webhooks → Add webhook
   - Payload URL: `https://your-domain.com/webhook`
   - Content type: `application/json`
   - Secret: 環境変数 `WEBHOOK_SECRET` と同じ値
   - Events: `Pull requests`, `Issues`

2. **テスト**
```bash
# ヘルスチェック
curl http://localhost:3000/health

# 手動PR処理
curl -X POST http://localhost:3000/api/review/123

# 手動イシュー分類
curl -X POST http://localhost:3000/api/classify/456
```

### 利点
- ✅ リアルタイム処理
- ✅ 柔軟なカスタマイズ
- ✅ 詳細なログ
- ✅ REST API提供

### 制限
- ⚠️ サーバー管理が必要
- ⚠️ 可用性の責任
- ⚠️ セキュリティ管理

## 🐳 Docker展開

### 基本的な展開
```bash
# イメージビルド
npm run docker:build

# 単体実行
npm run docker:run

# Docker Compose使用
npm run docker:compose
```

### 環境変数設定
```bash
# .env.docker
GITHUB_TOKEN=your_token
CLAUDE_API_KEY=your_key
GITHUB_OWNER=your_username
GITHUB_REPO=your_repo
WEBHOOK_SECRET=your_secret
PORT=3000
```

### Docker Composeでの本番展開
```yaml
# docker/docker-compose.yml
version: '3.8'
services:
  claude-automation:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Nginx リバースプロキシ
```bash
# Nginxプロファイル使用
docker-compose --profile nginx up -d
```

### 利点
- ✅ 一貫した環境
- ✅ 簡単スケーリング
- ✅ 隔離された実行
- ✅ 監視・ヘルスチェック

### 制限
- ⚠️ Dockerの知識が必要
- ⚠️ リソース使用量
- ⚠️ 永続化設定

## ☁️ クラウド展開

### AWS Lambda
```bash
# Serverless Framework使用
npm install -g serverless
serverless create --template aws-nodejs --path lambda-deployment
```

### Vercel
```bash
# vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "src/webhook-server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/webhook-server.js"
    }
  ]
}
```

### Heroku
```bash
# Procfile
web: node src/webhook-server.js
```

### Railway
```bash
# railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node src/webhook-server.js"
  }
}
```

## 🔐 セキュリティ設定

### 環境変数
```bash
# 必須
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxx

# 推奨
WEBHOOK_SECRET=random_secret_string
LOG_LEVEL=warn
NODE_ENV=production
```

### GitHub Token権限
最小限の権限のみ付与：
- ✅ `repo` (プライベートリポジトリの場合)
- ✅ `public_repo` (パブリックリポジトリの場合)
- ✅ `issues:write`
- ✅ `pull_requests:write`

### レート制限
```javascript
// Nginx設定例
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/m;
limit_req_zone $binary_remote_addr zone=webhook:10m rate=100r/m;
```

## 📊 監視・ログ

### ヘルスチェック
```bash
# エンドポイント
GET /health

# 期待される応答
{
  "server": "running",
  "automation": {
    "status": "healthy",
    "github": {"status": "healthy"},
    "claude": true
  }
}
```

### ログ管理
```javascript
// Winston設定
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### メトリクス
```bash
# 統計エンドポイント
GET /stats

# 応答例
{
  "stats": {
    "processedPRs": 45,
    "processedIssues": 23,
    "errors": 2,
    "uptime": 86400
  }
}
```

## 💰 コスト最適化

### Claude API使用量
```javascript
// 月間コスト見積もり
const monthlyEstimate = {
  prReviews: 100,        // 月間PRレビュー数
  issueClassifications: 50,  // 月間イシュー分類数
  costPerPR: 0.001,         // PR当たりのコスト
  costPerIssue: 0.0005,     // イシュー当たりのコスト
  
  total: function() {
    return (this.prReviews * this.costPerPR) + 
           (this.issueClassifications * this.costPerIssue);
  }
};

console.log(`月間コスト: $${monthlyEstimate.total().toFixed(4)}`);
```

### GitHub Actions制限
```yaml
# .github/workflows/auto-review.yml
# 平日のみ実行、コスト削減
on:
  pull_request:
    types: [opened, synchronize]
  schedule:
    - cron: '0 9 * * 1-5'  # 平日9時のみ
```

### リソース使用量
```bash
# Dockerメモリ制限
docker run -m 512m claude-automation

# Node.jsメモリ制限
node --max-old-space-size=512 src/webhook-server.js
```

## 🧪 テスト・品質保証

### 自動テスト
```bash
# テスト実行
npm test

# カバレッジ
npm run test:coverage

# リンター
npm run lint
```

### 本番前テスト
```bash
# ヘルスチェック
npm run automation:health

# 統計確認
npm run automation:stats

# 手動テスト
npm run cli review 123
npm run cli classify 456
```

### 継続的監視
```yaml
# .github/workflows/health-check.yml
name: Health Check
on:
  schedule:
    - cron: '0 */6 * * *'  # 6時間ごと
jobs:
  health:
    runs-on: ubuntu-latest
    steps:
      - name: Health Check
        run: curl -f ${{ secrets.HEALTH_CHECK_URL }}/health
```

## 🚨 トラブルシューティング

### よくある問題

#### 1. GitHub API制限
```bash
# 解決方法
# - レート制限の確認
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/rate_limit

# - 処理間隔の調整
# processPendingPRs() で await new Promise(resolve => setTimeout(resolve, 1000));
```

#### 2. Claude API制限
```bash
# 解決方法
# - トークン数の削減
# - リクエスト間隔の調整
# - Haikuモデルの使用
```

#### 3. Webhook署名エラー
```bash
# 解決方法
# - WEBHOOK_SECRET の確認
# - GitHub設定の確認
# - ペイロード形式の確認
```

### ログ分析
```bash
# エラーログの確認
tail -f logs/error.log

# 統計情報の確認
grep "processed" logs/combined.log | tail -10

# レート制限の確認
grep "rate.limit" logs/combined.log
```

## 📈 スケーリング

### 水平スケーリング
```yaml
# docker-compose.yml
services:
  claude-automation:
    deploy:
      replicas: 3
    environment:
      - NODE_ENV=production
```

### 負荷分散
```nginx
# nginx.conf
upstream claude-automation {
    server claude-automation-1:3000;
    server claude-automation-2:3000;
    server claude-automation-3:3000;
}
```

### キャッシュ設定
```yaml
# Redis追加
services:
  redis:
    image: redis:alpine
    profiles: ["redis"]
```

## 🎯 まとめ

### 推奨展開方法

1. **小規模プロジェクト**: GitHub Actions
2. **中規模プロジェクト**: Webhook Server + Docker
3. **大規模プロジェクト**: クラウド + 負荷分散

### 成功のポイント

- ✅ 段階的な展開
- ✅ 監視・ログの充実
- ✅ コスト管理
- ✅ セキュリティ対策
- ✅ 定期的なメンテナンス

これで本番環境での安定運用が可能になります！