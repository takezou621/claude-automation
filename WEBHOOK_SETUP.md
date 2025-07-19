# 🔗 GitHub Webhook セットアップガイド

システムをGitHubイベントに反応させるためのWebhook設定手順です。

## 📋 前提条件

- GitHub Personal Access Tokenが設定済み
- Claude API Keyが設定済み
- システムが稼働中またはデプロイ済み

## 🌐 Webhook URL の準備

### ローカル開発環境の場合

1. **ngrok** などのトンネリングツールを使用：
```bash
# ngrokをインストール (未インストールの場合)
npm install -g ngrok

# ローカルサーバーを公開 (ポート3000)
ngrok http 3000
```

2. ngrokから提供されるHTTPS URLをコピー（例: `https://abc123.ngrok.io`）

### 本番環境の場合

サーバーの公開URLを使用（例: `https://your-domain.com`）

## ⚙️ GitHub Repository Webhook 設定

### 1. リポジトリ設定にアクセス

1. GitHubでリポジトリ `takezou621/claude-automation` にアクセス
2. **Settings** タブをクリック
3. 左サイドバーの **Webhooks** をクリック
4. **Add webhook** ボタンをクリック

### 2. Webhook 設定

**Payload URL:**
```
https://your-domain.com/webhook
```
または
```
https://abc123.ngrok.io/webhook
```

**Content type:**
```
application/json
```

**Secret:**
```
fb4fff4d2cce5e157da75d110128f952ee0be518bd9e6c4829cc0fa1cdc4dd62
```
（.envファイルのWEBHOOK_SECRETと同じ値）

**Which events would you like to trigger this webhook?**

以下のイベントを選択：
- ✅ **Pull requests** - PRの作成、更新、マージ時
- ✅ **Issues** - Issue の作成、更新時  
- ✅ **Push** - コードのプッシュ時
- ✅ **Pull request reviews** - レビューコメント時

**Active:** ✅ チェック

### 3. Webhook を保存

**Add webhook** ボタンをクリックして保存

## 🧪 Webhook テスト

### 1. Webhook サーバー起動

```bash
# Webhook サーバーを起動
npm run webhook:start
```

### 2. テストイベント送信

GitHub Webhook設定画面で：
1. 作成したWebhookをクリック
2. **Recent Deliveries** タブを確認
3. **Redeliver** ボタンでテスト送信

### 3. ログ確認

サーバーログでWebhookイベントの受信を確認：
```bash
# ログファイルを監視
tail -f logs/automation.log
```

## 🔍 動作確認

以下のアクションでシステムが反応することを確認：

1. **Pull Request 作成**
   - 自動的にコード分析が実行される
   - レビューコメントが追加される
   - 適切なラベルが付与される

2. **Issue 作成**
   - 自動分類とラベリング
   - 優先度の判定

3. **コード Push**
   - セキュリティスキャンの実行
   - 品質チェック

## 🚨 トラブルシューティング

### Webhook が届かない場合

1. **URL確認:** Webhook URLが正しくアクセス可能か
2. **Secret確認:** .envのWEBHOOK_SECRETと設定値が一致するか
3. **ポート確認:** サーバーが正しいポートで起動しているか
4. **ファイアウォール:** ネットワーク設定でポートが開放されているか

### レスポンスエラーの場合

GitHub Webhook設定の **Recent Deliveries** でエラー詳細を確認：
- `2xx`: 正常
- `4xx`: 設定エラー
- `5xx`: サーバーエラー

### ログ確認コマンド

```bash
# システム状態確認
npm run automation:health

# 詳細ログ確認
npm run automation:stats

# エラーログ確認
tail -f logs/error.log
```

## 📊 監視とメトリクス

Webhook の動作状況を監視：

```bash
# 統計情報表示
npm run automation:stats

# パフォーマンス確認
npm run performance:test
```

## 🔐 セキュリティ注意事項

- Webhook SecretをGitにコミットしない
- HTTPS URLのみ使用する
- 定期的にSecretをローテーションする
- 不要なイベント通知は無効にする