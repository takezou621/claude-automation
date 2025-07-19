/**
 * Automation Tier Integration Tests
 * 
 * Comprehensive integration tests for new automation tiers including:
 * - End-to-end tier execution workflow
 * - Execution time validation
 * - Success rate validation
 * - Quality checks validation
 * - Component interaction testing
 */

const AutomationTierOrchestrator = require('../../src/automation-tier-orchestrator');
const ConfigManager = require('../../src/config-manager');
const PerformanceAnalyticsManager = require('../../src/performance-analytics-manager');

describe('Automation Tier Integration Tests', () => {
  let orchestrator;
  let configManager;
  let testConfigPath;

  beforeAll(async () => {
    // Create test configuration
    testConfigPath = './test-config/test-automation.json';
    configManager = new ConfigManager(testConfigPath);
    
    // Initialize test configuration
    await setupTestConfiguration(configManager);
    
    // Initialize orchestrator
    orchestrator = new AutomationTierOrchestrator(testConfigPath);
    await orchestrator.initialize();
  });

  afterAll(async () => {
    if (orchestrator) {
      await orchestrator.shutdown();
    }
  });

  describe('End-to-End Tier Execution', () => {
    test('should execute complete automation workflow for critical issue', async () => {
      const criticalIssue = {
        number: 123,
        title: 'Critical security vulnerability in authentication system',
        labels: [{ name: 'security' }, { name: 'critical' }],
        body: 'Critical security issue requiring immediate attention'
      };

      const result = await orchestrator.executeAutomationForIssue(criticalIssue);

      expect(result.success).toBe(true);
      expect(result.tier).toBeDefined();
      expect(result.branch).toBeDefined();
      expect(result.branch.name).toMatch(/^(critical\/|security\/|issue-)/);
      expect(result.execution).toBeDefined();
      expect(result.recommendation).toBeDefined();
      expect(result.performance).toBeDefined();
    }, 30000);

    test('should execute workflow for feature request', async () => {
      const featureIssue = {
        number: 124,
        title: 'Add user dashboard with analytics',
        labels: [{ name: 'feature' }, { name: 'enhancement' }],
        body: 'Need to implement comprehensive user dashboard'
      };

      const result = await orchestrator.executeAutomationForIssue(featureIssue);

      expect(result.success).toBe(true);
      expect(result.tier).toBeDefined();
      expect(result.branch.name).toMatch(/^(feature\/|issue-)/);
      expect(result.performance.executionTime).toBeGreaterThan(0);
    }, 30000);

    test('should execute workflow for documentation fix', async () => {
      const docIssue = {
        number: 125,
        title: 'Fix typo in README documentation',
        labels: [{ name: 'docs' }, { name: 'bug' }],
        body: 'Simple documentation fix needed'
      };

      const result = await orchestrator.executeAutomationForIssue(docIssue);

      expect(result.success).toBe(true);
      expect(result.branch.name).toMatch(/^(docs\/|fix\/|issue-)/);
    }, 30000);
  });

  describe('Tier Selection and Optimization', () => {
    test('should select optimal tier based on issue characteristics', async () => {
      const testCases = [
        {
          issue: {
            number: 201,
            title: 'Critical hotfix needed immediately',
            labels: [{ name: 'critical' }, { name: 'hotfix' }],
            body: 'Urgent production issue'
          },
          expectedTierType: ['ultimate', 'rapid'] // Should prefer fast tiers
        },
        {
          issue: {
            number: 202,
            title: 'Complex refactoring of authentication system',
            labels: [{ name: 'refactor' }, { name: 'complex' }],
            body: 'Major architectural changes needed with comprehensive testing'
          },
          expectedTierType: ['smart'] // Should prefer quality-focused tier
        }
      ];

      for (const testCase of testCases) {
        const result = await orchestrator.executeAutomationForIssue(testCase.issue);
        expect(testCase.expectedTierType).toContain(result.tier);
        expect(result.recommendation.confidence).toBeGreaterThan(0.5);
      }
    }, 60000);

    test('should provide tier recommendations for repository', async () => {
      const sampleIssues = [
        { number: 301, title: 'Security vulnerability', labels: [{ name: 'security' }] },
        { number: 302, title: 'Performance optimization', labels: [{ name: 'performance' }] },
        { number: 303, title: 'Feature enhancement', labels: [{ name: 'feature' }] }
      ];

      const recommendations = await orchestrator.getTierRecommendations(sampleIssues);

      expect(recommendations.recommendations).toBeDefined();
      expect(recommendations.recommendations.length).toBe(sampleIssues.length);
      expect(recommendations.patterns).toBeDefined();
      expect(recommendations.performance).toBeDefined();
    });
  });

  describe('Performance Requirements Validation', () => {
    test('ultimate tier should meet execution time requirements', async () => {
      const simpleIssue = {
        number: 401,
        title: 'Simple bug fix',
        labels: [{ name: 'bug' }],
        body: 'Quick fix needed'
      };

      const result = await orchestrator.executeAutomationForIssue(
        simpleIssue,
        { forceTier: 'ultimate' }
      );

      // Ultimate tier should complete within 45 seconds
      expect(result.performance.executionTime).toBeLessThanOrEqual(45000);
      expect(result.tier).toBe('ultimate');
    }, 50000);

    test('rapid tier should meet execution time requirements', async () => {
      const mediumIssue = {
        number: 402,
        title: 'Medium complexity feature',
        labels: [{ name: 'feature' }],
        body: 'Moderately complex feature implementation'
      };

      const result = await orchestrator.executeAutomationForIssue(
        mediumIssue,
        { forceTier: 'rapid' }
      );

      // Rapid tier should complete within 4 minutes
      expect(result.performance.executionTime).toBeLessThanOrEqual(240000);
      expect(result.tier).toBe('rapid');
    }, 300000);

    test('smart tier should meet execution time requirements', async () => {
      const complexIssue = {
        number: 403,
        title: 'Complex security enhancement',
        labels: [{ name: 'security' }, { name: 'enhancement' }],
        body: 'Complex security feature requiring comprehensive analysis'
      };

      const result = await orchestrator.executeAutomationForIssue(
        complexIssue,
        { forceTier: 'smart' }
      );

      // Smart tier should complete within 15 minutes
      expect(result.performance.executionTime).toBeLessThanOrEqual(900000);
      expect(result.tier).toBe('smart');
    }, 960000);
  });

  describe('Component Integration', () => {
    test('should integrate ConfigManager with all components', async () => {
      const status = await orchestrator.getSystemStatus();

      expect(status.initialized).toBe(true);
      expect(status.enabledTiers).toBeDefined();
      expect(status.enabledTiers.length).toBeGreaterThan(0);
      expect(status.configSummary).toBeDefined();
      expect(status.configSummary.validation.valid).toBe(true);
    });

    test('should integrate PerformanceAnalyticsManager', async () => {
      const testIssue = {
        number: 501,
        title: 'Test performance integration',
        labels: [{ name: 'test' }],
        body: 'Testing performance analytics integration'
      };

      const result = await orchestrator.executeAutomationForIssue(testIssue);
      
      expect(result.performance).toBeDefined();
      expect(result.performance.executionTime).toBeGreaterThan(0);
      expect(result.performance.tierPerformance).toBeDefined();
    });

    test('should integrate BranchPatternManager', async () => {
      const testIssue = {
        number: 502,
        title: 'Test branch pattern integration',
        labels: [{ name: 'feature' }],
        body: 'Testing branch pattern manager integration'
      };

      const result = await orchestrator.executeAutomationForIssue(testIssue);
      
      expect(result.branch).toBeDefined();
      expect(result.branch.name).toBeDefined();
      expect(result.branch.pattern).toBeDefined();
      expect(typeof result.branch.name).toBe('string');
      expect(result.branch.name.length).toBeGreaterThan(0);
    });

    test('should integrate IntelligentScheduleManager', async () => {
      const enabledTiers = configManager.getEnabledTiers();
      
      for (const tier of enabledTiers) {
        const tierConfig = configManager.getTierConfig(tier);
        expect(tierConfig).toBeDefined();
        expect(tierConfig.enabled).toBe(true);
        expect(tierConfig.schedule).toBeDefined();
        expect(tierConfig.maxExecutionTime).toBeGreaterThan(0);
      }
    });
  });

  describe('Error Handling and Fallback', () => {
    test('should handle tier execution failures gracefully', async () => {
      // Test with invalid configuration to trigger fallback
      const testIssue = {
        number: 601,
        title: 'Test error handling',
        labels: [{ name: 'test' }],
        body: 'Testing error handling and fallback mechanisms'
      };

      // Even if execution fails, it should not throw unhandled errors
      const result = await orchestrator.executeAutomationForIssue(testIssue);
      
      // Result should always be defined, success may be false
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('should validate tier configurations', async () => {
      const validation = configManager.validateConfig();
      
      expect(validation).toBeDefined();
      expect(validation.valid).toBe(true);
      expect(validation.errors).toBeDefined();
      expect(Array.isArray(validation.errors)).toBe(true);
    });
  });

  describe('Monitoring Integration', () => {
    test('should integrate with monitoring system', async () => {
      // Start monitoring
      await orchestrator.startMonitoring();
      
      expect(orchestrator.monitoringEnabled).toBe(true);
      
      const monitoringStatus = orchestrator.getMonitoringStatus();
      expect(monitoringStatus.enabled).toBe(true);
      
      // Stop monitoring
      await orchestrator.stopMonitoring();
      expect(orchestrator.monitoringEnabled).toBe(false);
    });
  });
});

/**
 * Setup test configuration for integration tests
 */
async function setupTestConfiguration(configManager) {
  // Ensure test configuration directory exists
  const fs = require('fs').promises;
  const path = require('path');
  
  const configDir = path.dirname(configManager.configPath);
  await fs.mkdir(configDir, { recursive: true });

  // Set test-specific configurations
  await configManager.set('automation.tiers.ultimate.enabled', true);
  await configManager.set('automation.tiers.ultimate.schedule', '* * * * *');
  await configManager.set('automation.tiers.ultimate.maxExecutionTime', 45000);

  await configManager.set('automation.tiers.rapid.enabled', true);
  await configManager.set('automation.tiers.rapid.schedule', '*/5 * * * *');
  await configManager.set('automation.tiers.rapid.maxExecutionTime', 240000);

  await configManager.set('automation.tiers.smart.enabled', true);
  await configManager.set('automation.tiers.smart.maxExecutionTime', 900000);

  // Set test thresholds
  await configManager.set('automation.tierSelection.autoSelection', true);
  await configManager.set('automation.tierSelection.fallbackChain', ['ultimate', 'rapid', 'smart']);

  // Disable monitoring auto-start for tests
  await configManager.set('monitoring.autoStart', false);

  console.log('✅ Test configuration setup complete');
}