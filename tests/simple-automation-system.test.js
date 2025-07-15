/**
 * Tests for Simple Automation System
 */

const SimpleAutomationSystem = require('../src/simple-automation-system');
const GitHubClient = require('../src/github-client');
const ClaudeAPIClient = require('../src/claude-api-client');

// Mock dependencies
jest.mock('../src/github-client');
jest.mock('../src/claude-api-client');

describe('SimpleAutomationSystem', () => {
  let system;
  let mockGitHubClient;
  let mockClaudeClient;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock instances
    mockGitHubClient = {
      getPullRequest: jest.fn(),
      createPullRequestComment: jest.fn(),
      addLabelsToIssue: jest.fn(),
      getIssue: jest.fn(),
      getRecentPullRequests: jest.fn(),
      getRecentIssues: jest.fn(),
      setupBasicLabels: jest.fn(),
      healthCheck: jest.fn()
    };
    
    mockClaudeClient = {
      sendMessage: jest.fn(),
      testConnection: jest.fn()
    };
    
    // Mock constructors
    GitHubClient.mockImplementation(() => mockGitHubClient);
    ClaudeAPIClient.mockImplementation(() => mockClaudeClient);
    
    // Create system instance
    system = new SimpleAutomationSystem({
      github: {
        token: 'mock-token',
        owner: 'test-owner',
        repo: 'test-repo'
      },
      claude: {
        apiKey: 'mock-key',
        model: 'claude-3-haiku-20240307'
      },
      automation: {
        autoReview: true,
        autoLabel: true,
        autoAssign: false
      }
    });
  });
  
  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(system.config.github.token).toBe('mock-token');
      expect(system.config.claude.model).toBe('claude-3-haiku-20240307');
      expect(system.config.automation.autoReview).toBe(true);
    });
    
    it('should initialize with default values', () => {
      const defaultSystem = new SimpleAutomationSystem();
      expect(defaultSystem.config.claude.model).toBe('claude-3-haiku-20240307');
      expect(defaultSystem.config.automation.autoReview).toBe(true);
    });
  });
  
  describe('reviewPullRequest', () => {
    it('should successfully review a PR', async () => {
      const prNumber = 123;
      const mockPRData = {
        title: 'Test PR',
        files: [
          { filename: 'test.js' },
          { filename: 'README.md' }
        ]
      };
      
      mockGitHubClient.getPullRequest.mockResolvedValue({
        success: true,
        data: mockPRData
      });
      
      mockClaudeClient.sendMessage.mockResolvedValue({
        success: true,
        response: 'This is a good PR with proper testing.'
      });
      
      mockGitHubClient.createPullRequestComment.mockResolvedValue({
        success: true,
        data: { id: 456 }
      });
      
      mockGitHubClient.addLabelsToIssue.mockResolvedValue({
        success: true
      });
      
      const result = await system.reviewPullRequest(prNumber);
      
      expect(result.success).toBe(true);
      expect(result.review).toBe('This is a good PR with proper testing.');
      expect(result.commentPosted).toBe(true);
      expect(mockGitHubClient.getPullRequest).toHaveBeenCalledWith(prNumber);
      expect(mockGitHubClient.createPullRequestComment).toHaveBeenCalled();
      expect(mockGitHubClient.addLabelsToIssue).toHaveBeenCalledWith(prNumber, ['ai-reviewed']);
    });
    
    it('should handle PR fetch failure', async () => {
      const prNumber = 123;
      
      mockGitHubClient.getPullRequest.mockResolvedValue({
        success: false,
        error: 'PR not found'
      });
      
      mockGitHubClient.addLabelsToIssue.mockResolvedValue({
        success: true
      });
      
      const result = await system.reviewPullRequest(prNumber);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get PR: PR not found');
      expect(mockGitHubClient.addLabelsToIssue).toHaveBeenCalledWith(prNumber, ['needs-human-review']);
    });
    
    it('should handle Claude API failure', async () => {
      const prNumber = 123;
      
      mockGitHubClient.getPullRequest.mockResolvedValue({
        success: true,
        data: { title: 'Test PR', files: [] }
      });
      
      mockClaudeClient.sendMessage.mockResolvedValue({
        success: false,
        error: 'API quota exceeded'
      });
      
      mockGitHubClient.addLabelsToIssue.mockResolvedValue({
        success: true
      });
      
      const result = await system.reviewPullRequest(prNumber);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('API quota exceeded');
      expect(mockGitHubClient.addLabelsToIssue).toHaveBeenCalledWith(prNumber, ['needs-human-review']);
    });
  });
  
  describe('classifyIssue', () => {
    it('should successfully classify an issue', async () => {
      const issueNumber = 456;
      const mockIssueData = {
        title: 'Bug in login system',
        body: 'The login system is not working properly when users try to authenticate.'
      };
      
      mockGitHubClient.getIssue.mockResolvedValue({
        success: true,
        data: mockIssueData
      });
      
      mockClaudeClient.sendMessage.mockResolvedValue({
        success: true,
        response: 'bug'
      });
      
      mockGitHubClient.addLabelsToIssue.mockResolvedValue({
        success: true
      });
      
      const result = await system.classifyIssue(issueNumber);
      
      expect(result.success).toBe(true);
      expect(result.category).toBe('bug');
      expect(result.labelsAdded).toEqual(['auto-bug', 'ai-classified']);
      expect(mockGitHubClient.addLabelsToIssue).toHaveBeenCalledWith(issueNumber, ['auto-bug', 'ai-classified']);
    });
    
    it('should handle invalid category response', async () => {
      const issueNumber = 456;
      
      mockGitHubClient.getIssue.mockResolvedValue({
        success: true,
        data: { title: 'Test Issue', body: 'Test body' }
      });
      
      mockClaudeClient.sendMessage.mockResolvedValue({
        success: true,
        response: 'invalid-category'
      });
      
      mockGitHubClient.addLabelsToIssue.mockResolvedValue({
        success: true
      });
      
      const result = await system.classifyIssue(issueNumber);
      
      expect(result.success).toBe(true);
      expect(result.category).toBe('question'); // Default fallback
      expect(result.labelsAdded).toEqual(['auto-question', 'ai-classified']);
    });
    
    it('should handle issue fetch failure', async () => {
      const issueNumber = 456;
      
      mockGitHubClient.getIssue.mockResolvedValue({
        success: false,
        error: 'Issue not found'
      });
      
      mockGitHubClient.addLabelsToIssue.mockResolvedValue({
        success: true
      });
      
      const result = await system.classifyIssue(issueNumber);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get issue: Issue not found');
      expect(mockGitHubClient.addLabelsToIssue).toHaveBeenCalledWith(issueNumber, ['auto-question', 'needs-human-review']);
    });
  });
  
  describe('processPendingPRs', () => {
    it('should process multiple PRs', async () => {
      const mockPRs = [
        { number: 1, title: 'PR 1' },
        { number: 2, title: 'PR 2' }
      ];
      
      mockGitHubClient.getRecentPullRequests.mockResolvedValue({
        success: true,
        data: mockPRs
      });
      
      mockGitHubClient.getPullRequest.mockResolvedValue({
        success: true,
        data: { title: 'Test PR', files: [] }
      });
      
      mockClaudeClient.sendMessage.mockResolvedValue({
        success: true,
        response: 'Good PR'
      });
      
      mockGitHubClient.createPullRequestComment.mockResolvedValue({
        success: true
      });
      
      mockGitHubClient.addLabelsToIssue.mockResolvedValue({
        success: true
      });
      
      const result = await system.processPendingPRs();
      
      expect(result.success).toBe(true);
      expect(result.processed).toBe(2);
      expect(result.results).toHaveLength(2);
      expect(mockGitHubClient.getRecentPullRequests).toHaveBeenCalledWith(5);
    });
    
    it('should handle failure to get recent PRs', async () => {
      mockGitHubClient.getRecentPullRequests.mockResolvedValue({
        success: false,
        error: 'API error'
      });
      
      const result = await system.processPendingPRs();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get recent PRs: API error');
    });
  });
  
  describe('processPendingIssues', () => {
    it('should process multiple issues', async () => {
      const mockIssues = [
        { number: 1, title: 'Issue 1' },
        { number: 2, title: 'Issue 2' }
      ];
      
      mockGitHubClient.getRecentIssues.mockResolvedValue({
        success: true,
        data: mockIssues
      });
      
      mockGitHubClient.getIssue.mockResolvedValue({
        success: true,
        data: { title: 'Test Issue', body: 'Test body' }
      });
      
      mockClaudeClient.sendMessage.mockResolvedValue({
        success: true,
        response: 'bug'
      });
      
      mockGitHubClient.addLabelsToIssue.mockResolvedValue({
        success: true
      });
      
      const result = await system.processPendingIssues();
      
      expect(result.success).toBe(true);
      expect(result.processed).toBe(2);
      expect(result.results).toHaveLength(2);
      expect(mockGitHubClient.getRecentIssues).toHaveBeenCalledWith(5);
    });
  });
  
  describe('initialize', () => {
    it('should initialize successfully', async () => {
      mockGitHubClient.healthCheck.mockResolvedValue({
        status: 'healthy'
      });
      
      mockClaudeClient.testConnection.mockResolvedValue({
        success: true
      });
      
      mockGitHubClient.setupBasicLabels.mockResolvedValue([]);
      
      const result = await system.initialize();
      
      expect(result.success).toBe(true);
      expect(mockGitHubClient.healthCheck).toHaveBeenCalled();
      expect(mockClaudeClient.testConnection).toHaveBeenCalled();
      expect(mockGitHubClient.setupBasicLabels).toHaveBeenCalled();
    });
    
    it('should handle GitHub connection failure', async () => {
      mockGitHubClient.healthCheck.mockResolvedValue({
        status: 'unhealthy'
      });
      
      const result = await system.initialize();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('GitHub connection failed');
    });
    
    it('should handle Claude connection failure', async () => {
      mockGitHubClient.healthCheck.mockResolvedValue({
        status: 'healthy'
      });
      
      mockClaudeClient.testConnection.mockResolvedValue({
        success: false
      });
      
      const result = await system.initialize();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Claude connection failed');
    });
  });
  
  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      mockGitHubClient.healthCheck.mockResolvedValue({
        status: 'healthy',
        rateLimit: { remaining: 4000 }
      });
      
      mockClaudeClient.sendMessage.mockResolvedValue({
        success: true
      });
      
      const result = await system.healthCheck();
      
      expect(result.status).toBe('healthy');
      expect(result.github.status).toBe('healthy');
      expect(result.claude).toBe(true);
      expect(result.rateLimit.remaining).toBe(4000);
    });
    
    it('should return unhealthy status', async () => {
      mockGitHubClient.healthCheck.mockResolvedValue({
        status: 'unhealthy'
      });
      
      mockClaudeClient.sendMessage.mockResolvedValue({
        success: false
      });
      
      const result = await system.healthCheck();
      
      expect(result.status).toBe('unhealthy');
      expect(result.github.status).toBe('unhealthy');
      expect(result.claude).toBe(false);
    });
  });
  
  describe('getStats', () => {
    it('should return current statistics', () => {
      // Process some items to update stats
      system.stats.processedPRs = 5;
      system.stats.processedIssues = 3;
      system.stats.errors = 1;
      
      const stats = system.getStats();
      
      expect(stats.processedPRs).toBe(5);
      expect(stats.processedIssues).toBe(3);
      expect(stats.errors).toBe(1);
      expect(stats.uptime).toBeGreaterThan(0);
      expect(stats.timestamp).toBeDefined();
    });
  });
  
  describe('updateConfig', () => {
    it('should update configuration', () => {
      const newConfig = {
        automation: {
          autoReview: false,
          autoLabel: true
        }
      };
      
      system.updateConfig(newConfig);
      
      expect(system.config.automation.autoReview).toBe(false);
      expect(system.config.automation.autoLabel).toBe(true);
    });
  });
  
  describe('processGitHubEvent', () => {
    it('should process pull request event', async () => {
      const eventData = { number: 123 };
      
      mockGitHubClient.getPullRequest.mockResolvedValue({
        success: true,
        data: { title: 'Test PR', files: [] }
      });
      
      mockClaudeClient.sendMessage.mockResolvedValue({
        success: true,
        response: 'Good PR'
      });
      
      mockGitHubClient.createPullRequestComment.mockResolvedValue({
        success: true
      });
      
      mockGitHubClient.addLabelsToIssue.mockResolvedValue({
        success: true
      });
      
      const result = await system.processGitHubEvent('pull_request', eventData);
      
      expect(result.success).toBe(true);
    });
    
    it('should process issues event', async () => {
      const eventData = { number: 456 };
      
      mockGitHubClient.getIssue.mockResolvedValue({
        success: true,
        data: { title: 'Test Issue', body: 'Test body' }
      });
      
      mockClaudeClient.sendMessage.mockResolvedValue({
        success: true,
        response: 'bug'
      });
      
      mockGitHubClient.addLabelsToIssue.mockResolvedValue({
        success: true
      });
      
      const result = await system.processGitHubEvent('issues', eventData);
      
      expect(result.success).toBe(true);
    });
    
    it('should handle unsupported event type', async () => {
      const result = await system.processGitHubEvent('unknown', {});
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Event type not supported');
    });
  });
});