/**
 * Configuration Manager
 * Persistent configuration and learning system for Claude AI automation
 */

const fs = require('fs').promises;
const path = require('path');

class ConfigManager {
  constructor (configPath = './config/claude-automation.json') {
    this.configPath = configPath;
    this.config = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      ai: {
        model: 'claude-3-sonnet-20240229',
        maxTokens: 4000,
        temperature: 0.1,
        rateLimits: {
          requestsPerMinute: 50,
          tokensPerMinute: 40000
        }
      },
      analysis: {
        cacheTimeout: 300000, // 5 minutes
        supportedLanguages: [
          'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'go', 'rust',
          'php', 'ruby', 'swift', 'kotlin', 'scala', 'dart', 'yaml', 'json'
        ],
        riskThresholds: {
          low: 10,
          medium: 25,
          high: 50
        },
        qualityGates: {
          maxIssuesPerFile: 10,
          maxSecurityIssues: 5,
          maxPerformanceIssues: 8,
          requiredCoverage: 80
        }
      },
      automation: {
        enableSmartMerge: true,
        autoLabelPRs: true,
        createReviewComments: true,
        requireManualReviewForHighRisk: true,
        schedules: {
          healthCheck: '*/15 * * * *', // Every 15 minutes
          performanceAnalysis: '0 */6 * * *', // Every 6 hours
          securityScan: '0 2 * * *', // Daily at 2 AM
          qualityReport: '0 8 * * 1' // Weekly on Monday at 8 AM
        }
      },
      repository: {
        mainBranch: 'main',
        protectedBranches: ['main', 'develop'],
        ignoredPaths: [
          'node_modules',
          'vendor',
          '.git',
          'dist',
          'build',
          'coverage',
          '*.min.js',
          '*.bundle.js'
        ],
        autoDeleteBranches: true,
        squashMerge: true
      },
      notifications: {
        slack: {
          enabled: false,
          webhook: null,
          channels: {
            general: '#claude-automation',
            security: '#security-alerts',
            performance: '#performance-alerts'
          }
        },
        email: {
          enabled: false,
          recipients: [],
          templates: {
            highRisk: 'high-risk-pr-template',
            securityAlert: 'security-alert-template',
            performanceAlert: 'performance-alert-template'
          }
        }
      },
      learning: {
        enableLearning: true,
        historySize: 1000,
        patterns: {},
        improvements: {},
        userFeedback: {}
      },
      performance: {
        maxExecutionTime: 300000, // 5 minutes
        maxMemoryUsage: 512, // MB
        enableProfiling: false,
        metrics: {
          requestCount: 0,
          averageResponseTime: 0,
          successRate: 100,
          errorRate: 0
        }
      }
    };

