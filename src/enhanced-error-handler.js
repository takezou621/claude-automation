/**
 * Enhanced Error Handler System
 *
 * Provides comprehensive error handling with custom error types,
 * automatic recovery strategies, and integration with monitoring systems.
 */

const { logger } = require('./enhanced-logger');

/**
 * Base error class for all custom errors
 */
class AutomationError extends Error {
  constructor (message, code = 'AUTOMATION_ERROR', details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = true; // Indicates this is an expected error

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON () {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      isOperational: this.isOperational,
      stack: this.stack
    };
  }
}

/**
 * GitHub API related errors
 */
class GitHubError extends AutomationError {
  constructor (message, statusCode = null, apiResponse = null) {
    super(message, 'GITHUB_ERROR', { statusCode, apiResponse });
    this.statusCode = statusCode;
    this.apiResponse = apiResponse;
  }
}

/**
 * Claude API related errors
 */
class ClaudeError extends AutomationError {
  constructor (message, modelUsed = null, tokensUsed = null) {
    super(message, 'CLAUDE_ERROR', { modelUsed, tokensUsed });
    this.modelUsed = modelUsed;
    this.tokensUsed = tokensUsed;
  }
}

/**
 * Automation tier execution errors
 */
class TierExecutionError extends AutomationError {
  constructor (message, tier, operation, issueNumber = null) {
    super(message, 'TIER_EXECUTION_ERROR', { tier, operation, issueNumber });
    this.tier = tier;
    this.operation = operation;
    this.issueNumber = issueNumber;
  }
}

/**
 * Security related errors
 */
class SecurityError extends AutomationError {
  constructor (message, severity = 'medium', securityType = 'general') {
    super(message, 'SECURITY_ERROR', { severity, securityType });
    this.severity = severity;
    this.securityType = securityType;
    this.isOperational = false; // Security errors are always critical
  }
}

/**
 * Configuration related errors
 */
class ConfigurationError extends AutomationError {
  constructor (message, configKey = null, configValue = null) {
    super(message, 'CONFIGURATION_ERROR', { configKey, configValue });
    this.configKey = configKey;
    this.configValue = configValue;
  }
}

/**
 * Validation related errors
 */
class ValidationError extends AutomationError {
  constructor (message, field = null, value = null, expectedType = null) {
    super(message, 'VALIDATION_ERROR', { field, value, expectedType });
    this.field = field;
    this.value = value;
    this.expectedType = expectedType;
  }
}

/**
 * Rate limiting errors
 */
class RateLimitError extends AutomationError {
  constructor (message, service = null, resetTime = null) {
    super(message, 'RATE_LIMIT_ERROR', { service, resetTime });
    this.service = service;
    this.resetTime = resetTime;
  }
}

/**
 * Network/connectivity errors
 */
class NetworkError extends AutomationError {
  constructor (message, endpoint = null, statusCode = null) {
    super(message, 'NETWORK_ERROR', { endpoint, statusCode });
    this.endpoint = endpoint;
    this.statusCode = statusCode;
  }
}

/**
 * Enhanced Error Handler
 */
class EnhancedErrorHandler {
  constructor (options = {}) {
    this.enableRecovery = options.enableRecovery !== false;
    this.enableNotifications = options.enableNotifications !== false;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000; // ms
    this.circuitBreakerThreshold = options.circuitBreakerThreshold || 10;
    this.circuitBreakerTimeout = options.circuitBreakerTimeout || 60000; // ms

    // Error statistics
    this.errorStats = {
      totalErrors: 0,
      errorsByType: new Map(),
      errorsByService: new Map(),
      recentErrors: [],
      maxRecentErrors: 100
    };

    // Circuit breaker state
    this.circuitBreakers = new Map();

    // Recovery strategies
    this.recoveryStrategies = new Map();
    this.initializeRecoveryStrategies();

    // Setup process event handlers
    this.setupProcessHandlers();
  }

