/**
 * Quick Integration Test
 * 
 * Fast validation that all components work together
 */

const AutomationTierOrchestrator = require('../src/automation-tier-orchestrator');
const ConfigManager = require('../src/config-manager');

describe('Quick Integration Test', () => {
  let orchestrator;
  let configManager;

  beforeAll(async () => {
    // Use in-memory config for quick testing
    configManager = new ConfigManager('./test-config/quick-test.json');
    await setupQuickTestConfig(configManager);
    
    orchestrator = new AutomationTierOrchestrator('./test-config/quick-test.json');
    await orchestrator.initialize();
  });

  afterAll(async () => {
    if (orchestrator) {
      await orchestrator.shutdown();
    }
  });

  test('should initialize all components successfully', async () => {
    const status = await orchestrator.getSystemStatus();
    
    expect(status.initialized).toBe(true);
    expect(status.enabledTiers).toBeDefined();
    expect(status.enabledTiers.length).toBeGreaterThan(0);
    expect(status.configSummary.validation.valid).toBe(true);
  });

  test('should execute automation for test issue', async () => {
    const testIssue = {
      number: 999,
      title: 'Quick integration test issue',
      labels: [{ name: 'test' }],
      body: 'Testing component integration'
    };

    const result = await orchestrator.executeAutomationForIssue(testIssue);
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.tier).toBeDefined();
    expect(result.branch).toBeDefined();
    expect(result.branch.name).toBeDefined();
    expect(result.performance).toBeDefined();
    expect(result.performance.executionTime).toBeGreaterThan(0);
  }, 120000); // 2 minute timeout

  test('should handle monitoring integration', async () => {
    await orchestrator.startMonitoring();
    
    const monitoringStatus = orchestrator.getMonitoringStatus();
    expect(monitoringStatus.enabled).toBe(true);
    
    await orchestrator.stopMonitoring();
    expect(orchestrator.monitoringEnabled).toBe(false);
  });

  test('should provide tier recommendations', async () => {
    const sampleIssues = [
      { number: 1, title: 'Test issue 1', labels: [{ name: 'bug' }] },
      { number: 2, title: 'Test issue 2', labels: [{ name: 'feature' }] }
    ];

    const recommendations = await orchestrator.getTierRecommendations(sampleIssues);
    
    expect(recommendations).toBeDefined();
    expect(recommendations.recommendations).toBeDefined();
    expect(recommendations.recommendations.length).toBe(2);
    expect(recommendations.patterns).toBeDefined();
  });

  test('should validate configuration management', async () => {
    // Test config updates
    const originalConfig = configManager.getTierConfig('rapid');
    const newMaxTime = 300000;
    
    await orchestrator.updateTierConfiguration('rapid', {
      enabled: true,
      maxExecutionTime: newMaxTime
    });

    // Reload config to ensure we get the latest values
    await configManager.loadConfig();
    const tierConfig = configManager.getTierConfig('rapid');
    expect(tierConfig.enabled).toBe(true);
    expect(tierConfig.maxExecutionTime).toBe(newMaxTime);
  });
});

async function setupQuickTestConfig(configManager) {
  const fs = require('fs').promises;
  const path = require('path');
  
  const configDir = path.dirname(configManager.configPath);
  await fs.mkdir(configDir, { recursive: true });

  // Minimal config for quick testing
  await configManager.set('automation.tiers.ultimate.enabled', true);
  await configManager.set('automation.tiers.ultimate.maxExecutionTime', 45000);
  await configManager.set('automation.tiers.rapid.enabled', true);
  await configManager.set('automation.tiers.rapid.maxExecutionTime', 240000);
  await configManager.set('automation.tiers.smart.enabled', true);
  await configManager.set('automation.tiers.smart.maxExecutionTime', 900000);
  await configManager.set('monitoring.autoStart', false);
}