    this.loadConfig();
  }

  /**
   * Load configuration from file
   */
  async loadConfig () {
    try {
      // Ensure config directory exists
      const configDir = path.dirname(this.configPath);
      await fs.mkdir(configDir, { recursive: true });

      // Load existing config
      const configData = await fs.readFile(this.configPath, 'utf8');
      const savedConfig = JSON.parse(configData);

      // Merge with defaults (in case new options were added)
      this.config = this.mergeConfigs(this.config, savedConfig);

      console.log('📋 Configuration loaded successfully');
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Config file doesn't exist, create it with defaults
        await this.saveConfig();
        console.log('📋 Default configuration created');
      } else {
        console.error('❌ Error loading configuration:', error.message);
      }
    }
  }

  /**
   * Save configuration to file
   */
  async saveConfig () {
    try {
      this.config.lastUpdated = new Date().toISOString();

      const configData = JSON.stringify(this.config, null, 2);
      await fs.writeFile(this.configPath, configData, 'utf8');

      console.log('💾 Configuration saved successfully');
    } catch (error) {
      console.error('❌ Error saving configuration:', error.message);
      throw error;
    }
  }

  /**
   * Get configuration value
   */
  get (path, defaultValue = null) {
    const keys = path.split('.');
    let current = this.config;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }

    return current;
  }

  /**
   * Set configuration value
   */
  async set (path, value) {
    const keys = path.split('.');
    let current = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
    await this.saveConfig();

    console.log(`⚙️ Configuration updated: ${path} = ${JSON.stringify(value)}`);
  }

  /**
   * Update AI model settings
   */
  async updateAISettings (settings) {
    await this.set('ai', { ...this.get('ai'), ...settings });
  }

  /**
   * Update analysis settings
   */
  async updateAnalysisSettings (settings) {
    await this.set('analysis', { ...this.get('analysis'), ...settings });
  }

  /**
   * Update automation settings
   */
  async updateAutomationSettings (settings) {
    await this.set('automation', { ...this.get('automation'), ...settings });
  }

  /**
   * Record learning data
   */
  async recordLearning (type, data) {
    if (!this.get('learning.enableLearning')) {
      return;
    }

    const learningData = this.get('learning') || {};

    if (!learningData[type]) {
      learningData[type] = [];
    }

    // Add new learning data
    learningData[type].push({
      timestamp: new Date().toISOString(),
      data
    });

    // Keep only recent entries
    const historySize = this.get('learning.historySize', 1000);
    if (learningData[type].length > historySize) {
      learningData[type] = learningData[type].slice(-historySize);
    }

    await this.set('learning', learningData);

    console.log(`🧠 Learning data recorded: ${type}`);
  }

  /**
   * Get learning insights
   */
  getLearningInsights (type) {
    const learningData = this.get(`learning.${type}`, []);

    if (learningData.length === 0) {
      return {
        totalEntries: 0,
        insights: []
      };
    }

    // Analyze patterns
    const insights = [];

    // Example: Find common issue patterns
    if (type === 'codeReview') {
      const issueTypes = {};
      learningData.forEach(entry => {
        if (entry.data.issues) {
          entry.data.issues.forEach(issue => {
            const issueType = issue.type || 'unknown';
            issueTypes[issueType] = (issueTypes[issueType] || 0) + 1;
          });
        }
      });

      insights.push({
        type: 'commonIssues',
        data: Object.entries(issueTypes)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([type, count]) => ({ type, count }))
      });
    }

    // Example: Success rate analysis
    const successfulEntries = learningData.filter(entry => entry.data.success);
    const successRate = (successfulEntries.length / learningData.length) * 100;

    insights.push({
      type: 'successRate',
      data: {
        rate: successRate,
        total: learningData.length,
        successful: successfulEntries.length
      }
    });

    return {
      totalEntries: learningData.length,
      insights
    };
  }

  /**
   * Update performance metrics
   */
  async updatePerformanceMetrics (metrics) {
    const currentMetrics = this.get('performance.metrics');
    const updatedMetrics = { ...currentMetrics, ...metrics };

    await this.set('performance.metrics', updatedMetrics);
  }

  /**
   * Get performance report
   */
  getPerformanceReport () {
    const metrics = this.get('performance.metrics');
    const thresholds = {
      responseTime: 2000, // 2 seconds
      successRate: 95, // 95%
      errorRate: 5 // 5%
    };

    return {
      metrics,
      status: {
        responseTime: metrics.averageResponseTime <= thresholds.responseTime ? 'good' : 'poor',
        successRate: metrics.successRate >= thresholds.successRate ? 'good' : 'poor',
        errorRate: metrics.errorRate <= thresholds.errorRate ? 'good' : 'poor'
      },
      recommendations: this.generatePerformanceRecommendations(metrics, thresholds)
    };
  }

  /**
   * Generate performance recommendations
   */
  generatePerformanceRecommendations (metrics, thresholds) {
    const recommendations = [];

    if (metrics.averageResponseTime > thresholds.responseTime) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'Average response time is above threshold',
        actions: [
          'Optimize AI model parameters',
          'Implement better caching',
          'Review API rate limits'
        ]
      });
    }

    if (metrics.successRate < thresholds.successRate) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        message: 'Success rate is below threshold',
        actions: [
          'Implement better error handling',
          'Add retry mechanisms',
          'Review API connectivity'
        ]
      });
    }

    if (metrics.errorRate > thresholds.errorRate) {
      recommendations.push({
        type: 'stability',
        priority: 'medium',
        message: 'Error rate is above threshold',
        actions: [
          'Analyze error patterns',
          'Improve input validation',
          'Add monitoring alerts'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Export configuration
   */
  async exportConfig (exportPath) {
    const exportData = {
      ...this.config,
      exportedAt: new Date().toISOString(),
      version: this.config.version
    };

    await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2), 'utf8');
    console.log(`📤 Configuration exported to ${exportPath}`);
  }

  /**
   * Import configuration
   */
  async importConfig (importPath) {
    const importData = await fs.readFile(importPath, 'utf8');
    const importedConfig = JSON.parse(importData);

    // Validate imported config
    if (!importedConfig.version) {
      throw new Error('Invalid configuration file: missing version');
    }

    // Merge imported config with current config
    this.config = this.mergeConfigs(this.config, importedConfig);
    await this.saveConfig();

    console.log(`📥 Configuration imported from ${importPath}`);
  }

  /**
   * Reset configuration to defaults
   */
  async resetConfig () {
    // Create backup
    const backupPath = `${this.configPath}.backup.${Date.now()}`;
    await fs.copyFile(this.configPath, backupPath);

    // Reset to defaults
    this.config = {
      ...this.config,
      lastUpdated: new Date().toISOString()
    };

    await this.saveConfig();
    console.log(`🔄 Configuration reset to defaults. Backup saved: ${backupPath}`);
  }

  /**
   * Validate configuration
   */
  validateConfig () {
    const errors = [];

    // Check required fields
    if (!this.config.ai.model) {
      errors.push('AI model is not configured');
    }

    if (!this.config.ai.maxTokens || this.config.ai.maxTokens <= 0) {
      errors.push('Invalid AI max tokens configuration');
    }

    if (!this.config.repository.mainBranch) {
      errors.push('Main branch is not configured');
    }

    // Check performance settings
    if (this.config.performance.maxExecutionTime <= 0) {
      errors.push('Invalid max execution time');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Merge configurations
   */
  mergeConfigs (defaultConfig, userConfig) {
    const result = { ...defaultConfig };

    for (const [key, value] of Object.entries(userConfig)) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = this.mergeConfigs(result[key] || {}, value);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Get configuration summary
   */
  getConfigSummary () {
    return {
      version: this.config.version,
      lastUpdated: this.config.lastUpdated,
      aiModel: this.config.ai.model,
      enabledFeatures: {
        smartMerge: this.config.automation.enableSmartMerge,
        autoLabel: this.config.automation.autoLabelPRs,
        learning: this.config.learning.enableLearning,
        notifications: this.config.notifications.slack.enabled || this.config.notifications.email.enabled
      },
      performance: this.config.performance.metrics,
      validation: this.validateConfig()
    };
  }
}

module.exports = ConfigManager;
