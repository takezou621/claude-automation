#!/usr/bin/env node

/**
 * Test script for Enhanced Logger and Error Handler
 * Tests comprehensive logging, error handling, and recovery mechanisms
 */

const { logger, EnhancedLogger } = require('./src/enhanced-logger');
const { 
  errorHandler, 
  GitHubError, 
  ClaudeError, 
  TierExecutionError, 
  SecurityError,
  NetworkError,
  AutomationError 
} = require('./src/enhanced-error-handler');

async function runLoggingTests() {
  console.log('🧪 Testing Enhanced Logger and Error Handler\n');
  
  // Test 1: Basic logging methods
  console.log('Test 1: Basic logging methods');
  logger.debug('Debug message', { component: 'test', operation: 'basic_logging' });
  logger.info('Info message', { component: 'test', operation: 'basic_logging' });
  logger.warn('Warning message', { component: 'test', operation: 'basic_logging' });
  logger.error('Error message', null, { component: 'test', operation: 'basic_logging' });
  
  // Test 2: Specialized logging methods
  console.log('\nTest 2: Specialized logging methods');
  logger.performance('test_operation', 1500, { component: 'test', success: true });
  logger.logTierExecution('ultimate', 'issue_processing', 'success', { issueNumber: 123 });
  logger.security('potential_vulnerability_detected', 'warning', { pattern: 'eval()', file: 'test.js' });
  logger.workflow('code_generation', 'success', { issueNumber: 124, tier: 'rapid' });
  logger.githubApi('create_pr', '/repos/owner/repo/pulls', 201, { prNumber: 456 });
  logger.claudeApi('code_analysis', 'claude-3-sonnet', 2500, { analysisType: 'security' });
  
  // Test 3: Timer functionality
  console.log('\nTest 3: Timer functionality');
  const timer = logger.createTimer('complex_operation', { component: 'test' });
  
  // Simulate some work
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const duration = timer.end({ result: 'success' });
  console.log(`Operation completed in ${duration}ms`);
  
  // Test 4: Error logging
  console.log('\nTest 4: Error logging');
  try {
    throw new Error('Test error for logging');
  } catch (error) {
    logger.error('Test error caught', error, { component: 'test', operation: 'error_logging' });
  }
  
  // Test 5: Custom error types
  console.log('\nTest 5: Custom error types');
  
  const customErrors = [
    new GitHubError('API rate limit exceeded', 403, { headers: { 'x-ratelimit-reset': '1234567890' } }),
    new ClaudeError('Model timeout', 'claude-3-sonnet', 3000),
    new TierExecutionError('Ultimate tier failed', 'ultimate', 'code_generation', 125),
    new SecurityError('Malicious code detected', 'critical', 'code_injection'),
    new NetworkError('Connection timeout', 'https://api.github.com', 408)
  ];
  
  for (const error of customErrors) {
    console.log(`Testing ${error.constructor.name}:`, {
      name: error.name,
      code: error.code,
      message: error.message
    });
  }
  
  // Test 6: Error handler without recovery
  console.log('\nTest 6: Error handler without recovery');
  
  try {
    const testError = new AutomationError('Test error for handler', 'TEST_ERROR', { test: true });
    await errorHandler.handleError(testError, { component: 'test', operation: 'error_handling' });
  } catch (error) {
    console.log('Expected error caught:', error.message);
  }
  
  // Test 7: Error recovery simulation
  console.log('\nTest 7: Error recovery simulation');
  
  // Simulate GitHub rate limit error
  try {
    const rateLimitError = new GitHubError('Rate limit exceeded', 403, { 
      headers: { 'x-ratelimit-reset': Math.floor(Date.now() / 1000) + 2 }
    });
    await errorHandler.handleError(rateLimitError, { 
      component: 'test', 
      operation: 'github_api_call',
      service: 'github'
    });
  } catch (error) {
    console.log('GitHub error after recovery attempt:', error.message);
  }
  
  // Test 8: Tier execution fallback
  console.log('\nTest 8: Tier execution fallback');
  
  try {
    const tierError = new TierExecutionError('Ultimate tier timeout', 'ultimate', 'code_generation', 126);
    const result = await errorHandler.handleError(tierError, { 
      component: 'test', 
      operation: 'tier_execution',
      service: 'automation'
    });
    console.log('Tier execution result:', result);
  } catch (error) {
    console.log('Tier execution error:', error.message);
  }
  
  // Test 9: Error analytics
  console.log('\nTest 9: Error analytics');
  
  // Generate some errors for analytics
  const errorTypes = [
    () => new GitHubError('Test GitHub error', 500),
    () => new ClaudeError('Test Claude error'),
    () => new NetworkError('Test network error', 'test.com', 404)
  ];
  
  for (let i = 0; i < 5; i++) {
    try {
      const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)]();
      await errorHandler.handleError(randomError, { 
        component: 'test', 
        operation: 'analytics_test',
        service: 'test'
      });
    } catch (error) {
      // Expected to fail
    }
  }
  
  // Get error statistics
  const errorStats = errorHandler.getErrorStats();
  console.log('Error statistics:', {
    totalErrors: errorStats.totalErrors,
    errorsByType: errorStats.errorsByType,
    circuitBreakers: errorStats.circuitBreakers,
    recentErrorCount: errorStats.recentErrors.length
  });
  
  // Test 10: Logger error analytics
  console.log('\nTest 10: Logger error analytics');
  
  const loggerAnalytics = logger.getErrorAnalytics();
  console.log('Logger analytics:', {
    totalErrors: loggerAnalytics.totalErrors,
    uniqueErrors: loggerAnalytics.uniqueErrors,
    errorRate: loggerAnalytics.errorRate.toFixed(2),
    topErrors: loggerAnalytics.topErrors
  });
  
  // Test 11: Structured event logging
  console.log('\nTest 11: Structured event logging');
  
  const eventSchema = {
    required: ['eventType', 'timestamp', 'data']
  };
  
  logger.logEvent('automation_started', {
    eventType: 'automation_started',
    timestamp: new Date().toISOString(),
    data: {
      tier: 'ultimate',
      issueNumber: 127,
      estimatedDuration: 45000
    }
  }, eventSchema);
  
  logger.logEvent('automation_completed', {
    eventType: 'automation_completed',
    timestamp: new Date().toISOString(),
    data: {
      tier: 'ultimate',
      issueNumber: 127,
      actualDuration: 42000,
      success: true
    }
  }, eventSchema);
  
  // Test 12: Log level testing
  console.log('\nTest 12: Log level testing');
  
  console.log('Current log level:', logger.getLogLevel());
  
  // Test different log levels
  logger.setLogLevel('error');
  logger.debug('This debug message should not appear');
  logger.info('This info message should not appear');
  logger.error('This error message should appear');
  
  logger.setLogLevel('info');
  logger.debug('This debug message should not appear');
  logger.info('This info message should appear');
  
  // Test 13: Timer with result
  console.log('\nTest 13: Timer with result');
  
  const operationTimer = logger.createTimer('database_query', { query: 'SELECT * FROM issues' });
  
  // Simulate operation
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const mockResult = { success: true, rows: 10 };
  const timerResult = operationTimer.endWithResult(mockResult);
  
  console.log('Timer with result:', {
    duration: timerResult.duration,
    success: timerResult.result.success
  });
  
  // Test 14: Multiple logger instances
  console.log('\nTest 14: Multiple logger instances');
  
  const customLogger = new EnhancedLogger({
    serviceName: 'test-service',
    logLevel: 'debug',
    enableConsole: true,
    enableFile: false
  });
  
  customLogger.info('Custom logger test', { instance: 'custom' });
  
  console.log('\n🎉 All logging and error handling tests completed!');
  console.log('\nCheck the logs/ directory for generated log files.');
}

// Run tests
runLoggingTests().catch(console.error);