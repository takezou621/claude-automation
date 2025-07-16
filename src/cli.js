#!/usr/bin/env node

/**
 * CLI Interface for Simple Automation System
 * 無料版自動化システムのコマンドラインインターface
 */

const { program } = require('commander');
const chalk = require('chalk').default;
const ora = require('ora').default;
const inquirer = require('inquirer');
require('dotenv').config();

const SimpleAutomationSystem = require('./simple-automation-system');

// 設定の取得
function getConfig () {
  return {
    github: {
      token: process.env.GITHUB_TOKEN,
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO
    },
    claude: {
      // Claude Code Max doesn't require API keys
      model: process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307'
    },
    automation: {
      autoReview: process.env.AUTO_REVIEW !== 'false',
      autoLabel: process.env.AUTO_LABEL !== 'false',
      autoAssign: process.env.AUTO_ASSIGN === 'true'
    }
  };
}

// システムの初期化
async function initializeSystem () {
  const config = getConfig();

  // 設定の検証
  if (!config.github.token) {
    console.error(chalk.red('Error: GITHUB_TOKEN is required'));
    process.exit(1);
  }

  // Claude Code Max doesn't require API keys
  // API key validation removed for Claude Code Max compatibility

  if (!config.github.owner || !config.github.repo) {
    console.error(chalk.red('Error: GITHUB_OWNER and GITHUB_REPO are required'));
    process.exit(1);
  }

  return new SimpleAutomationSystem(config);
}

// プログラムのセットアップ
program
  .name('claude-automation')
  .description('Simple GitHub automation with Claude AI (Free Tier)')
  .version('1.0.0');

// 初期化コマンド
program
  .command('init')
  .description('Initialize the automation system')
  .action(async () => {
    const spinner = ora('Initializing Simple Automation System...').start();

    try {
      const system = await initializeSystem();
      const result = await system.initialize();

      if (result.success) {
        spinner.succeed('System initialized successfully');
        console.log(chalk.green('✓ GitHub connection: OK'));
        console.log(chalk.green('✓ Claude AI connection: OK'));
        console.log(chalk.green('✓ Basic labels created'));
      } else {
        spinner.fail('System initialization failed');
        console.error(chalk.red('Error:', result.error));
      }
    } catch (error) {
      spinner.fail('System initialization failed');
      console.error(chalk.red('Error:', error.message));
    }
  });

// ヘルスチェックコマンド
program
  .command('health')
  .description('Check system health')
  .action(async () => {
    const spinner = ora('Checking system health...').start();

    try {
      const system = await initializeSystem();
      const health = await system.healthCheck();

      spinner.stop();

      if (health.status === 'healthy') {
        console.log(chalk.green('✓ System is healthy'));
      } else {
        console.log(chalk.yellow('⚠ System has issues'));
      }

      console.log('\n' + chalk.bold('Health Status:'));
      console.log(`GitHub: ${health.github.status === 'healthy' ? chalk.green('✓') : chalk.red('✗')} ${health.github.status}`);
      console.log(`Claude: ${health.claude ? chalk.green('✓') : chalk.red('✗')} ${health.claude ? 'Connected' : 'Failed'}`);

      if (health.rateLimit) {
        console.log(`Rate Limit: ${health.rateLimit.remaining}/5000 remaining`);
      }

      console.log('\n' + chalk.bold('Statistics:'));
      console.log(`PRs Processed: ${health.stats.processedPRs}`);
      console.log(`Issues Processed: ${health.stats.processedIssues}`);
      console.log(`Errors: ${health.stats.errors}`);
      console.log(`Uptime: ${Math.floor(health.stats.uptime)}s`);
    } catch (error) {
      spinner.fail('Health check failed');
      console.error(chalk.red('Error:', error.message));
    }
  });

// PR処理コマンド
program
  .command('review <pr-number>')
  .description('Review a specific pull request')
  .action(async (prNumber) => {
    const spinner = ora(`Reviewing PR #${prNumber}...`).start();

    try {
      const system = await initializeSystem();
      const result = await system.reviewPullRequest(parseInt(prNumber));

      if (result.success) {
        spinner.succeed(`PR #${prNumber} reviewed successfully`);
        console.log(chalk.green('✓ Review comment posted'));
        console.log(chalk.green('✓ Labels added'));
        console.log('\n' + chalk.bold('Review:'));
        console.log(result.review);
      } else {
        spinner.fail(`Failed to review PR #${prNumber}`);
        console.error(chalk.red('Error:', result.error));
      }
    } catch (error) {
      spinner.fail(`Failed to review PR #${prNumber}`);
      console.error(chalk.red('Error:', error.message));
    }
  });