  /**
   * Initialize recovery strategies for different error types
   */
  initializeRecoveryStrategies () {
    // GitHub API errors
    this.recoveryStrategies.set('GitHubError', {
      maxRetries: 3,
      retryDelay: 2000,
      backoffMultiplier: 2,
      recover: async (error, context, attempt) => {
        if (error.statusCode === 403) {
          // Rate limit - wait for reset
          const waitTime = this.calculateRateLimitWait(error.apiResponse);
          logger.warn(`GitHub rate limit hit, waiting ${waitTime}ms`, { error, attempt });
          await this.sleep(waitTime);
          return { shouldRetry: true };
        }

        if (error.statusCode >= 500) {
          // Server error - exponential backoff
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          logger.warn(`GitHub server error, retrying after ${delay}ms`, { error, attempt });
          await this.sleep(delay);
          return { shouldRetry: true };
        }

        return { shouldRetry: false };
      }
    });

    // Claude API errors
    this.recoveryStrategies.set('ClaudeError', {
      maxRetries: 2,
      retryDelay: 3000,
      backoffMultiplier: 1.5,
      recover: async (error, context, attempt) => {
        if (error.message.includes('rate limit')) {
          logger.warn('Claude rate limit hit, waiting before retry', { error, attempt });
          await this.sleep(5000);
          return { shouldRetry: true };
        }

        if (error.message.includes('timeout')) {
          logger.warn('Claude timeout, retrying with shorter prompt', { error, attempt });
          return { shouldRetry: true, modifyRequest: 'truncate' };
        }

        return { shouldRetry: false };
      }
    });

    // Tier execution errors
    this.recoveryStrategies.set('TierExecutionError', {
      maxRetries: 1,
      retryDelay: 1000,
      recover: async (error, context, attempt) => {
        if (error.tier === 'ultimate') {
          logger.warn('Ultimate tier failed, falling back to rapid tier', { error, attempt });
          return { shouldRetry: false, fallback: 'rapid' };
        }

        if (error.tier === 'rapid') {
          logger.warn('Rapid tier failed, falling back to smart tier', { error, attempt });
          return { shouldRetry: false, fallback: 'smart' };
        }

        return { shouldRetry: false };
      }
    });

    // Network errors
    this.recoveryStrategies.set('NetworkError', {
      maxRetries: 5,
      retryDelay: 1000,
      backoffMultiplier: 2,
      recover: async (error, context, attempt) => {
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        logger.warn(`Network error, retrying after ${delay}ms`, { error, attempt });
        await this.sleep(delay);
        return { shouldRetry: true };
      }
    });
  }

  /**
   * Handle error with automatic recovery
   */
  async handleError (error, context = {}) {
    const errorInfo = this.analyzeError(error);

    // Update statistics
    this.updateErrorStats(errorInfo);

    // Log error
    this.logError(errorInfo, context);

    // Check circuit breaker
    const service = context.service || 'unknown';
    if (this.isCircuitBreakerOpen(service)) {
      throw new AutomationError(
        `Service ${service} is currently unavailable (circuit breaker open)`,
        'CIRCUIT_BREAKER_OPEN',
        { service }
      );
    }

    // Attempt recovery if enabled
    if (this.enableRecovery) {
      const recoveryResult = await this.attemptRecovery(errorInfo, context);
      if (recoveryResult.recovered) {
        return recoveryResult;
      }
    }

    // Update circuit breaker
    this.updateCircuitBreaker(service, false);

    // Send notifications if enabled
    if (this.enableNotifications) {
      await this.sendErrorNotification(errorInfo, context);
    }

    // Re-throw if not recovered
    throw error;
  }

