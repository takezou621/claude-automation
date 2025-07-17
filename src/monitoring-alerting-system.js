/**
 * Monitoring and Alerting System
 * 
 * Comprehensive monitoring system for automation tiers with:
 * - GitHub Actions quota monitoring and alerts
 * - Performance threshold monitoring for each tier
 * - Tier health checks and status reporting
 * - Automated tier recommendation based on repository patterns
 */

const EventEmitter = require('events');

class MonitoringAlertingSystem extends EventEmitter {
  constructor (configManager, githubClient, performanceManager) {
    super();
    
    this.configManager = configManager;
    this.githubClient = githubClient;
    this.performanceManager = performanceManager;
    
    // Monitoring state
    this.monitoringActive = false;
    this.alerts = [];
    this.healthChecks = new Map();
    this.quotaData = new Map();
    this.performanceMetrics = new Map();
    
    // Monitoring intervals
    this.intervals = {
      healthCheck: null,
      quotaCheck: null,
      performanceCheck: null,
      recommendationUpdate: null
    };
    
    // Alert thresholds
    this.thresholds = this.initializeThresholds();
    
    // Event listeners for real-time monitoring
    this.setupEventListeners();
  }

  /**
   * Initialize monitoring thresholds from ConfigManager
   */
  initializeThresholds () {
    const defaultThresholds = {
      githubActions: {
        quotaWarning: 0.8, // 80% of quota used
        quotaCritical: 0.95, // 95% of quota used
        concurrentJobs: 20, // Max concurrent jobs
        queueWaitTime: 300000 // 5 minutes queue wait time
      },
      performance: {
        ultimate: {
          executionTime: 45000, // 45 seconds
          successRate: 0.90, // 90%
          errorRate: 0.10 // 10%
        },
        rapid: {
          executionTime: 240000, // 4 minutes
          successRate: 0.85, // 85%
          errorRate: 0.15 // 15%
        },
        smart: {
          executionTime: 900000, // 15 minutes
          successRate: 0.93, // 93%
          errorRate: 0.07 // 7%
        }
      },
      health: {
        consecutiveFailures: 3,
        responseTimeThreshold: 30000, // 30 seconds
        healthCheckInterval: 60000 // 1 minute
      }
    };

    // Merge with ConfigManager settings if available
    if (this.configManager) {
      const configThresholds = this.configManager.get('monitoring.thresholds', {});
      return this.mergeThresholds(defaultThresholds, configThresholds);
    }

    return defaultThresholds;
  }

  /**
   * Setup event listeners for real-time monitoring
   */
  setupEventListeners () {
    // Listen for tier execution events
    this.on('tierExecution', (data) => {
      this.updatePerformanceMetrics(data.tier, data.metrics);
      this.checkPerformanceThresholds(data.tier, data.metrics);
    });

    // Listen for GitHub API events
    this.on('githubApiCall', (data) => {
      this.updateQuotaUsage(data);
    });

    // Listen for health check events
    this.on('healthCheckComplete', (data) => {
      this.updateHealthStatus(data.tier, data.result);
    });
  }

  /**
   * Start comprehensive monitoring
   */
  async startMonitoring () {
    if (this.monitoringActive) {
      console.log('⚠️ Monitoring already active');
      return;
    }

    console.log('🔍 Starting comprehensive monitoring system...');
    
    try {
      // Initialize monitoring data
      await this.initializeMonitoringData();
      
      // Start periodic checks
      this.startHealthChecks();
      this.startQuotaMonitoring();
      this.startPerformanceMonitoring();
      this.startRecommendationUpdates();
      
      this.monitoringActive = true;
      console.log('✅ Monitoring system started successfully');
      
      this.emit('monitoringStarted', {
        timestamp: new Date().toISOString(),
        intervals: Object.keys(this.intervals)
      });
      
    } catch (error) {
      console.error('❌ Failed to start monitoring:', error.message);
      throw error;
    }
  }

