/**
 * Webhook Server
 * GitHub WebhookイベントをリアルタイムでProcessingする
 */

const express = require('express');
const crypto = require('crypto');
const winston = require('winston');
const SimpleAutomationSystem = require('./simple-automation-system');

class WebhookServer {
  constructor (config = {}) {
    this.config = {
      port: config.port || process.env.PORT || 3000,
      secret: config.secret || process.env.WEBHOOK_SECRET,
      github: config.github || {
        token: process.env.GITHUB_TOKEN,
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO
      },
      claude: config.claude || {
        apiKey: process.env.CLAUDE_API_KEY,
        model: process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307'
      },
      automation: config.automation || {
        autoReview: process.env.AUTO_REVIEW !== 'false',
        autoLabel: process.env.AUTO_LABEL !== 'false',
        autoAssign: process.env.AUTO_ASSIGN === 'true'
      }
    };

    this.app = express();
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'webhook-server.log' })
      ]
    });

    this.automationSystem = new SimpleAutomationSystem({
      github: this.config.github,
      claude: this.config.claude,
      automation: this.config.automation
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Middleware setup
   */
  setupMiddleware () {
    // Raw body parser for webhook signature verification
    this.app.use('/webhook', express.raw({ type: 'application/json' }));

    // JSON parser for other routes
    this.app.use(express.json());

    // Request logging
    this.app.use((req, res, next) => {
      this.logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      next();
    });
  }

  /**
   * Route setup
   */
  setupRoutes () {
    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        const health = await this.automationSystem.healthCheck();
        res.status(health.status === 'healthy' ? 200 : 503).json({
          server: 'running',
          automation: health,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          server: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Stats endpoint
    this.app.get('/stats', (req, res) => {
      const stats = this.automationSystem.getStats();
      res.json({
        stats,
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        }
      });
    });

    // Manual PR review endpoint
    this.app.post('/api/review/:prNumber', async (req, res) => {
      try {
        const prNumber = parseInt(req.params.prNumber);
        const result = await this.automationSystem.reviewPullRequest(prNumber);

        res.json({
          success: result.success,
          result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Manual issue classification endpoint
    this.app.post('/api/classify/:issueNumber', async (req, res) => {
      try {
        const issueNumber = parseInt(req.params.issueNumber);
        const result = await this.automationSystem.classifyIssue(issueNumber);

        res.json({
          success: result.success,
          result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // GitHub webhook endpoint
    this.app.post('/webhook', async (req, res) => {
      try {
        const signature = req.get('X-Hub-Signature-256');
        const event = req.get('X-GitHub-Event');
        const body = req.body;

        // Verify webhook signature
        if (!this.verifySignature(signature, body)) {
          return res.status(401).json({ error: 'Invalid signature' });
        }

        // Parse JSON body
        const payload = JSON.parse(body.toString());

        this.logger.info(`Received GitHub webhook: ${event}`, {
          action: payload.action,
          sender: payload.sender?.login
        });

        // Process webhook event
        const result = await this.processWebhookEvent(event, payload);

        res.json({
          success: true,
          event,
          action: payload.action,
          processed: result.processed,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        this.logger.error('Webhook processing error:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Batch processing endpoint
    this.app.post('/api/batch', async (req, res) => {
      try {
        const { type } = req.body;

        let result;
        if (type === 'prs' || !type) {
          result = await this.automationSystem.processPendingPRs();
        } else if (type === 'issues') {
          result = await this.automationSystem.processPendingIssues();
        } else {
          return res.status(400).json({
            success: false,
            error: 'Invalid type. Use "prs" or "issues"'
          });
        }

        res.json({
          success: result.success,
          result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Claude Automation Webhook Server',
        version: '1.0.0',
        status: 'running',
        endpoints: {
          health: '/health',
          stats: '/stats',
          webhook: '/webhook',
          batch: '/api/batch',
          review: '/api/review/:prNumber',
          classify: '/api/classify/:issueNumber'
        },
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Error handling setup
   */
  setupErrorHandling () {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    });

    // Global error handler
    this.app.use((err, req, res) => {
      this.logger.error('Server error:', err);
      res.status(500).json({
        error: 'Internal server error',
        message: err.message,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Verify GitHub webhook signature
   */
  verifySignature (signature, body) {
    if (!this.config.secret) {
      this.logger.warn('Webhook secret not configured. Skipping signature verification.');
      return true;
    }

    if (!signature) {
      this.logger.error('No signature provided in webhook request');
      return false;
    }

    // Ensure body is a string or Buffer
    const bodyData = Buffer.isBuffer(body)
      ? body
      : typeof body === 'string'
        ? body
        : JSON.stringify(body);

    const expectedSignature = crypto
      .createHmac('sha256', this.config.secret)
      .update(bodyData)
      .digest('hex');

    const expectedSignatureWithPrefix = `sha256=${expectedSignature}`;

    // Use constant-time comparison to prevent timing attacks
    return this.constantTimeCompare(signature, expectedSignatureWithPrefix);
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  constantTimeCompare (a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') {
      return false;
    }

    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Process GitHub webhook event
   */
  async processWebhookEvent (event, payload) {
    let processed = false;

    try {
      switch (event) {
        case 'pull_request':
          if (payload.action === 'opened' || payload.action === 'synchronize') {
            if (this.config.automation.autoReview) {
              await this.automationSystem.reviewPullRequest(payload.pull_request.number);
              processed = true;
            }
          }
          break;

        case 'issues':
          if (payload.action === 'opened') {
            if (this.config.automation.autoLabel) {
              await this.automationSystem.classifyIssue(payload.issue.number);
              processed = true;
            }
          }
          break;

        case 'ping':
          processed = true;
          this.logger.info('Received ping webhook');
          break;

        default:
          this.logger.info(`Unhandled webhook event: ${event}`);
      }

      return { processed };
    } catch (error) {
      this.logger.error(`Error processing ${event} webhook:`, error);
      throw error;
    }
  }

  /**
   * Initialize and start server
   */
  async start () {
    try {
      this.logger.info('Initializing automation system...');
      const initResult = await this.automationSystem.initialize();

      if (!initResult.success) {
        throw new Error(`Automation system initialization failed: ${initResult.error}`);
      }

      this.logger.info('Automation system initialized successfully');

      // Start server
      this.server = this.app.listen(this.config.port, () => {
        this.logger.info(`Webhook server listening on port ${this.config.port}`);
        this.logger.info(`Health check: http://localhost:${this.config.port}/health`);
        this.logger.info(`Webhook endpoint: http://localhost:${this.config.port}/webhook`);
      });

      // Graceful shutdown handling
      process.on('SIGTERM', () => this.stop());
      process.on('SIGINT', () => this.stop());
    } catch (error) {
      this.logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Stop server gracefully
   */
  async stop () {
    this.logger.info('Stopping webhook server...');

    if (this.server) {
      this.server.close(() => {
        this.logger.info('Webhook server stopped');
        process.exit(0);
      });
    }
  }

  /**
   * Get server instance (for testing)
   */
  getApp () {
    return this.app;
  }
}

module.exports = WebhookServer;

// Run server if this file is executed directly
if (require.main === module) {
  const server = new WebhookServer();
  server.start();
}
