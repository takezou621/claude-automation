/**
 * Automation Tier Orchestrator
 *
 * Central integration layer that coordinates all automation tier components
 * with ConfigManager for comprehensive automation system.
 *
 * Demonstrates proper integration of:
 * - ConfigManager
 * - IntelligentScheduleManager
 * - PerformanceAnalyticsManager
 * - TierExecutionHandler
 * - BranchPatternManager
 */

const ConfigManager = require('./config-manager');
const IntelligentScheduleManager = require('./intelligent-schedule-manager');
const PerformanceAnalyticsManager = require('./performance-analytics-manager');
const TierExecutionHandler = require('./tier-execution-handler');
const BranchPatternManager = require('./branch-pattern-manager');
const MonitoringAlertingSystem = require('./monitoring-alerting-system');

class AutomationTierOrchestrator {
  constructor (configPath = './config/claude-automation.json', githubClient = null) {
    // Initialize ConfigManager first
    this.configManager = new ConfigManager(configPath);

    // Initialize all components with ConfigManager integration
    this.scheduleManager = new IntelligentScheduleManager(this.configManager);
    this.performanceManager = new PerformanceAnalyticsManager(this.configManager);
    this.executionHandler = new TierExecutionHandler(this.configManager);
    this.branchPatternManager = new BranchPatternManager();

    // Initialize monitoring system
    this.monitoringSystem = new MonitoringAlertingSystem(
      this.configManager,
      githubClient,
      this.performanceManager
    );

    // Orchestrator state
    this.isInitialized = false;
    this.activeExecutions = new Map();
    this.tierStatus = new Map();
    this.monitoringEnabled = false;
  }

  /**
   * Initialize the orchestrator and all components
   */
  async initialize () {
    try {
      console.log('🚀 Initializing Automation Tier Orchestrator...');

      // Ensure ConfigManager is loaded
      await this.configManager.loadConfig();

      // Validate configuration
      const validation = this.configManager.validateConfig();
      if (!validation.valid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
      }

      // Initialize tier status tracking
      const enabledTiers = this.configManager.getEnabledTiers();
      for (const tier of enabledTiers) {
        this.tierStatus.set(tier, {
          enabled: true,
          lastExecution: null,
          status: 'ready',
          performance: await this.performanceManager.getTierPerformanceSummary(tier)
        });
      }

      // Optionally start monitoring
      const monitoringConfig = this.configManager.get('monitoring.autoStart', true);
      if (monitoringConfig) {
        await this.startMonitoring();
      }

      this.isInitialized = true;
      console.log(`✅ Orchestrator initialized with ${enabledTiers.length} enabled tiers`);

      return {
        success: true,
        enabledTiers,
        configSummary: this.configManager.getConfigSummary(),
        monitoringEnabled: this.monitoringEnabled
      };
    } catch (error) {
      console.error('❌ Failed to initialize orchestrator:', error.message);
      throw error;
    }
  }

  /**
   * Execute automation for a specific issue using optimal tier selection
   */
  async executeAutomationForIssue (issueData, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Orchestrator not initialized. Call initialize() first.');
    }

    // Initialize variables outside try block for proper scope
    let recommendation = null;
    let selectedTier = null;
    let startTime = Date.now();