// イシュー分類コマンド
program
  .command('classify <issue-number>')
  .description('Classify a specific issue')
  .action(async (issueNumber) => {
    const spinner = ora(`Classifying issue #${issueNumber}...`).start();

    try {
      const system = await initializeSystem();
      const result = await system.classifyIssue(parseInt(issueNumber));

      if (result.success) {
        spinner.succeed(`Issue #${issueNumber} classified successfully`);
        console.log(chalk.green(`✓ Category: ${result.category}`));
        console.log(chalk.green(`✓ Labels added: ${result.labelsAdded.join(', ')}`));
      } else {
        spinner.fail(`Failed to classify issue #${issueNumber}`);
        console.error(chalk.red('Error:', result.error));
      }
    } catch (error) {
      spinner.fail(`Failed to classify issue #${issueNumber}`);
      console.error(chalk.red('Error:', error.message));
    }
  });

// 一括処理コマンド
program
  .command('batch')
  .description('Process pending PRs and issues')
  .option('-p, --prs-only', 'Process only pull requests')
  .option('-i, --issues-only', 'Process only issues')
  .action(async (options) => {
    const spinner = ora('Processing pending items...').start();

    try {
      const system = await initializeSystem();
      const results = [];

      if (!options.issuesOnly) {
        spinner.text = 'Processing pending PRs...';
        const prResult = await system.processPendingPRs();
        results.push({ type: 'PRs', ...prResult });
      }

      if (!options.prsOnly) {
        spinner.text = 'Processing pending issues...';
        const issueResult = await system.processPendingIssues();
        results.push({ type: 'Issues', ...issueResult });
      }

      spinner.succeed('Batch processing completed');

      results.forEach(result => {
        console.log(`\n${chalk.bold(result.type)}:`);
        console.log(`Processed: ${result.processed}`);
        console.log(`Success: ${result.results?.filter(r => r.success).length || 0}`);
        console.log(`Failed: ${result.results?.filter(r => !r.success).length || 0}`);
      });
    } catch (error) {
      spinner.fail('Batch processing failed');
      console.error(chalk.red('Error:', error.message));
    }
  });

// 統計コマンド
program
  .command('stats')
  .description('Show system statistics')
  .action(async () => {
    const spinner = ora('Gathering statistics...').start();

    try {
      const system = await initializeSystem();
      const stats = system.getStats();

      spinner.succeed('Statistics gathered');

      console.log('\n' + chalk.bold('System Statistics:'));
      console.log(`Start Time: ${stats.startTime}`);
      console.log(`Uptime: ${Math.floor(stats.uptime)}s`);
      console.log(`PRs Processed: ${stats.processedPRs}`);
      console.log(`Issues Processed: ${stats.processedIssues}`);
      console.log(`Errors: ${stats.errors}`);

      if (stats.processedPRs > 0 || stats.processedIssues > 0) {
        const total = stats.processedPRs + stats.processedIssues;
        const successRate = ((total - stats.errors) / total * 100).toFixed(1);
        console.log(`Success Rate: ${successRate}%`);
      }
    } catch (error) {
      spinner.fail('Failed to gather statistics');
      console.error(chalk.red('Error:', error.message));
    }
  });

// 設定コマンド
program
  .command('config')
  .description('Show current configuration')
  .action(async () => {
    const config = getConfig();

    console.log(chalk.bold('Current Configuration:'));
    console.log(`GitHub Owner: ${config.github.owner}`);
    console.log(`GitHub Repo: ${config.github.repo}`);
    console.log(`GitHub Token: ${config.github.token ? '✓ Set' : '✗ Not set'}`);
    console.log(`Claude Mode: Claude Code Max (No API Key Required)`);
    console.log(`Claude Model: ${config.claude.model}`);
    console.log(`Auto Review: ${config.automation.autoReview ? '✓ Enabled' : '✗ Disabled'}`);
    console.log(`Auto Label: ${config.automation.autoLabel ? '✓ Enabled' : '✗ Disabled'}`);
    console.log(`Auto Assign: ${config.automation.autoAssign ? '✓ Enabled' : '✗ Disabled'}`);
  });

