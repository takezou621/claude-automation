/**
 * Concurrent Tier Execution Load Tests
 * 
 * Load testing for concurrent tier execution including:
 * - Multiple simultaneous tier executions
 * - Resource contention testing
 * - Performance degradation analysis
 * - System stability under load
 */

const AutomationTierOrchestrator = require('../../src/automation-tier-orchestrator');
const ConfigManager = require('../../src/config-manager');

describe('Concurrent Tier Execution Load Tests', () => {
  let orchestrator;
  let configManager;
  let testConfigPath;

  beforeAll(async () => {
    // Setup test configuration optimized for load testing
    testConfigPath = './test-config/load-test-automation.json';
    configManager = new ConfigManager(testConfigPath);
    await setupLoadTestConfiguration(configManager);
    
    orchestrator = new AutomationTierOrchestrator(testConfigPath);
    await orchestrator.initialize();
  });

  afterAll(async () => {
    if (orchestrator) {
      await orchestrator.shutdown();
    }
  });

  describe('Basic Concurrent Execution', () => {
    test('should handle 5 concurrent tier executions', async () => {
      const concurrentRequests = 5;
      const issues = generateTestIssues(concurrentRequests);
      
      const startTime = Date.now();
      const promises = issues.map(issue => 
        orchestrator.executeAutomationForIssue(issue)
      );
      
      const results = await Promise.allSettled(promises);
      const executionTime = Date.now() - startTime;
      
      // Analyze results
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
      const failed = results.filter(r => r.status === 'rejected' || !r.value?.success);
      
      console.log(`Concurrent execution stats:
        - Total requests: ${concurrentRequests}
        - Successful: ${successful.length}
        - Failed: ${failed.length}
        - Total time: ${executionTime}ms
        - Average time per request: ${executionTime / concurrentRequests}ms`);
      
      // Assertions
      expect(successful.length).toBeGreaterThanOrEqual(Math.floor(concurrentRequests * 0.8)); // 80% success rate
      expect(executionTime).toBeLessThan(300000); // Should complete within 5 minutes
    }, 360000);

    test('should handle 10 concurrent tier executions', async () => {
      const concurrentRequests = 10;
      const issues = generateTestIssues(concurrentRequests);
      
      const startTime = Date.now();
      const promises = issues.map(issue => 
        orchestrator.executeAutomationForIssue(issue)
      );
      
      const results = await Promise.allSettled(promises);
      const executionTime = Date.now() - startTime;
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
      const failed = results.filter(r => r.status === 'rejected' || !r.value?.success);
      
      console.log(`10 concurrent executions stats:
        - Successful: ${successful.length}/${concurrentRequests}
        - Success rate: ${(successful.length / concurrentRequests * 100).toFixed(1)}%
        - Total time: ${executionTime}ms`);
      
      expect(successful.length).toBeGreaterThanOrEqual(Math.floor(concurrentRequests * 0.7)); // 70% success rate
      expect(executionTime).toBeLessThan(600000); // Should complete within 10 minutes
    }, 720000);
  });

  describe('Mixed Tier Load Testing', () => {
    test('should handle mixed tier types concurrently', async () => {
      const issues = [
        // Ultimate tier requests (fast)
        ...generateTestIssues(3, 'ultimate'),
        // Rapid tier requests (medium)
        ...generateTestIssues(4, 'rapid'),
        // Smart tier requests (comprehensive)
        ...generateTestIssues(3, 'smart')
      ];
      
      const startTime = Date.now();
      const promises = issues.map(issue => {
        const options = issue.forceTier ? { forceTier: issue.forceTier } : {};
        return orchestrator.executeAutomationForIssue(issue, options);
      });
      
      const results = await Promise.allSettled(promises);
      const executionTime = Date.now() - startTime;
      
      // Analyze by tier
      const tierResults = {
        ultimate: { successful: 0, total: 0, avgTime: 0 },
        rapid: { successful: 0, total: 0, avgTime: 0 },
        smart: { successful: 0, total: 0, avgTime: 0 }
      };
      
      results.forEach((result, index) => {
        const tier = issues[index].forceTier || 'auto';
        if (tierResults[tier]) {
          tierResults[tier].total++;
          if (result.status === 'fulfilled' && result.value?.success) {
            tierResults[tier].successful++;
            tierResults[tier].avgTime += result.value.performance?.executionTime || 0;
          }
        }
      });
      
      // Calculate averages
      Object.keys(tierResults).forEach(tier => {
        if (tierResults[tier].successful > 0) {
          tierResults[tier].avgTime = tierResults[tier].avgTime / tierResults[tier].successful;
        }
      });
      
      console.log('Mixed tier execution results:', tierResults);
      
      // Verify tier-specific performance requirements
      expect(tierResults.ultimate.avgTime).toBeLessThanOrEqual(45000); // Ultimate: 45s
      expect(tierResults.rapid.avgTime).toBeLessThanOrEqual(240000); // Rapid: 4min
      expect(tierResults.smart.avgTime).toBeLessThanOrEqual(900000); // Smart: 15min
    }, 1200000); // 20 minutes timeout
  });

  describe('Resource Contention Testing', () => {
    test('should handle resource contention gracefully', async () => {
      // Generate many requests quickly to test resource contention
      const batchSize = 8;
      const issues = generateTestIssues(batchSize);
      
      // Track resource usage simulation
      const resourceMonitor = {
        cpuUsage: [],
        memoryUsage: [],
        apiCalls: []
      };
      
      const startTime = Date.now();
      const promises = issues.map(async (issue, index) => {
        // Simulate varying resource requirements
        const delay = index * 1000; // Stagger start times
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return orchestrator.executeAutomationForIssue(issue);
      });
      
      const results = await Promise.allSettled(promises);
      const executionTime = Date.now() - startTime;
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success);
      
      // System should handle resource contention without complete failure
      expect(successful.length).toBeGreaterThan(0);
      expect(successful.length / batchSize).toBeGreaterThan(0.5); // At least 50% success
      
      console.log(`Resource contention test:
        - Batch size: ${batchSize}
        - Successful: ${successful.length}
        - Success rate: ${(successful.length / batchSize * 100).toFixed(1)}%
        - Total time: ${executionTime}ms`);
    }, 480000);

    test('should maintain performance under sustained load', async () => {
      const batchCount = 3;
      const batchSize = 4;
      const batchDelay = 30000; // 30 seconds between batches
      
      const allResults = [];
      const batchTimes = [];
      
      for (let batch = 0; batch < batchCount; batch++) {
        console.log(`Starting batch ${batch + 1}/${batchCount}`);
        
        const batchIssues = generateTestIssues(batchSize, null, batch * batchSize);
        const batchStartTime = Date.now();
        
        const batchPromises = batchIssues.map(issue =>
          orchestrator.executeAutomationForIssue(issue)
        );
        
        const batchResults = await Promise.allSettled(batchPromises);
        const batchTime = Date.now() - batchStartTime;
        
        allResults.push(...batchResults);
        batchTimes.push(batchTime);
        
        console.log(`Batch ${batch + 1} completed in ${batchTime}ms`);
        
        // Wait before next batch (except for last batch)
        if (batch < batchCount - 1) {
          await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
      }
      
      // Analyze performance degradation
      const avgBatchTime = batchTimes.reduce((a, b) => a + b, 0) / batchTimes.length;
      const firstBatchTime = batchTimes[0];
      const lastBatchTime = batchTimes[batchTimes.length - 1];
      const performanceDegradation = (lastBatchTime - firstBatchTime) / firstBatchTime;
      
      console.log(`Sustained load test results:
        - Total batches: ${batchCount}
        - Batch size: ${batchSize}
        - Average batch time: ${avgBatchTime.toFixed(0)}ms
        - First batch time: ${firstBatchTime}ms
        - Last batch time: ${lastBatchTime}ms
        - Performance degradation: ${(performanceDegradation * 100).toFixed(1)}%`);
      
      // Performance should not degrade significantly
      expect(performanceDegradation).toBeLessThan(0.5); // Less than 50% degradation
      
      const totalSuccessful = allResults.filter(r => 
        r.status === 'fulfilled' && r.value?.success
      ).length;
      
      expect(totalSuccessful / allResults.length).toBeGreaterThan(0.7); // 70% overall success
    }, 600000);
  });

  describe('System Stability Testing', () => {
    test('should recover from failures gracefully', async () => {
      // Mix of valid and problematic requests
      const issues = [
        ...generateTestIssues(2), // Normal requests
        ...generateProblematicIssues(2), // Requests that might fail
        ...generateTestIssues(2) // More normal requests
      ];
      
      const promises = issues.map(issue =>
        orchestrator.executeAutomationForIssue(issue)
      );
      
      const results = await Promise.allSettled(promises);
      
      // System should handle failures without affecting subsequent requests
      const normalRequestResults = [
        results[0], results[1], // First batch
        results[4], results[5]  // Last batch
      ];
      
      const normalSuccessful = normalRequestResults.filter(r =>
        r.status === 'fulfilled' && r.value?.success
      );
      
      // Normal requests should mostly succeed despite problematic ones
      expect(normalSuccessful.length).toBeGreaterThanOrEqual(3);
      
      // System should remain operational
      const status = await orchestrator.getSystemStatus();
      expect(status.initialized).toBe(true);
    }, 240000);

    test('should handle monitoring under load', async () => {
      // Start monitoring
      await orchestrator.startMonitoring();
      
      // Generate load while monitoring is active
      const issues = generateTestIssues(6);
      const promises = issues.map(issue =>
        orchestrator.executeAutomationForIssue(issue)
      );
      
      const results = await Promise.allSettled(promises);
      
      // Check monitoring system health
      const monitoringStatus = orchestrator.getMonitoringStatus();
      expect(monitoringStatus.enabled).toBe(true);
      
      // Monitoring should have collected data
      expect(monitoringStatus.alerts).toBeDefined();
      
      // Stop monitoring
      await orchestrator.stopMonitoring();
    }, 300000);
  });

  describe('Performance Requirements Under Load', () => {
    test('should maintain execution time requirements under moderate load', async () => {
      const testCases = [
        { tier: 'ultimate', maxTime: 45000, count: 3 },
        { tier: 'rapid', maxTime: 240000, count: 3 },
        { tier: 'smart', maxTime: 900000, count: 2 }
      ];
      
      for (const testCase of testCases) {
        const issues = generateTestIssues(testCase.count, testCase.tier);
        const promises = issues.map(issue =>
          orchestrator.executeAutomationForIssue(issue, { forceTier: testCase.tier })
        );
        
        const results = await Promise.allSettled(promises);
        const successful = results.filter(r =>
          r.status === 'fulfilled' && r.value?.success
        );
        
        // Check execution times
        const executionTimes = successful.map(r => r.value.performance.executionTime);
        const avgExecutionTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
        
        console.log(`${testCase.tier} tier under load:
          - Count: ${testCase.count}
          - Successful: ${successful.length}
          - Avg execution time: ${avgExecutionTime.toFixed(0)}ms
          - Max allowed: ${testCase.maxTime}ms`);
        
        // At least 80% should succeed
        expect(successful.length / testCase.count).toBeGreaterThanOrEqual(0.8);
        
        // Average execution time should be within limits (allowing some overhead for load)
        const allowedOverhead = 1.2; // 20% overhead allowed under load
        expect(avgExecutionTime).toBeLessThanOrEqual(testCase.maxTime * allowedOverhead);
      }
    }, 1800000); // 30 minutes timeout
  });
});

