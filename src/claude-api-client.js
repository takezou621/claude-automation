/**
 * Claude API Client
 * Enterprise-grade Claude API integration for automated code analysis and generation
 */

const CLAUDE_API_BASE_URL = 'https://api.anthropic.com/v1';
const DEFAULT_MODEL = 'claude-3-sonnet-20240229';
const MAX_TOKENS = 4000;
const DEFAULT_TEMPERATURE = 0.1;

class ClaudeAPIClient {
  constructor(apiKey, options = {}) {
    // Claude Code Max doesn't require API keys
    this.apiKey = null;
    this.baseURL = options.baseURL || CLAUDE_API_BASE_URL;
    this.model = options.model || DEFAULT_MODEL;
    this.maxTokens = options.maxTokens || MAX_TOKENS;
    this.temperature = options.temperature || DEFAULT_TEMPERATURE;
    this.rateLimitConfig = {
      requestsPerMinute: options.rateLimitRPM || 50,
      tokensPerMinute: options.rateLimitTPM || 40000,
      requestCount: 0,
      tokenCount: 0,
      windowStart: Date.now()
    };
    this.retryConfig = {
      maxRetries: options.maxRetries || 3,
      baseDelay: options.baseDelay || 1000,
      maxDelay: options.maxDelay || 10000
    };
  }

