#!/usr/bin/env node

/**
 * Simple Usage Example
 * 無料版自動化システムの使用例
 */

const SimpleAutomationSystem = require('../src/simple-automation-system');
require('dotenv').config();

async function main() {
  console.log('🤖 Claude Automation - Simple Usage Example');
  console.log('='.repeat(50));
  
  // システムの初期化
  const system = new SimpleAutomationSystem({
    github: {
      token: process.env.GITHUB_TOKEN,
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO
    },
    claude: {
      apiKey: process.env.CLAUDE_API_KEY,
      model: process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307'
    },
    automation: {
      autoReview: true,
      autoLabel: true,
      autoAssign: false
    }
  });
  
  try {
    // 1. システムの初期化
    console.log('\n1. Initializing system...');
    const initResult = await system.initialize();
    
    if (initResult.success) {
      console.log('✅ System initialized successfully');
    } else {
      console.log('❌ System initialization failed:', initResult.error);
      return;
    }
    
    // 2. ヘルスチェック
    console.log('\n2. Checking system health...');
    const health = await system.healthCheck();
    console.log(`Status: ${health.status}`);
    console.log(`GitHub: ${health.github.status}`);
    console.log(`Claude: ${health.claude ? 'Connected' : 'Failed'}`);
    
    // 3. 統計の表示
    console.log('\n3. Current statistics:');
    const stats = system.getStats();
    console.log(`PRs Processed: ${stats.processedPRs}`);
    console.log(`Issues Processed: ${stats.processedIssues}`);
    console.log(`Errors: ${stats.errors}`);
    
    // 4. 最新PRの処理例
    console.log('\n4. Processing recent PRs...');
    const prResult = await system.processPendingPRs();
    
    if (prResult.success) {
      console.log(`✅ Processed ${prResult.processed} PRs`);
      prResult.results.forEach((result, index) => {
        const status = result.success ? '✅' : '❌';
        console.log(`  ${status} PR #${result.prNumber}: ${result.title}`);
      });
    } else {
      console.log('❌ Failed to process PRs:', prResult.error);
    }
    
    // 5. 最新イシューの処理例
    console.log('\n5. Processing recent issues...');
    const issueResult = await system.processPendingIssues();
    
    if (issueResult.success) {
      console.log(`✅ Processed ${issueResult.processed} issues`);
      issueResult.results.forEach((result, index) => {
        const status = result.success ? '✅' : '❌';
        console.log(`  ${status} Issue #${result.issueNumber}: ${result.title}`);
        if (result.success) {
          console.log(`    Category: ${result.category}`);
        }
      });
    } else {
      console.log('❌ Failed to process issues:', issueResult.error);
    }
    
    // 6. 最終統計
    console.log('\n6. Final statistics:');
    const finalStats = system.getStats();
    console.log(`PRs Processed: ${finalStats.processedPRs}`);
    console.log(`Issues Processed: ${finalStats.processedIssues}`);
    console.log(`Errors: ${finalStats.errors}`);
    
    if (finalStats.processedPRs > 0 || finalStats.processedIssues > 0) {
      const total = finalStats.processedPRs + finalStats.processedIssues;
      const successRate = ((total - finalStats.errors) / total * 100).toFixed(1);
      console.log(`Success Rate: ${successRate}%`);
    }
    
    // 7. コスト見積もり
    console.log('\n7. Cost estimation:');
    const prCost = finalStats.processedPRs * 0.001;
    const issueCost = finalStats.processedIssues * 0.0005;
    const totalCost = prCost + issueCost;
    console.log(`PR Review Cost: $${prCost.toFixed(4)}`);
    console.log(`Issue Classification Cost: $${issueCost.toFixed(4)}`);
    console.log(`Total Cost: $${totalCost.toFixed(4)}`);
    
    console.log('\n🎉 Example completed successfully!');
    console.log('For more advanced usage, check the CLI or interactive mode.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// エラーハンドリング
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// 実行
if (require.main === module) {
  main();
}

module.exports = { main };