/**
 * Generate test issues for load testing
 */
function generateTestIssues(count, forceTier = null, startNumber = 1000) {
  const issueTypes = [
    { labels: [{ name: 'bug' }], title: 'Fix bug in component' },
    { labels: [{ name: 'feature' }], title: 'Add new feature' },
    { labels: [{ name: 'enhancement' }], title: 'Enhance existing functionality' },
    { labels: [{ name: 'docs' }], title: 'Update documentation' },
    { labels: [{ name: 'security' }], title: 'Security improvement' }
  ];
  
  const issues = [];
  for (let i = 0; i < count; i++) {
    const typeIndex = i % issueTypes.length;
    const issueType = issueTypes[typeIndex];
    
    const issue = {
      number: startNumber + i,
      title: `${issueType.title} ${startNumber + i}`,
      labels: issueType.labels,
      body: `Load test issue ${startNumber + i} for ${forceTier || 'auto'} tier testing`
    };
    
    if (forceTier) {
      issue.forceTier = forceTier;
    }
    
    issues.push(issue);
  }
  
  return issues;
}

/**
 * Generate problematic issues that might cause failures
 */
function generateProblematicIssues(count) {
  const issues = [];
  for (let i = 0; i < count; i++) {
    issues.push({
      number: 9000 + i,
      title: '', // Empty title might cause issues
      labels: [], // No labels
      body: null // Null body
    });
  }
  return issues;
}

