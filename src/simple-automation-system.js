/**
 * Simple Automation System
 * 無料で使えるシンプルなGitHub自動化システム
 */

const winston = require('winston');
const ClaudeAPIClient = require('./claude-api-client');
const GitHubClient = require('./github-client');

class SimpleAutomationSystem {
  constructor (config = {}) {
    this.config = {
      github: {
        token: config.github?.token || process.env.GITHUB_TOKEN,
        owner: config.github?.owner,
        repo: config.github?.repo
      },
      claude: {
        // Claude Code Max doesn't require API keys
        model: config.claude?.model || 'claude-3-haiku-20240307' // 安価なモデル
      },
      automation: {
        autoReview: config.automation?.autoReview || true,
        autoLabel: config.automation?.autoLabel || true,
        autoAssign: config.automation?.autoAssign || false
      }
    };

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.simple(),
      transports: [new winston.transports.Console()]
    });

    this.claudeClient = new ClaudeAPIClient(null, { // Claude Code Max doesn't require API keys
      model: this.config.claude.model,
      maxTokens: 1000, // コストを抑制
      temperature: 0.1
    });

    this.githubClient = new GitHubClient(this.config.github);

    this.stats = {
      processedPRs: 0,
      processedIssues: 0,
      errors: 0,
      startTime: new Date()
    };
  }

  /**
   * プルリクエストの自動レビュー（無料版）
   */
  async reviewPullRequest (prNumber) {
    try {
      // GitHubからPRデータを取得
      const prResult = await this.githubClient.getPullRequest(prNumber);
      if (!prResult.success) {
        throw new Error(`Failed to get PR: ${prResult.error}`);
      }

      const prData = prResult.data;

      // シンプルなプロンプトでコストを抑制
      const prompt = `簡潔にコードレビューしてください：

タイトル: ${prData.title}
変更ファイル数: ${prData.files?.length || 0}
主な変更されたファイル: ${prData.files?.slice(0, 3).map(f => f.filename).join(', ') || 'なし'}

主な変更点を3つまでのポイントで評価してください。`;

      const response = await this.claudeClient.sendMessage(prompt, {
        maxTokens: 500 // さらにコストを抑制
      });

      if (response.success) {
        // レビューコメントをPRに投稿
        const reviewComment = `## 🤖 AI Code Review

${response.response}

---
*This review was generated by Claude AI automation (Free Tier)*`;

        const commentResult = await this.githubClient.createPullRequestComment(prNumber, reviewComment);

        // ai-reviewedラベルを追加
        await this.githubClient.addLabelsToIssue(prNumber, ['ai-reviewed']);

        this.stats.processedPRs++;
        return {
          success: true,
          review: response.response,
          commentPosted: commentResult.success,
          cost: 'low'
        };
      }

      throw new Error(response.error);
    } catch (error) {
      this.stats.errors++;
      this.logger.error('PR review failed:', error.message);

      // エラーの場合は手動レビュー必要のラベルを追加
      await this.githubClient.addLabelsToIssue(prNumber, ['needs-human-review']);

      return {
        success: false,
        error: error.message,
        fallback: 'このPRは手動レビューが必要です。'
      };
    }
  }

  /**
   * イシューの自動分類（無料版）
   */
  async classifyIssue (issueNumber) {
    try {
      // GitHubからイシューデータを取得
      const issueResult = await this.githubClient.getIssue(issueNumber);
      if (!issueResult.success) {
        throw new Error(`Failed to get issue: ${issueResult.error}`);
      }

      const issueData = issueResult.data;

      const prompt = `このイシューを1つのカテゴリに分類してください：

タイトル: ${issueData.title}
本文: ${issueData.body?.substring(0, 200) || ''}

カテゴリ: bug, feature, documentation, question のいずれか1つを返してください。`;

      const response = await this.claudeClient.sendMessage(prompt, {
        maxTokens: 50
      });

      if (response.success) {
        const category = response.response.toLowerCase().trim();
        const validCategory = ['bug', 'feature', 'documentation', 'question'].includes(category) ? category : 'question';

        // 分類結果に基づいてラベルを追加
        const labels = [`auto-${validCategory}`, 'ai-classified'];
        await this.githubClient.addLabelsToIssue(issueNumber, labels);

        this.stats.processedIssues++;
        return {
          success: true,
          category: validCategory,
          labelsAdded: labels,
          cost: 'minimal'
        };
      }

      throw new Error(response.error);
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Issue classification failed:', error.message);

      // エラーの場合はデフォルトラベルを追加
      await this.githubClient.addLabelsToIssue(issueNumber, ['auto-question', 'needs-human-review']);

      return {
        success: false,
        error: error.message,
        fallback: 'question' // デフォルトカテゴリ
      };
    }
  }

  /**
   * 基本的な自動化処理
   */
  async processGitHubEvent (eventType, eventData) {
    this.logger.info(`Processing ${eventType} event`);

    switch (eventType) {
      case 'pull_request':
        if (this.config.automation.autoReview) {
          return await this.reviewPullRequest(eventData.number);
        }
        break;

      case 'issues':
        if (this.config.automation.autoLabel) {
          return await this.classifyIssue(eventData.number);
        }
        break;

      default:
        this.logger.info(`Event type ${eventType} not handled`);
        return { success: false, reason: 'Event type not supported' };
    }
  }

  /**
   * 複数のPRを一括処理
   */
  async processPendingPRs () {
    try {
      const recentPRs = await this.githubClient.getRecentPullRequests(5);
      if (!recentPRs.success) {
        throw new Error(`Failed to get recent PRs: ${recentPRs.error}`);
      }

      const results = [];
      for (const pr of recentPRs.data) {
        this.logger.info(`Processing PR #${pr.number}: ${pr.title}`);

        try {
          const result = await this.reviewPullRequest(pr.number);
          results.push({
            prNumber: pr.number,
            title: pr.title,
            ...result
          });

          // レート制限を考慮して少し待機
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          results.push({
            prNumber: pr.number,
            title: pr.title,
            success: false,
            error: error.message
          });
        }
      }

      return {
        success: true,
        processed: results.length,
        results
      };
    } catch (error) {
      this.logger.error('Failed to process pending PRs:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 複数のイシューを一括処理
   */
  async processPendingIssues () {
    try {
      const recentIssues = await this.githubClient.getRecentIssues(5);
      if (!recentIssues.success) {
        throw new Error(`Failed to get recent issues: ${recentIssues.error}`);
      }

      const results = [];
      for (const issue of recentIssues.data) {
        this.logger.info(`Processing Issue #${issue.number}: ${issue.title}`);

        try {
          const result = await this.classifyIssue(issue.number);
          results.push({
            issueNumber: issue.number,
            title: issue.title,
            ...result
          });

          // レート制限を考慮して少し待機
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          results.push({
            issueNumber: issue.number,
            title: issue.title,
            success: false,
            error: error.message
          });
        }
      }

      return {
        success: true,
        processed: results.length,
        results
      };
    } catch (error) {
      this.logger.error('Failed to process pending issues:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 初期セットアップ
   */
  async initialize () {
    try {
      this.logger.info('Initializing Simple Automation System...');

      // GitHub接続テスト
      const githubHealth = await this.githubClient.healthCheck();
      if (githubHealth.status !== 'healthy') {
        throw new Error('GitHub connection failed');
      }

      // Claude接続テスト
      const claudeTest = await this.claudeClient.testConnection();
      if (!claudeTest.success) {
        throw new Error('Claude connection failed');
      }

      // 基本ラベルのセットアップ
      await this.githubClient.setupBasicLabels();

      this.logger.info('Simple Automation System initialized successfully');

      return {
        success: true,
        github: githubHealth,
        claude: claudeTest.success
      };
    } catch (error) {
      this.logger.error('Initialization failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * システム統計の取得
   */
  getStats () {
    return {
      ...this.stats,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 設定の更新
   */
  updateConfig (newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Configuration updated');
  }

  /**
   * ヘルスチェック
   */
  async healthCheck () {
    try {
      // GitHub APIのテスト
      const githubHealth = await this.githubClient.healthCheck();

      // Claude APIの簡単なテスト
      const claudeTest = await this.claudeClient.sendMessage('test', {
        maxTokens: 10
      });

      return {
        status: githubHealth.status === 'healthy' && claudeTest.success ? 'healthy' : 'unhealthy',
        github: githubHealth,
        claude: claudeTest.success,
        stats: this.getStats(),
        rateLimit: githubHealth.rateLimit
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        stats: this.getStats()
      };
    }
  }
}

module.exports = SimpleAutomationSystem;
