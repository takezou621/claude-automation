#!/usr/bin/env node

/**
 * Test script for PerformanceAnalyticsManager
 * Tests performance monitoring, anomaly detection, and metrics tracking
 */

const PerformanceAnalyticsManager = require('./src/performance-analytics-manager.js');

function runPerformanceTests() {
  console.log('🧪 Testing PerformanceAnalyticsManager\n');
  
  const analytics = new PerformanceAnalyticsManager({
    retentionDays: 30,
    anomalyThreshold: 2.0,
    alertingEnabled: true
  });
  
  // Test 1: Record sample executions for different tiers
  console.log('Test 1: Recording sample executions');
  
  const sampleExecutions = [
    {
      tier: 'ultimate',
      metrics: {
        executionTime: 40000,
        success: true,
        cpu: 25,
        memory: 30,
        apiCalls: 15,
        networkLatency: 50,
        issuesProcessed: 1,
        linesChanged: 25,
        filesModified: 2,
        testsAdded: 1,
        issueNumber: 123,
        issueType: 'bug',
        complexity: 'low'
      }
    },
    {
      tier: 'rapid',
      metrics: {
        executionTime: 190000,
        success: true,
        cpu: 40,
        memory: 45,
        apiCalls: 30,
        networkLatency: 80,
        issuesProcessed: 1,
        linesChanged: 50,
        filesModified: 3,
        testsAdded: 2,
        issueNumber: 124,
        issueType: 'feature',
        complexity: 'medium'
      }
    },
    {
      tier: 'smart',
      metrics: {
        executionTime: 650000,
        success: true,
        cpu: 65,
        memory: 70,
        apiCalls: 85,
        networkLatency: 120,
        issuesProcessed: 1,
        linesChanged: 150,
        filesModified: 8,
        testsAdded: 5,
        issueNumber: 125,
        issueType: 'security',
        complexity: 'high'
      }
    }
  ];
  
  const results = [];
  sampleExecutions.forEach(execution => {
    const result = analytics.recordExecution(execution.tier, execution.metrics);
    results.push(result);
    console.log(`${execution.tier} tier:`, {
      recorded: result.recorded,
      score: result.analysis.score,
      anomalies: result.anomalies.length,
      recommendations: result.recommendations.length
    });
  });
  
  // Test 2: Test anomaly detection with outlier data
  console.log('\nTest 2: Testing anomaly detection');
  
  const anomalyTest = {
    tier: 'ultimate',
    metrics: {
      executionTime: 120000, // Way above 45s target
      success: false,
      cpu: 95, // Very high CPU usage
      memory: 90,
      apiCalls: 50,
      networkLatency: 500,
      issuesProcessed: 0,
      linesChanged: 0,
      filesModified: 0,
      testsAdded: 0,
      issueNumber: 126,
      issueType: 'bug',
      complexity: 'low'
    }
  };
  
  const anomalyResult = analytics.recordExecution(anomalyTest.tier, anomalyTest.metrics);
  console.log('Anomaly test result:', {
    anomalies: anomalyResult.anomalies.length,
    anomalyTypes: anomalyResult.anomalies.map(a => a.type),
    recommendations: anomalyResult.recommendations.length
  });
  
  // Test 3: Generate tier comparison
  console.log('\nTest 3: Tier comparison analytics');
  
  const comparison = analytics.getTierComparison({ timeWindow: '24h' });
  console.log('Tier comparison:', {
    timeWindow: comparison.timeWindow,
    tiers: Object.keys(comparison.tiers),
    rankings: comparison.rankings,
    insights: comparison.insights.map(i => i.message)
  });
  
  // Test 4: Anomaly reporting
  console.log('\nTest 4: Anomaly reporting');
  
  const anomalyReport = analytics.getAnomalyReport({ timeWindow: '24h' });
  console.log('Anomaly report:', {
    totalAnomalies: anomalyReport.totalAnomalies,
    severityBreakdown: anomalyReport.severityBreakdown,
    tierBreakdown: anomalyReport.tierBreakdown,
    typeBreakdown: anomalyReport.typeBreakdown,
    recommendations: anomalyReport.recommendations.map(r => r.message)
  });
  
  // Test 5: Test baseline performance analysis
  console.log('\nTest 5: Baseline performance analysis');
  
  const tiers = ['ultimate', 'rapid', 'smart'];
  tiers.forEach(tier => {
    const metrics = {
      executionTime: 35000,
      success: true,
      cpu: 30,
      memory: 35,
      apiCalls: 20,
      networkLatency: 60,
      issuesProcessed: 1,
      linesChanged: 30,
      filesModified: 2,
      testsAdded: 1,
      issueNumber: 127,
      issueType: 'enhancement',
      complexity: 'medium'
    };
    
    const result = analytics.recordExecution(tier, metrics);
    console.log(`${tier} tier baseline:`, {
      score: result.analysis.score,
      performanceStatus: result.analysis.performance.executionTimeStatus,
      withinSLA: result.analysis.performance.withinSLA,
      resourceScore: Math.round(result.analysis.efficiency.resourceScore)
    });
  });
  
  // Test 6: Test performance recommendations
  console.log('\nTest 6: Performance recommendations');
  
  const poorPerformanceTest = {
    tier: 'rapid',
    metrics: {
      executionTime: 300000, // Over 4 minute target
      success: true,
      cpu: 80, // High resource usage
      memory: 85,
      apiCalls: 70,
      networkLatency: 200,
      issuesProcessed: 1,
      linesChanged: 10, // Low productivity
      filesModified: 1,
      testsAdded: 0,
      issueNumber: 128,
      issueType: 'bug',
      complexity: 'low'
    }
  };
  
  const recommendationResult = analytics.recordExecution(poorPerformanceTest.tier, poorPerformanceTest.metrics);
  console.log('Performance recommendations:', {
    score: recommendationResult.analysis.score,
    recommendations: recommendationResult.recommendations.map(r => ({
      type: r.type,
      priority: r.priority,
      message: r.message
    }))
  });
  
  // Test 7: Test trend analysis
  console.log('\nTest 7: Trend analysis');
  
  // Simulate degrading performance over time
  const degradingPerformance = [
    { executionTime: 35000, success: true, cpu: 25 },
    { executionTime: 40000, success: true, cpu: 30 },
    { executionTime: 45000, success: true, cpu: 35 },
    { executionTime: 50000, success: false, cpu: 40 },
    { executionTime: 55000, success: false, cpu: 45 }
  ];
  
  degradingPerformance.forEach((metrics, index) => {
    const fullMetrics = {
      ...metrics,
      memory: 30,
      apiCalls: 15,
      networkLatency: 50,
      issuesProcessed: metrics.success ? 1 : 0,
      linesChanged: 25,
      filesModified: 2,
      testsAdded: 1,
      issueNumber: 130 + index,
      issueType: 'bug',
      complexity: 'low'
    };
    
    const result = analytics.recordExecution('ultimate', fullMetrics);
    
    if (index === degradingPerformance.length - 1) {
      console.log('Trend analysis (final execution):', {
        trend: result.analysis.trend,
        trendRecommendations: result.recommendations.filter(r => r.type === 'trend')
      });
    }
  });
  
  // Test 8: Resource efficiency analysis
  console.log('\nTest 8: Resource efficiency analysis');
  
  const resourceTest = {
    tier: 'smart',
    metrics: {
      executionTime: 600000,
      success: true,
      cpu: 90, // Very high CPU
      memory: 95, // Very high memory
      apiCalls: 120, // High API usage
      networkLatency: 300, // High latency
      issuesProcessed: 1,
      linesChanged: 200,
      filesModified: 10,
      testsAdded: 8,
      issueNumber: 129,
      issueType: 'feature',
      complexity: 'high'
    }
  };
  
  const resourceResult = analytics.recordExecution(resourceTest.tier, resourceTest.metrics);
  console.log('Resource efficiency analysis:', {
    resourceScore: Math.round(resourceResult.analysis.efficiency.resourceScore),
    cpuEfficiency: resourceResult.analysis.efficiency.cpuEfficiency.toFixed(2),
    memoryEfficiency: resourceResult.analysis.efficiency.memoryEfficiency.toFixed(2),
    apiEfficiency: resourceResult.analysis.efficiency.apiEfficiency.toFixed(2),
    throughputEstimate: resourceResult.analysis.efficiency.throughputEstimate,
    costPerExecution: resourceResult.analysis.efficiency.costPerExecution.toFixed(4)
  });
  
  console.log('\n🎉 All performance analytics tests completed!');
}

// Run tests
runPerformanceTests();