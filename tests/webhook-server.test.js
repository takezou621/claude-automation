/**
 * Tests for Webhook Server
 */

const request = require('supertest');
const crypto = require('crypto');
const WebhookServer = require('../src/webhook-server');
const SimpleAutomationSystem = require('../src/simple-automation-system');

// Mock SimpleAutomationSystem
jest.mock('../src/simple-automation-system');

describe('WebhookServer', () => {
  let server;
  let app;
  let mockAutomationSystem;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock automation system
    mockAutomationSystem = {
      initialize: jest.fn(),
      healthCheck: jest.fn(),
      getStats: jest.fn(),
      reviewPullRequest: jest.fn(),
      classifyIssue: jest.fn(),
      processPendingPRs: jest.fn(),
      processPendingIssues: jest.fn()
    };
    
    SimpleAutomationSystem.mockImplementation(() => mockAutomationSystem);
    
    // Create server instance
    server = new WebhookServer({
      port: 3001,
      secret: 'test-secret',
      github: {
        token: 'test-token',
        owner: 'test-owner',
        repo: 'test-repo'
      },
      claude: {
        apiKey: 'test-key',
        model: 'claude-3-haiku-20240307'
      }
    });
    
    app = server.getApp();
  });
  
  describe('Health Check', () => {
    it('should return healthy status', async () => {
      mockAutomationSystem.healthCheck.mockResolvedValue({
        status: 'healthy',
        github: { status: 'healthy' },
        claude: true
      });
      
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body.server).toBe('running');
      expect(response.body.automation.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
    });
    
    it('should return unhealthy status', async () => {
      mockAutomationSystem.healthCheck.mockResolvedValue({
        status: 'unhealthy',
        github: { status: 'unhealthy' },
        claude: false
      });
      
      const response = await request(app)
        .get('/health')
        .expect(503);
      
      expect(response.body.server).toBe('running');
      expect(response.body.automation.status).toBe('unhealthy');
    });
    
    it('should handle health check error', async () => {
      mockAutomationSystem.healthCheck.mockRejectedValue(new Error('Health check failed'));
      
      const response = await request(app)
        .get('/health')
        .expect(500);
      
      expect(response.body.server).toBe('error');
      expect(response.body.error).toBe('Health check failed');
    });
  });
  
  describe('Stats Endpoint', () => {
    it('should return system stats', async () => {
      const mockStats = {
        processedPRs: 10,
        processedIssues: 5,
        errors: 1,
        uptime: 3600
      };
      
      mockAutomationSystem.getStats.mockReturnValue(mockStats);
      
      const response = await request(app)
        .get('/stats')
        .expect(200);
      
      expect(response.body.stats).toEqual(mockStats);
      expect(response.body.server.uptime).toBeGreaterThan(0);
      expect(response.body.server.memory).toBeDefined();
    });
  });
  
  describe('Manual PR Review', () => {
    it('should review PR successfully', async () => {
      mockAutomationSystem.reviewPullRequest.mockResolvedValue({
        success: true,
        review: 'Good PR',
        commentPosted: true
      });
      
      const response = await request(app)
        .post('/api/review/123')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.result.review).toBe('Good PR');
      expect(mockAutomationSystem.reviewPullRequest).toHaveBeenCalledWith(123);
    });
    
    it('should handle PR review error', async () => {
      mockAutomationSystem.reviewPullRequest.mockRejectedValue(new Error('Review failed'));
      
      const response = await request(app)
        .post('/api/review/123')
        .expect(500);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Review failed');
    });
    
    it('should handle invalid PR number', async () => {
      const response = await request(app)
        .post('/api/review/invalid')
        .expect(500);
      
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('Manual Issue Classification', () => {
    it('should classify issue successfully', async () => {
      mockAutomationSystem.classifyIssue.mockResolvedValue({
        success: true,
        category: 'bug',
        labelsAdded: ['auto-bug', 'ai-classified']
      });
      
      const response = await request(app)
        .post('/api/classify/456')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.result.category).toBe('bug');
      expect(mockAutomationSystem.classifyIssue).toHaveBeenCalledWith(456);
    });
    
    it('should handle classification error', async () => {
      mockAutomationSystem.classifyIssue.mockRejectedValue(new Error('Classification failed'));
      
      const response = await request(app)
        .post('/api/classify/456')
        .expect(500);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Classification failed');
    });
  });
  
  describe('Batch Processing', () => {
    it('should process PRs in batch', async () => {
      mockAutomationSystem.processPendingPRs.mockResolvedValue({
        success: true,
        processed: 3,
        results: [
          { prNumber: 1, success: true },
          { prNumber: 2, success: true },
          { prNumber: 3, success: false }
        ]
      });
      
      const response = await request(app)
        .post('/api/batch')
        .send({ type: 'prs' })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.result.processed).toBe(3);
      expect(mockAutomationSystem.processPendingPRs).toHaveBeenCalled();
    });
    
    it('should process issues in batch', async () => {
      mockAutomationSystem.processPendingIssues.mockResolvedValue({
        success: true,
        processed: 2,
        results: [
          { issueNumber: 1, success: true },
          { issueNumber: 2, success: true }
        ]
      });
      
      const response = await request(app)
        .post('/api/batch')
        .send({ type: 'issues' })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.result.processed).toBe(2);
      expect(mockAutomationSystem.processPendingIssues).toHaveBeenCalled();
    });
    
    it('should handle invalid batch type', async () => {
      const response = await request(app)
        .post('/api/batch')
        .send({ type: 'invalid' })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid type. Use "prs" or "issues"');
    });
  });
  
  describe('Webhook Processing', () => {
    function createSignature(payload, secret) {
      return 'sha256=' + crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
    }
    
    it('should process pull request webhook', async () => {
      const payload = {
        action: 'opened',
        pull_request: {
          number: 123,
          title: 'Test PR'
        }
      };
      
      const payloadString = JSON.stringify(payload);
      const signature = createSignature(payloadString, 'test-secret');
      
      mockAutomationSystem.reviewPullRequest.mockResolvedValue({
        success: true,
        review: 'Good PR'
      });
      
      const response = await request(app)
        .post('/webhook')
        .set('X-GitHub-Event', 'pull_request')
        .set('X-Hub-Signature-256', signature)
        .send(payloadString)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.event).toBe('pull_request');
      expect(response.body.action).toBe('opened');
      expect(response.body.processed).toBe(true);
      expect(mockAutomationSystem.reviewPullRequest).toHaveBeenCalledWith(123);
    });
    
    it('should process issues webhook', async () => {
      const payload = {
        action: 'opened',
        issue: {
          number: 456,
          title: 'Test Issue'
        }
      };
      
      const payloadString = JSON.stringify(payload);
      const signature = createSignature(payloadString, 'test-secret');
      
      mockAutomationSystem.classifyIssue.mockResolvedValue({
        success: true,
        category: 'bug'
      });
      
      const response = await request(app)
        .post('/webhook')
        .set('X-GitHub-Event', 'issues')
        .set('X-Hub-Signature-256', signature)
        .send(payloadString)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.event).toBe('issues');
      expect(response.body.action).toBe('opened');
      expect(response.body.processed).toBe(true);
      expect(mockAutomationSystem.classifyIssue).toHaveBeenCalledWith(456);
    });
    
    it('should handle ping webhook', async () => {
      const payload = { zen: 'Design for failure.' };
      const payloadString = JSON.stringify(payload);
      const signature = createSignature(payloadString, 'test-secret');
      
      const response = await request(app)
        .post('/webhook')
        .set('X-GitHub-Event', 'ping')
        .set('X-Hub-Signature-256', signature)
        .send(payloadString)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.event).toBe('ping');
      expect(response.body.processed).toBe(true);
    });
    
    it('should reject invalid signature', async () => {
      const payload = { action: 'opened' };
      const payloadString = JSON.stringify(payload);
      
      const response = await request(app)
        .post('/webhook')
        .set('X-GitHub-Event', 'pull_request')
        .set('X-Hub-Signature-256', 'sha256=invalid')
        .send(payloadString)
        .expect(401);
      
      expect(response.body.error).toBe('Invalid signature');
    });
    
    it('should handle webhook processing error', async () => {
      const payload = {
        action: 'opened',
        pull_request: { number: 123 }
      };
      
      const payloadString = JSON.stringify(payload);
      const signature = createSignature(payloadString, 'test-secret');
      
      mockAutomationSystem.reviewPullRequest.mockRejectedValue(new Error('Processing failed'));
      
      const response = await request(app)
        .post('/webhook')
        .set('X-GitHub-Event', 'pull_request')
        .set('X-Hub-Signature-256', signature)
        .send(payloadString)
        .expect(500);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Processing failed');
    });
    
    it('should handle unhandled webhook event', async () => {
      const payload = { action: 'created' };
      const payloadString = JSON.stringify(payload);
      const signature = createSignature(payloadString, 'test-secret');
      
      const response = await request(app)
        .post('/webhook')
        .set('X-GitHub-Event', 'unknown')
        .set('X-Hub-Signature-256', signature)
        .send(payloadString)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.event).toBe('unknown');
      expect(response.body.processed).toBe(false);
    });
  });
  
  describe('Root Endpoint', () => {
    it('should return server info', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
      
      expect(response.body.name).toBe('Claude Automation Webhook Server');
      expect(response.body.version).toBe('1.0.0');
      expect(response.body.status).toBe('running');
      expect(response.body.endpoints).toBeDefined();
    });
  });
  
  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);
      
      expect(response.body.error).toBe('Endpoint not found');
      expect(response.body.path).toBe('/nonexistent');
      expect(response.body.method).toBe('GET');
    });
  });
  
  describe('Signature Verification', () => {
    it('should verify valid signature', () => {
      const payload = 'test payload';
      const signature = 'sha256=' + crypto
        .createHmac('sha256', 'test-secret')
        .update(payload)
        .digest('hex');
      
      const result = server.verifySignature(signature, Buffer.from(payload));
      expect(result).toBe(true);
    });
    
    it('should reject invalid signature', () => {
      const payload = 'test payload';
      const signature = 'sha256=invalid';
      
      const result = server.verifySignature(signature, Buffer.from(payload));
      expect(result).toBe(false);
    });
    
    it('should handle missing signature', () => {
      const payload = 'test payload';
      
      const result = server.verifySignature(null, Buffer.from(payload));
      expect(result).toBe(false);
    });
    
    it('should skip verification when no secret configured', () => {
      const serverWithoutSecret = new WebhookServer({
        secret: null
      });
      
      const result = serverWithoutSecret.verifySignature(null, Buffer.from('test'));
      expect(result).toBe(true);
    });
  });
});