/**
 * Branch Pattern Manager
 * Manages branch naming patterns for different issue types and priorities
 */

class BranchPatternManager {
  constructor () {
    this.patterns = {
      // Feature patterns
      feature: 'feature/{title}',
      'feature-scoped': 'feature/{scope}/{title}',
      feat: 'feat/{title}',

      // Bug fix patterns
      bugfix: 'bugfix/{title}',
      bug: 'bug/{title}',
      fix: 'fix/{title}',

      // Hotfix patterns
      hotfix: 'hotfix/{title}',
      patch: 'patch/{title}',

      // Enhancement patterns
      enhancement: 'enhancement/{title}',
      improve: 'improve/{title}',

      // Documentation patterns
      docs: 'docs/{title}',
      documentation: 'documentation/{title}',

      // Refactoring patterns
      refactor: 'refactor/{title}',
      refact: 'refact/{title}',

      // Testing patterns
      test: 'test/{title}',
      testing: 'testing/{title}',

      // Chore patterns
      chore: 'chore/{title}',
      maintenance: 'maintenance/{title}',

      // Release patterns
      release: 'release/{version}',
      version: 'version/{version}'
    };

    this.priorityPrefixes = {
      critical: 'critical',
      high: 'high',
      medium: 'med',
      low: 'low'
    };

    this.issueTypeMapping = {
      bug: ['bugfix', 'bug', 'fix'],
      feature: ['feature', 'feat', 'feature-scoped'],
      enhancement: ['enhancement', 'improve'],
      documentation: ['docs', 'documentation'],
      refactor: ['refactor', 'refact'],
      test: ['test', 'testing'],
      hotfix: ['hotfix', 'patch'],
      chore: ['chore', 'maintenance'],
      release: ['release', 'version']
    };
  }

  /**
   * Get available branch patterns
   * @returns {Object} Available patterns
   */
  getAvailablePatterns () {
    return { ...this.patterns };
  }

  /**
   * Select pattern based on issue type and priority
   * @param {string} issueType - Type of issue (bug, feature, etc.)
   * @param {string} priority - Priority level (critical, high, medium, low)
   * @returns {string} Selected pattern name
   */
  selectPattern (issueType, priority = 'medium') {
    const normalizedType = issueType.toLowerCase();

    // Special handling for critical issues
    if (priority === 'critical') {
      if (normalizedType.includes('bug') || normalizedType.includes('fix')) {
        return 'hotfix';
      }
    }

    // Map issue type to available patterns
    const availablePatterns = this.issueTypeMapping[normalizedType] || ['feature'];

    // Select first available pattern (can be enhanced with more logic)
    return availablePatterns[0];
  }

  /**
   * Generate branch name from pattern
   * @param {string} patternName - Pattern to use
   * @param {Object} context - Context with title, scope, version, etc.
   * @param {string} priority - Priority level
   * @returns {string} Generated branch name
   */
  generateBranchName (patternName, context, priority = 'medium') {
    const pattern = this.patterns[patternName];
    if (!pattern) {
      throw new Error(`Pattern '${patternName}' not found`);
    }

    let branchName = pattern;

    // Replace placeholders
    if (context.title) {
      branchName = branchName.replace('{title}', this.sanitizeTitle(context.title));
    }

    if (context.scope) {
      branchName = branchName.replace('{scope}', this.sanitizeScope(context.scope));
    }

    if (context.version) {
      branchName = branchName.replace('{version}', this.sanitizeVersion(context.version));
    }

    // Add priority prefix for high priority items
    if (priority === 'critical' || priority === 'high') {
      const prefix = this.priorityPrefixes[priority];
      branchName = `${prefix}/${branchName}`;
    }

    return this.sanitizeBranchName(branchName);
  }

  /**
   * Sanitize title for branch name
   * @param {string} title - Title to sanitize
   * @returns {string} Sanitized title
   */
  sanitizeTitle (title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }

