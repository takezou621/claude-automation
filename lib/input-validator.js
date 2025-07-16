/**
 * Comprehensive input validation utilities
 * Prevents injection attacks and ensures data integrity
 */

const validator = {
  /**
   * Validate issue number
   * @param {any} issueNumber - Input to validate
   * @returns {number} - Validated issue number
   */
  validateIssueNumber(issueNumber) {
    if (typeof issueNumber !== 'string' && typeof issueNumber !== 'number') {
      throw new Error('Issue number must be a string or number');
    }
    
    const num = parseInt(issueNumber, 10);
    if (isNaN(num) || num <= 0 || num > 999999) {
      throw new Error('Issue number must be between 1 and 999999');
    }
    
    return num;
  },

  /**
   * Validate pull request number
   * @param {any} prNumber - Input to validate
   * @returns {number} - Validated PR number
   */
  validatePRNumber(prNumber) {
    return this.validateIssueNumber(prNumber); // Same validation logic
  },

  /**
   * Validate GitHub repository name
   * @param {string} repoName - Repository name to validate
   * @returns {string} - Validated repository name
   */
  validateRepoName(repoName) {
    if (typeof repoName !== 'string') {
      throw new Error('Repository name must be a string');
    }
    
    // GitHub repository naming rules
    const repoNameRegex = /^[a-zA-Z0-9\-_.]{1,100}$/;
    if (!repoNameRegex.test(repoName)) {
      throw new Error('Invalid repository name format');
    }
    
    // Prevent reserved names
    const reservedNames = ['..', '.', 'aux', 'con', 'prn', 'nul'];
    if (reservedNames.includes(repoName.toLowerCase())) {
      throw new Error('Repository name is reserved');
    }
    
    return repoName;
  },

  /**
   * Validate GitHub username/owner
   * @param {string} username - Username to validate
   * @returns {string} - Validated username
   */
  validateUsername(username) {
    if (typeof username !== 'string') {
      throw new Error('Username must be a string');
    }
    
    // GitHub username rules
    const usernameRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
    if (!usernameRegex.test(username)) {
      throw new Error('Invalid username format');
    }
    
    return username;
  },

  /**
   * Validate issue/PR title
   * @param {string} title - Title to validate
   * @returns {string} - Validated title
   */
  validateTitle(title) {
    if (typeof title !== 'string') {
      throw new Error('Title must be a string');
    }
    
    if (title.length === 0) {
      throw new Error('Title cannot be empty');
    }
    
    if (title.length > 500) {
      throw new Error('Title too long (max 500 characters)');
    }
    
    // Remove dangerous characters
    const sanitized = title
      .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters
      .replace(/[<>]/g, '') // Remove HTML brackets
      .trim();
    
    if (sanitized.length === 0) {
      throw new Error('Title became empty after sanitization');
    }
    
    return sanitized;
  },

  /**
   * Validate issue/PR body
   * @param {string} body - Body content to validate
   * @returns {string} - Validated body
   */
  validateBody(body) {
    if (typeof body !== 'string') {
      throw new Error('Body must be a string');
    }
    
    if (body.length > 65536) { // 64KB limit
      throw new Error('Body too long (max 65536 characters)');
    }
    
    // Remove dangerous characters but preserve formatting
    const sanitized = body
      .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/g, '') // Remove control chars except \n, \r, \t
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframe tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:text\/html/gi, '') // Remove data: HTML
      .trim();
    
    return sanitized;
  },

  /**
   * Validate label name
   * @param {string} label - Label to validate
   * @returns {string} - Validated label
   */
  validateLabel(label) {
    if (typeof label !== 'string') {
      throw new Error('Label must be a string');
    }
    
    if (label.length === 0) {
      throw new Error('Label cannot be empty');
    }
    
    if (label.length > 50) {
      throw new Error('Label too long (max 50 characters)');
    }
    
    // GitHub label naming rules
    const labelRegex = /^[a-zA-Z0-9\-_.: ]+$/;
    if (!labelRegex.test(label)) {
      throw new Error('Invalid label format');
    }
    
    return label.trim();
  },

  /**
   * Validate webhook event type
   * @param {string} eventType - Event type to validate
   * @returns {string} - Validated event type
   */
  validateEventType(eventType) {
    if (typeof eventType !== 'string') {
      throw new Error('Event type must be a string');
    }
    
    const validEvents = [
      'issues',
      'pull_request',
      'push',
      'release',
      'fork',
      'watch',
      'star',
      'ping',
      'check_run',
      'check_suite',
      'commit_comment',
      'create',
      'delete',
      'deployment',
      'deployment_status',
      'discussion',
      'gollum',
      'issue_comment',
      'label',
      'member',
      'membership',
      'milestone',
      'organization',
      'page_build',
      'project',
      'project_card',
      'project_column',
      'public',
      'pull_request_review',
      'pull_request_review_comment',
      'repository',
      'status',
      'team',
      'team_add',
      'workflow_dispatch',
      'workflow_run'
    ];
    
    if (!validEvents.includes(eventType)) {
      throw new Error(`Invalid event type: ${eventType}`);
    }
    
    return eventType;
  },

  /**
   * Validate file path
   * @param {string} filePath - File path to validate
   * @returns {string} - Validated file path
   */
  validateFilePath(filePath) {
    if (typeof filePath !== 'string') {
      throw new Error('File path must be a string');
    }
    
    if (filePath.length === 0) {
      throw new Error('File path cannot be empty');
    }
    
    if (filePath.length > 1000) {
      throw new Error('File path too long (max 1000 characters)');
    }
    
    // Prevent directory traversal
    if (filePath.includes('..')) {
      throw new Error('Directory traversal detected in file path');
    }
    
    // Prevent absolute paths (security risk)
    if (filePath.startsWith('/')) {
      throw new Error('Absolute paths not allowed');
    }
    
    // Remove dangerous characters
    const sanitized = filePath
      .replace(/[<>"|?*]/g, '') // Windows invalid chars
      .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Control characters
      .trim();
    
    if (sanitized.length === 0) {
      throw new Error('File path became empty after sanitization');
    }
    
    return sanitized;
  },

  /**
   * Validate URL
   * @param {string} url - URL to validate
   * @returns {string} - Validated URL
   */
  validateURL(url) {
    if (typeof url !== 'string') {
      throw new Error('URL must be a string');
    }
    
    if (url.length > 2000) {
      throw new Error('URL too long (max 2000 characters)');
    }
    
    // Basic URL validation
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (error) {
      throw new Error('Invalid URL format');
    }
    
    // Only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Only HTTP/HTTPS URLs are allowed');
    }
    
    // Prevent private IP ranges (basic check)
    const hostname = parsedUrl.hostname.toLowerCase();
    if (hostname === 'localhost' || 
        hostname.startsWith('127.') || 
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
      throw new Error('Private IP addresses not allowed');
    }
    
    return url;
  },

  /**
   * Validate API key format
   * @param {string} apiKey - API key to validate
   * @returns {string} - Validated API key
   */
  validateAPIKey(apiKey) {
    if (typeof apiKey !== 'string') {
      throw new Error('API key must be a string');
    }
    
    if (apiKey.length < 20) {
      throw new Error('API key too short (min 20 characters)');
    }
    
    if (apiKey.length > 500) {
      throw new Error('API key too long (max 500 characters)');
    }
    
    // Basic format validation (alphanumeric, hyphens, underscores)
    const apiKeyRegex = /^[a-zA-Z0-9\-_]+$/;
    if (!apiKeyRegex.test(apiKey)) {
      throw new Error('Invalid API key format');
    }
    
    return apiKey;
  },

  /**
   * Validate email address
   * @param {string} email - Email to validate
   * @returns {string} - Validated email
   */
  validateEmail(email) {
    if (typeof email !== 'string') {
      throw new Error('Email must be a string');
    }
    
    if (email.length > 254) {
      throw new Error('Email too long (max 254 characters)');
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    
    return email.toLowerCase();
  },

  /**
   * Validate array of values
   * @param {Array} array - Array to validate
   * @param {Function} itemValidator - Function to validate each item
   * @param {number} maxLength - Maximum array length
   * @returns {Array} - Validated array
   */
  validateArray(array, itemValidator, maxLength = 100) {
    if (!Array.isArray(array)) {
      throw new Error('Input must be an array');
    }
    
    if (array.length > maxLength) {
      throw new Error(`Array too long (max ${maxLength} items)`);
    }
    
    return array.map((item, index) => {
      try {
        return itemValidator(item);
      } catch (error) {
        throw new Error(`Invalid item at index ${index}: ${error.message}`);
      }
    });
  }
};

module.exports = validator;