  /**
   * Stop monitoring
   */
  async stopMonitoring () {
    console.log('🛑 Stopping monitoring system...');
    
    // Clear all intervals
    Object.values(this.intervals).forEach(interval => {
      if (interval) clearInterval(interval);
    });
    
    // Reset intervals
    Object.keys(this.intervals).forEach(key => {
      this.intervals[key] = null;
    });
    
    this.monitoringActive = false;
    console.log('✅ Monitoring system stopped');
    
    this.emit('monitoringStopped', {
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Initialize monitoring data structures
   */
  async initializeMonitoringData () {
    const enabledTiers = this.configManager ? 
      this.configManager.getEnabledTiers() : ['ultimate', 'rapid', 'smart'];
    
    // Initialize health check data
    for (const tier of enabledTiers) {
      this.healthChecks.set(tier, {
        status: 'unknown',
        lastCheck: null,
        consecutiveFailures: 0,
        uptime: 0,
        responseTime: 0
      });
      
      this.performanceMetrics.set(tier, {
        executionTimes: [],
        successRate: 0,
        errorRate: 0,
        lastUpdate: null
      });
    }
    
    // Initialize quota data
    this.quotaData.set('actions', {
      totalMinutes: 0,
      usedMinutes: 0,
      remainingMinutes: 0,
      resetDate: null,
      lastUpdate: null
    });
  }

  /**
   * Start tier health checks
   */
  startHealthChecks () {
    const interval = this.thresholds.health.healthCheckInterval;
    
    this.intervals.healthCheck = setInterval(async () => {
      await this.performHealthChecks();
    }, interval);
    
    console.log(`🏥 Health checks started (interval: ${interval}ms)`);
  }

  /**
   * Start GitHub Actions quota monitoring
   */
  startQuotaMonitoring () {
    // Check quota every 15 minutes
    this.intervals.quotaCheck = setInterval(async () => {
      await this.checkGitHubActionsQuota();
    }, 15 * 60 * 1000);
    
    // Initial check
    this.checkGitHubActionsQuota();
    console.log('📊 GitHub Actions quota monitoring started');
  }

  /**
   * Start performance monitoring
   */
  startPerformanceMonitoring () {
    // Check performance every 5 minutes
    this.intervals.performanceCheck = setInterval(async () => {
      await this.checkAllTierPerformance();
    }, 5 * 60 * 1000);
    
    console.log('⚡ Performance monitoring started');
  }

  /**
   * Start automated recommendation updates
   */
  startRecommendationUpdates () {
    // Update recommendations every hour
    this.intervals.recommendationUpdate = setInterval(async () => {
      await this.updateAutomatedRecommendations();
    }, 60 * 60 * 1000);
    
    console.log('🎯 Automated recommendation updates started');
  }

  /**
   * Perform health checks for all enabled tiers
   */
  async performHealthChecks () {
    const enabledTiers = this.configManager ? 
      this.configManager.getEnabledTiers() : ['ultimate', 'rapid', 'smart'];
    
    for (const tier of enabledTiers) {
      try {
        const healthResult = await this.checkTierHealth(tier);
        this.updateHealthStatus(tier, healthResult);
        
        this.emit('healthCheckComplete', {
          tier,
          result: healthResult,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error(`❌ Health check failed for ${tier} tier:`, error.message);
        this.updateHealthStatus(tier, { status: 'error', error: error.message });
      }
    }
  }

  /**
   * Check health of specific tier
   */
  async checkTierHealth (tier) {
    const startTime = Date.now();
    
    try {
      // Check if tier is enabled
      const isEnabled = this.configManager ? 
        this.configManager.getTierConfig(tier)?.enabled : true;
      
      if (!isEnabled) {
        return {
          status: 'disabled',
          responseTime: 0,
          checks: { enabled: false }
        };
      }
      
      // Perform basic health checks
      const checks = {
        enabled: true,
        configValid: await this.checkTierConfiguration(tier),
        resourcesAvailable: await this.checkTierResources(tier),
        workflowsAccessible: await this.checkTierWorkflows(tier)
      };
      
      const responseTime = Date.now() - startTime;
      const allHealthy = Object.values(checks).every(check => check === true);
      
      return {
        status: allHealthy ? 'healthy' : 'unhealthy',
        responseTime,
        checks
      };
      
    } catch (error) {
      return {
        status: 'error',
        responseTime: Date.now() - startTime,
        error: error.message,
        checks: {}
      };
    }
  }

  /**
   * Check GitHub Actions quota usage
   */
  async checkGitHubActionsQuota () {
    try {
      if (!this.githubClient) {
        console.warn('⚠️ GitHub client not available for quota monitoring');
        return;
      }

      // Get billing information (requires appropriate permissions)
      const billing = await this.githubClient.getBilling();
      const actions = billing.actions || {};
      
      const quotaData = {
        totalMinutes: actions.total_minutes_used || 0,
        usedMinutes: actions.total_minutes_used || 0,
        remainingMinutes: (actions.included_minutes || 2000) - (actions.total_minutes_used || 0),
        resetDate: new Date().toISOString(), // Approximation
        lastUpdate: new Date().toISOString()
      };
      
      this.quotaData.set('actions', quotaData);
      
      // Check thresholds and generate alerts
      const usageRatio = quotaData.usedMinutes / (quotaData.usedMinutes + quotaData.remainingMinutes);
      
      if (usageRatio >= this.thresholds.githubActions.quotaCritical) {
        this.generateAlert('critical', 'github_quota', 
          `GitHub Actions quota critical: ${(usageRatio * 100).toFixed(1)}% used`);
      } else if (usageRatio >= this.thresholds.githubActions.quotaWarning) {
        this.generateAlert('warning', 'github_quota', 
          `GitHub Actions quota warning: ${(usageRatio * 100).toFixed(1)}% used`);
      }
      
      this.emit('quotaUpdated', { quotaData, usageRatio });
      
    } catch (error) {
      console.error('❌ Failed to check GitHub Actions quota:', error.message);
      this.generateAlert('error', 'quota_check', `Quota monitoring failed: ${error.message}`);
    }
  }

  /**
   * Check performance for all tiers
   */
  async checkAllTierPerformance () {
    const enabledTiers = this.configManager ? 
      this.configManager.getEnabledTiers() : ['ultimate', 'rapid', 'smart'];
    
    for (const tier of enabledTiers) {
      try {
        const performance = this.performanceManager ? 
          await this.performanceManager.getTierPerformanceSummary(tier) : null;
        
        if (performance) {
          this.checkPerformanceThresholds(tier, performance);
        }
        
      } catch (error) {
        console.error(`❌ Performance check failed for ${tier} tier:`, error.message);
      }
    }
  }

  /**
   * Check performance against thresholds
   */
  checkPerformanceThresholds (tier, metrics) {
    const thresholds = this.thresholds.performance[tier];
    if (!thresholds) return;
    
    const alerts = [];
    
    // Check execution time
    if (metrics.averageExecutionTime > thresholds.executionTime) {
      alerts.push({
        type: 'performance',
        severity: 'warning',
        message: `${tier} tier execution time above threshold: ${metrics.averageExecutionTime}ms > ${thresholds.executionTime}ms`
      });
    }
    
    // Check success rate
    if (metrics.successRate < thresholds.successRate * 100) {
      alerts.push({
        type: 'performance',
        severity: 'critical',
        message: `${tier} tier success rate below threshold: ${metrics.successRate}% < ${thresholds.successRate * 100}%`
      });
    }
    
    // Generate alerts
    alerts.forEach(alert => {
      this.generateAlert(alert.severity, alert.type, alert.message, { tier, metrics });
    });
  }

  /**
   * Update automated tier recommendations
   */
  async updateAutomatedRecommendations () {
    try {
      if (!this.configManager) return;
      
      // Analyze repository patterns
      const repoAnalysis = await this.analyzeRepositoryPatterns();
      
      // Generate recommendations based on analysis
      const recommendations = this.generateTierRecommendations(repoAnalysis);
      
      // Store recommendations
      await this.configManager.set('monitoring.recommendations', {
        timestamp: new Date().toISOString(),
        analysis: repoAnalysis,
        recommendations
      });
      
      this.emit('recommendationsUpdated', { repoAnalysis, recommendations });
      console.log(`🎯 Updated automated recommendations (${recommendations.length} recommendations)`);
      
    } catch (error) {
      console.error('❌ Failed to update recommendations:', error.message);
    }
  }

  /**
   * Analyze repository patterns for recommendations
   */
  async analyzeRepositoryPatterns () {
    // Simulate repository analysis (in real implementation, this would analyze actual repository data)
    return {
      issueTypes: {
        feature: 0.4,
        bug: 0.3,
        documentation: 0.15,
        security: 0.1,
        performance: 0.05
      },
      priorities: {
        high: 0.2,
        medium: 0.6,
        low: 0.2
      },
      workflowPatterns: {
        peakHours: ['14:00', '17:00', '20:00'],
        timezone: 'UTC',
        activityLevel: 'medium'
      },
      performanceHistory: {
        ultimate: { avgTime: 35000, successRate: 0.92 },
        rapid: { avgTime: 180000, successRate: 0.88 },
        smart: { avgTime: 600000, successRate: 0.95 }
      }
    };
  }

  /**
   * Generate tier recommendations based on analysis
   */
  generateTierRecommendations (analysis) {
    const recommendations = [];
    
    // Analyze issue types for tier optimization
    if (analysis.issueTypes.security > 0.15) {
      recommendations.push({
        type: 'tier_optimization',
        tier: 'smart',
        priority: 'high',
        message: 'High security issue volume detected. Consider prioritizing smart tier for security issues.',
        action: 'update_tier_selection_rules'
      });
    }
    
    // Analyze performance patterns
    Object.entries(analysis.performanceHistory).forEach(([tier, perf]) => {
      const thresholds = this.thresholds.performance[tier];
      if (thresholds && perf.successRate < thresholds.successRate) {
        recommendations.push({
          type: 'performance_optimization',
          tier,
          priority: 'medium',
          message: `${tier} tier success rate below optimal. Consider configuration tuning.`,
          action: 'review_tier_configuration'
        });
      }
    });
    
    // Analyze workflow patterns
    if (analysis.workflowPatterns.activityLevel === 'high') {
      recommendations.push({
        type: 'capacity_planning',
        priority: 'medium',
        message: 'High activity level detected. Consider enabling more automation tiers.',
        action: 'scale_automation_capacity'
      });
    }
    
    return recommendations;
  }

  /**
   * Generate alert
   */
  generateAlert (severity, type, message, metadata = {}) {
    const alert = {
      id: this.generateAlertId(),
      severity, // critical, warning, info
      type, // github_quota, performance, health, etc.
      message,
      metadata,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      resolved: false
    };
    
    this.alerts.push(alert);
    
    // Keep only recent alerts (last 1000)
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }
    
    console.log(`🚨 ${severity.toUpperCase()} Alert: ${message}`);
    
    this.emit('alertGenerated', alert);
    
    // Auto-notify based on severity
    if (severity === 'critical') {
      this.notifyAdministrators(alert);
    }
    
    return alert;
  }

  /**
   * Get comprehensive monitoring status
   */
  getMonitoringStatus () {
    const enabledTiers = this.configManager ? 
      this.configManager.getEnabledTiers() : ['ultimate', 'rapid', 'smart'];
    
    const status = {
      monitoring: {
        active: this.monitoringActive,
        startTime: this.monitoringStartTime,
        intervals: Object.fromEntries(
          Object.entries(this.intervals).map(([key, interval]) => [key, !!interval])
        )
      },
      tiers: {},
      quota: Object.fromEntries(this.quotaData),
      alerts: {
        total: this.alerts.length,
        unacknowledged: this.alerts.filter(a => !a.acknowledged).length,
        critical: this.alerts.filter(a => a.severity === 'critical').length,
        recent: this.alerts.slice(-10)
      },
      recommendations: this.configManager ? 
        this.configManager.get('monitoring.recommendations', {}) : {}
    };
    
    // Add tier-specific status
    for (const tier of enabledTiers) {
      status.tiers[tier] = {
        health: this.healthChecks.get(tier) || {},
        performance: this.performanceMetrics.get(tier) || {}
      };
    }
    
    return status;
  }

  /**
   * Helper methods
   */
  
  async checkTierConfiguration (tier) {
    try {
      const config = this.configManager ? this.configManager.getTierConfig(tier) : null;
      return config && config.enabled && config.schedule && config.maxExecutionTime;
    } catch {
      return false;
    }
  }
  
  async checkTierResources (tier) {
    // Simulate resource check (CPU, memory, etc.)
    return Math.random() > 0.1; // 90% chance of resources being available
  }
  
  async checkTierWorkflows (tier) {
    // Simulate workflow accessibility check
    return Math.random() > 0.05; // 95% chance of workflows being accessible
  }
  
  updateHealthStatus (tier, result) {
    const current = this.healthChecks.get(tier) || {};
    
    if (result.status === 'healthy') {
      current.consecutiveFailures = 0;
    } else {
      current.consecutiveFailures = (current.consecutiveFailures || 0) + 1;
    }
    
    const updated = {
      ...current,
      status: result.status,
      lastCheck: new Date().toISOString(),
      responseTime: result.responseTime || 0,
      uptime: result.status === 'healthy' ? (current.uptime || 0) + 1 : 0
    };
    
    this.healthChecks.set(tier, updated);
    
    // Generate alert for consecutive failures
    if (updated.consecutiveFailures >= this.thresholds.health.consecutiveFailures) {
      this.generateAlert('critical', 'health', 
        `${tier} tier has ${updated.consecutiveFailures} consecutive health check failures`);
    }
  }
  
  updatePerformanceMetrics (tier, metrics) {
    const current = this.performanceMetrics.get(tier) || { executionTimes: [] };
    
    if (metrics.executionTime) {
      current.executionTimes.push(metrics.executionTime);
      // Keep only last 100 execution times
      if (current.executionTimes.length > 100) {
        current.executionTimes = current.executionTimes.slice(-100);
      }
    }
    
    current.lastUpdate = new Date().toISOString();
    this.performanceMetrics.set(tier, current);
  }
  
  updateQuotaUsage (apiCallData) {
    // Track API usage for quota monitoring
    // This would be called whenever GitHub API calls are made
  }
  
  generateAlertId () {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  mergeThresholds (defaults, config) {
    // Deep merge threshold configurations
    const merged = { ...defaults };
    for (const [key, value] of Object.entries(config)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        merged[key] = { ...merged[key], ...value };
      } else {
        merged[key] = value;
      }
    }
    return merged;
  }
  
  async notifyAdministrators (alert) {
    // Implement administrator notification (email, Slack, etc.)
    console.log(`📧 Notifying administrators about critical alert: ${alert.message}`);
    
    // This would integrate with notification systems configured in ConfigManager
    const notificationConfig = this.configManager ? 
      this.configManager.get('notifications', {}) : {};
    
    if (notificationConfig.slack?.enabled) {
      // Send Slack notification
    }
    
    if (notificationConfig.email?.enabled) {
      // Send email notification
    }
  }
}

module.exports = MonitoringAlertingSystem;