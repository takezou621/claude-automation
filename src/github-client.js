/**
 * GitHub API Client
 * 無料版での基本的なGitHub操作
 */

const { Octokit } = require('@octokit/rest');
const winston = require('winston');

class GitHubClient {
  constructor (config = {}) {
    this.config = {
      token: config.token || process.env.GITHUB_TOKEN,
      owner: config.owner,
      repo: config.repo,
      ...config
    };

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.simple(),
      transports: [new winston.transports.Console()]
    });

    this.octokit = new Octokit({
      auth: this.config.token,
      userAgent: 'claude-automation-free/1.0.0'
    });

    this.rateLimitInfo = {
      remaining: 5000,
      reset: new Date()
    };
  }

  /**
   * プルリクエストの取得
   */
  async getPullRequest (prNumber) {
    try {
      const response = await this.octokit.pulls.get({
        owner: this.config.owner,
        repo: this.config.repo,
        pull_number: prNumber
      });

      // ファイル変更の取得
      const filesResponse = await this.octokit.pulls.listFiles({
        owner: this.config.owner,
        repo: this.config.repo,
        pull_number: prNumber
      });

      this.updateRateLimit(response.headers);

      return {
        success: true,
        data: {
          ...response.data,
          files: filesResponse.data
        }
      };
    } catch (error) {
      this.logger.error('Failed to get PR:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * プルリクエストにコメントを追加
   */
  async createPullRequestComment (prNumber, comment) {
    try {
      const response = await this.octokit.issues.createComment({
        owner: this.config.owner,
        repo: this.config.repo,
        issue_number: prNumber,
        body: comment
      });

      this.updateRateLimit(response.headers);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      this.logger.error('Failed to create PR comment:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * イシューの取得
   */
  async getIssue (issueNumber) {
    try {
      const response = await this.octokit.issues.get({
        owner: this.config.owner,
        repo: this.config.repo,
        issue_number: issueNumber
      });

      this.updateRateLimit(response.headers);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      this.logger.error('Failed to get issue:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * イシューにラベルを追加
   */
  async addLabelsToIssue (issueNumber, labels) {
    try {
      const response = await this.octokit.issues.addLabels({
        owner: this.config.owner,
        repo: this.config.repo,
        issue_number: issueNumber,
        labels: Array.isArray(labels) ? labels : [labels]
      });

      this.updateRateLimit(response.headers);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      this.logger.error('Failed to add labels:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 最近のプルリクエスト一覧を取得
   */
  async getRecentPullRequests (count = 10) {
    try {
      const response = await this.octokit.pulls.list({
        owner: this.config.owner,
        repo: this.config.repo,
        state: 'open',
        sort: 'updated',
        direction: 'desc',
        per_page: count
      });

      this.updateRateLimit(response.headers);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      this.logger.error('Failed to get recent PRs:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 最近のイシュー一覧を取得
   */
  async getRecentIssues (count = 10) {
    try {
      const response = await this.octokit.issues.list({
        owner: this.config.owner,
        repo: this.config.repo,
        state: 'open',
        sort: 'updated',
        direction: 'desc',
        per_page: count
      });

      this.updateRateLimit(response.headers);

      return {
        success: true,
        data: response.data.filter(issue => !issue.pull_request) // PRを除外
      };
    } catch (error) {
      this.logger.error('Failed to get recent issues:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * プルリクエストの差分を取得
   */
  async getPullRequestDiff (prNumber) {
    try {
      const response = await this.octokit.pulls.get({
        owner: this.config.owner,
        repo: this.config.repo,
        pull_number: prNumber,
        mediaType: {
          format: 'diff'
        }
      });

      this.updateRateLimit(response.headers);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      this.logger.error('Failed to get PR diff:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * ラベルの作成
   */
  async createLabel (name, color, description) {
    try {
      const response = await this.octokit.issues.createLabel({
        owner: this.config.owner,
        repo: this.config.repo,
        name,
        color,
        description
      });

      this.updateRateLimit(response.headers);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // ラベルが既に存在する場合は成功とみなす
      if (error.status === 422) {
        return {
          success: true,
          data: { message: 'Label already exists' }
        };
      }

      this.logger.error('Failed to create label:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 基本的なラベルのセットアップ
   */
  async setupBasicLabels () {
    const labels = [
      { name: 'ai-reviewed', color: '0e8a16', description: 'Reviewed by AI automation' },
      { name: 'ai-classified', color: '006b75', description: 'Classified by AI automation' },
      { name: 'needs-human-review', color: 'd73a4a', description: 'Requires human review' },
      { name: 'auto-bug', color: 'b60205', description: 'Automatically classified as bug' },
      { name: 'auto-feature', color: '0052cc', description: 'Automatically classified as feature' },
      { name: 'auto-documentation', color: '7057ff', description: 'Automatically classified as documentation' },
      { name: 'auto-question', color: 'fbca04', description: 'Automatically classified as question' }
    ];

    const results = [];

    for (const label of labels) {
      const result = await this.createLabel(label.name, label.color, label.description);
      results.push({ ...label, ...result });
    }

    return results;
  }

  /**
   * レート制限情報の更新
   */
  updateRateLimit (headers) {
    if (headers['x-ratelimit-remaining']) {
      this.rateLimitInfo.remaining = parseInt(headers['x-ratelimit-remaining']);
    }
    if (headers['x-ratelimit-reset']) {
      this.rateLimitInfo.reset = new Date(parseInt(headers['x-ratelimit-reset']) * 1000);
    }
  }

  /**
   * レート制限情報の取得
   */
  getRateLimitInfo () {
    return {
      ...this.rateLimitInfo,
      resetIn: Math.max(0, this.rateLimitInfo.reset - new Date())
    };
  }

  /**
   * 接続テスト
   */
  async testConnection () {
    try {
      const response = await this.octokit.users.getAuthenticated();

      return {
        success: true,
        user: response.data.login,
        scopes: response.headers['x-oauth-scopes']?.split(', ') || []
      };
    } catch (error) {
      this.logger.error('GitHub connection test failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * リポジトリ情報の取得
   */
  async getRepositoryInfo () {
    try {
      const response = await this.octokit.repos.get({
        owner: this.config.owner,
        repo: this.config.repo
      });

      return {
        success: true,
        data: {
          name: response.data.name,
          fullName: response.data.full_name,
          description: response.data.description,
          private: response.data.private,
          language: response.data.language,
          stars: response.data.stargazers_count,
          forks: response.data.forks_count,
          openIssues: response.data.open_issues_count
        }
      };
    } catch (error) {
      this.logger.error('Failed to get repository info:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * ヘルスチェック
   */
  async healthCheck () {
    const connectionTest = await this.testConnection();

    if (!connectionTest.success) {
      return {
        status: 'unhealthy',
        error: connectionTest.error,
        rateLimit: this.getRateLimitInfo()
      };
    }

    const repoInfo = await this.getRepositoryInfo();

    return {
      status: 'healthy',
      user: connectionTest.user,
      repository: repoInfo.success ? repoInfo.data : null,
      rateLimit: this.getRateLimitInfo(),
      scopes: connectionTest.scopes
    };
  }
}

module.exports = GitHubClient;