  /**
   * Analyze error and extract information
   */
  analyzeError (error) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      type: error.constructor.name,
      message: error.message,
      code: error.code || 'UNKNOWN',
      isOperational: error.isOperational || false,
      stack: error.stack,
      details: error.details || {}
    };

    // Extract additional information based on error type
    if (error instanceof GitHubError) {
      errorInfo.statusCode = error.statusCode;
      errorInfo.apiResponse = error.apiResponse;
    } else if (error instanceof ClaudeError) {
      errorInfo.modelUsed = error.modelUsed;
      errorInfo.tokensUsed = error.tokensUsed;
    } else if (error instanceof TierExecutionError) {
      errorInfo.tier = error.tier;
      errorInfo.operation = error.operation;
      errorInfo.issueNumber = error.issueNumber;
    } else if (error instanceof SecurityError) {
      errorInfo.severity = error.severity;
      errorInfo.securityType = error.securityType;
    }

    return errorInfo;
  }

  /**
   * Update error statistics
   */
  updateErrorStats (errorInfo) {
    this.errorStats.totalErrors++;

    // Update by type
    const typeCount = this.errorStats.errorsByType.get(errorInfo.type) || 0;
    this.errorStats.errorsByType.set(errorInfo.type, typeCount + 1);

    // Update recent errors
    this.errorStats.recentErrors.push(errorInfo);
    if (this.errorStats.recentErrors.length > this.errorStats.maxRecentErrors) {
      this.errorStats.recentErrors.shift();
    }
  }

  /**
   * Log error with appropriate level and context
   */
  logError (errorInfo, context) {
    const logLevel = this.getLogLevel(errorInfo);
    const logMessage = `${errorInfo.type}: ${errorInfo.message}`;

    logger[logLevel](logMessage, {
      ...context,
      errorInfo,
      type: 'error_handling'
    });
  }

  /**
   * Get appropriate log level for error
   */
  getLogLevel (errorInfo) {
    if (errorInfo.type === 'SecurityError') {
      return 'error';
    }

    if (errorInfo.code === 'CIRCUIT_BREAKER_OPEN') {
      return 'warn';
    }

    if (errorInfo.isOperational) {
      return 'warn';
    }

    return 'error';
  }

  /**
   * Attempt error recovery
   */
  async attemptRecovery (errorInfo, context) {
    const strategy = this.recoveryStrategies.get(errorInfo.type);

    if (!strategy) {
      logger.debug(`No recovery strategy for ${errorInfo.type}`);
      return { recovered: false };
    }

    const maxRetries = strategy.maxRetries || this.maxRetries;
    let attempt = 1;

    while (attempt <= maxRetries) {
      try {
        const result = await strategy.recover(errorInfo, context, attempt);

        if (result.shouldRetry) {
          logger.info(`Recovery attempt ${attempt}/${maxRetries} for ${errorInfo.type}`, {
            errorInfo,
            context,
            attempt
          });

          attempt++;
          continue;
        } else if (result.fallback) {
          logger.info(`Fallback triggered for ${errorInfo.type}: ${result.fallback}`, {
            errorInfo,
            context,
            fallback: result.fallback
          });

          return {
            recovered: true,
            strategy: 'fallback',
            fallback: result.fallback
          };
        } else {
          break;
        }
      } catch (recoveryError) {
        logger.error(`Recovery attempt ${attempt} failed for ${errorInfo.type}`,
          recoveryError, { errorInfo, context, attempt });
        attempt++;
      }
    }

    return { recovered: false };
  }

  /**
   * Check if circuit breaker is open for a service
   */
  isCircuitBreakerOpen (service) {
    const breaker = this.circuitBreakers.get(service);
    if (!breaker) return false;

    if (breaker.state === 'open') {
      // Check if timeout has passed
      if (Date.now() - breaker.lastFailure > this.circuitBreakerTimeout) {
        breaker.state = 'half-open';
        breaker.failures = 0;
        logger.info(`Circuit breaker for ${service} moved to half-open state`);
      }
      return breaker.state === 'open';
    }

    return false;
  }

  /**
   * Update circuit breaker state
   */
  updateCircuitBreaker (service, success) {
    let breaker = this.circuitBreakers.get(service);

    if (!breaker) {
      breaker = {
        service,
        state: 'closed',
        failures: 0,
        lastFailure: null
      };
      this.circuitBreakers.set(service, breaker);
    }

    if (success) {
      breaker.failures = 0;
      breaker.state = 'closed';
    } else {
      breaker.failures++;
      breaker.lastFailure = Date.now();

      if (breaker.failures >= this.circuitBreakerThreshold) {
        breaker.state = 'open';
        logger.warn(`Circuit breaker opened for ${service} after ${breaker.failures} failures`);
      }
    }
  }

  /**
   * Send error notification
   */
  async sendErrorNotification (errorInfo, context) {
    // This would integrate with notification systems (email, Slack, etc.)
    logger.info('Error notification sent', {
      errorInfo: {
        type: errorInfo.type,
        message: errorInfo.message,
        code: errorInfo.code
      },
      context
    });
  }

  /**
   * Calculate rate limit wait time
   */
  calculateRateLimitWait (apiResponse) {
    if (apiResponse && apiResponse.headers) {
      const resetTime = apiResponse.headers['x-ratelimit-reset'];
      if (resetTime) {
        const resetTimestamp = parseInt(resetTime) * 1000;
        const waitTime = resetTimestamp - Date.now();
        return Math.max(waitTime, 0);
      }
    }

    return 60000; // Default 1 minute
  }

  /**
   * Sleep utility
   */
  sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get error statistics
   */
  getErrorStats () {
    return {
      totalErrors: this.errorStats.totalErrors,
      errorsByType: Object.fromEntries(this.errorStats.errorsByType),
      errorsByService: Object.fromEntries(this.errorStats.errorsByService),
      recentErrors: this.errorStats.recentErrors.slice(-10),
      circuitBreakers: Array.from(this.circuitBreakers.entries()).map(([service, breaker]) => ({
        service,
        state: breaker.state,
        failures: breaker.failures,
        lastFailure: breaker.lastFailure
      }))
    };
  }

  /**
   * Setup process event handlers
   */
  setupProcessHandlers () {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', error, { type: 'uncaught_exception' });

      // Exit gracefully
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection', new Error(reason), {
        promise: promise.toString(),
        type: 'unhandled_rejection'
      });
    });

    // Handle process termination
    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down gracefully');
      this.shutdown();
    });

    process.on('SIGINT', () => {
      logger.info('Received SIGINT, shutting down gracefully');
      this.shutdown();
    });
  }

  /**
   * Graceful shutdown
   */
  async shutdown () {
    logger.info('Error handler shutting down...');

    // Close any open connections, cleanup resources
    this.circuitBreakers.clear();
    this.errorStats = {
      totalErrors: 0,
      errorsByType: new Map(),
      errorsByService: new Map(),
      recentErrors: []
    };

    logger.info('Error handler shutdown complete');
  }
}

// Export error classes and handler
module.exports = {
  // Error classes
  AutomationError,
  GitHubError,
  ClaudeError,
  TierExecutionError,
  SecurityError,
  ConfigurationError,
  ValidationError,
  RateLimitError,
  NetworkError,

  // Error handler
  EnhancedErrorHandler,

  // Singleton instance
  errorHandler: new EnhancedErrorHandler()
};