  /**
   * Send a message to Claude API with enterprise features
   */
  async sendMessage(message, options = {}) {
    const startTime = Date.now();
    
    try {
      // Rate limiting check
      await this.checkRateLimit();
      
      // Prepare request payload
      const payload = {
        model: options.model || this.model,
        max_tokens: options.maxTokens || this.maxTokens,
        temperature: options.temperature || this.temperature,
        messages: [
          {
            role: 'user',
            content: message
          }
        ]
      };

      // Add system prompt if provided
      if (options.systemPrompt) {
        payload.system = options.systemPrompt;
      }

      // Execute request with retry logic
      const response = await this.executeWithRetry(async () => {
        return await this.makeRequest('/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Claude Code Max authentication handled differently
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify(payload)
        });
      });

      // Update rate limit tracking
      this.updateRateLimitTracking(response);

      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        response: response.content[0].text,
        model: response.model,
        usage: response.usage,
        executionTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Analyze code with Claude AI
   */
  async analyzeCode(code, analysisType = 'general', options = {}) {
    const systemPrompts = {
      general: 'You are a senior software engineer reviewing code. Provide constructive feedback on code quality, potential bugs, and improvements.',
      security: 'You are a security expert analyzing code for vulnerabilities. Focus on security issues, potential exploits, and secure coding practices.',
      performance: 'You are a performance optimization expert. Analyze code for performance bottlenecks, memory usage, and optimization opportunities.',
      architecture: 'You are a software architect reviewing code structure. Focus on design patterns, architectural decisions, and maintainability.'
    };

    const prompt = `Please analyze the following code:

\`\`\`
${code}
\`\`\`

Analysis Type: ${analysisType}
Focus Areas: ${options.focusAreas || 'overall code quality'}

Please provide:
1. Overall assessment
2. Specific issues found
3. Recommendations for improvement
4. Risk level (LOW/MEDIUM/HIGH)
5. Priority of fixes`;

    return await this.sendMessage(prompt, {
      systemPrompt: systemPrompts[analysisType] || systemPrompts.general,
      ...options
    });
  }

  /**
   * Generate code solution with Claude AI
   */
  async generateCodeSolution(requirement, context = {}, options = {}) {
    const systemPrompt = `You are an expert software developer. Generate clean, efficient, and well-documented code solutions.

Context:
- Language: ${context.language || 'auto-detect'}
- Framework: ${context.framework || 'N/A'}
- Requirements: ${context.requirements || 'Basic implementation'}
- Constraints: ${context.constraints || 'None specified'}

Guidelines:
- Write production-ready code
- Include proper error handling
- Add comprehensive comments
- Follow best practices
- Ensure security considerations`;

    const prompt = `Generate a code solution for the following requirement:

${requirement}

Please provide:
1. Complete code implementation
2. Usage examples
3. Testing recommendations
4. Security considerations
5. Performance notes`;

    return await this.sendMessage(prompt, {
      systemPrompt,
      ...options
    });
  }

  /**
   * Review pull request with Claude AI
   */
  async reviewPullRequest(prData, options = {}) {
    const systemPrompt = `You are an expert code reviewer performing a thorough pull request review. 
    
    Focus on:
    - Code quality and best practices
    - Security vulnerabilities
    - Performance implications
    - Maintainability
    - Test coverage
    - Documentation quality`;

    const prompt = `Review this pull request:

**Title:** ${prData.title}
**Description:** ${prData.description}

**Files Changed:**
${prData.files.map(file => `
File: ${file.filename}
Changes: +${file.additions} -${file.deletions}
${file.patch ? `\nDiff:\n${file.patch}` : ''}
`).join('\n')}

Please provide:
1. Overall assessment (APPROVE/REQUEST_CHANGES/COMMENT)
2. Specific feedback for each file
3. Security concerns
4. Performance considerations
5. Suggested improvements
6. Risk assessment`;

    return await this.sendMessage(prompt, {
      systemPrompt,
      maxTokens: options.maxTokens || 6000,
      ...options
    });
  }

  /**
   * Check rate limits and wait if necessary
   */
  async checkRateLimit() {
    const now = Date.now();
    const windowElapsed = now - this.rateLimitConfig.windowStart;
    
    // Reset window if more than 1 minute has passed
    if (windowElapsed >= 60000) {
      this.rateLimitConfig.requestCount = 0;
      this.rateLimitConfig.tokenCount = 0;
      this.rateLimitConfig.windowStart = now;
      return;
    }

    // Check if we need to wait
    if (this.rateLimitConfig.requestCount >= this.rateLimitConfig.requestsPerMinute) {
      const waitTime = 60000 - windowElapsed;
      console.log(`Rate limit reached. Waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.checkRateLimit();
    }
  }

  /**
   * Update rate limit tracking
   */
  updateRateLimitTracking(response) {
    this.rateLimitConfig.requestCount++;
    if (response.usage && response.usage.input_tokens) {
      this.rateLimitConfig.tokenCount += response.usage.input_tokens + response.usage.output_tokens;
    }
  }

  /**
   * Execute request with retry logic
   */
  async executeWithRetry(requestFn, attempt = 1) {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt >= this.retryConfig.maxRetries) {
        throw error;
      }

      const delay = Math.min(
        this.retryConfig.baseDelay * Math.pow(2, attempt - 1),
        this.retryConfig.maxDelay
      );

      console.log(`Request failed (attempt ${attempt}/${this.retryConfig.maxRetries}). Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this.executeWithRetry(requestFn, attempt + 1);
    }
  }

  /**
   * Make HTTP request
   */
  async makeRequest(endpoint, options) {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
    }
    
    return response.json();
  }

  /**
   * Get API usage statistics
   */
  getUsageStats() {
    const now = Date.now();
    const windowElapsed = now - this.rateLimitConfig.windowStart;
    
    return {
      requestsThisMinute: this.rateLimitConfig.requestCount,
      tokensThisMinute: this.rateLimitConfig.tokenCount,
      requestsPerMinuteLimit: this.rateLimitConfig.requestsPerMinute,
      tokensPerMinuteLimit: this.rateLimitConfig.tokensPerMinute,
      windowElapsed,
      utilizationRate: {
        requests: (this.rateLimitConfig.requestCount / this.rateLimitConfig.requestsPerMinute) * 100,
        tokens: (this.rateLimitConfig.tokenCount / this.rateLimitConfig.tokensPerMinute) * 100
      }
    };
  }

  /**
   * Test API connectivity
   */
  async testConnection() {
    const startTime = Date.now();
    
    try {
      const result = await this.sendMessage('Test connection. Please respond with "Connection successful."', {
        maxTokens: 100,
        temperature: 0
      });
      
      return {
        success: true,
        responseTime: Date.now() - startTime,
        message: 'Claude API connection successful',
        model: this.model,
        apiKey: this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'Not configured'
      };
    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }
}

module.exports = ClaudeAPIClient;