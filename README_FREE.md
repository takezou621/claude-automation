# Claude Automation - 無料版

GitHub自動化を無料で使えるシンプルなシステムです。

## 🎯 特徴

### 💰 コスト最適化
- **Claude Haikuモデル**を使用（最安価）
- **トークン制限**でコストを抑制
- **最小限の機能**に絞り込み
- **高価な外部サービス**は不要

### 🚀 シンプルな機能
- **PR自動レビュー**（簡潔なフィードバック）
- **イシュー自動分類**（基本的なラベル付け）
- **基本的な統計**（処理数など）

## 📦 インストール

```bash
# 最小限の依存関係のみ
npm install
```

## ⚙️ 設定

```javascript
// .env ファイル
CLAUDE_API_KEY=your-claude-api-key
GITHUB_TOKEN=your-github-token
```

## 🔧 使用方法

### 基本的な起動
```bash
npm run start:simple
```

### 基本的な設定
```javascript
const SimpleAutomationSystem = require('./src/simple-automation-system');

const system = new SimpleAutomationSystem({
  github: {
    token: process.env.GITHUB_TOKEN,
    owner: 'your-username',
    repo: 'your-repo'
  },
  claude: {
    apiKey: process.env.CLAUDE_API_KEY,
    model: 'claude-3-haiku-20240307' // 最安価モデル
  },
  automation: {
    autoReview: true,
    autoLabel: true,
    autoAssign: false // 無料版では無効
  }
});
```

## 📊 無料版の制限

### 機能制限
- ✅ PR自動レビュー（簡潔版）
- ✅ イシュー自動分類（基本版）
- ❌ 複雑なワークフロー
- ❌ 外部システム連携
- ❌ 高度なAI機能

### コスト制限
- **1回のレビュー**: 約 $0.001
- **1日100PRの場合**: 約 $0.10
- **月間コスト**: 約 $3.00

### 使用例

```javascript
// PRレビュー
const prData = {
  title: 'Fix bug in user authentication',
  files: ['src/auth.js', 'tests/auth.test.js']
};

const result = await system.reviewPullRequest(prData);
console.log(result.review); // 簡潔なレビュー

// イシュー分類
const issueData = {
  title: 'App crashes on login',
  body: 'When I try to login, the app crashes...'
};

const classification = await system.classifyIssue(issueData);
console.log(classification.category); // 'bug'
```

## 📈 統計確認

```javascript
const stats = system.getStats();
console.log(stats);
// {
//   processedPRs: 15,
//   processedIssues: 8,
//   errors: 1,
//   uptime: 3600
// }
```

## 🔍 ヘルスチェック

```javascript
const health = await system.healthCheck();
console.log(health);
// {
//   status: 'healthy',
//   claude: true,
//   github: true,
//   stats: {...}
// }
```

## 💡 コスト削減のポイント

### 1. モデル選択
- **Claude Haiku**: 最安価で基本的な処理に十分
- **トークン制限**: 1000トークン以下に制限

### 2. 処理最適化
- **簡潔なプロンプト**: 必要最小限の指示
- **バッチ処理**: 複数の処理をまとめる
- **キャッシュ**: 同じ結果の再利用

### 3. 機能絞り込み
- **必要な機能のみ**: 使わない機能は無効化
- **シンプルな処理**: 複雑な分析は避ける

## 🛠️ カスタマイズ

```javascript
// 設定更新
system.updateConfig({
  automation: {
    autoReview: false, // レビュー機能を無効化
    autoLabel: true    // ラベル機能は有効
  }
});

// 独自の処理
system.processGitHubEvent('pull_request', prData);
```

## 📝 ログ

```javascript
// シンプルなログ出力
system.logger.info('Processing started');
system.logger.error('Error occurred');
```

## 🚨 注意事項

### 制限事項
- **機能は基本的なもののみ**
- **高度なAI機能は利用不可**
- **外部システム連携なし**
- **エンタープライズ機能なし**

### 推奨用途
- **個人プロジェクト**
- **小規模チーム**
- **基本的な自動化**
- **コスト重視の環境**

## 📊 コスト見積もり

### 月間使用量の例
- **PRレビュー**: 100回/月 × $0.001 = $0.10
- **イシュー分類**: 50回/月 × $0.0005 = $0.025
- **合計**: 約 $0.125/月

### 使用量を抑える方法
1. **必要な時のみ有効化**
2. **バッチ処理の活用**
3. **定期的な統計確認**

## 🔧 トラブルシューティング

### よくある問題
1. **API制限**: レート制限に注意
2. **コスト超過**: 統計で使用量を確認
3. **認証エラー**: トークンの確認

### 解決方法
```bash
# ヘルスチェック
node -e "
const system = require('./src/simple-automation-system');
system.healthCheck().then(console.log);
"
```

## 📞 サポート

無料版サポート:
- **GitHub Issues**: バグ報告・質問
- **ドキュメント**: 使用方法の確認
- **コミュニティ**: 他のユーザーとの情報交換

## 🎯 まとめ

この無料版は:
- **低コスト**で基本的な自動化が可能
- **シンプル**で導入しやすい
- **個人・小規模チーム**に最適
- **必要最小限**の機能に絞り込み

高度な機能が必要な場合は、有料版への移行を検討してください。