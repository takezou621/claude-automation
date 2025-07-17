/**
 * Monitoring System Integration Example
 * 
 * Demonstrates how to use the comprehensive monitoring and alerting system
 * for automation tiers with all key features.
 */

const ConfigManager = require('../src/config-manager');
const MonitoringAlertingSystem = require('../src/monitoring-alerting-system');
const PerformanceAnalyticsManager = require('../src/performance-analytics-manager');
const GitHubClient = require('../src/github-client');

async function runMonitoringExample() {
  console.log('🔍 Starting Monitoring System Example\n');

  try {
    // Initialize dependencies
    const configManager = new ConfigManager();
    await configManager.loadConfig();
    
    const performanceManager = new PerformanceAnalyticsManager(configManager);
    const githubClient = new GitHubClient({ 
      token: process.env.GITHUB_TOKEN,
      owner: 'example',
      repo: 'test-repo'
    });

    // Initialize monitoring system
    const monitoring = new MonitoringAlertingSystem(
      configManager,
      githubClient,
      performanceManager
    );

    // Setup event listeners for monitoring events
    setupMonitoringEventListeners(monitoring);

    // Start comprehensive monitoring
    console.log('🚀 Starting monitoring system...');
    await monitoring.startMonitoring();

    // Simulate some automation tier activity
    console.log('\n📊 Simulating automation tier activity...');
    await simulateAutomationActivity(monitoring);

    // Wait for monitoring cycles to complete
    console.log('\n⏳ Waiting for monitoring cycles...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check monitoring status
    console.log('\n📈 Monitoring Status:');
    const status = monitoring.getMonitoringStatus();
    displayMonitoringStatus(status);

    // Demonstrate manual health checks
    console.log('\n🏥 Performing manual health checks...');
    await demonstrateHealthChecks(monitoring);

    // Demonstrate alert handling
    console.log('\n🚨 Demonstrating alert handling...');
    await demonstrateAlertHandling(monitoring);

    // Show quota monitoring
    console.log('\n📊 GitHub Actions Quota Status:');
    await demonstrateQuotaMonitoring(monitoring);

    // Show automated recommendations
    console.log('\n🎯 Automated Recommendations:');
    await demonstrateRecommendations(monitoring);

    // Show performance monitoring
    console.log('\n⚡ Performance Monitoring:');
    await demonstratePerformanceMonitoring(monitoring, performanceManager);

    // Cleanup
    console.log('\n🛑 Stopping monitoring system...');
    await monitoring.stopMonitoring();

    console.log('\n✅ Monitoring system example completed successfully!');

  } catch (error) {
    console.error('\n❌ Example failed:', error.message);
    console.error(error.stack);
  }
}

/**
 * Setup event listeners for monitoring events
 */
function setupMonitoringEventListeners(monitoring) {
  monitoring.on('monitoringStarted', (data) => {
    console.log(`✅ Monitoring started at ${data.timestamp}`);
  });

  monitoring.on('alertGenerated', (alert) => {
    console.log(`🚨 ${alert.severity.toUpperCase()} Alert: ${alert.message}`);
  });

  monitoring.on('healthCheckComplete', (data) => {
    console.log(`🏥 Health check for ${data.tier}: ${data.result.status}`);
  });

  monitoring.on('quotaUpdated', (data) => {
    const usage = ((data.quotaData.usedMinutes / (data.quotaData.usedMinutes + data.quotaData.remainingMinutes)) * 100).toFixed(1);
    console.log(`📊 GitHub Actions quota: ${usage}% used`);
  });

  monitoring.on('recommendationsUpdated', (data) => {
    console.log(`🎯 Updated ${data.recommendations.length} automated recommendations`);
  });
}

/**
 * Simulate automation tier activity
 */
async function simulateAutomationActivity(monitoring) {
  const tiers = ['ultimate', 'rapid', 'smart'];
  
  for (const tier of tiers) {
    // Simulate tier execution with metrics
    const metrics = {
      executionTime: tier === 'ultimate' ? 35000 : tier === 'rapid' ? 180000 : 600000,
      success: Math.random() > 0.1, // 90% success rate
      resourceUsage: {
        cpu: Math.random() * 100,
        memory: Math.random() * 1024
      },
      apiCalls: Math.floor(Math.random() * 50) + 10
    };
    
    // Emit tier execution event
    monitoring.emit('tierExecution', {
      tier,
      metrics,
      timestamp: new Date().toISOString()
    });
    
    console.log(`🔄 Simulated ${tier} tier execution (${metrics.executionTime}ms, success: ${metrics.success})`);
  }
}

/**
 * Display monitoring status
 */
function displayMonitoringStatus(status) {
  console.log('─'.repeat(50));
  console.log(`Active: ${status.monitoring.active}`);
  console.log(`Total Alerts: ${status.alerts.total}`);
  console.log(`Unacknowledged Alerts: ${status.alerts.unacknowledged}`);
  console.log(`Critical Alerts: ${status.alerts.critical}`);
  
  console.log('\nTier Health Status:');
  Object.entries(status.tiers).forEach(([tier, data]) => {
    const health = data.health.status || 'unknown';
    const responseTime = data.health.responseTime || 0;
    console.log(`  ${tier.toUpperCase()}: ${health} (${responseTime}ms)`);
  });
  
  console.log('\nQuota Status:');
  Object.entries(status.quota).forEach(([service, data]) => {
    if (data.usedMinutes !== undefined) {
      const usage = ((data.usedMinutes / (data.usedMinutes + data.remainingMinutes)) * 100).toFixed(1);
      console.log(`  ${service}: ${usage}% used (${data.remainingMinutes} minutes remaining)`);
    }
  });
}

/**
 * Demonstrate health checks
 */
async function demonstrateHealthChecks(monitoring) {
  console.log('Triggering manual health checks...');
  await monitoring.performHealthChecks();
  
  const status = monitoring.getMonitoringStatus();
  
  console.log('Health Check Results:');
  Object.entries(status.tiers).forEach(([tier, data]) => {
    const health = data.health;
    console.log(`  ${tier.toUpperCase()}:`);
    console.log(`    Status: ${health.status}`);
    console.log(`    Response Time: ${health.responseTime}ms`);
    console.log(`    Consecutive Failures: ${health.consecutiveFailures}`);
    console.log(`    Last Check: ${health.lastCheck}`);
  });
}

/**
 * Demonstrate alert handling
 */
async function demonstrateAlertHandling(monitoring) {
  // Generate some test alerts
  monitoring.generateAlert('warning', 'test', 'This is a test warning alert');
  monitoring.generateAlert('critical', 'test', 'This is a test critical alert');
  monitoring.generateAlert('info', 'test', 'This is a test info alert');
  
  const status = monitoring.getMonitoringStatus();
  
  console.log('Recent Alerts:');
  status.alerts.recent.forEach(alert => {
    console.log(`  [${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message}`);
    console.log(`    Time: ${alert.timestamp}`);
    console.log(`    Acknowledged: ${alert.acknowledged}`);
  });
}

/**
 * Demonstrate quota monitoring
 */
async function demonstrateQuotaMonitoring(monitoring) {
  // Trigger manual quota check
  await monitoring.checkGitHubActionsQuota();
  
  const status = monitoring.getMonitoringStatus();
  
  if (status.quota.actions) {
    const quota = status.quota.actions;
    const usage = ((quota.usedMinutes / (quota.usedMinutes + quota.remainingMinutes)) * 100).toFixed(1);
    
    console.log(`Usage: ${usage}%`);
    console.log(`Used: ${quota.usedMinutes} minutes`);
    console.log(`Remaining: ${quota.remainingMinutes} minutes`);
    console.log(`Last Updated: ${quota.lastUpdate}`);
  } else {
    console.log('Quota data not available (GitHub client might not be configured)');
  }
}

/**
 * Demonstrate automated recommendations
 */
async function demonstrateRecommendations(monitoring) {
  // Trigger recommendation update
  await monitoring.updateAutomatedRecommendations();
  
  const status = monitoring.getMonitoringStatus();
  
  if (status.recommendations.recommendations) {
    console.log('Current Recommendations:');
    status.recommendations.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.type}:`);
      console.log(`     ${rec.message}`);
      console.log(`     Action: ${rec.action}`);
      if (rec.tier) console.log(`     Tier: ${rec.tier}`);
    });
  } else {
    console.log('No recommendations available yet');
  }
}

/**
 * Demonstrate performance monitoring
 */
async function demonstratePerformanceMonitoring(monitoring, performanceManager) {
  // Simulate recording some performance metrics
  const tiers = ['ultimate', 'rapid', 'smart'];
  
  for (const tier of tiers) {
    await performanceManager.recordMetrics(tier, {
      executionTime: tier === 'ultimate' ? 35000 : tier === 'rapid' ? 180000 : 600000,
      success: Math.random() > 0.15, // 85% success rate
      resourceUsage: {
        cpu: Math.random() * 100,
        memory: Math.random() * 1024
      },
      apiCalls: Math.floor(Math.random() * 50) + 10,
      issueNumber: Math.floor(Math.random() * 1000) + 1
    });
  }
  
  // Check performance for all tiers
  await monitoring.checkAllTierPerformance();
  
  // Display performance summaries
  for (const tier of tiers) {
    try {
      const summary = await performanceManager.getTierPerformanceSummary(tier);
      console.log(`${tier.toUpperCase()} Tier Performance:`);
      console.log(`  Executions: ${summary.executionCount}`);
      console.log(`  Success Rate: ${summary.successRate.toFixed(1)}%`);
      console.log(`  Avg Execution Time: ${summary.averageExecutionTime.toFixed(0)}ms`);
      console.log(`  Last Execution: ${summary.lastExecution}`);
    } catch (error) {
      console.log(`  Error getting performance summary: ${error.message}`);
    }
  }
}

// Export for use in other scripts
module.exports = { runMonitoringExample };

// Run if called directly
if (require.main === module) {
  runMonitoringExample();
}