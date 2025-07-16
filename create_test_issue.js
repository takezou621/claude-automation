#!/usr/bin/env node

/**
 * Create Test Issue for Claude Automation Workflow
 * GitHub APIを使用してテスト用Issueを作成
 */

const https = require('https');

// GitHub API configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'takezou621';
const REPO_NAME = 'claude-automation';

if (!GITHUB_TOKEN) {
  console.error('❌ GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

const issueData = {
  title: "🧪 テスト用バグ修正 - Claude自動化システム検証",
  body: `# Claude自動化ワークフローテスト

このIssueは、Claude自動化システムの動作を検証するために作成されたテストIssueです。

## 🐛 問題の詳細

テスト用のバグを修正して、自動化システムが正常に動作することを確認します。

## 📋 要求される機能

- [x] 自動的なIssue分析
- [x] バグ修正コードの生成
- [x] プルリクエストの自動作成
- [x] 品質チェックの実行
- [x] 自動マージの実行

## 🔧 技術要件

- Python 3.x対応コード
- ログ機能の実装
- エラーハンドリングの追加
- 適切なドキュメント
- テストケースの作成

## 🎯 期待される結果

1. ✅ Issueが自動的に \`claude-ready\` ラベルで処理される
2. ✅ \`claude-auto-impl-issue-X\` ブランチが作成される
3. ✅ バグ修正コードが生成される
4. ✅ プルリクエストが自動作成される
5. ✅ 品質チェックが通過する
6. ✅ 自動マージが実行される
7. ✅ Issueが自動クローズされる

## 🚨 優先度

**HIGH** - 自動化システムのテスト検証

---
🤖 **自動化テスト用Issue** | 生成時刻: ${new Date().toISOString()}`,
  labels: [
    'bug',
    'automation-ready', 
    'claude-ready',
    'priority:high',
    'urgent',
    'test-automation'
  ]
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
        'User-Agent': 'Claude-Automation-Test'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
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

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('🚀 Creating test issue for Claude automation workflow...');
  console.log(`📍 Repository: ${REPO_OWNER}/${REPO_NAME}`);
  
  try {
    const issue = await createIssue();
    
    console.log('\n✅ Test issue created successfully!');
    console.log(`📋 Issue #${issue.number}: ${issue.title}`);
    console.log(`🔗 URL: ${issue.html_url}`);
    console.log(`🏷️  Labels: ${issue.labels.map(l => l.name).join(', ')}`);
    
    console.log('\n🤖 Expected Automation Flow:');
    console.log('  1. ⏱️  Issue Processor will analyze this issue');
    console.log('  2. 🏷️  Appropriate labels will be added');
    console.log('  3. 🌿 Feature branch will be created');
    console.log('  4. 🔄 Code generation will start');
    console.log('  5. 📤 Pull request will be created');
    console.log('  6. 🧪 Quality checks will run');
    console.log('  7. 🔀 Auto-merge will be attempted');
    console.log('  8. ✅ Issue will be closed');
    
    console.log('\n📊 Monitoring Instructions:');
    console.log(`  • Watch the issue: ${issue.html_url}`);
    console.log(`  • Check Actions: https://github.com/${REPO_OWNER}/${REPO_NAME}/actions`);
    console.log(`  • Monitor for new PRs and branches`);
    
    return issue;
    
  } catch (error) {
    console.error('\n❌ Failed to create test issue:');
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createIssue };