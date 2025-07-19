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
        },
        tiers: {
          ultimate: {
            enabled: true,
            schedule: '* * * * *', // Every minute
            maxExecutionTime: 45000, // 45 seconds
            priority: 100,
            fallbackTier: 'rapid',
            cooldownMinutes: 0,
            resourceLimits: {
              cpu: 50,
              memory: 256,
              apiCalls: 30
            },
            qualityGates: {
              securityCheck: 'basic',
              syntaxValidation: true,
              performanceCheck: false
            }
          },
          rapid: {
            enabled: true,
            schedule: '*/5 * * * *', // Every 5 minutes
            maxExecutionTime: 240000, // 4 minutes
            priority: 80,
            fallbackTier: 'smart',
            cooldownMinutes: 5,
            resourceLimits: {
              cpu: 70,
              memory: 512,
              apiCalls: 60
            },
            qualityGates: {
              securityCheck: 'standard',
              syntaxValidation: true,
              performanceCheck: true,
              testExecution: false
            },
            branchPatterns: {
              enabled: true,
              defaultPattern: 'rapid/issue-{number}',
              typeMapping: {
                bug: 'fix/issue-{number}-rapid',
                enhancement: 'feature/issue-{number}-rapid',
                security: 'security/issue-{number}-rapid'
              }
            }
          },
          smart: {
            enabled: true,
            schedule: {
              weekdays: ['0 14 * * 1-5', '0 17 * * 1-5', '0 20 * * 1-5'],
              weekends: ['0 1 * * 0,6', '0 5 * * 0,6', '0 9 * * 0,6', '0 13 * * 0,6']
            },
            maxExecutionTime: 900000, // 15 minutes
            priority: 60,
            fallbackTier: null,
            cooldownMinutes: 180, // 3 hours
            resourceLimits: {
              cpu: 90,
              memory: 1024,
              apiCalls: 120
            },
            qualityGates: {
              securityCheck: 'comprehensive',
              syntaxValidation: true,
              performanceCheck: true,
              testExecution: true,
              codeReview: true,
              documentationRequired: true
            },
            branchPatterns: {
              enabled: true,
              intelligentSelection: true,
              patterns: [
                'critical/issue-{number}-{type}',
                'security/issue-{number}-{sanitized-title}',
                'feature/issue-{number}-{sanitized-title}',
                'fix/issue-{number}-{sanitized-title}',
                'docs/issue-{number}-{sanitized-title}',
                'perf/issue-{number}-{sanitized-title}',
                'refactor/issue-{number}-{sanitized-title}',
                'test/issue-{number}-{sanitized-title}',
                'ci/issue-{number}-{sanitized-title}'
              ]
            },
            scheduleOptimization: {
              enabled: true,
              timezoneAware: true,
              activityBasedAdjustment: true,
              resourceContentionPrevention: true
            }
          }
        },
        tierSelection: {
          defaultTier: 'rapid',
          autoSelection: true,
          selectionCriteria: {
            issueComplexity: true,
            issuePriority: true,
            resourceAvailability: true,
            historicalPerformance: true
          },
          fallbackChain: ['ultimate', 'rapid', 'smart']
        },
        performanceTracking: {
          enabled: true,
          retentionDays: 30,
          anomalyDetection: true,
          anomalyThreshold: 2.0,
          alerting: true,
          metrics: {
            executionTime: true,
            successRate: true,
            resourceUsage: true,
            qualityScore: true,
            throughput: true
          }
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
   * Get tier configuration
   */
  getTierConfig (tier) {
    return this.get(`automation.tiers.${tier}`, null);
  }

  /**
   * Update tier configuration
   */
  async updateTierConfig (tier, config) {
    const currentConfig = this.getTierConfig(tier) || {};
    await this.set(`automation.tiers.${tier}`, { ...currentConfig, ...config });
  }

  /**
   * Enable/disable automation tier
   */
  async setTierEnabled (tier, enabled) {
    await this.set(`automation.tiers.${tier}.enabled`, enabled);
  }

  /**
   * Get all enabled tiers
   */
  getEnabledTiers () {
    const tiers = this.get('automation.tiers', {});
    return Object.entries(tiers)
      .filter(([, config]) => config.enabled)
      .map(([tier]) => tier);
  }

  /**
   * Get tier selection configuration
   */
  getTierSelectionConfig () {
    return this.get('automation.tierSelection', {
      defaultTier: 'rapid',
      autoSelection: true,
      fallbackChain: ['ultimate', 'rapid', 'smart']
    });
  }

  /**
   * Update tier selection configuration
   */
  async updateTierSelectionConfig (config) {
    const currentConfig = this.getTierSelectionConfig();
    await this.set('automation.tierSelection', { ...currentConfig, ...config });
  }

  /**
   * Get branch pattern configuration for tier
   */
  getBranchPatternConfig (tier) {
    return this.get(`automation.tiers.${tier}.branchPatterns`, {});
  }

  /**
   * Update branch pattern configuration for tier
   */
  async updateBranchPatternConfig (tier, config) {
    const currentConfig = this.getBranchPatternConfig(tier);
    await this.set(`automation.tiers.${tier}.branchPatterns`, { ...currentConfig, ...config });
  }

  /**
   * Get performance tracking configuration
   */
  getPerformanceTrackingConfig () {
    return this.get('automation.performanceTracking', {
      enabled: true,
      retentionDays: 30,
      anomalyDetection: true
    });
  }

  /**
   * Update performance tracking configuration
   */
  async updatePerformanceTrackingConfig (config) {
    const currentConfig = this.getPerformanceTrackingConfig();
    await this.set('automation.performanceTracking', { ...currentConfig, ...config });
  }

  /**
   * Store performance metrics for tier
   */
  async storePerformanceMetrics (tier, metrics) {
    const key = `performance.tierMetrics.${tier}`;
    const currentMetrics = this.get(key, []);

    // Add new metrics with timestamp
    const newMetric = {
      ...metrics,
      timestamp: new Date().toISOString()
    };

    currentMetrics.push(newMetric);

    // Keep only recent metrics based on retention policy
    const retentionDays = this.getPerformanceTrackingConfig().retentionDays;
    const cutoffDate = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000));

    const filteredMetrics = currentMetrics.filter(metric =>
      new Date(metric.timestamp) > cutoffDate
    );

    await this.set(key, filteredMetrics);
  }

  /**
   * Get performance metrics for tier
   */
  getPerformanceMetrics (tier, timeWindow = '24h') {
    const metrics = this.get(`performance.tierMetrics.${tier}`, []);

    // Parse time window
    const windowMs = this.parseTimeWindow(timeWindow);
    const cutoffDate = new Date(Date.now() - windowMs);

    return metrics.filter(metric =>
      new Date(metric.timestamp) > cutoffDate
    );
  }

  /**
   * Get tier performance summary
   */
  getTierPerformanceSummary (tier) {
    const metrics = this.getPerformanceMetrics(tier, '24h');

    if (metrics.length === 0) {
      return {
        tier,
        executionCount: 0,
        averageExecutionTime: 0,
        successRate: 0,
        lastExecution: null
      };
    }

    const totalExecutionTime = metrics.reduce((sum, m) => sum + (m.executionTime || 0), 0);
    const successfulExecutions = metrics.filter(m => m.success).length;
    const latestMetric = metrics.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    return {
      tier,
      executionCount: metrics.length,
      averageExecutionTime: totalExecutionTime / metrics.length,
      successRate: (successfulExecutions / metrics.length) * 100,
      lastExecution: latestMetric.timestamp,
      resourceUsage: {
        avgCpu: metrics.reduce((sum, m) => sum + (m.cpu || 0), 0) / metrics.length,
        avgMemory: metrics.reduce((sum, m) => sum + (m.memory || 0), 0) / metrics.length,
        avgApiCalls: metrics.reduce((sum, m) => sum + (m.apiCalls || 0), 0) / metrics.length
      }
    };
  }

  /**
   * Get optimal tier recommendation for issue
   */
  getOptimalTierRecommendation (issueData) {
    const selectionConfig = this.getTierSelectionConfig();

    if (!selectionConfig.autoSelection) {
      return {
        recommendedTier: selectionConfig.defaultTier,
        confidence: 0.5,
        reasoning: 'Auto-selection disabled, using default tier'
      };
    }

    // Analyze issue characteristics
    const analysis = this.analyzeIssueForTierSelection(issueData);

    // Score each tier based on suitability
    const tierScores = {};
    const enabledTiers = this.getEnabledTiers();

    for (const tier of enabledTiers) {
      tierScores[tier] = this.calculateTierSuitabilityScore(tier, analysis);
    }

    // Find best tier
    const bestTier = Object.entries(tierScores)
      .sort(([, a], [, b]) => b - a)[0];

    return {
      recommendedTier: bestTier[0],
      confidence: bestTier[1],
      reasoning: this.generateTierRecommendationReasoning(bestTier[0], analysis),
      alternativeTiers: Object.entries(tierScores)
        .sort(([, a], [, b]) => b - a)
        .slice(1, 3)
        .map(([tier, score]) => ({ tier, score }))
    };
  }

  /**
   * Analyze issue characteristics for tier selection
   */
  analyzeIssueForTierSelection (issueData) {
    const title = (issueData.title || '').toLowerCase();
    const body = (issueData.body || '').toLowerCase();
    const labels = (issueData.labels || []).map(l =>
      typeof l === 'string' ? l.toLowerCase() : l.name.toLowerCase()
    );

    return {
      priority: this.detectIssuePriority(labels, title),
      complexity: this.detectIssueComplexity(labels, title, body),
      urgency: this.detectIssueUrgency(labels, title),
      risk: this.detectIssueRisk(labels, title, body),
      type: this.detectIssueType(labels, title)
    };
  }

  /**
   * Calculate tier suitability score
   */
  calculateTierSuitabilityScore (tier, analysis) {
    const tierConfig = this.getTierConfig(tier);
    if (!tierConfig || !tierConfig.enabled) return 0;

    let score = 0;

    // Priority scoring
    if (tier === 'ultimate' && analysis.priority >= 90) score += 30;
    if (tier === 'rapid' && analysis.priority >= 60 && analysis.priority < 90) score += 25;
    if (tier === 'smart' && analysis.priority < 60) score += 20;

    // Complexity scoring
    if (tier === 'smart' && analysis.complexity === 'high') score += 25;
    if (tier === 'rapid' && analysis.complexity === 'medium') score += 20;
    if (tier === 'ultimate' && analysis.complexity === 'low') score += 15;

    // Urgency scoring
    if (tier === 'ultimate' && analysis.urgency === 'high') score += 20;
    if (tier === 'rapid' && analysis.urgency === 'medium') score += 15;

    // Risk scoring
    if (tier === 'smart' && analysis.risk === 'high') score += 20;
    if (tier === 'rapid' && analysis.risk === 'medium') score += 15;
    if (tier === 'ultimate' && analysis.risk === 'low') score += 10;

    // Type-specific scoring
    const typeScoring = {
      ultimate: { bug: 10, hotfix: 15, critical: 20 },
      rapid: { enhancement: 15, feature: 10, bug: 15 },
      smart: { refactor: 20, documentation: 15, security: 25 }
    };

    if (typeScoring[tier] && typeScoring[tier][analysis.type]) {
      score += typeScoring[tier][analysis.type];
    }

    return Math.min(100, score);
  }

  /**
   * Generate tier recommendation reasoning
   */
  generateTierRecommendationReasoning (tier, analysis) {
    const reasons = [];

    if (tier === 'ultimate') {
      if (analysis.priority >= 90) reasons.push('High priority issue requiring immediate attention');
      if (analysis.urgency === 'high') reasons.push('Urgent issue needing rapid response');
      if (analysis.complexity === 'low') reasons.push('Low complexity suitable for fast processing');
    } else if (tier === 'rapid') {
      if (analysis.complexity === 'medium') reasons.push('Medium complexity balances speed and quality');
      if (analysis.priority >= 60) reasons.push('Priority level appropriate for rapid processing');
      if (analysis.risk === 'medium') reasons.push('Risk level manageable with rapid quality checks');
    } else if (tier === 'smart') {
      if (analysis.complexity === 'high') reasons.push('High complexity requires comprehensive analysis');
      if (analysis.risk === 'high') reasons.push('High risk needs thorough quality assurance');
      if (analysis.type === 'security') reasons.push('Security issues benefit from smart automation');
    }

    return reasons.join('; ') || 'Best fit based on issue characteristics';
  }

  /**
   * Helper methods for issue analysis
   */
  detectIssuePriority (labels, title) {
    const priorityKeywords = {
      critical: 100, urgent: 90, high: 80, medium: 60, low: 40
    };

    for (const [keyword, score] of Object.entries(priorityKeywords)) {
      if (labels.includes(keyword) || title.includes(keyword)) {
        return score;
      }
    }

    return 60; // Default medium priority
  }

  detectIssueComplexity (labels, title, body) {
    const complexityIndicators = {
      high: ['refactor', 'architecture', 'breaking', 'complex', 'major'],
      medium: ['feature', 'enhancement', 'update', 'improve'],
      low: ['typo', 'comment', 'doc', 'simple', 'minor', 'fix']
    };

    const content = `${title} ${body} ${labels.join(' ')}`;

    for (const [level, indicators] of Object.entries(complexityIndicators)) {
      if (indicators.some(indicator => content.includes(indicator))) {
        return level;
      }
    }

    return 'medium';
  }

  detectIssueUrgency (labels, title) {
    const urgencyKeywords = ['urgent', 'asap', 'immediately', 'hotfix', 'critical'];
    const content = `${title} ${labels.join(' ')}`;

    if (urgencyKeywords.some(keyword => content.includes(keyword))) {
      return 'high';
    }

    return 'medium';
  }

  detectIssueRisk (labels, title, body) {
    const riskIndicators = {
      high: ['security', 'auth', 'payment', 'data', 'breaking'],
      medium: ['api', 'database', 'integration'],
      low: ['doc', 'test', 'comment', 'style']
    };

    const content = `${title} ${body} ${labels.join(' ')}`;

    for (const [level, indicators] of Object.entries(riskIndicators)) {
      if (indicators.some(indicator => content.includes(indicator))) {
        return level;
      }
    }

    return 'medium';
  }

  detectIssueType (labels, title) {
    const typePatterns = {
      security: ['security', 'vulnerability', 'cve'],
      bug: ['bug', 'error', 'fix', 'broken'],
      feature: ['feature', 'enhancement', 'add'],
      documentation: ['doc', 'readme', 'wiki'],
      performance: ['performance', 'slow', 'optimize'],
      test: ['test', 'coverage', 'spec']
    };

    const content = `${title} ${labels.join(' ')}`;

    for (const [type, patterns] of Object.entries(typePatterns)) {
      if (patterns.some(pattern => content.includes(pattern))) {
        return type;
      }
    }

    return 'general';
  }

  /**
   * Parse time window string to milliseconds
   */
  parseTimeWindow (timeWindow) {
    const match = timeWindow.match(/^(\d+)([hmsd])$/);
    if (!match) return 24 * 60 * 60 * 1000; // Default 24 hours

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000
    };

    return value * (multipliers[unit] || multipliers.h);
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
