/**
 * Simple Automation System
 * 無料で使えるシンプルなGitHub自動化システム
 */

const winston = require('winston');
const ClaudeAPIClient = require('./claude-api-client');

class SimpleAutomationSystem {
  constructor(config = {}) {
    this.config = {
      github: {
        token: config.github?.token || process.env.GITHUB_TOKEN,
        owner: config.github?.owner,
        repo: config.github?.repo
      },
      claude: {
        apiKey: config.claude?.apiKey || process.env.CLAUDE_API_KEY,
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
    
    this.claudeClient = new ClaudeAPIClient(this.config.claude.apiKey, {
      model: this.config.claude.model,
      maxTokens: 1000, // コストを抑制
      temperature: 0.1
    });
    
    this.stats = {
      processedPRs: 0,
      processedIssues: 0,
      errors: 0
    };
  }

  /**
   * プルリクエストの自動レビュー（無料版）
   */
  async reviewPullRequest(prData) {
    try {
      // シンプルなプロンプトでコストを抑制
      const prompt = `簡潔にコードレビューしてください：

タイトル: ${prData.title}
変更ファイル数: ${prData.files?.length || 0}

主な変更点を3つまでのポイントで評価してください。`;
      
      const response = await this.claudeClient.sendMessage(prompt, {
        maxTokens: 500 // さらにコストを抑制
      });
      
      if (response.success) {
        this.stats.processedPRs++;
        return {
          success: true,
          review: response.response,
          cost: 'low'
        };
      }
      
      throw new Error(response.error);
      
    } catch (error) {
      this.stats.errors++;
      this.logger.error('PR review failed:', error.message);
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
  async classifyIssue(issueData) {
    try {
      const prompt = `このイシューを1つのカテゴリに分類してください：

タイトル: ${issueData.title}
本文: ${issueData.body?.substring(0, 200) || ''}

カテゴリ: bug, feature, documentation, question のいずれか1つを返してください。`;
      
      const response = await this.claudeClient.sendMessage(prompt, {
        maxTokens: 50
      });
      
      if (response.success) {
        this.stats.processedIssues++;
        const category = response.response.toLowerCase().trim();
        return {
          success: true,
          category: ['bug', 'feature', 'documentation', 'question'].includes(category) ? category : 'question',
          cost: 'minimal'
        };
      }
      
      throw new Error(response.error);
      
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Issue classification failed:', error.message);
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
  async processGitHubEvent(eventType, eventData) {
    this.logger.info(`Processing ${eventType} event`);
    
    switch (eventType) {
      case 'pull_request':
        if (this.config.automation.autoReview) {
          return await this.reviewPullRequest(eventData);
        }
        break;
        
      case 'issues':
        if (this.config.automation.autoLabel) {
          return await this.classifyIssue(eventData);
        }
        break;
        
      default:
        this.logger.info(`Event type ${eventType} not handled`);
        return { success: false, reason: 'Event type not supported' };
    }
  }

  /**
   * システム統計の取得
   */
  getStats() {
    return {
      ...this.stats,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 設定の更新
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Configuration updated');
  }

  /**
   * ヘルスチェック
   */
  async healthCheck() {
    try {
      // Claude APIの簡単なテスト
      const testResponse = await this.claudeClient.sendMessage('test', {
        maxTokens: 10
      });
      
      return {
        status: 'healthy',
        claude: testResponse.success,
        github: !!this.config.github.token,
        stats: this.getStats()
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