    try {
      // Get optimal tier recommendation from ConfigManager
      recommendation = this.configManager.getOptimalTierRecommendation(issueData);
      selectedTier = options.forceTier || recommendation.recommendedTier;

      console.log(`🎯 Selected ${selectedTier} tier for issue #${issueData.number} (confidence: ${recommendation.confidence})`);
      console.log(`💡 Reasoning: ${recommendation.reasoning}`);

      // Check if tier is available
      if (!this.executionHandler.isTierEnabled(selectedTier)) {
        throw new Error(`Selected tier ${selectedTier} is disabled`);
      }

      // Generate branch pattern using BranchPatternManager
      const patternSelection = this.branchPatternManager.selectPattern(issueData);
      const branchInfo = this.branchPatternManager.generateBranchName(
        patternSelection.pattern,
        issueData,
        patternSelection.priority
      );

      console.log(`🌿 Generated branch: ${branchInfo.name} (pattern: ${patternSelection.pattern})`);

      // Get optimized schedule for the tier
      const schedule = this.scheduleManager.getOptimalSchedule(selectedTier, {
        timezone: options.timezone,
        priority: patternSelection.priority
      });

      // Execute automation with comprehensive error handling
      const executionContext = {
        issue: issueData,
        branch: branchInfo,
        schedule,
        options
      };
      const result = await this.executionHandler.executeTierWithHandling(
        selectedTier,
        executionContext,
        async (context) => {
          // This is where the actual automation logic would be implemented
          // For now, simulate execution
          return await this.simulateAutomationExecution(context);
        }
      );

      // Record performance metrics
      const executionTime = Date.now() - startTime;
      const performanceMetrics = {
        executionTime,
        success: result.success,
        issueNumber: issueData.number,
        branchPattern: patternSelection.pattern,
        resourceUsage: {
          cpu: Math.random() * 100, // Simulated - would be real metrics
          memory: Math.random() * 1024
        },
        apiCalls: Math.floor(Math.random() * 50) + 10
      };

      await this.performanceManager.recordMetrics(selectedTier, performanceMetrics);

      // Emit monitoring event if monitoring is enabled
      if (this.monitoringEnabled) {
        this.monitoringSystem.emit('tierExecution', {
          tier: selectedTier,
          metrics: performanceMetrics,
          timestamp: new Date().toISOString()
        });
      }

      // Update tier status
      this.updateTierStatus(selectedTier, result);

      return {
        success: result.success,
        tier: selectedTier,
        branch: branchInfo,
        execution: result.execution,
        recommendation,
        performance: {
          executionTime,
          tierPerformance: await this.performanceManager.getTierPerformanceSummary(selectedTier)
        }
      };
    } catch (error) {
      console.error(`❌ Automation execution failed: ${error.message}`);

      // Record failure metrics if we have a selected tier
      const tierForMetrics = selectedTier || recommendation?.recommendedTier || 'unknown';
      const executionTime = Date.now() - startTime;

      try {
        await this.performanceManager.recordMetrics(tierForMetrics, {
          executionTime,
          success: false,
          error: error.message,
          issueNumber: issueData.number || 0
        });
      } catch (metricsError) {
        console.warn('Failed to record failure metrics:', metricsError.message);
      }

      throw error;
    }
  }

  /**
   * Get comprehensive system status
   */
  async getSystemStatus () {
    if (!this.isInitialized) {
      return { initialized: false };
    }

    const enabledTiers = this.configManager.getEnabledTiers();
    const tierPerformance = {};

    for (const tier of enabledTiers) {
      tierPerformance[tier] = await this.performanceManager.getTierPerformanceSummary(tier);
    }

    return {
      initialized: true,
      enabledTiers,
      tierStatus: Object.fromEntries(this.tierStatus),
      tierPerformance,
      activeExecutions: this.activeExecutions.size,
      configSummary: this.configManager.getConfigSummary(),
      systemRecommendations: this.generateSystemRecommendations()
    };
  }

  /**
   * Update tier configuration
   */
  async updateTierConfiguration (tier, config) {
    await this.configManager.updateTierConfig(tier, config);

    // Update tier status
    if (this.tierStatus.has(tier)) {
      const status = this.tierStatus.get(tier);
      status.enabled = config.enabled !== false;
      this.tierStatus.set(tier, status);
    }

    console.log(`⚙️ Updated ${tier} tier configuration`);
  }

  /**
   * Get tier recommendations for repository
   */
  async getTierRecommendations (recentIssues = []) {
    const recommendations = [];

    for (const issue of recentIssues) {
      const recommendation = this.configManager.getOptimalTierRecommendation(issue);
      recommendations.push({
        issue: issue.number,
        recommendedTier: recommendation.recommendedTier,
        confidence: recommendation.confidence,
        reasoning: recommendation.reasoning
      });
    }

    return {
      recommendations,
      patterns: this.branchPatternManager.getPatternRecommendations(
        recentIssues.map(issue => `${issue.labels?.[0]?.name || 'feature'}/issue-${issue.number}`)
      ),
      performance: await this.performanceManager.generateSystemReport()
    };
  }

  /**
   * Simulate automation execution (placeholder for actual logic)
   */
  async simulateAutomationExecution (context) {
    // Simulate processing time based on tier
    const processingTime = {
      ultimate: 20000 + Math.random() * 20000, // 20-40 seconds
      rapid: 120000 + Math.random() * 100000, // 2-3.5 minutes
      smart: 300000 + Math.random() * 400000 // 5-12 minutes
    };

    const delay = processingTime[context.issue.tier] || 30000;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Simulate success/failure based on tier reliability
    const successRates = { ultimate: 0.92, rapid: 0.88, smart: 0.95 };
    const success = Math.random() < (successRates[context.issue.tier] || 0.9);

    if (!success) {
      throw new Error(`Simulated execution failure for ${context.issue.tier} tier`);
    }

    return {
      status: 'completed',
      branch: context.branch.name,
      changes: `Processed issue #${context.issue.number}`,
      metrics: {
        linesChanged: Math.floor(Math.random() * 100) + 10,
        filesModified: Math.floor(Math.random() * 5) + 1
      }
    };
  }

  /**
   * Update tier status after execution
   */
  updateTierStatus (tier, result) {
    const status = this.tierStatus.get(tier) || {};
    status.lastExecution = new Date().toISOString();
    status.status = result.success ? 'success' : 'error';
    this.tierStatus.set(tier, status);
  }

  /**
   * Generate system-wide recommendations
   */
  generateSystemRecommendations () {
    const recommendations = [];

    // Check tier performance
    for (const [tier, status] of this.tierStatus) {
      if (status.performance?.successRate < 80) {
        recommendations.push({
          type: 'performance',
          tier,
          message: `${tier} tier success rate below 80%`,
          action: 'review_configuration'
        });
      }
    }

    return recommendations;
  }

  /**
   * Start monitoring system
   */
  async startMonitoring () {
    if (this.monitoringEnabled) {
      console.log('⚠️ Monitoring already enabled');
      return;
    }

    try {
      await this.monitoringSystem.startMonitoring();
      this.monitoringEnabled = true;
      console.log('🔍 Orchestrator monitoring started');
    } catch (error) {
      console.error('❌ Failed to start monitoring:', error.message);
      throw error;
    }
  }

  /**
   * Stop monitoring system
   */
  async stopMonitoring () {
    if (!this.monitoringEnabled) {
      console.log('⚠️ Monitoring not enabled');
      return;
    }

    try {
      await this.monitoringSystem.stopMonitoring();
      this.monitoringEnabled = false;
      console.log('🛑 Orchestrator monitoring stopped');
    } catch (error) {
      console.error('❌ Failed to stop monitoring:', error.message);
      throw error;
    }
  }

  /**
   * Get comprehensive monitoring status
   */
  getMonitoringStatus () {
    if (!this.monitoringEnabled) {
      return { enabled: false };
    }

    return {
      enabled: true,
      ...this.monitoringSystem.getMonitoringStatus()
    };
  }

  /**
   * Get monitoring alerts
   */
  getMonitoringAlerts (severity = null) {
    if (!this.monitoringEnabled) {
      return [];
    }

    const status = this.monitoringSystem.getMonitoringStatus();
    let alerts = status.alerts.recent || [];

    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }

    return alerts;
  }

  /**
   * Acknowledge monitoring alert
   */
  acknowledgeAlert (alertId) {
    if (!this.monitoringEnabled) {
      return false;
    }

    const alerts = this.monitoringSystem.alerts;
    const alert = alerts.find(a => a.id === alertId);

    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
      console.log(`✅ Alert ${alertId} acknowledged`);
      return true;
    }

    return false;
  }

  /**
   * Graceful shutdown
   */
  async shutdown () {
    console.log('🛑 Shutting down Automation Tier Orchestrator...');

    // Stop monitoring if enabled
    if (this.monitoringEnabled) {
      await this.stopMonitoring();
    }

    // Wait for active executions to complete
    const activeExecutions = Array.from(this.activeExecutions.values());
    if (activeExecutions.length > 0) {
      console.log(`⏳ Waiting for ${activeExecutions.length} active executions to complete...`);
      await Promise.allSettled(activeExecutions);
    }

    // Save final configuration state
    await this.configManager.saveConfig();

    this.isInitialized = false;
    console.log('✅ Orchestrator shutdown complete');
  }
}

module.exports = AutomationTierOrchestrator;
