/**
 * Enhanced Logger System
 * 
 * Provides comprehensive logging with structured formats, multiple transports,
 * and integration with performance monitoring and error tracking.
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

class EnhancedLogger {
  constructor(options = {}) {
    this.serviceName = options.serviceName || 'claude-automation';
    this.environment = options.environment || process.env.NODE_ENV || 'development';
    this.logLevel = options.logLevel || process.env.LOG_LEVEL || 'info';
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile !== false;
    this.enableStructured = options.enableStructured !== false;
    this.logDirectory = options.logDirectory || path.join(process.cwd(), 'logs');
    this.maxFileSize = options.maxFileSize || '10m';
    this.maxFiles = options.maxFiles || 5;
    this.enableErrorTracking = options.enableErrorTracking !== false;
    
    // Ensure logs directory exists
    this.ensureLogDirectory();
    
    // Initialize winston logger
    this.logger = this.createLogger();
    
    // Initialize error tracking
    this.errorTracker = {
      errors: [],
      maxErrors: 1000,
      errorsByType: new Map(),
      errorsByService: new Map()
    };
    
    // Set up periodic cleanup
    this.setupCleanup();
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true });
    }
  }

  /**
   * Create winston logger with enhanced configuration
   */
  createLogger() {
    const formats = [
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
      }),
      winston.format.errors({ stack: true }),
      winston.format.metadata({
        fillExcept: ['message', 'level', 'timestamp', 'service']
      })
    ];

    // Add structured format for JSON logging
    if (this.enableStructured) {
      formats.push(winston.format.json());
    } else {
      formats.push(winston.format.printf(this.formatLogEntry.bind(this)));
    }

    const transports = [];

    // Console transport
    if (this.enableConsole) {
      transports.push(new winston.transports.Console({
        level: this.logLevel,
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(this.formatConsoleEntry.bind(this))
        )
      }));
    }

    // File transports
    if (this.enableFile) {
      // General application logs
      transports.push(new winston.transports.File({
        filename: path.join(this.logDirectory, 'application.log'),
        level: this.logLevel,
        maxsize: this.maxFileSize,
        maxFiles: this.maxFiles,
        format: winston.format.combine(...formats)
      }));

      // Error logs
      transports.push(new winston.transports.File({
        filename: path.join(this.logDirectory, 'errors.log'),
        level: 'error',
        maxsize: this.maxFileSize,
        maxFiles: this.maxFiles,
        format: winston.format.combine(...formats)
      }));

      // Performance logs
      transports.push(new winston.transports.File({
        filename: path.join(this.logDirectory, 'performance.log'),
        level: 'info',
        maxsize: this.maxFileSize,
        maxFiles: this.maxFiles,
        format: winston.format.combine(...formats)
      }));
    }

    return winston.createLogger({
      level: this.logLevel,
      defaultMeta: {
        service: this.serviceName,
        environment: this.environment,
        pid: process.pid
      },
      transports,
      // Handle uncaught exceptions
      exceptionHandlers: [
        new winston.transports.File({
          filename: path.join(this.logDirectory, 'exceptions.log')
        })
      ],
      // Handle unhandled promise rejections
      rejectionHandlers: [
        new winston.transports.File({
          filename: path.join(this.logDirectory, 'rejections.log')
        })
      ]
    });
  }

  /**
   * Format log entry for file output
   */
  formatLogEntry(info) {
    const { timestamp, level, message, service, environment, metadata } = info;
    
    let entry = `[${timestamp}] [${level.toUpperCase()}] [${service}] ${message}`;
    
    // Add metadata if present
    if (metadata && Object.keys(metadata).length > 0) {
      entry += ` | ${JSON.stringify(metadata)}`;
    }
    
    return entry;
  }

  /**
   * Format console entry with colors and better readability
   */
  formatConsoleEntry(info) {
    const { timestamp, level, message, service, metadata } = info;
    
    let entry = `🤖 [${timestamp}] ${level}: ${message}`;
    
    // Add context information
    if (metadata && Object.keys(metadata).length > 0) {
      // Filter out common fields for console readability
      const filteredMetadata = { ...metadata };
      delete filteredMetadata.duration;
      delete filteredMetadata.pid;
      delete filteredMetadata.hostname;
      
      if (Object.keys(filteredMetadata).length > 0) {
        entry += ` | ${JSON.stringify(filteredMetadata)}`;
      }
    }
    
    return entry;
  }

  /**
   * Enhanced logging methods with context support
   */
  debug(message, context = {}) {
    this.logger.debug(message, this.enrichContext(context));
  }

  info(message, context = {}) {
    this.logger.info(message, this.enrichContext(context));
  }

  warn(message, context = {}) {
    this.logger.warn(message, this.enrichContext(context));
  }

  error(message, error = null, context = {}) {
    const enrichedContext = this.enrichContext(context);
    
    if (error) {
      enrichedContext.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      };
    }
    
    this.logger.error(message, enrichedContext);
    
    // Track error for analytics
    if (this.enableErrorTracking) {
      this.trackError(message, error, enrichedContext);
    }
  }

  /**
   * Performance logging methods
   */
  performance(operation, duration, context = {}) {
    this.logger.info(`Performance: ${operation} completed in ${duration}ms`, {
      ...this.enrichContext(context),
      operation,
      duration,
      type: 'performance'
    });
  }

  /**
   * Tier-specific logging methods
   */
  logTierExecution(tier, operation, status, context = {}) {
    const level = status === 'success' ? 'info' : 'error';
    const message = `${tier.toUpperCase()} tier: ${operation} ${status}`;
    
    this.logger[level](message, {
      ...this.enrichContext(context),
      tier,
      operation,
      status,
      type: 'tier_execution'
    });
  }

  /**
   * Security logging methods
   */
  security(event, severity, context = {}) {
    const level = severity === 'critical' ? 'error' : severity === 'warning' ? 'warn' : 'info';
    const message = `Security: ${event}`;
    
    this.logger[level](message, {
      ...this.enrichContext(context),
      event,
      severity,
      type: 'security'
    });
  }

  /**
   * Automation workflow logging
   */
  workflow(stage, status, context = {}) {
    const level = status === 'success' ? 'info' : status === 'error' ? 'error' : 'warn';
    const message = `Workflow: ${stage} ${status}`;
    
    this.logger[level](message, {
      ...this.enrichContext(context),
      stage,
      status,
      type: 'workflow'
    });
  }

  /**
   * GitHub API interaction logging
   */
  githubApi(action, endpoint, status, context = {}) {
    const level = status >= 200 && status < 400 ? 'info' : 'error';
    const message = `GitHub API: ${action} ${endpoint} [${status}]`;
    
    this.logger[level](message, {
      ...this.enrichContext(context),
      action,
      endpoint,
      status,
      type: 'github_api'
    });
  }

  /**
   * Claude API interaction logging
   */
  claudeApi(action, model, tokens, context = {}) {
    this.logger.info(`Claude API: ${action} using ${model} (${tokens} tokens)`, {
      ...this.enrichContext(context),
      action,
      model,
      tokens,
      type: 'claude_api'
    });
  }

  /**
   * Enrich context with common fields
   */
  enrichContext(context = {}) {
    return {
      ...context,
      timestamp: new Date().toISOString(),
      hostname: require('os').hostname(),
      pid: process.pid,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };
  }

  /**
   * Track errors for analytics
   */
  trackError(message, error, context) {
    const errorEntry = {
      timestamp: Date.now(),
      message,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      } : null,
      context,
      id: this.generateErrorId()
    };

    // Add to error tracker
    this.errorTracker.errors.push(errorEntry);
    
    // Maintain max errors limit
    if (this.errorTracker.errors.length > this.errorTracker.maxErrors) {
      this.errorTracker.errors.shift();
    }
    
    // Update error statistics
    const errorType = error?.name || 'UnknownError';
    const service = context.service || this.serviceName;
    
    this.errorTracker.errorsByType.set(errorType, 
      (this.errorTracker.errorsByType.get(errorType) || 0) + 1);
    this.errorTracker.errorsByService.set(service, 
      (this.errorTracker.errorsByService.get(service) || 0) + 1);
  }

  /**
   * Generate unique error ID
   */
  generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error analytics
   */
  getErrorAnalytics(timeWindow = 3600000) { // 1 hour default
    const cutoffTime = Date.now() - timeWindow;
    const recentErrors = this.errorTracker.errors.filter(e => e.timestamp > cutoffTime);
    
    return {
      totalErrors: recentErrors.length,
      uniqueErrors: new Set(recentErrors.map(e => e.error?.name || 'UnknownError')).size,
      errorsByType: Object.fromEntries(
        Array.from(this.errorTracker.errorsByType.entries())
      ),
      errorsByService: Object.fromEntries(
        Array.from(this.errorTracker.errorsByService.entries())
      ),
      recentErrors: recentErrors.slice(-10), // Last 10 errors
      errorRate: recentErrors.length / (timeWindow / 1000 / 60), // Errors per minute
      topErrors: this.getTopErrors(recentErrors),
      timeWindow: timeWindow
    };
  }

  /**
   * Get top errors by frequency
   */
  getTopErrors(errors) {
    const errorCounts = {};
    
    errors.forEach(error => {
      const errorType = error.error?.name || 'UnknownError';
      const key = `${errorType}: ${error.message}`;
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });
    
    return Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));
  }

  /**
   * Create timing decorator for performance logging
   */
  createTimer(operation, context = {}) {
    const startTime = Date.now();
    
    return {
      end: (additionalContext = {}) => {
        const duration = Date.now() - startTime;
        this.performance(operation, duration, { ...context, ...additionalContext });
        return duration;
      },
      
      endWithResult: (result, additionalContext = {}) => {
        const duration = Date.now() - startTime;
        const success = result && !result.error;
        
        this.performance(operation, duration, { 
          ...context, 
          ...additionalContext,
          success,
          result: result ? { success, error: result.error } : null
        });
        
        return { duration, result };
      }
    };
  }

  /**
   * Log structured event with schema validation
   */
  logEvent(eventType, data, schema = null) {
    // Basic schema validation if provided
    if (schema && !this.validateEventSchema(data, schema)) {
      this.warn(`Invalid event schema for ${eventType}`, { data, schema });
      return;
    }
    
    this.info(`Event: ${eventType}`, {
      eventType,
      data,
      type: 'event'
    });
  }

  /**
   * Basic schema validation
   */
  validateEventSchema(data, schema) {
    for (const field of schema.required || []) {
      if (!(field in data)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Setup periodic cleanup
   */
  setupCleanup() {
    // Clean up old error tracking data every hour
    setInterval(() => {
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
      this.errorTracker.errors = this.errorTracker.errors.filter(e => e.timestamp > cutoffTime);
    }, 3600000); // 1 hour
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    return new Promise((resolve) => {
      this.logger.info('Enhanced logger shutting down...');
      
      // Close all transports
      this.logger.close(() => {
        this.info('Enhanced logger shutdown complete');
        resolve();
      });
    });
  }

  /**
   * Get current log level
   */
  getLogLevel() {
    return this.logLevel;
  }

  /**
   * Set log level dynamically
   */
  setLogLevel(level) {
    this.logLevel = level;
    this.logger.level = level;
    this.info(`Log level changed to: ${level}`);
  }

  /**
   * Get logger instance (for direct winston access if needed)
   */
  getLogger() {
    return this.logger;
  }
}

// Export singleton instance
const enhancedLogger = new EnhancedLogger();

module.exports = {
  EnhancedLogger,
  logger: enhancedLogger
};