// インタラクティブモード
program
  .command('interactive')
  .description('Start interactive mode')
  .action(async () => {
    console.log(chalk.bold('🤖 Claude Automation - Interactive Mode'));
    console.log('Select an action to perform:\n');

    const system = await initializeSystem();

    const mainMenu = async () => {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: '🔍 Check system health', value: 'health' },
            { name: '📝 Review a PR', value: 'review' },
            { name: '🏷️ Classify an issue', value: 'classify' },
            { name: '📊 View statistics', value: 'stats' },
            { name: '🔄 Batch process', value: 'batch' },
            { name: '⚙️ View configuration', value: 'config' },
            { name: '❌ Exit', value: 'exit' }
          ]
        }
      ]);

      switch (answers.action) {
        case 'health':
          const spinner = ora('Checking system health...').start();
          const health = await system.healthCheck();
          spinner.stop();

          console.log(`\nSystem Status: ${health.status === 'healthy' ? chalk.green('Healthy') : chalk.red('Unhealthy')}`);
          console.log(`GitHub: ${health.github.status === 'healthy' ? chalk.green('Connected') : chalk.red('Failed')}`);
          console.log(`Claude: ${health.claude ? chalk.green('Connected') : chalk.red('Failed')}`);
          break;

        case 'review':
          const prAnswer = await inquirer.prompt([
            {
              type: 'input',
              name: 'prNumber',
              message: 'Enter PR number:',
              validate: (input) => {
                const num = parseInt(input);
                return !isNaN(num) && num > 0 || 'Please enter a valid PR number';
              }
            }
          ]);

          const reviewSpinner = ora('Reviewing PR...').start();
          const reviewResult = await system.reviewPullRequest(parseInt(prAnswer.prNumber));
          reviewSpinner.stop();

          if (reviewResult.success) {
            console.log(chalk.green('✓ Review completed successfully'));
            console.log('\nReview:');
            console.log(reviewResult.review);
          } else {
            console.log(chalk.red('✗ Review failed:', reviewResult.error));
          }
          break;

        case 'classify':
          const issueAnswer = await inquirer.prompt([
            {
              type: 'input',
              name: 'issueNumber',
              message: 'Enter issue number:',
              validate: (input) => {
                const num = parseInt(input);
                return !isNaN(num) && num > 0 || 'Please enter a valid issue number';
              }
            }
          ]);

          const classifySpinner = ora('Classifying issue...').start();
          const classifyResult = await system.classifyIssue(parseInt(issueAnswer.issueNumber));
          classifySpinner.stop();

          if (classifyResult.success) {
            console.log(chalk.green('✓ Classification completed successfully'));
            console.log(`Category: ${classifyResult.category}`);
            console.log(`Labels: ${classifyResult.labelsAdded.join(', ')}`);
          } else {
            console.log(chalk.red('✗ Classification failed:', classifyResult.error));
          }
          break;

        case 'stats':
          const stats = system.getStats();
          console.log('\n' + chalk.bold('System Statistics:'));
          console.log(`PRs Processed: ${stats.processedPRs}`);
          console.log(`Issues Processed: ${stats.processedIssues}`);
          console.log(`Errors: ${stats.errors}`);
          console.log(`Uptime: ${Math.floor(stats.uptime)}s`);
          break;

        case 'batch':
          const batchSpinner = ora('Processing pending items...').start();
          const [prResult, issueResult] = await Promise.all([
            system.processPendingPRs(),
            system.processPendingIssues()
          ]);
          batchSpinner.stop();

          console.log('\n' + chalk.bold('Batch Processing Results:'));
          console.log(`PRs: ${prResult.processed} processed`);
          console.log(`Issues: ${issueResult.processed} processed`);
          break;

        case 'config':
          const config = getConfig();
          console.log('\n' + chalk.bold('Current Configuration:'));
          console.log(`Repository: ${config.github.owner}/${config.github.repo}`);
          console.log(`Claude Model: ${config.claude.model}`);
          console.log(`Auto Review: ${config.automation.autoReview ? 'Enabled' : 'Disabled'}`);
          console.log(`Auto Label: ${config.automation.autoLabel ? 'Enabled' : 'Disabled'}`);
          break;

        case 'exit':
          console.log(chalk.blue('Goodbye! 👋'));
          process.exit(0);
      }

      console.log('\n');
      await mainMenu();
    };

    await mainMenu();
  });

// エラーハンドリング
program.on('command:*', () => {
  console.error(chalk.red('Invalid command. Use --help for available commands.'));
  process.exit(1);
});

// プログラムの実行
if (require.main === module) {
  program.parse(process.argv);

  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
}

module.exports = program;