/**
 * Setup configuration optimized for load testing
 */
async function setupLoadTestConfiguration(configManager) {
  const fs = require('fs').promises;
  const path = require('path');
  
  const configDir = path.dirname(configManager.configPath);
  await fs.mkdir(configDir, { recursive: true });

  // Configure tiers for load testing
  await configManager.set('automation.tiers.ultimate.enabled', true);
  await configManager.set('automation.tiers.ultimate.maxExecutionTime', 45000);
  await configManager.set('automation.tiers.ultimate.resourceLimits.cpu', 50);
  
  await configManager.set('automation.tiers.rapid.enabled', true);
  await configManager.set('automation.tiers.rapid.maxExecutionTime', 240000);
  await configManager.set('automation.tiers.rapid.resourceLimits.cpu', 70);
  
  await configManager.set('automation.tiers.smart.enabled', true);
  await configManager.set('automation.tiers.smart.maxExecutionTime', 900000);
  await configManager.set('automation.tiers.smart.resourceLimits.cpu', 90);
  
  // Configure for better load handling
  await configManager.set('automation.tierSelection.autoSelection', true);
  await configManager.set('monitoring.autoStart', false);
  
  // Increase timeouts for load testing
  await configManager.set('performance.maxExecutionTime', 1800000); // 30 minutes
  
  console.log('✅ Load test configuration setup complete');
}