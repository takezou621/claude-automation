#!/usr/bin/env node

/**
 * Test script for IntelligentScheduleManager
 * Tests RepairGPT optimized scheduling and timezone awareness
 */

const IntelligentScheduleManager = require('./src/intelligent-schedule-manager.js');

function runSchedulingTests() {
  console.log('🧪 Testing IntelligentScheduleManager\n');
  
  const scheduler = new IntelligentScheduleManager();
  
  // Test 1: Basic tier schedule retrieval
  console.log('Test 1: Basic tier schedule retrieval');
  const tiers = ['ultimate', 'rapid', 'smart'];
  
  tiers.forEach(tier => {
    const schedule = scheduler.getOptimalSchedule(tier);
    console.log(`${tier} tier:`, {
      cron: schedule.cron,
      maxExecutionTime: schedule.maxExecutionTime,
      priority: schedule.priority
    });
  });
  
  // Test 2: Timezone optimization
  console.log('\nTest 2: Timezone optimization');
  const timezones = ['America/New_York', 'Europe/London', 'Asia/Tokyo'];
  
  timezones.forEach(tz => {
    const schedule = scheduler.getOptimalSchedule('smart', { timezone: tz });
    console.log(`Smart tier optimized for ${tz}:`, {
      timezoneOptimized: schedule.timezoneOptimized,
      targetTimezone: schedule.targetTimezone,
      weekdays: schedule.cron.weekdays?.slice(0, 2) // Show first 2 entries
    });
  });
  
  // Test 3: Execution decision logic
  console.log('\nTest 3: Execution decision logic');
  
  tiers.forEach(tier => {
    const decision = scheduler.shouldExecute(tier);
    console.log(`${tier} tier execution decision:`, {
      shouldExecute: decision.shouldExecute,
      reasoning: decision.reasoning,
      timeWindow: decision.checks.timeWindow,
      resources: decision.checks.resources
    });
  });
  
  // Test 4: Resource analysis
  console.log('\nTest 4: Resource analysis');
  const resourceAnalysis = scheduler.getResourceAnalysis();
  console.log('Resource analysis:', {
    status: resourceAnalysis.status,
    contention: resourceAnalysis.contention,
    github: {
      apiCallsRemaining: resourceAnalysis.github.apiCallsRemaining,
      concurrentActions: resourceAnalysis.github.concurrentActions
    },
    system: {
      cpu: resourceAnalysis.system.cpu,
      memory: resourceAnalysis.system.memory
    }
  });
  
  // Test 5: Activity pattern analysis
  console.log('\nTest 5: Activity pattern analysis');
  const activityAnalysis = scheduler.getRepositoryActivityAnalysis();
  console.log('Activity analysis:', {
    confidence: activityAnalysis.confidence,
    peakHours: activityAnalysis.peakHours,
    quietPeriods: activityAnalysis.quietPeriods,
    patterns: {
      weeklyPattern: Object.entries(activityAnalysis.patterns.weeklyPattern).slice(0, 3),
      dailyPattern: activityAnalysis.patterns.dailyPattern
    }
  });
  
  // Test 6: Comprehensive schedule recommendations
  console.log('\nTest 6: Comprehensive schedule recommendations');
  const recommendations = scheduler.getScheduleRecommendations();
  console.log('Schedule recommendations summary:', {
    activeSchedules: recommendations.summary.activeSchedules,
    averageSuccessRate: recommendations.summary.averageSuccessRate,
    status: recommendations.summary.status,
    criticalIssues: recommendations.summary.criticalIssues,
    nextMaintenanceWindow: recommendations.summary.nextMaintenanceWindow
  });
  
  // Test 7: Performance analysis
  console.log('\nTest 7: Performance analysis');
  tiers.forEach(tier => {
    const performance = scheduler.analyzeSchedulePerformance(tier);
    console.log(`${tier} tier performance:`, {
      averageExecutionTime: `${performance.averageExecutionTime / 1000}s`,
      successRate: `${Math.round(performance.successRate * 100)}%`,
      resourceEfficiency: `${Math.round(performance.resourceEfficiency * 100)}%`,
      lastWeekExecutions: performance.lastWeekExecutions
    });
  });
  
  // Test 8: Next optimal time calculation
  console.log('\nTest 8: Next optimal time calculation');
  tiers.forEach(tier => {
    const nextTime = scheduler.getNextOptimalTime(tier);
    console.log(`${tier} tier next optimal time:`, nextTime.toISOString());
  });
  
  console.log('\n🎉 All scheduling tests completed!');
}

// Run tests
runSchedulingTests();