  /**
   * Sanitize scope for branch name
   * @param {string} scope - Scope to sanitize
   * @returns {string} Sanitized scope
   */
  sanitizeScope (scope) {
    return scope
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 20);
  }

  /**
   * Sanitize version for branch name
   * @param {string} version - Version to sanitize
   * @returns {string} Sanitized version
   */
  sanitizeVersion (version) {
    return version
      .replace(/[^a-z0-9.-]/g, '')
      .substring(0, 20);
  }

  /**
   * Sanitize full branch name
   * @param {string} branchName - Branch name to sanitize
   * @returns {string} Sanitized branch name
   */
  sanitizeBranchName (branchName) {
    return branchName
      .replace(/[^a-z0-9\-/.]/g, '')
      .replace(/\/+/g, '/')
      .replace(/-+/g, '-')
      .replace(/^\/|\/$/g, '')
      .substring(0, 100);
  }

  /**
   * Validate branch name
   * @param {string} branchName - Branch name to validate
   * @returns {Object} Validation result
   */
  validateBranchName (branchName) {
    const errors = [];
    const warnings = [];

    // Check length
    if (branchName.length > 100) {
      errors.push('Branch name too long (max 100 characters)');
    }

    // Check for invalid characters
    if (!/^[a-z0-9\-/]+$/.test(branchName)) {
      errors.push('Branch name contains invalid characters');
    }

    // Check for consecutive slashes or dashes
    if (/\/\/|--/.test(branchName)) {
      errors.push('Branch name contains consecutive slashes or dashes');
    }

    // Check for leading/trailing slashes
    if (branchName.startsWith('/') || branchName.endsWith('/')) {
      errors.push('Branch name cannot start or end with slash');
    }

    // Check for very short names
    if (branchName.length < 3) {
      warnings.push('Branch name is very short');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Detect pattern from existing branch name
   * @param {string} branchName - Existing branch name
   * @returns {Object} Detection result
   */
  detectPattern (branchName) {
    const normalizedName = branchName.toLowerCase();

    // Check for priority prefixes
    let priority = 'medium';
    let cleanName = normalizedName;

    for (const [priorityLevel, prefix] of Object.entries(this.priorityPrefixes)) {
      if (normalizedName.startsWith(`${prefix}/`)) {
        priority = priorityLevel;
        cleanName = normalizedName.substring(prefix.length + 1);
        break;
      }
    }

    // Try to match patterns
    for (const [patternName, pattern] of Object.entries(this.patterns)) {
      const patternRegex = this.createPatternRegex(pattern);
      if (patternRegex.test(cleanName)) {
        return {
          pattern: patternName,
          priority,
          matches: true,
          confidence: this.calculateConfidence(cleanName, pattern)
        };
      }
    }

    return {
      pattern: null,
      priority,
      matches: false,
      confidence: 0
    };
  }

  /**
   * Create regex from pattern
   * @param {string} pattern - Pattern to convert
   * @returns {RegExp} Generated regex
   */
  createPatternRegex (pattern) {
    const escapedPattern = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\\\{title\\\}/g, '[a-z0-9-]+')
      .replace(/\\\{scope\\\}/g, '[a-z0-9-]+')
      .replace(/\\\{version\\\}/g, '[a-z0-9.-]+');

    return new RegExp(`^${escapedPattern}$`);
  }

  /**
   * Calculate confidence score for pattern match
   * @param {string} branchName - Branch name
   * @param {string} pattern - Pattern
   * @returns {number} Confidence score (0-1)
   */
  calculateConfidence (branchName, pattern) {
    const patternParts = pattern.split('/');
    const nameParts = branchName.split('/');

    if (patternParts.length !== nameParts.length) {
      return 0.5;
    }

    let matches = 0;
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].includes('{')) {
        matches += 0.5; // Placeholder match
      } else if (patternParts[i] === nameParts[i]) {
        matches += 1; // Exact match
      }
    }

    return matches / patternParts.length;
  }

  /**
   * Get pattern recommendations based on repository activity
   * @param {Array} recentBranches - Recent branch names
   * @returns {Object} Recommendations
   */
  getPatternRecommendations (recentBranches = []) {
    const patternUsage = {};

    // Analyze recent branches
    recentBranches.forEach(branch => {
      const detection = this.detectPattern(branch);
      if (detection.matches) {
        patternUsage[detection.pattern] = (patternUsage[detection.pattern] || 0) + 1;
      }
    });

    // Sort by usage frequency
    const sortedPatterns = Object.entries(patternUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      mostUsed: sortedPatterns,
      recommended: sortedPatterns.length > 0 ? sortedPatterns[0][0] : 'feature',
      usage: patternUsage
    };
  }
}

module.exports = BranchPatternManager;
