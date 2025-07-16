#\!/usr/bin/env node

const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'takezou621';
const REPO_NAME = 'claude-automation';

const issueData = {
  title: "🔧 バグ修正テスト v2 - promptFile エラー修正後検証",
  body: `# 修正後のClaude自動化ワークフローテスト

このIssueは、promptFileエラーを修正した後のClaude自動化システムの動作を検証するために作成されたテストIssueです。

## 🐛 修正された問題

- \`promptFile is not defined\` エラーの修正
- generateCodeFallback関数のパラメータ修正
- フォールバック機能の正常動作確認

## 📋 期待される動作

1. ✅ Issue分析が正常実行される
2. ✅ フォールバック機能でコード生成される
3. ✅ \`src/bugfix_22.py\` ファイルが作成される
4. ✅ プルリクエストが自動作成される
5. ✅ 品質チェックが通過する
6. ✅ 自動マージが実行される

## 🎯 テスト項目

- [x] Python bugfixテンプレート生成
- [x] ログ機能実装
- [x] エラーハンドリング追加
- [x] 品質チェック実行

---
🤖 **修正版テスト** | 生成時刻: ${new Date().toISOString()}`,
  labels: ['bug', 'automation-ready', 'claude-ready', 'priority:high', 'test-v2']
};

function createIssue() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(issueData);
    
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: `/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Claude-Automation-Test-V2'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 201) {
            resolve(response);
          } else {
            reject(new Error(`GitHub API Error: ${res.statusCode} - ${response.message || data}`));
          }
        } catch (error) {
          reject(new Error(`Parse Error: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

createIssue().then(issue => {
  console.log('✅ Test Issue v2 created successfully\!');
  console.log(`📋 Issue #${issue.number}: ${issue.title}`);
  console.log(`🔗 URL: ${issue.html_url}`);
  console.log(`🏷️  Labels: ${issue.labels.map(l => l.name).join(', ')}`);
}).catch(console.error);
